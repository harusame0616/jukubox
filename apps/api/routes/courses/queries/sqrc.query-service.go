package queries

import (
	"context"
	"log"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

const pageSize = 200

type SqrcCourseQueryService struct {
	sqrc db.Querier
}

var _ CourseQueryService = (*SqrcCourseQueryService)(nil)

func NewSqrcCourseQueryService(querier db.Querier) *SqrcCourseQueryService {
	return &SqrcCourseQueryService{sqrc: querier}
}

func (r *SqrcCourseQueryService) FindCourses(ctx context.Context, keyword string, cursor string) (GetCoursesResult, error) {
	var cursorUuid pgtype.UUID

	if cursor != "" {
		if err := cursorUuid.Scan(cursor); err != nil {
			log.Printf("cursor scan error: %v", err)
			return GetCoursesResult{Courses: []CoursesItem{}, Cursor: nil}, err
		}
	}

	rawCourses, err := r.sqrc.GetCourses(ctx, db.GetCoursesParams{Cursor: cursorUuid, Keyword: keyword, Size: pageSize + 1})
	if err != nil {
		return GetCoursesResult{Courses: []CoursesItem{}, Cursor: nil}, err
	}

	slicedRawCourses := rawCourses[0:min(len(rawCourses), pageSize)]

	coursesItems := make([]CoursesItem, len(slicedRawCourses))
	for i, rawCourse := range slicedRawCourses {
		coursesItems[i] = CoursesItem{
			CourseId: rawCourse.CourseID.String(),
			Title:    rawCourse.Title,
		}
	}

	var nextCursor *string
	if len(rawCourses) > pageSize {
		s := rawCourses[pageSize-1].CourseID.String()
		nextCursor = &s
	}

	return GetCoursesResult{Courses: coursesItems, Cursor: nextCursor}, nil
}
