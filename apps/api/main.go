package main

import (
	"context"
	"log"
	"net/http"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/harusame0616/ijuku/apps/api/routes/courses/queries"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, "postgresql://postgres:password@localhost:5432/postgres")
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	q := db.New(pool)
	coursesHandler := queries.NewCoursesHandlers(queries.NewSqrcCourseQueryService(q))

	http.HandleFunc("/v1/courses", coursesHandler.GetCoursesHandler)

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
