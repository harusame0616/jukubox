package queries

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/harusame0616/ijuku/apps/api/lib/response"
	"github.com/jackc/pgx/v5/pgtype"
)

type GetEnrollmentsQuery interface {
	GetEnrollmentsByUserID(ctx context.Context, userid pgtype.UUID) ([]db.GetEnrollmentsByUserIDRow, error)
}

type GetEnrollmentsHandler struct {
	query GetEnrollmentsQuery
}

func NewGetEnrollmentsHandler(q GetEnrollmentsQuery) *GetEnrollmentsHandler {
	return &GetEnrollmentsHandler{query: q}
}

type GetEnrollmentsResponse struct {
	Enrollments []db.GetEnrollmentsByUserIDRow `json:"enrollments"`
}

func (h *GetEnrollmentsHandler) GetEnrollmentsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var userID pgtype.UUID
	if err := userID.Scan(r.PathValue("userID")); err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "userID must be a valid UUID")
		return
	}

	enrollments, err := h.query.GetEnrollmentsByUserID(r.Context(), userID)
	if err != nil {
		log.Printf("GetEnrollmentsByUserID error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	_ = json.NewEncoder(w).Encode(GetEnrollmentsResponse{Enrollments: enrollments})
}
