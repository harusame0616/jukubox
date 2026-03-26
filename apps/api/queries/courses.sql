-- name: GetCourses :many
SELECT
    course_id,
    title
FROM
    courses
WHERE
    (
        courses.publish_status = 'published'
        AND courses.visibility IN ('public', 'paid')
    )
    AND (
        @Cursor :: uuid IS NULL
        OR course_id > @Cursor
    )
    AND (
        NULLIF(@Keyword :: text, '') IS NULL
        OR title LIKE '%' || @Keyword || '%'
        OR description LIKE '%' || @Keyword || '%'
    )
ORDER BY
    course_id
LIMIT
    @Size;
