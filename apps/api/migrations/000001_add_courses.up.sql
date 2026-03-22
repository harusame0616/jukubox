CREATE EXTENSION ltree;

CREATE FUNCTION update_meta_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW._updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE categories (
    category_id UUID,
    name TEXT NOT NULL,
    path ltree NOT NULL,

    _created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_categories PRIMARY KEY (category_id)
);

CREATE INDEX idx_categories_path ON categories USING gist (path);

CREATE TABLE authors (
    author_id UUID,
    name TEXT NOT NULL,
    profile TEXT NOT NULL,

    _created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_authors PRIMARY KEY (author_id)
);

CREATE TABLE courses (
    course_id UUID,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    slug TEXT NOT NULL,
    tags JSONB NOT NULL,
    publish_status TEXT NOT NULL,
    category_id UUID NOT NULL,
    published_at TIMESTAMPTZ,
    author_id UUID NOT NULL,
    visibility TEXT NOT NULL,

    _created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_courses PRIMARY KEY (course_id),
    CONSTRAINT fk_courses_category_id FOREIGN KEY (category_id) REFERENCES categories(category_id),
    CONSTRAINT fk_courses_author_id FOREIGN KEY (author_id) REFERENCES authors(author_id),
    CONSTRAINT uq_courses_slug_author_id UNIQUE (slug, author_id)
);

CREATE INDEX idx_courses_category_id ON courses USING btree (category_id);
CREATE INDEX idx_courses_author_id ON courses USING btree (author_id);
CREATE INDEX idx_courses_tags ON courses USING gin (tags);

COMMENT ON COLUMN courses.publish_status IS 'draft / published / archived';
COMMENT ON COLUMN courses.visibility IS 'private = 自分のみ, public = 誰でも閲覧可, paid = 購入者のみ';

CREATE TRIGGER trigger_courses_meta_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER trigger_categories_meta_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER trigger_authors_meta_updated_at
    BEFORE UPDATE ON authors
    FOR EACH ROW
    EXECUTE FUNCTION update_meta_updated_at();
