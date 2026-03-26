package queries

import "context"

type CourseQueryService interface {
	FindCourses(ctx context.Context, keyword string, cursor string) (GetCoursesResult, error)
}

type CoursesItem struct {
	CourseId string `json:"courseId"`
	Title    string `json:"title"`
}

type GetCoursesResult struct {
	Courses []CoursesItem `json:"courses"`
	Cursor  *string       `json:"cursor"`
}
