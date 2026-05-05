package apikeys

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

var ErrApiKeyNotFound = errors.New("api key not found")

type deleteApiKeyRepository interface {
	deleteByID(ctx context.Context, userID, apiKeyID uuid.UUID) (int64, error)
}

type deleteApiKeyUsecase struct {
	repository deleteApiKeyRepository
}

func NewDeleteApiKeyUsecase(repository deleteApiKeyRepository) *deleteApiKeyUsecase {
	return &deleteApiKeyUsecase{repository: repository}
}

func (u *deleteApiKeyUsecase) Execute(ctx context.Context, userID, apiKeyID uuid.UUID) error {
	rows, err := u.repository.deleteByID(ctx, userID, apiKeyID)
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrApiKeyNotFound
	}
	return nil
}
