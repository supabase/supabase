package shared

import (
	"net/http"
)

// SendJSON sends a JSON response with proper error handling
func SendJSON(w http.ResponseWriter, status int, obj any) error {
	return JSON(w).ContentType("application/json").Status(status).Send(obj)
}
