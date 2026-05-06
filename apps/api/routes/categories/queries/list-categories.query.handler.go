package queries

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/harusame0616/ijuku/apps/api/internal/db"
	"github.com/harusame0616/ijuku/apps/api/lib/response"
)

type listCategoriesQuery interface {
	ListCategories(ctx context.Context) ([]db.ListCategoriesRow, error)
}

type ListCategoriesHandler struct {
	q listCategoriesQuery
}

func NewListCategoriesHandler(q listCategoriesQuery) *ListCategoriesHandler {
	return &ListCategoriesHandler{q: q}
}

type categoryNode struct {
	Slug     string         `json:"slug"`
	Name     string         `json:"name"`
	Children []categoryNode `json:"children,omitempty"`
}

type listCategoriesResponse struct {
	Categories []categoryNode `json:"categories"`
}

func (h *ListCategoriesHandler) ListCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := h.q.ListCategories(r.Context())
	if err != nil {
		log.Printf("ListCategories error: %v", err)
		response.WriteInternalServerErrorResponse(w)
		return
	}

	tree := buildTree(rows)
	_ = json.NewEncoder(w).Encode(listCategoriesResponse{Categories: tree})
}

// buildTree は path 昇順でソートされた categories から階層構造を組み立てる
func buildTree(rows []db.ListCategoriesRow) []categoryNode {
	type entry struct {
		node     *categoryNode
		children *[]categoryNode
	}
	byPath := map[string]*entry{}
	roots := []categoryNode{}

	for _, row := range rows {
		segments := strings.Split(row.Path, ".")
		slug := segments[len(segments)-1]
		node := categoryNode{Slug: slug, Name: row.Name}

		if len(segments) == 1 {
			roots = append(roots, node)
			byPath[row.Path] = &entry{
				node:     &roots[len(roots)-1],
				children: &roots[len(roots)-1].Children,
			}
			continue
		}

		parentPath := strings.Join(segments[:len(segments)-1], ".")
		parent, ok := byPath[parentPath]
		if !ok {
			continue
		}
		*parent.children = append(*parent.children, node)
		appended := &(*parent.children)[len(*parent.children)-1]
		byPath[row.Path] = &entry{
			node:     appended,
			children: &appended.Children,
		}
	}

	return roots
}
