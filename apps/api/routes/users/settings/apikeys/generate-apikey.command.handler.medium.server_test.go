package apikeys_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/env"
	"github.com/harusame0616/ijuku/apps/api/lib/txrunner"
	"github.com/harusame0616/ijuku/apps/api/lib/uuidutils"
	"github.com/harusame0616/ijuku/apps/api/routes/users/settings/apikeys"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateApiKeyHandlerMedium(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	if err != nil {
		t.Fatalf("DBへの接続に失敗しました: %v", err)
	}
	defer pool.Close()

	handler := apikeys.NewGenerateApiKeyHandler(apikeys.NewGenerateApiKeyUsecase(apikeys.NewApiKeySqrcRepository(), txrunner.NewPgxTransactionRunner(pool)))

	newAuthorizedRequest := func(t *testing.T, userID, body string) *http.Request {
		t.Helper()
		r := httptest.NewRequest("POST", "/v1/me/apikeys", strings.NewReader(body))
		if userID != "" {
			r = r.WithContext(libauth.WithUserID(r.Context(), userID))
		}
		return r
	}

	t.Run("認証されていない場合 401 を返す", func(t *testing.T) {
		r := httptest.NewRequest("POST", "/v1/me/apikeys", strings.NewReader("{}"))
		w := httptest.NewRecorder()

		handler.GenerateApiKeyHandler(w, r)

		assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	})

	t.Run("userId が非 UUID の場合 Input Validation Error を返す", func(t *testing.T) {
		r := newAuthorizedRequest(t, "invalid-uuid", "{}")
		w := httptest.NewRecorder()

		handler.GenerateApiKeyHandler(w, r)

		var responseBody map[string]any
		json.NewDecoder(w.Result().Body).Decode(&responseBody)
		assert.Equal(t, map[string]any{
			"errorCode": "INPUT_VALIDATION_ERROR",
			"message":   "User ID must be valid UUID",
		}, responseBody)
	})

	t.Run("expiredAt のフォーマットが ISO 8601 フォーマットではない場合 Input Validation Error を返す", func(t *testing.T) {
		r := newAuthorizedRequest(t, "BD30D30D-01A0-4E43-A00D-1E6EB88A1D54", `{"expiredAt": "invalid format"}`)
		w := httptest.NewRecorder()

		handler.GenerateApiKeyHandler(w, r)

		var responseBody map[string]any
		json.NewDecoder(w.Result().Body).Decode(&responseBody)
		assert.Equal(t, map[string]any{
			"errorCode": "INPUT_VALIDATION_ERROR",
			"message":   "expiredAt must be ISO 8601 format",
		}, responseBody)
	})

	t.Run("Body のフォーマットが json フォーマットではない場合 Input Validation Error を返す", func(t *testing.T) {
		r := newAuthorizedRequest(t, "BD30D30D-01A0-4E43-A00D-1E6EB88A1D54", `invalid json`)
		w := httptest.NewRecorder()

		handler.GenerateApiKeyHandler(w, r)

		var responseBody map[string]any
		json.NewDecoder(w.Result().Body).Decode(&responseBody)
		assert.Equal(t, map[string]any{
			"errorCode": "INPUT_VALIDATION_ERROR",
			"message":   "Body must be valid JSON",
		}, responseBody)
	})

	t.Run("API KEY が上限を超えている場合 Apikey Quota Exceeds Limit Error を返す", func(t *testing.T) {
		userID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, userID))
		t.Cleanup(func() {
			cleanupApiKeys(ctx, pool, userID)
			cleanupUser(ctx, pool, userID)
		})
		for i := 0; i < 5; i++ {
			_, err := pool.Exec(ctx, `INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at) VALUES ($1, $2, $3, 'suffix', 'infinity')`, uuidutils.MustNewUuidString(), userID, uuidutils.MustNewUuidString())
			require.NoError(t, err)
		}

		r := newAuthorizedRequest(t, userID, "{}")
		w := httptest.NewRecorder()

		handler.GenerateApiKeyHandler(w, r)

		var responseBody map[string]any
		json.NewDecoder(w.Result().Body).Decode(&responseBody)
		assert.Equal(t, map[string]any{
			"errorCode": "APIKEY_QUOTA_EXCEEDS_LIMIT",
			"message":   "Api key quota exceeds limit. Api key quota limit is 5",
		}, responseBody)
	})

	t.Run("API KEY を上限まで登録できる", func(t *testing.T) {
		userID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, userID))
		t.Cleanup(func() {
			cleanupApiKeys(ctx, pool, userID)
			cleanupUser(ctx, pool, userID)
		})
		for i := 0; i < 4; i++ {
			_, err := pool.Exec(ctx, `INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at) VALUES ($1, $2, $3, 'suffix', 'infinity')`, uuidutils.MustNewUuidString(), userID, uuidutils.MustNewUuidString())
			require.NoError(t, err)
		}

		r := newAuthorizedRequest(t, userID, "{}")
		w := httptest.NewRecorder()

		handler.GenerateApiKeyHandler(w, r)

		var responseBody map[string]any
		json.NewDecoder(w.Result().Body).Decode(&responseBody)
		assert.Regexp(t, "jukubox_.+", responseBody["apikey"])
	})

	t.Run("expiredAt を指定した場合 API KEY を有効期限付きで登録できる", func(t *testing.T) {
		userID := uuidutils.MustNewUuidString()
		require.NoError(t, insertUser(ctx, pool, userID))
		t.Cleanup(func() {
			cleanupApiKeys(ctx, pool, userID)
			cleanupUser(ctx, pool, userID)
		})

		r := newAuthorizedRequest(t, userID, `{"expiredAt": "2030-01-01T00:00:00Z"}`)
		w := httptest.NewRecorder()

		handler.GenerateApiKeyHandler(w, r)

		var responseBody map[string]any
		json.NewDecoder(w.Result().Body).Decode(&responseBody)
		assert.Regexp(t, "jukubox_.+", responseBody["apikey"])

		var expiredAt time.Time
		require.NoError(t, pool.QueryRow(ctx, `SELECT expired_at FROM apikeys WHERE user_id = $1`, userID).Scan(&expiredAt))
		assert.Equal(t, "2030-01-01T00:00:00Z", expiredAt.UTC().Format(time.RFC3339))
	})
}
