package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/stretchr/testify/assert"
)

const testUserID = "00000000-0000-0000-0000-000000000001"

type mockUpdateUsecase struct{ err error }

func (m *mockUpdateUsecase) Execute(_ context.Context, _ uuid.UUID, _, _ string) error {
	return m.err
}

func newPatchRequest(t *testing.T, userID, body string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPatch, "/v1/me", strings.NewReader(body))
	if userID != "" {
		req = req.WithContext(libauth.WithUserID(req.Context(), userID))
	}
	return req
}

func decodeStringMap(t *testing.T, w *httptest.ResponseRecorder) map[string]string {
	t.Helper()
	var body map[string]string
	if err := json.NewDecoder(w.Result().Body).Decode(&body); err != nil {
		t.Fatalf("レスポンスボディのデコードに失敗しました: %v", err)
	}
	return body
}

func TestPatchUserHandler(t *testing.T) {
	validBody := `{"nickname":"テスト","introduce":"自己紹介"}`

	t.Run("認証情報が無い場合401を返す", func(t *testing.T) {
		h := NewUpdateUserHandler(&mockUpdateUsecase{})
		w := httptest.NewRecorder()
		h.PatchUserHandler(w, newPatchRequest(t, "", validBody))
		assert.Equal(t, http.StatusUnauthorized, w.Result().StatusCode)
	})

	t.Run("userIDがUUID形式でない場合400を返す", func(t *testing.T) {
		h := NewUpdateUserHandler(&mockUpdateUsecase{})
		req := newPatchRequest(t, "not-a-uuid", validBody)
		w := httptest.NewRecorder()
		h.PatchUserHandler(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
	})

	t.Run("リクエストボディが不正なJSONの場合400を返す", func(t *testing.T) {
		h := NewUpdateUserHandler(&mockUpdateUsecase{})
		w := httptest.NewRecorder()
		h.PatchUserHandler(w, newPatchRequest(t, testUserID, "invalid-json"))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
	})

	t.Run("バリデーションエラーの場合400を返す", func(t *testing.T) {
		h := NewUpdateUserHandler(&mockUpdateUsecase{err: fmt.Errorf("%w: nickname too short", ErrValidation)})
		w := httptest.NewRecorder()
		h.PatchUserHandler(w, newPatchRequest(t, testUserID, `{"nickname":"valid","introduce":""}`))
		assert.Equal(t, http.StatusBadRequest, w.Result().StatusCode)
	})

	t.Run("ユーザーが存在しない場合404を返す", func(t *testing.T) {
		h := NewUpdateUserHandler(&mockUpdateUsecase{err: ErrUserNotFound})
		w := httptest.NewRecorder()
		h.PatchUserHandler(w, newPatchRequest(t, testUserID, validBody))
		assert.Equal(t, http.StatusNotFound, w.Result().StatusCode)
	})

	t.Run("予期しないエラーの場合500を返す", func(t *testing.T) {
		h := NewUpdateUserHandler(&mockUpdateUsecase{err: fmt.Errorf("unexpected error")})
		w := httptest.NewRecorder()
		h.PatchUserHandler(w, newPatchRequest(t, testUserID, validBody))
		assert.Equal(t, http.StatusInternalServerError, w.Result().StatusCode)
	})

	t.Run("正常な場合200とnickname・introduceを返す", func(t *testing.T) {
		h := NewUpdateUserHandler(&mockUpdateUsecase{})
		w := httptest.NewRecorder()
		h.PatchUserHandler(w, newPatchRequest(t, testUserID, validBody))
		assert.Equal(t, http.StatusOK, w.Result().StatusCode)
		body := decodeStringMap(t, w)
		assert.Equal(t, "テスト", body["nickname"])
		assert.Equal(t, "自己紹介", body["introduce"])
	})
}
