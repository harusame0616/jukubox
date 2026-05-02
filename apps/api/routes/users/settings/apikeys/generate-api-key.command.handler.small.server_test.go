package apikeys

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/txrunner"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockGenerateApiKeyExecutor struct {
	result generateApiKeyExecuteResult
	err    error
}

func (m *mockGenerateApiKeyExecutor) Execute(_ context.Context, _ uuid.UUID, _ *time.Time) (generateApiKeyExecuteResult, error) {
	return m.result, m.err
}

func newGenerateRequest(t *testing.T, userID, body string) *http.Request {
	t.Helper()
	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}
	req := httptest.NewRequest(http.MethodPost, "/v1/me/apikeys", bodyReader)
	if userID != "" {
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
	}
	return req
}

func TestGenerateApiKeyHandler(t *testing.T) {
	t.Run("認証情報が無い場合401を返す", func(t *testing.T) {
		h := NewGenerateApiKeyHandler(&mockGenerateApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, "", "{}"))
		assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	})

	t.Run("userIDがUUID形式でない場合400を返す", func(t *testing.T) {
		h := NewGenerateApiKeyHandler(&mockGenerateApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, "not-a-uuid", "{}"))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "INPUT_VALIDATION_ERROR", body["errorCode"])
		assert.Equal(t, "User ID must be valid UUID", body["message"])
	})

	t.Run("Bodyが不正なJSONの場合400を返す", func(t *testing.T) {
		h := NewGenerateApiKeyHandler(&mockGenerateApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, testUserID, "invalid json"))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "Body must be valid JSON", body["message"])
	})

	t.Run("expiredAtがISO 8601フォーマットでない場合400を返す", func(t *testing.T) {
		h := NewGenerateApiKeyHandler(&mockGenerateApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, testUserID, `{"expiredAt": "invalid format"}`))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "expiredAt must be ISO 8601 format", body["message"])
	})

	t.Run("クォータ超過の場合409を返す", func(t *testing.T) {
		h := NewGenerateApiKeyHandler(&mockGenerateApiKeyExecutor{err: ErrApiKeyCountExceedsLimit})
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, testUserID, "{}"))
		assert.Equal(t, http.StatusConflict, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "APIKEY_QUOTA_EXCEEDS_LIMIT", body["errorCode"])
	})

	t.Run("ロックタイムアウトの場合503を返す", func(t *testing.T) {
		h := NewGenerateApiKeyHandler(&mockGenerateApiKeyExecutor{err: txrunner.ErrLockTimeout})
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, testUserID, "{}"))
		assert.Equal(t, http.StatusServiceUnavailable, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "APIKEY_LOCK_TIMEOUT", body["errorCode"])
	})

	t.Run("usecaseが想定外のエラーの場合500を返す", func(t *testing.T) {
		h := NewGenerateApiKeyHandler(&mockGenerateApiKeyExecutor{err: errors.New("unexpected")})
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, testUserID, "{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Result().StatusCode)
	})

	t.Run("正常系では200と平文API キーを返す", func(t *testing.T) {
		executor := &mockGenerateApiKeyExecutor{result: generateApiKeyExecuteResult{Apikey: "jukubox_plain"}}
		h := NewGenerateApiKeyHandler(executor)
		w := httptest.NewRecorder()
		h.GenerateApiKeyHandler(w, newGenerateRequest(t, testUserID, "{}"))

		assert.Equal(t, http.StatusOK, w.Result().StatusCode)
		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "jukubox_plain", body["apikey"])
	})
}
