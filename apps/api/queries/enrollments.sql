-- name: GetEnrollmentsByUserID :many
SELECT
    courses.course_id AS "courseId",
    courses.title
FROM
    user_topic_progresses
    JOIN course_section_topics ON user_topic_progresses.course_section_topic_id = course_section_topics.course_section_topic_id
    JOIN course_sections ON course_section_topics.course_section_id = course_sections.course_section_id
    JOIN courses ON course_sections.course_id = courses.course_id
WHERE
    user_topic_progresses.user_id = @UserID :: uuid
GROUP BY
    courses.course_id, courses.title
ORDER BY
    MAX(user_topic_progresses._updated_at) DESC;
