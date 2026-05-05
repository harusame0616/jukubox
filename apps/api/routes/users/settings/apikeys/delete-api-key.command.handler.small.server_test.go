package apikeys

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockDeleteApiKeyExecutor struct {
	err error
}

func (m *mockDeleteApiKeyExecutor) Execute(_ context.Context, _, _ uuid.UUID) error {
	return m.err
}

func newDeleteRequest(t *testing.T, userID, apiKeyID string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodDelete, "/v1/me/apikeys/"+apiKeyID, nil)
	req.SetPathValue("apikeyID", apiKeyID)
	if userID != "" {
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
	}
	return req
}

func TestDeleteApiKeyHandler(t *testing.T) {
	const validApiKeyID = "11111111-1111-1111-1111-111111111111"

	t.Run("認証情報が無い場合401を返す", func(t *testing.T) {
		h := NewDeleteApiKeyHandler(&mockDeleteApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.DeleteApiKeyHandler(w, newDeleteRequest(t, "", validApiKeyID))
		assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	})

	t.Run("userIDがUUID形式でない場合400を返す", func(t *testing.T) {
		h := NewDeleteApiKeyHandler(&mockDeleteApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.DeleteApiKeyHandler(w, newDeleteRequest(t, "not-a-uuid", validApiKeyID))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
	})

	t.Run("apikeyIDがUUID形式でない場合400を返す", func(t *testing.T) {
		h := NewDeleteApiKeyHandler(&mockDeleteApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.DeleteApiKeyHandler(w, newDeleteRequest(t, testUserID, "not-a-uuid"))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "INPUT_VALIDATION_ERROR", body["errorCode"])
	})

	t.Run("該当キーが無い場合404を返す", func(t *testing.T) {
		h := NewDeleteApiKeyHandler(&mockDeleteApiKeyExecutor{err: ErrApiKeyNotFound})
		w := httptest.NewRecorder()
		h.DeleteApiKeyHandler(w, newDeleteRequest(t, testUserID, validApiKeyID))
		assert.Equal(t, http.StatusNotFound, w.Result().StatusCode)

		var body map[string]any
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		assert.Equal(t, "APIKEY_NOT_FOUND", body["errorCode"])
	})

	t.Run("usecaseが想定外のエラーの場合500を返す", func(t *testing.T) {
		h := NewDeleteApiKeyHandler(&mockDeleteApiKeyExecutor{err: errors.New("unexpected")})
		w := httptest.NewRecorder()
		h.DeleteApiKeyHandler(w, newDeleteRequest(t, testUserID, validApiKeyID))
		assert.Equal(t, http.StatusInternalServerError, w.Result().StatusCode)
	})

	t.Run("正常系では204を返す", func(t *testing.T) {
		h := NewDeleteApiKeyHandler(&mockDeleteApiKeyExecutor{})
		w := httptest.NewRecorder()
		h.DeleteApiKeyHandler(w, newDeleteRequest(t, testUserID, validApiKeyID))
		assert.Equal(t, http.StatusNoContent, w.Result().StatusCode)
	})
}
