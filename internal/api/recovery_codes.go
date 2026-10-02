package api

import (
	"errors"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// RecoveryCodesGenerateParams are the parameters for generating recovery codes.
type RecoveryCodesGenerateParams struct {
	FriendlyName string `json:"friendly_name"`
}

// RecoveryCodesVerifyParams are the parameters for verifying a recovery code.
type RecoveryCodesVerifyParams struct {
	Code string `json:"code"`
}

// RecoveryCodesResponse is the response shared by the recovery-code endpoints.
// The codes are only returned once, on generation.
type RecoveryCodesResponse struct {
	ID           uuid.UUID `json:"id"`
	Type         string    `json:"type"`
	FriendlyName string    `json:"friendly_name,omitempty"`
	Total        int       `json:"total"`
	Remaining    *int      `json:"remaining,omitempty"`
	Codes        []string  `json:"codes,omitempty"`
}

func uniqueRecoveryCodes(count, length int, generate func(int) string) []string {
	seen := make(map[string]struct{}, count)
	codes := make([]string, 0, count)

	for len(codes) < count {
		code := generate(length)
		if _, dup := seen[code]; dup {
			continue
		}

		seen[code] = struct{}{}
		codes = append(codes, code)
	}

	return codes
}

// generateRecoveryCodes generates the configured number of recovery codes,
// returning the canonical plaintexts and their hashes.
func generateRecoveryCodes(config *conf.GlobalConfiguration) ([]string, []string, error) {
	codes := uniqueRecoveryCodes(config.MFA.RecoveryCodes.Count, config.MFA.RecoveryCodes.CodeLength, crypto.GenerateRecoveryCode)
	hashes := make([]string, 0, len(codes))

	for _, code := range codes {
		hash, err := crypto.GenerateRecoveryCodeHash(code)
		if err != nil {
			return nil, nil, apierrors.NewInternalServerError("Error generating recovery codes").WithInternalError(err)
		}

		hashes = append(hashes, hash)
	}

	return codes, hashes, nil
}

// RecoveryCodesStatus returns the recovery-code enrollment status and counts,
// never code values or lockout state.
func (a *API) RecoveryCodesStatus(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	db := a.db.WithContext(ctx)

	if user == nil {
		return apierrors.NewInternalServerError("An authenticated user is required to view recovery codes")
	}

	set, err := models.FindRecoveryCodeSetByUser(db, user.ID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeMFAFactorNotFound, "The user has not enrolled recovery codes")
		}
		return apierrors.NewInternalServerError("Database error finding recovery code set").WithInternalError(err)
	}

	total, remaining, err := models.CountRecoveryCodes(db, set.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error counting recovery codes").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, &RecoveryCodesResponse{
		ID:        set.MFAFactorID, // we return the factor ID, not the set ID, to match the other factor endpoints.
		Type:      models.RecoveryCode,
		Total:     total,
		Remaining: &remaining,
	})
}

