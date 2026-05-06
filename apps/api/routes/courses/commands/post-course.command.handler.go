package commands

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/harusame0616/ijuku/apps/api/internal/db"
	libauth "github.com/harusame0616/ijuku/apps/api/lib/auth"
	"github.com/harusame0616/ijuku/apps/api/lib/response"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	errorCodeCourseSlugConflict = "COURSE_SLUG_CONFLICT"

	titleMaxLength        = 120
	descriptionMaxLength  = 2000
	slugMaxLength         = 80
	tagMaxLength          = 30
	tagsMaxCount          = 20
	categoryNameMaxLength = 80
	categoryPathMaxLength = 120
)

var (
	slugRegex         = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)
	categoryPathRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$`)
)

type queries interface {
	GetAuthorByUserID(ctx context.Context, userID pgtype.UUID) (db.GetAuthorByUserIDRow, error)
	InsertAuthor(ctx context.Context, arg db.InsertAuthorParams) error
	InsertUserAuthor(ctx context.Context, arg db.InsertUserAuthorParams) error
	GetCategoryByPath(ctx context.Context, path string) (db.GetCategoryByPathRow, error)
	InsertCategory(ctx context.Context, arg db.InsertCategoryParams) error
	InsertCourse(ctx context.Context, arg db.InsertCourseParams) error
}

type queriesWithTx interface {
	queries
	WithTx(tx pgx.Tx) *db.Queries
}

type transactionRunner interface {
	RunInTransaction(ctx context.Context, f func(tx pgx.Tx) error) error
}

type userQuerier interface {
	GetUser(ctx context.Context, userID pgtype.UUID) (db.GetUserRow, error)
}

type PostCourseHandler struct {
	q        queriesWithTx
	users    userQuerier
	txRunner transactionRunner
}

func NewPostCourseHandler(q queriesWithTx, users userQuerier, txRunner transactionRunner) *PostCourseHandler {
	return &PostCourseHandler{q: q, users: users, txRunner: txRunner}
}

type postCourseRequest struct {
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	Slug         string   `json:"slug"`
	Tags         []string `json:"tags"`
	Visibility   string   `json:"visibility"`
	CategoryName string   `json:"categoryName"`
	CategoryPath string   `json:"categoryPath"`
}

type postCourseResponse struct {
	CourseID   string `json:"courseId"`
	AuthorSlug string `json:"authorSlug"`
	CourseSlug string `json:"courseSlug"`
}

func (h *PostCourseHandler) PostCourseHandler(w http.ResponseWriter, r *http.Request) {
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

	var body postCourseRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, "body must be valid JSON")
		return
	}

	if msg := validateBody(&body); msg != "" {
		response.WriteErrorResponse(w, http.StatusBadRequest, response.InputValidationError, msg)
		return
	}

	user, err := h.users.GetUser(r.Context(), pgUUID(userID))
	if err != nil {
		log.Printf("PostCourseHandler GetUser error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	courseID, err := uuid.NewRandom()
	if err != nil {
		log.Printf("PostCourseHandler uuid generation error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	tagsJSON, err := json.Marshal(body.Tags)
	if err != nil {
		log.Printf("PostCourseHandler tags marshal error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	var authorSlug string
	err = h.txRunner.RunInTransaction(r.Context(), func(tx pgx.Tx) error {
		q := h.q.WithTx(tx)

		author, err := h.resolveAuthor(r.Context(), q, userID, user)
		if err != nil {
			return err
		}
		authorSlug = author.slug

		categoryID, err := h.resolveCategory(r.Context(), q, body.CategoryPath, body.CategoryName)
		if err != nil {
			return err
		}

		// ステップ 1 では常に下書きで作成する。公開はステップ 2 以降の編集画面で行う。
		return q.InsertCourse(r.Context(), db.InsertCourseParams{
			Courseid:      pgUUID(courseID),
			Title:         body.Title,
			Description:   body.Description,
			Slug:          body.Slug,
			Tags:          tagsJSON,
			Publishstatus: "draft",
			Categoryid:    pgUUID(categoryID),
			Publishedat:   pgtype.Timestamptz{},
			Authorid:      pgUUID(author.id),
			Visibility:    body.Visibility,
		})
	})

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == "uq_courses_slug_author_id" {
			response.WriteErrorResponse(w, http.StatusConflict, errorCodeCourseSlugConflict, "course slug already used by this author")
			return
		}
		log.Printf("PostCourseHandler error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(postCourseResponse{
		CourseID:   courseID.String(),
		AuthorSlug: authorSlug,
		CourseSlug: body.Slug,
	})
}

type resolvedAuthor struct {
	id   uuid.UUID
	slug string
}

func (h *PostCourseHandler) resolveAuthor(
	ctx context.Context,
	q queries,
	userID uuid.UUID,
	user db.GetUserRow,
) (resolvedAuthor, error) {
	author, err := q.GetAuthorByUserID(ctx, pgUUID(userID))
	if err == nil {
		id, err := uuid.FromBytes(author.AuthorID.Bytes[:])
		if err != nil {
			return resolvedAuthor{}, err
		}
		return resolvedAuthor{id: id, slug: author.Slug}, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return resolvedAuthor{}, err
	}

	authorID, err := uuid.NewRandom()
	if err != nil {
		return resolvedAuthor{}, err
	}
	slug := strings.ReplaceAll(userID.String(), "-", "")
	if err := q.InsertAuthor(ctx, db.InsertAuthorParams{
		Authorid: pgUUID(authorID),
		Name:     user.Nickname,
		Profile:  user.Introduce,
		Slug:     slug,
	}); err != nil {
		return resolvedAuthor{}, err
	}
	if err := q.InsertUserAuthor(ctx, db.InsertUserAuthorParams{
		Userid:   pgUUID(userID),
		Authorid: pgUUID(authorID),
	}); err != nil {
		return resolvedAuthor{}, err
	}
	return resolvedAuthor{id: authorID, slug: slug}, nil
}

func (h *PostCourseHandler) resolveCategory(
	ctx context.Context,
	q queries,
	path, name string,
) (uuid.UUID, error) {
	row, err := q.GetCategoryByPath(ctx, path)
	if err == nil {
		return uuid.FromBytes(row.CategoryID.Bytes[:])
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return uuid.UUID{}, err
	}

	categoryID, err := uuid.NewRandom()
	if err != nil {
		return uuid.UUID{}, err
	}
	if err := q.InsertCategory(ctx, db.InsertCategoryParams{
		Categoryid: pgUUID(categoryID),
		Name:       name,
		Path:       path,
	}); err != nil {
		return uuid.UUID{}, err
	}
	return categoryID, nil
}

func pgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func validateBody(body *postCourseRequest) string {
	body.Title = strings.TrimSpace(body.Title)
	body.Description = strings.TrimSpace(body.Description)
	body.Slug = strings.TrimSpace(body.Slug)
	body.Visibility = strings.TrimSpace(body.Visibility)
	body.CategoryName = strings.TrimSpace(body.CategoryName)
	body.CategoryPath = strings.TrimSpace(body.CategoryPath)

	if body.Title == "" {
		return "title is required"
	}
	if runeLen(body.Title) > titleMaxLength {
		return "title is too long"
	}
	if body.Description == "" {
		return "description is required"
	}
	if runeLen(body.Description) > descriptionMaxLength {
		return "description is too long"
	}
	if body.Slug == "" {
		return "slug is required"
	}
	if runeLen(body.Slug) > slugMaxLength {
		return "slug is too long"
	}
	if !slugRegex.MatchString(body.Slug) {
		return "slug format is invalid"
	}
	if body.Visibility != "public" && body.Visibility != "private" {
		return "visibility must be public or private"
	}
	if body.CategoryName == "" {
		return "categoryName is required"
	}
	if runeLen(body.CategoryName) > categoryNameMaxLength {
		return "categoryName is too long"
	}
	if body.CategoryPath == "" {
		return "categoryPath is required"
	}
	if runeLen(body.CategoryPath) > categoryPathMaxLength {
		return "categoryPath is too long"
	}
	if !categoryPathRegex.MatchString(body.CategoryPath) {
		return "categoryPath format is invalid"
	}
	if len(body.Tags) > tagsMaxCount {
		return "tags has too many entries"
	}
	for _, tag := range body.Tags {
		if tag == "" {
			return "tag must not be empty"
		}
		if runeLen(tag) > tagMaxLength {
			return "tag is too long"
		}
	}

	return ""
}

func runeLen(s string) int {
	return len([]rune(s))
}
