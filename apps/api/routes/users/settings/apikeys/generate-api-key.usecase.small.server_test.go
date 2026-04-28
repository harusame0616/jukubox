package apikeys

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeTransactionRunner struct {
	advisoryLockErr error
}

func (r *fakeTransactionRunner) RunInTransaction(ctx context.Context, f func(tx pgx.Tx) error) error {
	return f(nil)
}

func (r *fakeTransactionRunner) AcquireAdvisoryLock(_ context.Context, _ pgx.Tx, _ int64) error {
	return r.advisoryLockErr
}

type fakeApiKeyRepository struct {
	count     int
	saveErr   error
	savedKey  *hashedApiKey
	saveCalls int
}

func (r *fakeApiKeyRepository) countWithTx(_ context.Context, _ pgx.Tx, _ uuid.UUID) int {
	return r.count
}

func (r *fakeApiKeyRepository) saveWithTx(_ context.Context, _ pgx.Tx, key hashedApiKey) error {
	r.saveCalls++
	if r.saveErr != nil {
		return r.saveErr
	}
	r.savedKey = &key
	return nil
}

func TestGenerateApiKeyUsecaseExecute(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()

	t.Run("AcquireAdvisoryLock がエラーを返した場合エラーを伝搬する", func(t *testing.T) {
		lockErr := errors.New("lock failed")
		usecase := NewGenerateApiKeyUsecase(
			&fakeApiKeyRepository{},
			&fakeTransactionRunner{advisoryLockErr: lockErr},
		)
		_, err := usecase.Execute(ctx, userID, nil)
		assert.ErrorIs(t, err, lockErr)
	})

	t.Run("API キー数が上限以上の場合 ErrApiKeyCountExceedsLimit を返す", func(t *testing.T) {
		usecase := NewGenerateApiKeyUsecase(
			&fakeApiKeyRepository{count: apiKeyMaxCount},
			&fakeTransactionRunner{},
		)
		_, err := usecase.Execute(ctx, userID, nil)
		assert.ErrorIs(t, err, ErrApiKeyCountExceedsLimit)
	})

	t.Run("saveWithTx がエラーを返した場合エラーを伝搬する", func(t *testing.T) {
		saveErr := errors.New("save failed")
		usecase := NewGenerateApiKeyUsecase(
			&fakeApiKeyRepository{saveErr: saveErr},
			&fakeTransactionRunner{},
		)
		_, err := usecase.Execute(ctx, userID, nil)
		assert.ErrorIs(t, err, saveErr)
	})

	t.Run("正常系では平文 API キーを返し saveWithTx に正しい hashedApiKey が渡される", func(t *testing.T) {
		repo := &fakeApiKeyRepository{}
		usecase := NewGenerateApiKeyUsecase(repo, &fakeTransactionRunner{})

		result, err := usecase.Execute(ctx, userID, nil)
		require.NoError(t, err)
		assert.True(t, strings.HasPrefix(result.Apikey, "jukubox_"))
		require.Equal(t, 1, repo.saveCalls)
		require.NotNil(t, repo.savedKey)
		assert.Equal(t, userID, repo.savedKey.userID)
		assert.Equal(t, result.Apikey[len(result.Apikey)-4:], repo.savedKey.plainApiKeySuffix)
	})
}
