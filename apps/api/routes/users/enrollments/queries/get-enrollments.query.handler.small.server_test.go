package queries

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

const validUserID = "00000000-0000-0000-0000-000000000001"

type mockGetEnrollmentsQuery struct {
	rows []db.GetEnrollmentsByUserIDRow
	err  error
}

func (m *mockGetEnrollmentsQuery) GetEnrollmentsByUserID(_ context.Context, _ pgtype.UUID) ([]db.GetEnrollmentsByUserIDRow, error) {
	return m.rows, m.err
}

func newGetEnrollmentsRequest(t *testing.T, userID string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/v1/users/"+userID+"/enrollments", nil)
	req.SetPathValue("userID", userID)
	return req
}

func TestGetEnrollmentsHandler(t *testing.T) {
	t.Run("userIDがUUID形式でない場合400を返す", func(t *testing.T) {
		h := NewGetEnrollmentsHandler(&mockGetEnrollmentsQuery{})
		w := httptest.NewRecorder()
		h.GetEnrollmentsHandler(w, newGetEnrollmentsRequest(t, "invalid-uuid"))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)

		var body map[string]string
		if err := json.NewDecoder(w.Result().Body).Decode(&body); err != nil {
			t.Fatalf("レスポンスボディのデコードに失敗しました: %v", err)
		}
		assert.Equal(t, "INPUT_VALIDATION_ERROR", body["errorCode"])
	})

	t.Run("DBエラーの場合500を返す", func(t *testing.T) {
		h := NewGetEnrollmentsHandler(&mockGetEnrollmentsQuery{err: errors.New("db error")})
		w := httptest.NewRecorder()
		h.GetEnrollmentsHandler(w, newGetEnrollmentsRequest(t, validUserID))
		assert.Equal(t, http.StatusInternalServerError, w.Result().StatusCode)
	})

	t.Run("受講中コースがない場合は空配列を返す", func(t *testing.T) {
		h := NewGetEnrollmentsHandler(&mockGetEnrollmentsQuery{rows: []db.GetEnrollmentsByUserIDRow{}})
		w := httptest.NewRecorder()
		h.GetEnrollmentsHandler(w, newGetEnrollmentsRequest(t, validUserID))
		assert.Equal(t, http.StatusOK, w.Result().StatusCode)

		var body GetEnrollmentsResponse
		if err := json.NewDecoder(w.Result().Body).Decode(&body); err != nil {
			t.Fatalf("レスポンスボディのデコードに失敗しました: %v", err)
		}
		assert.Equal(t, []db.GetEnrollmentsByUserIDRow{}, body.Enrollments)
	})

	t.Run("受講中コースを返す", func(t *testing.T) {
		var courseID pgtype.UUID
		_ = courseID.Scan("00000000-0000-0000-0000-000000000abc")

		h := NewGetEnrollmentsHandler(&mockGetEnrollmentsQuery{
			rows: []db.GetEnrollmentsByUserIDRow{
				{CourseId: courseID, Title: "テストコース"},
			},
		})
		w := httptest.NewRecorder()
		h.GetEnrollmentsHandler(w, newGetEnrollmentsRequest(t, validUserID))
		assert.Equal(t, http.StatusOK, w.Result().StatusCode)

		var body GetEnrollmentsResponse
		if err := json.NewDecoder(w.Result().Body).Decode(&body); err != nil {
			t.Fatalf("レスポンスボディのデコードに失敗しました: %v", err)
		}
		assert.Len(t, body.Enrollments, 1)
		assert.Equal(t, "テストコース", body.Enrollments[0].Title)
	})
}
