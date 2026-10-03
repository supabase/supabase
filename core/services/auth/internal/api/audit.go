package api

import (
	"net/http"
	"strings"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
)

var filterColumnMap = map[string][]string{
	"author": {"actor_username", "actor_name"},
	"action": {"action"},
	"type":   {"log_type"},
}

func (a *API) adminAuditLog(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	// aud := a.requestAud(ctx, r)
	pageParams, err := paginate(r)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Bad Pagination Parameters: %v", err)
	}

	var col []string
	var qval string
	q := r.URL.Query().Get("query")
	if q != "" {
		var exists bool
		qparts := strings.SplitN(q, ":", 2)
		col, exists = filterColumnMap[qparts[0]]
		if !exists || len(qparts) < 2 {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invalid query scope: %s", q)
		}
		qval = qparts[1]
	}

	logs, err := models.FindAuditLogEntries(db, col, qval, pageParams)
	if err != nil {
		return apierrors.NewInternalServerError("Error searching for audit logs").WithInternalError(err)
	}

	addPaginationHeaders(w, r, pageParams)

	return sendJSON(w, http.StatusOK, logs)
}
