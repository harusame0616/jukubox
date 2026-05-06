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
	postCourseMedUserID = "47000000-0000-0000-0000-000000000001"
)

func setupPostCourseTestData(ctx context.Context, pool *pgxpool.Pool) error {
	cleanupPostCourseTestData(ctx, pool)
	if _, err := pool.Exec(ctx,
		`INSERT INTO users (user_id, nickname, introduce) VALUES ($1, '投稿者ユーザー', 'プロフィール')`,
		postCourseMedUserID,
	); err != nil {
		return fmt.Errorf("ユーザー作成に失敗: %w", err)
	}
	return nil
}

func cleanupPostCourseTestData(ctx context.Context, pool *pgxpool.Pool) {
	user := postCourseMedUserID
	_, _ = pool.Exec(ctx,
		`DELETE FROM course_section_topics WHERE course_id IN (
			SELECT course_id FROM courses WHERE author_id IN (
				SELECT author_id FROM user_authors WHERE user_id = $1
			)
		)`, user)
	_, _ = pool.Exec(ctx,
		`DELETE FROM course_sections WHERE course_id IN (
			SELECT course_id FROM courses WHERE author_id IN (
				SELECT author_id FROM user_authors WHERE user_id = $1
			)
		)`, user)
	_, _ = pool.Exec(ctx,
		`DELETE FROM courses WHERE author_id IN (
			SELECT author_id FROM user_authors WHERE user_id = $1
		)`, user)
	_, _ = pool.Exec(ctx, `DELETE FROM categories WHERE path::text LIKE 'posttest%'`)
	authorIDs := []string{}
	rows, err := pool.Query(ctx, `SELECT author_id::text FROM user_authors WHERE user_id = $1`, user)
	if err == nil {
		for rows.Next() {
			var id string
			_ = rows.Scan(&id)
			authorIDs = append(authorIDs, id)
		}
		rows.Close()
	}
	_, _ = pool.Exec(ctx, `DELETE FROM user_authors WHERE user_id = $1`, user)
	if len(authorIDs) > 0 {
		_, _ = pool.Exec(ctx, `DELETE FROM authors WHERE author_id = ANY($1)`, authorIDs)
	}
	_, _ = pool.Exec(ctx, `DELETE FROM users WHERE user_id = $1`, user)
}

func validBody(slug, path string) string {
	return fmt.Sprintf(`{
		"title": "%s タイトル",
		"description": "概要文。",
		"slug": "%s",
		"tags": ["nextjs"],
		"visibility": "public",
		"categoryName": "Next.js",
		"categoryPath": "%s"
	}`, slug, slug, path)
}

