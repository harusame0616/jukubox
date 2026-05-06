CREATE TABLE user_authors (
    user_id UUID,
    author_id UUID,

    _created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_user_authors PRIMARY KEY (user_id, author_id),
    CONSTRAINT fk_user_authors_user_id FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_user_authors_author_id FOREIGN KEY (author_id) REFERENCES authors(author_id)
);

CREATE INDEX idx_user_authors_author_id ON user_authors USING btree (author_id);

CREATE TRIGGER trigger_user_authors_meta_updated_at
    BEFORE UPDATE ON user_authors
    FOR EACH ROW
    EXECUTE FUNCTION update_meta_updated_at();

ALTER TABLE categories
    ADD CONSTRAINT uq_categories_path UNIQUE (path);