// RecoveryCodesGenerate creates the user's recovery-code factor and one-time
// set of codes, returning the plaintexts exactly once.
func (a *API) RecoveryCodesGenerate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	session := getSession(ctx)
	config := a.config
	db := a.db.WithContext(ctx)

	if session == nil || user == nil {
		return apierrors.NewInternalServerError("A valid session and a registered user are required to generate recovery codes")
	}

	if !config.MFA.RecoveryCodes.EnrollEnabled {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFARecoveryCodesEnrollDisabled, "MFA enroll is disabled for recovery codes")
	}

	// The body is optional; only parse it when one was sent.
	params := &RecoveryCodesGenerateParams{}
	if body, _ := utilities.GetBodyBytes(r); len(body) != 0 {
		if err := retrieveRequestParams(r, params); err != nil {
			return err
		}
	}

	if !session.IsAAL2() {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeInsufficientAAL, "AAL2 required to generate recovery codes")
	}

	if _, err := models.FindRecoveryCodeSetByUser(db, user.ID); err == nil {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAVerifiedFactorExists, "Recovery codes are already enrolled for this user, use regenerate to rotate them")
	} else if !models.IsNotFoundError(err) {
		return apierrors.NewInternalServerError("Database error finding recovery code set").WithInternalError(err)
	}

	factor := models.NewRecoveryCodeFactor(user, params.FriendlyName)

	if err := validateFactors(db, user, factor.FriendlyName, config, session); err != nil {
		return err
	}

	// Recovery codes can never be the user's only second factor.
	if !hasUsableNonRecoveryFactor(config, user.Factors, uuid.Nil) {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFARecoveryCodesSoleFactor, "At least one other verified factor is required to generate recovery codes")
	}

	codes, hashes, err := generateRecoveryCodes(config)
	if err != nil {
		return err
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		// The unique user_id on mfa_recovery_code_sets ensures that only one
		// recovery-code factor can be created per user.
		if terr := tx.Create(factor); terr != nil {
			return apierrors.NewInternalServerError("Database error creating factor").WithInternalError(terr)
		}

		if _, terr := models.CreateRecoveryCodeSet(tx, factor, hashes); terr != nil {
			return apierrors.NewInternalServerError("Database error creating recovery codes").WithInternalError(terr)
		}

		return models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.RecoveryCodesGeneratedAction, utilities.GetIPAddress(r), map[string]any{
			"factor_id": factor.ID,
			"count":     len(codes),
		})
	})
	if err != nil {
		return err
	}

	if config.Mailer.Notifications.MFAFactorEnrolledEnabled && user.GetEmail() != "" {
		if err := a.sendMFAFactorEnrolledNotification(r, db, user, factor.FactorType); err != nil {
			logrus.WithError(err).Warn("Unable to send MFA factor enrolled notification email")
		}
	}

	return sendJSON(w, http.StatusOK, &RecoveryCodesResponse{
		ID:           factor.ID,
		Type:         models.RecoveryCode,
		FriendlyName: factor.FriendlyName,
		Total:        len(codes),
		Codes:        codes,
	})
}

// RecoveryCodesRegenerate atomically replaces the user's recovery codes with a
// fresh set, clearing any active lockout, and returns the new plaintexts exactly once.
func (a *API) RecoveryCodesRegenerate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	session := getSession(ctx)
	config := a.config
	db := a.db.WithContext(ctx)

	if session == nil || user == nil {
		return apierrors.NewInternalServerError("A valid session and a registered user are required to regenerate recovery codes")
	}

	if !config.MFA.RecoveryCodes.EnrollEnabled {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFARecoveryCodesEnrollDisabled, "MFA enroll is disabled for recovery codes")
	}

	if !session.IsAAL2() {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeInsufficientAAL, "AAL2 required to regenerate recovery codes")
	}

	set, err := models.FindRecoveryCodeSetByUser(db, user.ID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeMFAFactorNotFound, "The user has not enrolled recovery codes")
		}

		return apierrors.NewInternalServerError("Database error finding recovery code set").WithInternalError(err)
	}

	factor, err := models.FindFactorByFactorID(db, set.MFAFactorID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeMFAFactorNotFound, "The user has not enrolled recovery codes")
		}

		return apierrors.NewInternalServerError("Database error finding recovery code factor").WithInternalError(err)
	}

	codes, hashes, err := generateRecoveryCodes(config)
	if err != nil {
		return err
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := models.ReplaceRecoveryCodes(tx, set.ID, hashes); terr != nil {
			if models.IsNotFoundError(terr) {
				return apierrors.NewNotFoundError(apierrors.ErrorCodeMFAFactorNotFound, "The user has not enrolled recovery codes")
			}

			return apierrors.NewInternalServerError("Database error replacing recovery codes").WithInternalError(terr)
		}

		return models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.RecoveryCodesRegeneratedAction, utilities.GetIPAddress(r), map[string]any{
			"factor_id": factor.ID,
			"count":     len(codes),
		})
	})
	if err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, &RecoveryCodesResponse{
		ID:           factor.ID,
		Type:         models.RecoveryCode,
		FriendlyName: factor.FriendlyName,
		Total:        len(codes),
		Codes:        codes,
	})
}