func TestPostCourseHandlerMedium(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	require.NoError(t, err, "DBへの接続に失敗しました")
	defer pool.Close()

	require.NoError(t, setupPostCourseTestData(ctx, pool))
	t.Cleanup(func() { cleanupPostCourseTestData(ctx, pool) })

	q := db.New(pool)
	handler := commands.NewPostCourseHandler(q, q, txrunner.NewPgxTransactionRunner(pool))

	newReq := func(userID, body string) *http.Request {
		req := httptest.NewRequest(http.MethodPost, "/v1/courses", strings.NewReader(body))
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
		return req
	}

	t.Run("初回投稿で著者・カテゴリ・コースが作成され publish_status は draft になる", func(t *testing.T) {
		t.Cleanup(func() { cleanupPostCourseTestData(ctx, pool); _ = setupPostCourseTestData(ctx, pool) })

		w := httptest.NewRecorder()
		handler.PostCourseHandler(w, newReq(postCourseMedUserID, validBody("posttest-course-1", "posttest1.frontend.nextjs")))

		require.Equal(t, http.StatusCreated, w.Result().StatusCode, "body: %s", w.Body.String())

		var resp map[string]string
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&resp))
		assert.NotEmpty(t, resp["courseId"])
		assert.NotEmpty(t, resp["authorSlug"])
		assert.Equal(t, "posttest-course-1", resp["courseSlug"])
		assert.Empty(t, resp["publishedAt"])

		var authorID string
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT author_id::text FROM user_authors WHERE user_id = $1`, postCourseMedUserID,
		).Scan(&authorID))

		var authorName, authorProfile, authorSlug string
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT name, profile, slug FROM authors WHERE author_id = $1`, authorID,
		).Scan(&authorName, &authorProfile, &authorSlug))
		assert.Equal(t, "投稿者ユーザー", authorName)
		assert.Equal(t, "プロフィール", authorProfile)
		assert.Equal(t, resp["authorSlug"], authorSlug)

		var courseTitle, publishStatus string
		var tagsJSON []byte
		var publishedAt *string
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT title, publish_status, tags, published_at::text FROM courses WHERE course_id = $1`, resp["courseId"],
		).Scan(&courseTitle, &publishStatus, &tagsJSON, &publishedAt))
		assert.Equal(t, "posttest-course-1 タイトル", courseTitle)
		assert.Equal(t, "draft", publishStatus)
		assert.JSONEq(t, `["nextjs"]`, string(tagsJSON))
		assert.Nil(t, publishedAt)

		// セクション・トピックは作成しない
		var sectionCount int
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM course_sections WHERE course_id = $1`, resp["courseId"],
		).Scan(&sectionCount))
		assert.Equal(t, 0, sectionCount)
	})

	t.Run("同一著者で同一 slug の場合 409 COURSE_SLUG_CONFLICT を返す", func(t *testing.T) {
		t.Cleanup(func() { cleanupPostCourseTestData(ctx, pool); _ = setupPostCourseTestData(ctx, pool) })

		body := validBody("posttest-dup-slug", "posttest3.frontend.nextjs")
		w1 := httptest.NewRecorder()
		handler.PostCourseHandler(w1, newReq(postCourseMedUserID, body))
		require.Equal(t, http.StatusCreated, w1.Result().StatusCode, "body: %s", w1.Body.String())

		w2 := httptest.NewRecorder()
		handler.PostCourseHandler(w2, newReq(postCourseMedUserID, body))
		assert.Equal(t, http.StatusConflict, w2.Result().StatusCode)
		var resp map[string]string
		require.NoError(t, json.NewDecoder(w2.Result().Body).Decode(&resp))
		assert.Equal(t, "COURSE_SLUG_CONFLICT", resp["errorCode"])
	})

	t.Run("既存カテゴリパスは再利用される", func(t *testing.T) {
		t.Cleanup(func() { cleanupPostCourseTestData(ctx, pool); _ = setupPostCourseTestData(ctx, pool) })

		body1 := validBody("posttest-shared-cat-1", "posttest4.shared.path")
		w1 := httptest.NewRecorder()
		handler.PostCourseHandler(w1, newReq(postCourseMedUserID, body1))
		require.Equal(t, http.StatusCreated, w1.Result().StatusCode)

		body2 := validBody("posttest-shared-cat-2", "posttest4.shared.path")
		w2 := httptest.NewRecorder()
		handler.PostCourseHandler(w2, newReq(postCourseMedUserID, body2))
		require.Equal(t, http.StatusCreated, w2.Result().StatusCode, "body: %s", w2.Body.String())

		var count int
		require.NoError(t, pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM categories WHERE path::text = 'posttest4.shared.path'`,
		).Scan(&count))
		assert.Equal(t, 1, count)
	})

	t.Run("認証なしは 401 を返す", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/v1/courses", strings.NewReader(validBody("posttest-noauth", "posttest5.x")))
		w := httptest.NewRecorder()
		handler.PostCourseHandler(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	})

	t.Run("不正な JSON は INPUT_VALIDATION_ERROR を返す", func(t *testing.T) {
		w := httptest.NewRecorder()
		handler.PostCourseHandler(w, newReq(postCourseMedUserID, "not json"))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
	})

	t.Run("title が空だとバリデーションエラー", func(t *testing.T) {
		body := strings.Replace(
			validBody("posttest-bad", "posttest6.x"),
			`"title": "posttest-bad タイトル"`,
			`"title": ""`,
			1,
		)
		w := httptest.NewRecorder()
		handler.PostCourseHandler(w, newReq(postCourseMedUserID, body))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
		var resp map[string]string
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&resp))
		assert.Equal(t, "INPUT_VALIDATION_ERROR", resp["errorCode"])
	})
}
