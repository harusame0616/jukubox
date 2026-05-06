package commands_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/env"
	"github.com/harusame0616/ijuku/apps/api/lib/txrunner"
	"github.com/harusame0616/ijuku/apps/api/routes/courses/commands"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	putSectionsOwnerUserID  = "47000000-0000-0000-0000-0000000000a1"
	putSectionsOtherUserID  = "47000000-0000-0000-0000-0000000000a2"
)

func setupPutCourseSectionsTestData(ctx context.Context, pool *pgxpool.Pool) error {
	cleanupPutCourseSectionsTestData(ctx, pool)
	if _, err := pool.Exec(ctx,
		`INSERT INTO users (user_id, nickname, introduce) VALUES ($1, '所有者', ''), ($2, '別ユーザー', '')`,
		putSectionsOwnerUserID, putSectionsOtherUserID,
	); err != nil {
		return fmt.Errorf("ユーザー作成に失敗: %w", err)
	}
	return nil
}

func cleanupPutCourseSectionsTestData(ctx context.Context, pool *pgxpool.Pool) {
	users := []string{putSectionsOwnerUserID, putSectionsOtherUserID}
	_, _ = pool.Exec(ctx,
		`DELETE FROM course_section_topics WHERE course_id IN (
			SELECT course_id FROM courses WHERE author_id IN (
				SELECT author_id FROM user_authors WHERE user_id = ANY($1)
			)
		)`, users)
	_, _ = pool.Exec(ctx,
		`DELETE FROM course_sections WHERE course_id IN (
			SELECT course_id FROM courses WHERE author_id IN (
				SELECT author_id FROM user_authors WHERE user_id = ANY($1)
			)
		)`, users)
	_, _ = pool.Exec(ctx,
		`DELETE FROM courses WHERE author_id IN (
			SELECT author_id FROM user_authors WHERE user_id = ANY($1)
		)`, users)
	_, _ = pool.Exec(ctx, `DELETE FROM categories WHERE path::text LIKE 'posttest9%'`)
	authorIDs := []string{}
	rows, err := pool.Query(ctx, `SELECT author_id::text FROM user_authors WHERE user_id = ANY($1)`, users)
	if err == nil {
		for rows.Next() {
			var id string
			_ = rows.Scan(&id)
			authorIDs = append(authorIDs, id)
		}
		rows.Close()
	}
	_, _ = pool.Exec(ctx, `DELETE FROM user_authors WHERE user_id = ANY($1)`, users)
	if len(authorIDs) > 0 {
		_, _ = pool.Exec(ctx, `DELETE FROM authors WHERE author_id = ANY($1)`, authorIDs)
	}
	_, _ = pool.Exec(ctx, `DELETE FROM users WHERE user_id = ANY($1)`, users)
}

func validSectionsBody() string {
	return `{
		"sections": [
			{
				"title": "セクション1",
				"description": "セクション概要",
				"topics": [
					{"title": "トピック1", "description": "概要", "body": "本文"}
				]
			}
		]
	}`
}

// 指定ユーザーで POST /v1/courses 相当の下書きコースを作成し、courseId を返す
func createDraftCourse(t *testing.T, pool *pgxpool.Pool, userID, slug, path string) string {
	t.Helper()
	q := db.New(pool)
	postHandler := commands.NewPostCourseHandler(q, q, txrunner.NewPgxTransactionRunner(pool))
	body := fmt.Sprintf(`{
		"title": "%s タイトル",
		"description": "概要文。",
		"slug": "%s",
		"tags": [],
		"visibility": "public",
		"categoryName": "Cat",
		"categoryPath": "%s"
	}`, slug, slug, path)
	req := httptest.NewRequest(http.MethodPost, "/v1/courses", strings.NewReader(body))
	req = req.WithContext(libauth.WithUserID(req.Context(), userID))
	w := httptest.NewRecorder()
	postHandler.PostCourseHandler(w, req)
	require.Equal(t, http.StatusCreated, w.Result().StatusCode, "body: %s", w.Body.String())
	var resp map[string]string
	require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&resp))
	return resp["courseId"]
}