func recoveryCodeVerificationFailedError() *apierrors.HTTPError {
	return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAVerificationFailed, "Invalid recovery code entered")
}

func recoveryCodeLockedError() *apierrors.HTTPError {
	return apierrors.NewTooManyRequestsError(apierrors.ErrorCodeMFARecoveryCodesLocked, "Too many failed verification attempts, try again later")
}

// RecoveryCodesVerify redeems a single recovery code and upgrades the user's session to AAL2.
func (a *API) RecoveryCodesVerify(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	session := getSession(ctx)
	config := a.config
	db := a.db.WithContext(ctx)

	if session == nil || user == nil {
		return apierrors.NewInternalServerError("A valid session and a registered user are required to verify recovery codes")
	}

	if !config.MFA.RecoveryCodes.VerifyEnabled {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFARecoveryCodesVerifyDisabled, "MFA verification is disabled for recovery codes")
	}

	params := &RecoveryCodesVerifyParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	code := crypto.NormalizeRecoveryCode(params.Code)
	if code == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Code needs to be non-empty")
	}

	set, err := models.FindRecoveryCodeSetByUser(db, user.ID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return recoveryCodeVerificationFailedError()
		}

		return apierrors.NewInternalServerError("Database error finding recovery code set").WithInternalError(err)
	}

	if set.IsLocked(time.Now()) {
		return recoveryCodeLockedError()
	}

	factor, err := models.FindFactorByFactorID(db, set.MFAFactorID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return recoveryCodeVerificationFailedError()
		}

		return apierrors.NewInternalServerError("Database error finding recovery code factor").WithInternalError(err)
	}

	entries, err := models.FindUnusedRecoveryCodes(db, set.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error finding recovery codes").WithInternalError(err)
	}

	// Compare against every unused code without early exit.
	var matched *models.RecoveryCodeEntry
	for i := range entries {
		switch cerr := crypto.CompareHashAndRecoveryCode(entries[i].CodeHash, code); {
		case cerr == nil:
			if matched == nil {
				matched = &entries[i]
			}
		case !errors.Is(cerr, crypto.ErrRecoveryCodeMismatchedHashAndCode):
			// A malformed stored hash is treated as a non-match.
			logrus.WithError(cerr).WithField("recovery_code_id", entries[i].ID).Warn("Invalid recovery code hash in database")
		}
	}
	valid := matched != nil

	if config.Hook.MFAVerificationAttempt.Enabled {
		input := v0hooks.NewMFAVerificationAttemptInput(
			r,
			user.ID,
			factor.ID,
			factor.FactorType,
			valid,
		)

		output := v0hooks.MFAVerificationAttemptOutput{}
		err := a.hooksMgr.InvokeHook(nil, r, input, &output)
		if err != nil {
			return err
		}

		if output.Decision == v0hooks.HookRejection {
			if err := models.Logout(db, user.ID); err != nil {
				return err
			}

			if output.Message == "" {
				output.Message = v0hooks.DefaultMFAHookRejectionMessage
			}

			return apierrors.NewForbiddenError(apierrors.ErrorCodeMFAVerificationRejected, "%s", output.Message)
		}
	}

	var token *AccessTokenResponse
	err = db.Transaction(func(tx *storage.Connection) error {
		lockedSet, terr := models.FindRecoveryCodeSetForUpdate(tx, user.ID)
		if terr != nil {
			if models.IsNotFoundError(terr) {
				return recoveryCodeVerificationFailedError()
			}

			return apierrors.NewInternalServerError("Database error locking recovery code set").WithInternalError(terr)
		}

		now := time.Now()
		if lockedSet.IsLocked(now) {
			return recoveryCodeLockedError()
		}

		if terr := lockedSet.ClearExpiredLockout(tx, now); terr != nil {
			return apierrors.NewInternalServerError("Database error clearing recovery code lockout").WithInternalError(terr)
		}

		consumed := false
		if valid {
			switch terr := matched.MarkConsumed(tx); {
			case terr == nil:
				consumed = true
			case !errors.Is(terr, models.RecoveryCodeAlreadyConsumedError{}):
				return apierrors.NewInternalServerError("Database error consuming recovery code").WithInternalError(terr)
			}
		}

		if !consumed {
			// A code consumed by a concurrent request counts as a failure, exactly like a wrong code.
			// The increment must commit even though the request fails.
			if terr := lockedSet.RegisterFailure(tx, now, config.MFA.RecoveryCodes.MaxVerifyAttempts, config.MFA.RecoveryCodes.LockoutDuration); terr != nil {
				return apierrors.NewInternalServerError("Database error recording failed verification").WithInternalError(terr)
			}

			return storage.NewCommitWithError(recoveryCodeVerificationFailedError())
		}

		if terr := lockedSet.ResetLockout(tx); terr != nil {
			return apierrors.NewInternalServerError("Database error resetting recovery code lockout").WithInternalError(terr)
		}

		_, remaining, terr := models.CountRecoveryCodes(tx, lockedSet.ID)
		if terr != nil {
			return apierrors.NewInternalServerError("Database error counting recovery codes").WithInternalError(terr)
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.RecoveryCodesVerifiedAction, utilities.GetIPAddress(r), map[string]any{
			"factor_id": factor.ID,
			"remaining": remaining,
		}); terr != nil {
			return terr
		}

		user, terr = models.FindUserByID(tx, user.ID)
		if terr != nil {
			return terr
		}

		token, terr = a.updateMFASessionAndClaims(r, tx, user, models.MFARecoveryCode, models.GrantParams{
			FactorID: &factor.ID,
		})
		if terr != nil {
			return terr
		}

		if terr := models.InvalidateSessionsWithAALLessThan(tx, user.ID, models.AAL2.String()); terr != nil {
			return apierrors.NewInternalServerError("Failed to update sessions. %s", terr)
		}

		return nil
	})
	if err != nil {
		return err
	}

	metering.RecordLogin(metering.LoginTypeMFA, user.ID, &metering.LoginData{
		Provider: metering.ProviderMFARecoveryCode,
	})

	return sendJSON(w, http.StatusOK, token)
}

