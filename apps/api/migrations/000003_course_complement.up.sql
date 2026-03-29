ALTER TABLE
    course_sections
ADD
    COLUMN title TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_sections
ALTER COLUMN
    title DROP DEFAULT;

ALTER TABLE
    course_sections
ADD
    COLUMN description TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_sections
ALTER COLUMN
    description DROP DEFAULT;

ALTER TABLE
    course_section_topics
ADD
    COLUMN title TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_section_topics
ALTER COLUMN
    title DROP DEFAULT;

ALTER TABLE
    course_section_topics
ADD
    COLUMN description TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_section_topics
ALTER COLUMN
    description DROP DEFAULT;

ALTER TABLE
    course_section_topics
ADD
    COLUMN prerequisites TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_section_topics
ALTER COLUMN
    prerequisites DROP DEFAULT;

ALTER TABLE
    course_section_topics
ADD
    COLUMN knowledge TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_section_topics
ALTER COLUMN
    knowledge DROP DEFAULT;

ALTER TABLE
    course_section_topics
ADD
    COLUMN flow TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_section_topics
ALTER COLUMN
    flow DROP DEFAULT;

ALTER TABLE
    course_section_topics
ADD
    COLUMN quiz TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_section_topics
ALTER COLUMN
    quiz DROP DEFAULT;

ALTER TABLE
    course_section_topics
ADD
    COLUMN completion_criteria TEXT NOT NULL DEFAULT '';

ALTER TABLE
    course_section_topics
ALTER COLUMN
    completion_criteria DROP DEFAULT;

CREATE TABLE progress_topics (
    progress_topic_id UUID,
    course_id UUID NOT NULL,
    course_section_topic_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status TEXT NOT NULL,
    _created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_progress_topics PRIMARY KEY (progress_topic_id),
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_course_id FOREIGN KEY (course_id) REFERENCES courses(course_id),
)
