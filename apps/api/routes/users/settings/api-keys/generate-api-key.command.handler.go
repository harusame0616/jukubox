package apikeys

import (
	"encoding/json"
	"net/http"

	"github.com/harusame0616/ijuku/apps/api/lib/validation"
)

func GenerateApiKeyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// TODO: 本来は API キーから UserId を解決すべきだが、認証機能未実装のため暫定的に body から取得している
	var bodyParams struct {
		UserId string `json:"userId"`
	}

	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&bodyParams); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"code": validation.InputValidationError,
			"message": "body is invalid json"})
		return
	}

}