func TestPutCourseSectionsHandlerMedium(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	require.NoError(t, err, "DBへの接続に失敗しました")
	defer pool.Close()

	require.NoError(t, setupPutCourseSectionsTestData(ctx, pool))
	t.Cleanup(func() { cleanupPutCourseSectionsTestData(ctx, pool) })

	q := db.New(pool)
	handler := commands.NewPutCourseSectionsHandler(q, txrunner.NewPgxTransactionRunner(pool))

	newReq := func(userID, courseID, body string) *http.Request {
		req := httptest.NewRequest(http.MethodPut, "/v1/courses/"+courseID+"/sections", strings.NewReader(body))
		req.SetPathValue("courseId", courseID)
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
		return req
	}

	t.Run("著者本人がセクションを保存するとセクション・トピックが置換される", func(t *testing.T) {
		t.Cleanup(func() { cleanupPutCourseSectionsTestData(ctx, pool); _ = setupPutCourseSectionsTestData(ctx, pool) })

		courseID := createDraftCourse(t, pool, putSectionsOwnerUserID, "posttest9-course-1", "posttest91.cat.x")

		w := httptest.NewRecorder()
		handler.PutCourseSectionsHandler(w, newReq(putSectionsOwnerUserID, courseID, validSectionsBody()))
		require.Equal(t, http.StatusNoContent, w.Result().StatusCode, "body: %s", w.Body.String())

		var sectionCount, topicCount int
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM course_sections WHERE course_id = $1`, courseID,
		).Scan(&sectionCount))
		assert.Equal(t, 1, sectionCount)
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM course_section_topics WHERE course_id = $1`, courseID,
		).Scan(&topicCount))
		assert.Equal(t, 1, topicCount)

		// 二度目の保存で完全に置換される
		body2 := `{
			"sections": [
				{"title": "S1", "description": "", "topics": [
					{"title": "T1", "description": "", "body": "本文1"},
					{"title": "T2", "description": "", "body": "本文2"}
				]},
				{"title": "S2", "description": "", "topics": [
					{"title": "T3", "description": "", "body": "本文3"}
				]}
			]
		}`
		w2 := httptest.NewRecorder()
		handler.PutCourseSectionsHandler(w2, newReq(putSectionsOwnerUserID, courseID, body2))
		require.Equal(t, http.StatusNoContent, w2.Result().StatusCode)

		require.NoError(t, pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM course_sections WHERE course_id = $1`, courseID,
		).Scan(&sectionCount))
		assert.Equal(t, 2, sectionCount)
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM course_section_topics WHERE course_id = $1`, courseID,
		).Scan(&topicCount))
		assert.Equal(t, 3, topicCount)
	})

	t.Run("認証なしは 401 を返す", func(t *testing.T) {
		t.Cleanup(func() { cleanupPutCourseSectionsTestData(ctx, pool); _ = setupPutCourseSectionsTestData(ctx, pool) })
		courseID := createDraftCourse(t, pool, putSectionsOwnerUserID, "posttest9-course-noauth", "posttest92.cat.x")

		req := httptest.NewRequest(http.MethodPut, "/v1/courses/"+courseID+"/sections", strings.NewReader(validSectionsBody()))
		req.SetPathValue("courseId", courseID)
		w := httptest.NewRecorder()
		handler.PutCourseSectionsHandler(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	})

	t.Run("他人のコースに保存しようとすると 403 を返す", func(t *testing.T) {
		t.Cleanup(func() { cleanupPutCourseSectionsTestData(ctx, pool); _ = setupPutCourseSectionsTestData(ctx, pool) })
		courseID := createDraftCourse(t, pool, putSectionsOwnerUserID, "posttest9-course-403", "posttest93.cat.x")

		w := httptest.NewRecorder()
		handler.PutCourseSectionsHandler(w, newReq(putSectionsOtherUserID, courseID, validSectionsBody()))
		assert.Equal(t, http.StatusForbidden, w.Result().StatusCode)
	})

	t.Run("存在しないコースは 404 を返す", func(t *testing.T) {
		t.Cleanup(func() { cleanupPutCourseSectionsTestData(ctx, pool); _ = setupPutCourseSectionsTestData(ctx, pool) })

		w := httptest.NewRecorder()
		handler.PutCourseSectionsHandler(w, newReq(putSectionsOwnerUserID, "00000000-0000-0000-0000-000000000000", validSectionsBody()))
		assert.Equal(t, http.StatusNotFound, w.Result().StatusCode)
	})

	t.Run("セクションが空だとバリデーションエラー", func(t *testing.T) {
		t.Cleanup(func() { cleanupPutCourseSectionsTestData(ctx, pool); _ = setupPutCourseSectionsTestData(ctx, pool) })
		courseID := createDraftCourse(t, pool, putSectionsOwnerUserID, "posttest9-course-400", "posttest94.cat.x")

		w := httptest.NewRecorder()
		handler.PutCourseSectionsHandler(w, newReq(putSectionsOwnerUserID, courseID, `{"sections":[]}`))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
		var resp map[string]string
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&resp))
		assert.Equal(t, "INPUT_VALIDATION_ERROR", resp["errorCode"])
	})
}
