package apikeys_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/env"
	"github.com/harusame0616/ijuku/apps/api/lib/uuidutils"
	"github.com/harusame0616/ijuku/apps/api/routes/users/settings/apikeys"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDeleteApiKeyHandlerMedium(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	if err != nil {
		t.Fatalf("DBへの接続に失敗しました: %v", err)
	}
	defer pool.Close()

	q := db.New(pool)
	handler := apikeys.NewDeleteApiKeyHandler(apikeys.NewDeleteApiKeyUsecase(apikeys.NewApiKeySqrcRepository(q)))

	newAuthorizedRequest := func(t *testing.T, userID, apiKeyID string) *http.Request {
		t.Helper()
		r := httptest.NewRequest(http.MethodDelete, "/v1/me/apikeys/"+apiKeyID, nil)
		r.SetPathValue("apikeyID", apiKeyID)
		r = r.WithContext(libauth.WithUserID(r.Context(), userID))
		return r
	}

	t.Run("自分の API キーを削除できる", func(t *testing.T) {
		userID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, userID))
		t.Cleanup(func() {
			cleanupApiKeys(ctx, pool, userID)
			cleanupUser(ctx, pool, userID)
		})
		apiKeyID := uuidutils.MustNewUuidString()
		_, err := pool.Exec(ctx, `INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at) VALUES ($1, $2, $3, 'suffix', 'infinity')`,
			apiKeyID, userID, uuidutils.MustNewUuidString())
		require.NoError(t, err)

		w := httptest.NewRecorder()
		handler.DeleteApiKeyHandler(w, newAuthorizedRequest(t, userID, apiKeyID))

		assert.Equal(t, http.StatusNoContent, w.Result().StatusCode)

		var count int
		require.NoError(t, pool.QueryRow(ctx, `SELECT COUNT(*) FROM apikeys WHERE apikey_id = $1`, apiKeyID).Scan(&count))
		assert.Equal(t, 0, count)
	})

	t.Run("他人の API キーは削除されず 404 を返す", func(t *testing.T) {
		ownerID := uuidutils.MustNewUuidString()
		otherID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, ownerID))
		require.NoError(t, insertUser(ctx, pool, otherID))
		t.Cleanup(func() {
			cleanupApiKeys(ctx, pool, ownerID)
			cleanupUser(ctx, pool, ownerID)
			cleanupUser(ctx, pool, otherID)
		})
		apiKeyID := uuidutils.MustNewUuidString()
		_, err := pool.Exec(ctx, `INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at) VALUES ($1, $2, $3, 'suffix', 'infinity')`,
			apiKeyID, ownerID, uuidutils.MustNewUuidString())
		require.NoError(t, err)

		w := httptest.NewRecorder()
		handler.DeleteApiKeyHandler(w, newAuthorizedRequest(t, otherID, apiKeyID))

		assert.Equal(t, http.StatusNotFound, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "APIKEY_NOT_FOUND", body["errorCode"])

		var count int
		require.NoError(t, pool.QueryRow(ctx, `SELECT COUNT(*) FROM apikeys WHERE apikey_id = $1`, apiKeyID).Scan(&count))
		assert.Equal(t, 1, count)
	})

	t.Run("存在しない API キー ID の場合 404 を返す", func(t *testing.T) {
		userID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, userID))
		t.Cleanup(func() { cleanupUser(ctx, pool, userID) })

		w := httptest.NewRecorder()
		handler.DeleteApiKeyHandler(w, newAuthorizedRequest(t, userID, uuidutils.MustNewUuidString()))

		assert.Equal(t, http.StatusNotFound, w.Result().StatusCode)
	})
}
