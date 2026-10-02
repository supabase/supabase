package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// PasskeyAuthenticationOptionsResponse is the response body for POST /passkeys/authentication/options.
type PasskeyAuthenticationOptionsResponse struct {
	ChallengeID string                                      `json:"challenge_id"`
	Options     *protocol.PublicKeyCredentialRequestOptions `json:"options"`
	ExpiresAt   int64                                       `json:"expires_at"`
}

// PasskeyAuthenticationVerifyParams is the request body for POST /passkeys/authentication/verify.
type PasskeyAuthenticationVerifyParams struct {
	ChallengeID string          `json:"challenge_id"`
	Credential  json.RawMessage `json:"credential"`
}

// PasskeyAuthenticationOptions handles POST /passkeys/authentication/options.
// Generates WebAuthn authentication options for discoverable credential login.
func (a *API) PasskeyAuthenticationOptions(w http.ResponseWriter, r *http.Request) error {
	config := a.config
	db := a.db.WithContext(r.Context())

	webAuthn, err := a.getPasskeyWebAuthn()
	if err != nil {
		return apierrors.NewInternalServerError("Failed to initialize WebAuthn").WithInternalError(err)
	}

	// Discoverable flow: empty allowCredentials, no user binding
	options, session, err := webAuthn.BeginDiscoverableLogin()
	if err != nil {
		return apierrors.NewInternalServerError("Failed to generate WebAuthn authentication options").WithInternalError(err)
	}

	expiresAt := time.Now().Add(config.WebAuthn.ChallengeExpiryDuration)
	challenge := models.NewWebAuthnChallenge(
		nil, // no user_id for discoverable flow
		models.WebAuthnChallengeTypeAuthentication,
		&models.WebAuthnSessionData{SessionData: session},
		expiresAt,
	)

	if err := db.Create(challenge); err != nil {
		return apierrors.NewInternalServerError("Database error storing challenge").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, &PasskeyAuthenticationOptionsResponse{
		ChallengeID: challenge.ID.String(),
		Options:     &options.Response,
		ExpiresAt:   expiresAt.Unix(),
	})
}

// PasskeyAuthenticationVerify handles POST /passkeys/authentication/verify.
// Validates the WebAuthn assertion and issues tokens for discoverable credential login.
func (a *API) PasskeyAuthenticationVerify(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	db := a.db.WithContext(ctx)

	params := &PasskeyAuthenticationVerifyParams{}
	body, err := utilities.GetBodyBytes(r)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Could not read request body")
	}
	if err := json.Unmarshal(body, params); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Could not parse request body as JSON: %v", err)
	}

	if params.ChallengeID == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "challenge_id is required")
	}
	if params.Credential == nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "credential is required")
	}

	challengeID, err := uuid.FromString(params.ChallengeID)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "challenge_id must be a valid UUID")
	}

	challenge, err := models.ConsumeWebAuthnChallengeByID(db, challengeID, models.WebAuthnChallengeTypeAuthentication, nil)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnChallengeNotFound, "Challenge not found or already used")
		}

		return apierrors.NewInternalServerError("Database error consuming challenge").WithInternalError(err)
	}

	if challenge.IsExpired() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnChallengeExpired, "Challenge has expired")
	}

	parsedResponse, err := parseCredentialAssertionResponse(params.Credential)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnVerificationFailed, "Invalid credential response").WithInternalError(err)
	}

	webAuthn, err := a.getPasskeyWebAuthn()
	if err != nil {
		return apierrors.NewInternalServerError("Failed to initialize WebAuthn").WithInternalError(err)
	}

	sessionData := *challenge.SessionData.SessionData

	// Discoverable login: resolve user from userHandle in the assertion
	handler := func(rawID, userHandle []byte) (webauthn.User, error) {
		userID, uerr := uuid.FromString(string(userHandle))
		if uerr != nil {
			return nil, uerr
		}

		u, uerr := models.FindUserByID(db, userID)
		if uerr != nil {
			return nil, uerr
		}

		creds, uerr := models.FindWebAuthnCredentialsByUserID(db, u.ID)
		if uerr != nil {
			return nil, uerr
		}
		if len(creds) == 0 {
			return nil, models.WebAuthnCredentialNotFoundError{}
		}

		return newWebAuthnUser(u, creds), nil
	}

	webauthnUser, credential, err := webAuthn.ValidatePasskeyLogin(handler, sessionData, parsedResponse)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnVerificationFailed, "Credential verification failed").WithInternalError(err)
	}

	// Look up the authenticated user from the validated assertion's userHandle
	userID, err := uuid.FromString(string(webauthnUser.WebAuthnID()))
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invalid user handle in assertion")
	}
	user, err := models.FindUserByID(db, userID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error loading user").WithInternalError(err)
	}

	if user.GetEmail() != "" && !user.IsConfirmed() {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeEmailNotConfirmed, "Email not confirmed")
	}
	if user.GetPhone() != "" && !user.IsPhoneConfirmed() {
		return apierrors.NewForbiddenError(apierrors.ErrorCodePhoneNotConfirmed, "Phone not confirmed")
	}

	if user.IsBanned() {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeUserBanned, "User is banned")
	}

	// Find the matching WebAuthnCredential record to update
	passkeyCredential, err := models.FindWebAuthnCredentialByCredentialID(db, credential.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error loading passkey").WithInternalError(err)
	}

	var grantParams models.GrantParams
	grantParams.FillGrantParams(r)

	var token *AccessTokenResponse
	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error

		if terr = passkeyCredential.UpdateLastUsedWithSignCount(tx, credential.Authenticator.SignCount); terr != nil {
			return terr
		}

		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.LoginAction, utilities.GetIPAddress(r), map[string]any{
			"passkey_id": passkeyCredential.ID,
		}); terr != nil {
			return terr
		}

		token, terr = a.issueRefreshToken(r, w.Header(), tx, user, models.PasskeyLogin, grantParams)
		if terr != nil {
			return terr
		}

		return nil
	})
	if err != nil {
		return err
	}

	metering.RecordLogin(metering.LoginTypePasskey, user.ID, nil)

	return sendJSON(w, http.StatusOK, token)
}

// parseCredentialAssertionResponse parses a WebAuthn credential assertion response from raw JSON.
func parseCredentialAssertionResponse(raw json.RawMessage) (*protocol.ParsedCredentialAssertionData, error) {
	var car protocol.CredentialAssertionResponse
	if err := json.Unmarshal(raw, &car); err != nil {
		return nil, err
	}

	return car.Parse()
}
