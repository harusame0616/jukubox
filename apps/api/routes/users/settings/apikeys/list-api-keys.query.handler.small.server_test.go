package apikeys

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/harusame0616/ijuku/apps/api/internal/db"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testUserID  = "00000000-0000-0000-0000-000000000001"
	apikeyIDOne = "11111111-1111-1111-1111-111111111111"
	apikeyIDTwo = "22222222-2222-2222-2222-222222222222"
)

type mockListApiKeysQuery struct {
	rows []db.ListApiKeysByUserIDRow
	err  error
}

func (m *mockListApiKeysQuery) ListApiKeysByUserID(_ context.Context, _ pgtype.UUID) ([]db.ListApiKeysByUserIDRow, error) {
	return m.rows, m.err
}

func newListRequest(t *testing.T, userID string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/v1/me/settings/apikeys", nil)
	if userID != "" {
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
	}
	return req
}

func mustUUID(t *testing.T, s string) pgtype.UUID {
	t.Helper()
	parsed, err := uuid.Parse(s)
	require.NoError(t, err)
	return pgtype.UUID{Bytes: parsed, Valid: true}
}

func TestListApiKeysHandler(t *testing.T) {
	t.Run("認証情報が無い場合401を返す", func(t *testing.T) {
		h := NewListApiKeysHandler(&mockListApiKeysQuery{})
		w := httptest.NewRecorder()
		h.ListApiKeysHandler(w, newListRequest(t, ""))
		assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	})

	t.Run("userIDがUUID形式でない場合400を返す", func(t *testing.T) {
		h := NewListApiKeysHandler(&mockListApiKeysQuery{})
		w := httptest.NewRecorder()
		h.ListApiKeysHandler(w, newListRequest(t, "not-a-uuid"))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
	})

	t.Run("DBエラーの場合500を返す", func(t *testing.T) {
		h := NewListApiKeysHandler(&mockListApiKeysQuery{err: errors.New("db error")})
		w := httptest.NewRecorder()
		h.ListApiKeysHandler(w, newListRequest(t, testUserID))
		assert.Equal(t, http.StatusInternalServerError, w.Result().StatusCode)
	})

	t.Run("0件の場合200と空配列を返す", func(t *testing.T) {
		h := NewListApiKeysHandler(&mockListApiKeysQuery{rows: nil})
		w := httptest.NewRecorder()
		h.ListApiKeysHandler(w, newListRequest(t, testUserID))
		assert.Equal(t, http.StatusOK, w.Result().StatusCode)

		var body ListApiKeysResponse
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, []ApiKeyListItem{}, body.ApiKeys)
	})

	t.Run("複数件と無期限が正しくシリアライズされる", func(t *testing.T) {
		createdAt := time.Date(2026, 1, 10, 12, 0, 0, 0, time.UTC)
		expiredAt := time.Date(2027, 1, 10, 12, 0, 0, 0, time.UTC)
		expiredAtStr := "2027-01-10T12:00:00Z"
		h := NewListApiKeysHandler(&mockListApiKeysQuery{
			rows: []db.ListApiKeysByUserIDRow{
				{
					ApikeyID:    mustUUID(t, apikeyIDOne),
					PlainSuffix: "a3f9",
					CreatedAt:   pgtype.Timestamptz{Time: createdAt, Valid: true},
					ExpiredAt:   pgtype.Timestamptz{Time: expiredAt, Valid: true},
				},
				{
					ApikeyID:    mustUUID(t, apikeyIDTwo),
					PlainSuffix: "c5d1",
					CreatedAt:   pgtype.Timestamptz{Time: createdAt, Valid: true},
					ExpiredAt:   pgtype.Timestamptz{InfinityModifier: pgtype.Infinity, Valid: true},
				},
			},
		})
		w := httptest.NewRecorder()
		h.ListApiKeysHandler(w, newListRequest(t, testUserID))
		assert.Equal(t, http.StatusOK, w.Result().StatusCode)

		var body ListApiKeysResponse
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		require.Len(t, body.ApiKeys, 2)

		assert.Equal(t, apikeyIDOne, body.ApiKeys[0].ApiKeyID)
		assert.Equal(t, "a3f9", body.ApiKeys[0].Suffix)
		assert.Equal(t, "2026-01-10T12:00:00Z", body.ApiKeys[0].CreatedAt)
		require.NotNil(t, body.ApiKeys[0].ExpiredAt)
		assert.Equal(t, expiredAtStr, *body.ApiKeys[0].ExpiredAt)

		assert.Equal(t, apikeyIDTwo, body.ApiKeys[1].ApiKeyID)
		assert.Equal(t, "c5d1", body.ApiKeys[1].Suffix)
		assert.Nil(t, body.ApiKeys[1].ExpiredAt)
	})
}
