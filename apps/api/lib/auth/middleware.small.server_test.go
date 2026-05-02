package auth_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type stubResolver struct {
	wantHash  string
	row       pgtype.UUID
	err       error
	callCount int
}

func (s *stubResolver) GetUserIDByApiKeyHash(_ context.Context, keyHash string) (pgtype.UUID, error) {
	s.callCount++
	s.wantHash = keyHash
	return s.row, s.err
}

func newOKHandler(captured *string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uid, ok := auth.UserIDFromContext(r.Context())
		if ok {
			*captured = uid
		}
		w.WriteHeader(http.StatusOK)
	})
}

func TestMiddleware_NoAuthorizationHeader_Returns401(t *testing.T) {
	verifier := newVerifierWithHMAC(t)
	resolver := &stubResolver{err: pgx.ErrNoRows}

	captured := ""
	handler := auth.Middleware(verifier, resolver)(newOKHandler(&captured))
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/v1/me", nil)

	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	assert.Empty(t, captured)
}

func TestMiddleware_ValidJWT_PassesUserIDInContext(t *testing.T) {
	verifier := newVerifierWithHMAC(t)
	token := signHMAC(t, testHMACSecret, false)
	resolver := &stubResolver{}

	captured := ""
	handler := auth.Middleware(verifier, resolver)(newOKHandler(&captured))
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	r.Header.Set("Authorization", "Bearer "+token)

	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusOK, w.Result().StatusCode)
	assert.Equal(t, "user-id", captured)
	assert.Equal(t, 0, resolver.callCount, "JWT で認証成功した場合は API キーを問い合わせない")
}

func TestMiddleware_InvalidJWT_FallsBackToApiKey(t *testing.T) {
	verifier := newVerifierWithHMAC(t)

	// 解決された UUID を返す
	parsed := pgtype.UUID{}
	require.NoError(t, parsed.Scan("123e4567-e89b-12d3-a456-426614174000"))
	resolver := &stubResolver{row: parsed}

	captured := ""
	handler := auth.Middleware(verifier, resolver)(newOKHandler(&captured))
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	r.Header.Set("Authorization", "Bearer jukubox_some_plain_api_key")

	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusOK, w.Result().StatusCode)
	assert.Equal(t, "123e4567-e89b-12d3-a456-426614174000", captured)
	assert.Equal(t, auth.HashApiKey("jukubox_some_plain_api_key"), resolver.wantHash)
}

func TestMiddleware_UnknownApiKey_Returns401(t *testing.T) {
	verifier := newVerifierWithHMAC(t)
	resolver := &stubResolver{err: pgx.ErrNoRows}

	captured := ""
	handler := auth.Middleware(verifier, resolver)(newOKHandler(&captured))
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	r.Header.Set("Authorization", "Bearer jukubox_unknown")

	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	assert.Empty(t, captured)
}

func TestMiddleware_ApiKeyResolverInternalError_Returns401(t *testing.T) {
	// 防御的な経路: resolver が予期しない DB エラーを返す場合は 401 にフォールバックする
	// （ユーザーに対しては unauthorized を出し、内部エラーは漏らさない）
	verifier := newVerifierWithHMAC(t)
	resolver := &stubResolver{err: errors.New("connection refused")}

	captured := ""
	handler := auth.Middleware(verifier, resolver)(newOKHandler(&captured))
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	r.Header.Set("Authorization", "Bearer jukubox_anything")

	handler.ServeHTTP(w, r)

	// 内部エラーでも 401 を返す（攻撃者に内部状態を漏らさないため）
	assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	assert.Empty(t, captured)
}

func TestUserIDFromContext_NoValue(t *testing.T) {
	_, ok := auth.UserIDFromContext(context.Background())
	assert.False(t, ok)
}

func TestUserIDFromContext_EmptyValue(t *testing.T) {
	ctx := auth.WithUserID(context.Background(), "")
	_, ok := auth.UserIDFromContext(ctx)
	assert.False(t, ok)
}

func TestHashApiKey_DeterministicAndMatchesEntity(t *testing.T) {
	// 同じ平文に対して同じハッシュを返す
	a := auth.HashApiKey("jukubox_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
	b := auth.HashApiKey("jukubox_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")

	assert.Equal(t, a, b)
	// SHA256 は 32 byte hex = 64 文字
	assert.Len(t, a, 64)
}