// RecoveryCodesDelete revokes the user's recovery-code factor.
func (a *API) RecoveryCodesDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	session := getSession(ctx)
	config := a.config
	db := a.db.WithContext(ctx)

	if session == nil || user == nil {
		return apierrors.NewInternalServerError("A valid session and a registered user are required to delete recovery codes")
	}

	if !session.IsAAL2() {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeInsufficientAAL, "AAL2 required to delete recovery codes")
	}

	factor, err := models.FindRecoveryCodeFactorByUser(db, user.ID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeMFAFactorNotFound, "The user has not enrolled recovery codes")
		}

		return apierrors.NewInternalServerError("Database error finding recovery code factor").WithInternalError(err)
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := tx.Destroy(factor); terr != nil {
			return apierrors.NewInternalServerError("Database error deleting recovery code factor").WithInternalError(terr)
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.RecoveryCodesDeletedAction, utilities.GetIPAddress(r), map[string]any{
			"factor_id": factor.ID,
		}); terr != nil {
			return terr
		}

		if terr := factor.DowngradeSessionsToAAL1(tx); terr != nil {
			return apierrors.NewInternalServerError("Database error downgrading sessions").WithInternalError(terr)
		}

		return nil
	})
	if err != nil {
		return err
	}

	if config.Mailer.Notifications.MFAFactorUnenrolledEnabled && user.GetEmail() != "" {
		if err := a.sendMFAFactorUnenrolledNotification(r, db, user, factor.FactorType); err != nil {
			logrus.WithError(err).Warn("Unable to send MFA factor unenrolled notification email")
		}
	}

	return sendJSON(w, http.StatusOK, &UnenrollFactorResponse{
		ID: factor.ID,
	})
}
