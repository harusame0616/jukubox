package queries_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/harusame0616/ijuku/apps/api/lib/env"
	"github.com/harusame0616/ijuku/apps/api/routes/categories/queries"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestListCategoriesHandlerMedium(t *testing.T) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, env.Require("DATABASE_URL"))
	require.NoError(t, err)
	defer pool.Close()

	q := db.New(pool)
	handler := queries.NewListCategoriesHandler(q)

	t.Run("seed されたカテゴリ一覧を返す", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/v1/categories", nil)
		handler.ListCategoriesHandler(w, r)

		assert.Equal(t, http.StatusOK, w.Result().StatusCode)
		var body struct {
			Categories []struct {
				Slug string `json:"slug"`
				Name string `json:"name"`
			} `json:"categories"`
		}
		require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&body))
		require.NotEmpty(t, body.Categories, "カテゴリが空でないこと")

		var found bool
		for _, c := range body.Categories {
			if c.Slug == "frontend" {
				found = true
				break
			}
		}
		require.True(t, found, "frontend カテゴリが返る")
	})
}
