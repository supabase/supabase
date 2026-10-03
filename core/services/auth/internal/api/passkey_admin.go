package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// AdminPasskeyList handles GET /admin/users/{user_id}/passkeys.
// Requires admin credentials. Returns all passkeys for the specified user.
func (a *API) AdminPasskeyList(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	db := a.db.WithContext(ctx)

	creds, err := models.FindWebAuthnCredentialsByUserID(db, user.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error loading passkeys").WithInternalError(err)
	}

	items := make([]PasskeyListItem, len(creds))
	for i, cred := range creds {
		items[i] = toPasskeyListItem(cred)
	}

	return sendJSON(w, http.StatusOK, items)
}

// AdminPasskeyDelete handles DELETE /admin/users/{user_id}/passkeys/{passkey_id}.
// Requires admin credentials. Deletes the specified passkey.
func (a *API) AdminPasskeyDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	adminUser := getAdminUser(ctx)
	db := a.db.WithContext(ctx)

	passkeyID, err := uuid.FromString(chi.URLParam(r, "passkey_id"))
	if err != nil {
		return apierrors.NewNotFoundError(apierrors.ErrorCodeValidationFailed, "Passkey not found")
	}

	cred, err := models.FindWebAuthnCredentialByIDAndUserID(db, passkeyID, user.ID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeValidationFailed, "Passkey not found")
		}
		return apierrors.NewInternalServerError("Database error loading passkey").WithInternalError(err)
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := cred.Delete(tx); terr != nil {
			return terr
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, adminUser, models.PasskeyDeletedAction, utilities.GetIPAddress(r), map[string]any{
			"user_id":    user.ID,
			"passkey_id": cred.ID,
		}); terr != nil {
			return terr
		}

		return nil
	})
	if err != nil {
		return apierrors.NewInternalServerError("Database error deleting passkey").WithInternalError(err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}
