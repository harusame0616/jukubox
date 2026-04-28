package apikeys

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/response"
	"github.com/harusame0616/ijuku/apps/api/lib/txrunner"
)

type generateApiKeyExecutor interface {
	Execute(ctx context.Context, userID uuid.UUID, expiredAt *time.Time) (generateApiKeyExecuteResult, error)
}

type generateApiKey struct {
	usecase  generateApiKeyExecutor
	verifier *libauth.Verifier
}

func NewGenerateApiKeyHandler(usecase generateApiKeyExecutor, verifier *libauth.Verifier) generateApiKey {
	return generateApiKey{
		usecase:  usecase,
		verifier: verifier,
	}
}

func (generateApiKey generateApiKey) GenerateApiKeyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	token, err := libauth.ExtractBearerToken(r)
	if err != nil {
		response.WriteErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	jwtUserID, err := generateApiKey.verifier.GetUserID(token)
	if err != nil {
		response.WriteErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	userID := r.PathValue("userID")
	if userID == "" {
		response.WriteInternalServerErrorResponse(w)
		return
	}

	if jwtUserID != userID {
		response.WriteErrorResponse(w, http.StatusForbidden, "FORBIDDEN", "forbidden")
		return
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "User ID must be valid UUID")
		return
	}

	var bodyParams struct {
		ExpiredAt *time.Time `json:"expiredAt"`
	}

	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&bodyParams); err != nil {
		var timeParseErr *time.ParseError

		switch {
		case errors.As(err, &timeParseErr):
			response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "expiredAt must be ISO 8601 format")
		default:
			response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "Body must be valid JSON")
		}
		return
	}

	result, err := generateApiKey.usecase.Execute(r.Context(), parsedUserID, bodyParams.ExpiredAt)

	if err != nil {
		switch {
		case errors.Is(err, ErrApiKeyCountExceedsLimit):
			response.WriteErrorResponse(w, http.StatusConflict, "APIKEY_QUOTA_EXCEEDS_LIMIT", "Api key quota exceeds limit. Api key quota limit is "+strconv.Itoa(apiKeyMaxCount))
		case errors.Is(err, txrunner.ErrLockTimeout):
			response.WriteErrorResponse(w, http.StatusServiceUnavailable, "APIKEY_LOCK_TIMEOUT", "Api key generation is temporarily unavailable. Please try again later.")
		default:
			response.WriteInternalServerErrorResponse(w)
		}

		return
	}

	json.NewEncoder(w).Encode(result)
}
