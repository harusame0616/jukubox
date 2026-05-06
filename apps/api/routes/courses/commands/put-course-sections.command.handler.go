package commands

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/harusame0616/ijuku/apps/api/internal/db"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/response"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	sectionTitleMaxLength = 120
	sectionDescMaxLength  = 500
	topicTitleMaxLength   = 120
	topicDescMaxLength    = 500
	topicBodyMaxLength    = 50000
)

type putCourseSectionsQueries interface {
	GetAuthorByUserID(ctx context.Context, userID pgtype.UUID) (db.GetAuthorByUserIDRow, error)
	GetCourseAuthorityById(ctx context.Context, courseID pgtype.UUID) (db.GetCourseAuthorityByIdRow, error)
	DeleteCourseSectionTopicsByCourseID(ctx context.Context, courseID pgtype.UUID) error
	DeleteCourseSectionsByCourseID(ctx context.Context, courseID pgtype.UUID) error
	InsertCourseSection(ctx context.Context, arg db.InsertCourseSectionParams) error
	InsertCourseSectionTopic(ctx context.Context, arg db.InsertCourseSectionTopicParams) error
}

type putCourseSectionsQueriesWithTx interface {
	putCourseSectionsQueries
	WithTx(tx pgx.Tx) *db.Queries
}

type PutCourseSectionsHandler struct {
	q        putCourseSectionsQueriesWithTx
	txRunner transactionRunner
}

func NewPutCourseSectionsHandler(q putCourseSectionsQueriesWithTx, txRunner transactionRunner) *PutCourseSectionsHandler {
	return &PutCourseSectionsHandler{q: q, txRunner: txRunner}
}

type putCourseSectionTopic struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Body        string `json:"body"`
}

type putCourseSection struct {
	Title       string                  `json:"title"`
	Description string                  `json:"description"`
	Topics      []putCourseSectionTopic `json:"topics"`
}

type putCourseSectionsRequest struct {
	Sections []putCourseSection `json:"sections"`
}

func (h *PutCourseSectionsHandler) PutCourseSectionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userIDStr, ok := libauth.UserIDFromContext(r.Context())
	if !ok {
		response.WriteErrorResponse(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "userID must be UUID format")
		return
	}

	courseIDStr := r.PathValue("courseId")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "courseId must be UUID format")
		return
	}

	var body putCourseSectionsRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "body must be valid JSON")
		return
	}
	if msg := validateSectionsBody(&body); msg != "" {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, msg)
		return
	}

	authority, err := h.q.GetCourseAuthorityById(r.Context(), pgUUID(courseID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			response.WriteErrorResponse(w, http.StatusNotFound, "NOT_FOUND", "course not found")
			return
		}
		log.Printf("PutCourseSectionsHandler GetCourseAuthorityById error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	author, err := h.q.GetAuthorByUserID(r.Context(), pgUUID(userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			response.WriteErrorResponse(w, http.StatusForbidden, "FORBIDDEN", "not the course author")
			return
		}
		log.Printf("PutCourseSectionsHandler GetAuthorByUserID error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}
	if authority.AuthorID != author.AuthorID {
		response.WriteErrorResponse(w, http.StatusForbidden, "FORBIDDEN", "not the course author")
		return
	}

	err = h.txRunner.RunInTransaction(r.Context(), func(tx pgx.Tx) error {
		q := h.q.WithTx(tx)
		// 既存のセクション・トピックを全削除して新規挿入する（編集ではなく置換）
		if err := q.DeleteCourseSectionTopicsByCourseID(r.Context(), pgUUID(courseID)); err != nil {
			return err
		}
		if err := q.DeleteCourseSectionsByCourseID(r.Context(), pgUUID(courseID)); err != nil {
			return err
		}
		for sIdx, section := range body.Sections {
			sectionID, err := uuid.NewRandom()
			if err != nil {
				return err
			}
			if err := q.InsertCourseSection(r.Context(), db.InsertCourseSectionParams{
				Coursesectionid: pgUUID(sectionID),
				Courseid:        pgUUID(courseID),
				Index:           int16(sIdx + 1),
				Title:           section.Title,
				Description:     section.Description,
			}); err != nil {
				return err
			}
			for tIdx, topic := range section.Topics {
				topicID, err := uuid.NewRandom()
				if err != nil {
					return err
				}
				if err := q.InsertCourseSectionTopic(r.Context(), db.InsertCourseSectionTopicParams{
					Coursesectiontopicid: pgUUID(topicID),
					Courseid:             pgUUID(courseID),
					Coursesectionid:      pgUUID(sectionID),
					Index:                int16(tIdx + 1),
					Title:                topic.Title,
					Description:          topic.Description,
					Content:              topic.Body,
				}); err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		log.Printf("PutCourseSectionsHandler error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func validateSectionsBody(body *putCourseSectionsRequest) string {
	if len(body.Sections) == 0 {
		return "sections must have at least one entry"
	}
	for _, section := range body.Sections {
		if strings.TrimSpace(section.Title) == "" {
			return "section title is required"
		}
		if runeLen(section.Title) > sectionTitleMaxLength {
			return "section title is too long"
		}
		if runeLen(section.Description) > sectionDescMaxLength {
			return "section description is too long"
		}
		if len(section.Topics) == 0 {
			return "section must have at least one topic"
		}
		for _, topic := range section.Topics {
			if strings.TrimSpace(topic.Title) == "" {
				return "topic title is required"
			}
			if runeLen(topic.Title) > topicTitleMaxLength {
				return "topic title is too long"
			}
			if runeLen(topic.Description) > topicDescMaxLength {
				return "topic description is too long"
			}
			if strings.TrimSpace(topic.Body) == "" {
				return "topic body is required"
			}
			if runeLen(topic.Body) > topicBodyMaxLength {
				return "topic body is too long"
			}
		}
	}
	return ""
}
