package api

import (
	"net/http"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
)

// RecoverParams holds the parameters for a password recovery request
type RecoverParams struct {
	Email               string `json:"email"`
	CodeChallenge       string `json:"code_challenge"`
	CodeChallengeMethod string `json:"code_challenge_method"`
}

func (p *RecoverParams) Validate(a *API) error {
	if p.Email == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Password recovery requires an email")
	}
	var err error
	if p.Email, err = a.validateEmail(p.Email); err != nil {
		return err
	}
	if err := validatePKCEParams(p.CodeChallengeMethod, p.CodeChallenge); err != nil {
		return err
	}
	return nil
}

// Recover sends a recovery email
func (a *API) Recover(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config

	params := &RecoverParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	flowType := getFlowFromChallenge(params.CodeChallenge)
	if err := params.Validate(a); err != nil {
		return err
	}

	var user *models.User
	var err error
	aud := a.requestAud(ctx, r)

	user, err = models.FindUserByEmailAndAudience(db, params.Email, aud)
	if err != nil {
		if models.IsNotFoundError(err) {
			return sendJSON(w, http.StatusOK, map[string]string{})
		}
		return apierrors.NewInternalServerError("Unable to process request").WithInternalError(err)
	}
	if isPKCEFlow(flowType) {
		if _, err := generateFlowState(db, models.Recovery.String(), models.Recovery, params.CodeChallengeMethod, params.CodeChallenge, &(user.ID)); err != nil {
			return err
		}
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserRecoveryRequestedAction, "", nil); terr != nil {
			return terr
		}
		return a.sendPasswordRecovery(r, tx, user, flowType)
	})
	if err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, map[string]string{})
}
