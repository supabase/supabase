package api

import (
	"encoding/json"
	"net/http"
	"time"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// PasskeyListItem is the response shape for a single passkey in the list and management endpoints.
type PasskeyListItem struct {
	ID           string     `json:"id"`
	FriendlyName string     `json:"friendly_name,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty"`
}

// PasskeyUpdateParams is the request body for PATCH /passkeys/{passkey_id}.
type PasskeyUpdateParams struct {
	FriendlyName string `json:"friendly_name"`
}

// TODO(fm): we should not allow any of the following operations on credentials used for
// MFA webauthn factors — in particular, the deletion operation.

// PasskeyList handles GET /passkeys/.
// Requires authentication. Returns all passkeys for the authenticated user.
func (a *API) PasskeyList(w http.ResponseWriter, r *http.Request) error {
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

// PasskeyUpdate handles PATCH /passkeys/{passkey_id}.
// Requires authentication. Updates the friendly_name of a passkey owned by the authenticated user.
func (a *API) PasskeyUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	db := a.db.WithContext(ctx)

	passkeyID, err := uuid.FromString(chi.URLParam(r, "passkey_id"))
	if err != nil {
		return apierrors.NewNotFoundError(apierrors.ErrorCodeValidationFailed, "Passkey not found")
	}

	params := &PasskeyUpdateParams{}
	body, err := utilities.GetBodyBytes(r)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Could not read request body")
	}
	if err := json.Unmarshal(body, params); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Could not parse request body as JSON: %v", err)
	}

	if params.FriendlyName == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "friendly_name is required")
	}
	if utf8.RuneCountInString(params.FriendlyName) > 120 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "friendly_name must be 120 characters or less")
	}

	cred, err := models.FindWebAuthnCredentialByIDAndUserID(db, passkeyID, user.ID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeValidationFailed, "Passkey not found")
		}
		return apierrors.NewInternalServerError("Database error loading passkey").WithInternalError(err)
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := cred.UpdateFriendlyName(tx, params.FriendlyName); terr != nil {
			return terr
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.PasskeyUpdatedAction, utilities.GetIPAddress(r), map[string]any{
			"passkey_id": cred.ID,
		}); terr != nil {
			return terr
		}

		return nil
	})
	if err != nil {
		return apierrors.NewInternalServerError("Database error updating passkey").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, toPasskeyListItem(cred))
}

// PasskeyDelete handles DELETE /passkeys/{passkey_id}.
// Requires authentication. Deletes a passkey owned by the authenticated user.
func (a *API) PasskeyDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	session := getSession(ctx)
	db := a.db.WithContext(ctx)

	if err := requirePasskeyManagementAAL(user, session); err != nil {
		return err
	}

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

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.PasskeyDeletedAction, utilities.GetIPAddress(r), map[string]any{
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

func toPasskeyListItem(cred *models.WebAuthnCredential) PasskeyListItem {
	return PasskeyListItem{
		ID:           cred.ID.String(),
		FriendlyName: cred.FriendlyName,
		CreatedAt:    cred.CreatedAt,
		LastUsedAt:   cred.LastUsedAt,
	}
}
