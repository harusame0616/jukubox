package auth_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/env"
	"github.com/harusame0616/ijuku/apps/api/lib/uuidutils"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMiddlewareMedium_APIKeyAuthSucceedsWithDB(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	if err != nil {
		t.Fatalf("DBへの接続に失敗しました: %v", err)
	}
	defer pool.Close()

	q := db.New(pool)

	// Verifier は HMAC 用ダミー (JWT は使わない経路)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"keys": []any{}})
	}))
	defer srv.Close()
	verifier := auth.NewVerifier("dummy-secret-not-used", srv.URL)

	// テスト用ユーザー＋API キー (有効) を投入
	userID := uuidutils.MustNewUuidString()
	apikeyID := uuidutils.MustNewUuidString()
	// uuid を含めて衝突を避ける
	plainKey := "jukubox_valid_" + apikeyID
	hash := auth.HashApiKey(plainKey)

	_, err = pool.Exec(ctx, `INSERT INTO users (user_id, nickname) VALUES ($1, '認証ミドルウェアテスト')`, userID)
	require.NoError(t, err)
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM apikeys WHERE user_id = $1`, userID)
		_, _ = pool.Exec(ctx, `DELETE FROM users WHERE user_id = $1`, userID)
	})

	_, err = pool.Exec(ctx,
		`INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at) VALUES ($1, $2, $3, $4, 'infinity')`,
		apikeyID, userID, hash, plainKey[len(plainKey)-4:],
	)
	require.NoError(t, err)

	captured := ""
	mw := auth.Middleware(verifier, q)
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uid, _ := auth.UserIDFromContext(r.Context())
		captured = uid
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	r.Header.Set("Authorization", "Bearer "+plainKey)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusOK, w.Result().StatusCode)
	assert.Equal(t, userID, captured)
}

func TestMiddlewareMedium_ExpiredAPIKeyReturns401(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	if err != nil {
		t.Fatalf("DBへの接続に失敗しました: %v", err)
	}
	defer pool.Close()

	q := db.New(pool)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"keys": []any{}})
	}))
	defer srv.Close()
	verifier := auth.NewVerifier("dummy", srv.URL)

	userID := uuidutils.MustNewUuidString()
	apikeyID := uuidutils.MustNewUuidString()
	// uuid を含めて衝突を避ける
	plainKey := "jukubox_expired_" + apikeyID
	hash := auth.HashApiKey(plainKey)

	_, err = pool.Exec(ctx, `INSERT INTO users (user_id, nickname) VALUES ($1, '期限切れキーテスト')`, userID)
	require.NoError(t, err)
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM apikeys WHERE user_id = $1`, userID)
		_, _ = pool.Exec(ctx, `DELETE FROM users WHERE user_id = $1`, userID)
	})

	_, err = pool.Exec(ctx,
		`INSERT INTO apikeys (apikey_id, user_id, key_hash, plain_suffix, expired_at) VALUES ($1, $2, $3, '0000', '2000-01-01T00:00:00Z')`,
		apikeyID, userID, hash,
	)
	require.NoError(t, err)

	called := false
	mw := auth.Middleware(verifier, q)
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	r.Header.Set("Authorization", "Bearer "+plainKey)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	assert.False(t, called, "期限切れ API キーでは next ハンドラーは呼ばれない")
}
