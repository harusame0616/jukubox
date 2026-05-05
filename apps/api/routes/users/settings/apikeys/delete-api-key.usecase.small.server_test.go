package apikeys

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockDeleteApiKeyRepository struct {
	rows         int64
	err          error
	gotUserID    uuid.UUID
	gotApiKeyID  uuid.UUID
	deleteCalled bool
}

func (m *mockDeleteApiKeyRepository) deleteByID(_ context.Context, userID, apiKeyID uuid.UUID) (int64, error) {
	m.deleteCalled = true
	m.gotUserID = userID
	m.gotApiKeyID = apiKeyID
	return m.rows, m.err
}

func TestDeleteApiKeyUsecaseExecute(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	apiKeyID := uuid.New()

	t.Run("リポジトリがエラーを返した場合エラーを伝搬する", func(t *testing.T) {
		repoErr := errors.New("db error")
		usecase := NewDeleteApiKeyUsecase(&mockDeleteApiKeyRepository{err: repoErr})
		assert.ErrorIs(t, usecase.Execute(ctx, userID, apiKeyID), repoErr)
	})

	t.Run("削除対象が無い場合 ErrApiKeyNotFound を返す", func(t *testing.T) {
		usecase := NewDeleteApiKeyUsecase(&mockDeleteApiKeyRepository{rows: 0})
		assert.ErrorIs(t, usecase.Execute(ctx, userID, apiKeyID), ErrApiKeyNotFound)
	})

	t.Run("削除に成功した場合 nil を返し、 user_id と apikey_id がリポジトリに渡る", func(t *testing.T) {
		repo := &mockDeleteApiKeyRepository{rows: 1}
		usecase := NewDeleteApiKeyUsecase(repo)
		require.NoError(t, usecase.Execute(ctx, userID, apiKeyID))
		assert.True(t, repo.deleteCalled)
		assert.Equal(t, userID, repo.gotUserID)
		assert.Equal(t, apiKeyID, repo.gotApiKeyID)
	})
}
