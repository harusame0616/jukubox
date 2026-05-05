package apikeys

import (
	"context"
	"errors"
	"net/http"

	"github.com/google/uuid"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/response"
)

type deleteApiKeyExecutor interface {
	Execute(ctx context.Context, userID, apiKeyID uuid.UUID) error
}

type DeleteApiKeyHandler struct {
	usecase deleteApiKeyExecutor
}

func NewDeleteApiKeyHandler(usecase deleteApiKeyExecutor) *DeleteApiKeyHandler {
	return &DeleteApiKeyHandler{usecase: usecase}
}

func (h *DeleteApiKeyHandler) DeleteApiKeyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userIDStr, ok := libauth.UserIDFromContext(r.Context())
	if !ok {
		response.WriteErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "userID must be a valid UUID")
		return
	}

	apiKeyID, err := uuid.Parse(r.PathValue("apikeyID"))
	if err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "apikeyID must be a valid UUID")
		return
	}

	if err := h.usecase.Execute(r.Context(), userID, apiKeyID); err != nil {
		switch {
		case errors.Is(err, ErrApiKeyNotFound):
			response.WriteErrorResponse(w, http.StatusNotFound, "APIKEY_NOT_FOUND", "api key not found")
		default:
			response.WriteInternalServerErrorResponse(w)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
