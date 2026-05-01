ALTER TABLE
    course_section_topics DROP COLUMN prerequisites,
    DROP COLUMN knowledge,
    DROP COLUMN flow,
    DROP COLUMN quiz,
    DROP COLUMN completion_criteria,
ADD
    COLUMN content TEXT NOT NULL;
