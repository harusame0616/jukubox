package apikeys_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/harusame0616/ijuku/apps/api/lib/env"
	"github.com/harusame0616/ijuku/apps/api/lib/uuidutils"
	"github.com/harusame0616/ijuku/apps/api/routes/users/settings/apikeys"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestListApiKeysHandlerMedium(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	if err != nil {
		t.Fatalf("DBへの接続に失敗しました: %v", err)
	}
	defer pool.Close()

	q := db.New(pool)
	handler := apikeys.NewListApiKeysHandler(q)

	t.Run("複数の API キーを作成日降順で返し、 infinity の有効期限が \"infinity\" として返る", func(t *testing.T) {
		userID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, userID))
		t.Cleanup(func() {
			cleanupApiKeys(ctx, pool, userID)
			cleanupUser(ctx, pool, userID)
		})

		olderID := uuidutils.MustNewUuidString()
		newerID := uuidutils.MustNewUuidString()
		_, err := pool.Exec(ctx, `INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at, _created_at) VALUES ($1, $2, $3, 'a3f9', '2027-01-10T00:00:00Z', '2026-01-10T00:00:00Z')`,
			olderID, userID, uuidutils.MustNewUuidString())
		require.NoError(t, err)
		_, err = pool.Exec(ctx, `INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at, _created_at) VALUES ($1, $2, $3, 'c5d1', 'infinity', '2026-04-01T00:00:00Z')`,
			newerID, userID, uuidutils.MustNewUuidString())
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/v1/me/settings/apikeys", nil)
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
		w := httptest.NewRecorder()

		handler.ListApiKeysHandler(w, req)

		assert.Equal(t, http.StatusOK, w.Result().StatusCode)

		var body apikeys.ListApiKeysResponse
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		require.Len(t, body.ApiKeys, 2)
	})

	t.Run("APIキーが0件のユーザーは空配列を返す", func(t *testing.T) {
		userID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, userID))
		t.Cleanup(func() { cleanupUser(ctx, pool, userID) })

		req := httptest.NewRequest(http.MethodGet, "/v1/me/settings/apikeys", nil)
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
		w := httptest.NewRecorder()

		handler.ListApiKeysHandler(w, req)

		assert.Equal(t, http.StatusOK, w.Result().StatusCode)
		var body apikeys.ListApiKeysResponse
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Empty(t, body.ApiKeys)
	})
}

func insertUser(ctx context.Context, pool *pgxpool.Pool, userID string) error {
	_, err := pool.Exec(ctx, `INSERT INTO users (user_id, nickname) VALUES ($1, 'テストユーザー')`, userID)
	return err
}

func cleanupApiKeys(ctx context.Context, pool *pgxpool.Pool, userID string) {
	_, _ = pool.Exec(ctx, `DELETE FROM apikeys WHERE user_id = $1`, userID)
}

func cleanupUser(ctx context.Context, pool *pgxpool.Pool, userID string) {
	_, _ = pool.Exec(ctx, `DELETE FROM users WHERE user_id = $1`, userID)
}
