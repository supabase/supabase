package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// PasskeyRegistrationOptionsParams is the request body for POST /passkeys/registration/options.
type PasskeyRegistrationOptionsParams struct{}

// PasskeyRegistrationOptionsResponse is the response body for POST /passkeys/registration/options.
type PasskeyRegistrationOptionsResponse struct {
	ChallengeID string                                       `json:"challenge_id"`
	Options     *protocol.PublicKeyCredentialCreationOptions `json:"options"`
	ExpiresAt   int64                                        `json:"expires_at"`
}

// PasskeyRegistrationVerifyParams is the request body for POST /passkeys/registration/verify.
type PasskeyRegistrationVerifyParams struct {
	ChallengeID string          `json:"challenge_id"`
	Credential  json.RawMessage `json:"credential"`
}

// PasskeyMetadataResponse is the response body for successful passkey creation.
type PasskeyMetadataResponse struct {
	ID           string    `json:"id"`
	FriendlyName string    `json:"friendly_name,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// PasskeyRegistrationOptions handles POST /passkeys/registration/options.
// Requires authentication. Generates WebAuthn registration options for adding a passkey to an existing account.
func (a *API) PasskeyRegistrationOptions(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	session := getSession(ctx)
	db := a.db.WithContext(ctx)

	if user.IsSSOUser {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeValidationFailed, "SSO users cannot register passkeys")
	}

	if err := requirePasskeyManagementAAL(user, session); err != nil {
		return err
	}

	// Check passkey limit
	count, err := models.CountWebAuthnCredentialsByUserID(db, user.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error counting passkeys").WithInternalError(err)
	}
	if count >= config.Passkey.MaxPasskeysPerUser {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeTooManyPasskeys, "Maximum number of passkeys reached")
	}

	// Load existing passkeys to build exclusion list
	existingCreds, err := models.FindWebAuthnCredentialsByUserID(db, user.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error loading passkeys").WithInternalError(err)
	}

	excludeList := make([]protocol.CredentialDescriptor, len(existingCreds))
	for i, cred := range existingCreds {
		excludeList[i] = protocol.CredentialDescriptor{
			Type:         protocol.PublicKeyCredentialType,
			CredentialID: cred.CredentialID,
		}
	}

	webAuthn, err := a.getPasskeyWebAuthn()
	if err != nil {
		return apierrors.NewInternalServerError("Failed to initialize WebAuthn").WithInternalError(err)
	}

	webAuthnUser := newWebAuthnUser(user, existingCreds)
	options, webAuthnSessionData, err := webAuthn.BeginRegistration(webAuthnUser, webauthn.WithExclusions(excludeList))
	if err != nil {
		return apierrors.NewInternalServerError("Failed to generate WebAuthn registration options").WithInternalError(err)
	}

	expiresAt := time.Now().Add(config.WebAuthn.ChallengeExpiryDuration)
	challenge := models.NewWebAuthnChallenge(
		&user.ID,
		models.WebAuthnChallengeTypeRegistration,
		&models.WebAuthnSessionData{SessionData: webAuthnSessionData},
		expiresAt,
	)

	if err := db.Create(challenge); err != nil {
		return apierrors.NewInternalServerError("Database error storing challenge").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, &PasskeyRegistrationOptionsResponse{
		ChallengeID: challenge.ID.String(),
		Options:     &options.Response,
		ExpiresAt:   expiresAt.Unix(),
	})
}

// PasskeyRegistrationVerify handles POST /passkeys/registration/verify.
// Requires authentication. Verifies the WebAuthn credential and creates a passkey for the authenticated user.
func (a *API) PasskeyRegistrationVerify(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	session := getSession(ctx)
	db := a.db.WithContext(ctx)

	if user.IsSSOUser {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeValidationFailed, "SSO users cannot register passkeys")
	}

	if err := requirePasskeyManagementAAL(user, session); err != nil {
		return err
	}

	params := &PasskeyRegistrationVerifyParams{}
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

	// Atomically consume the challenge to prevent replay/race conditions
	challenge, err := models.ConsumeWebAuthnChallengeByID(db, challengeID, models.WebAuthnChallengeTypeRegistration, &user.ID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnChallengeNotFound, "Challenge not found or already used")
		}

		return apierrors.NewInternalServerError("Database error consuming challenge").WithInternalError(err)
	}

	if challenge.IsExpired() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnChallengeExpired, "Challenge has expired")
	}

	// Parse the credential creation response from the JSON params
	parsedResponse, err := parseCredentialCreationResponse(params.Credential)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnVerificationFailed, "Invalid credential response").WithInternalError(err)
	}

	webAuthn, err := a.getPasskeyWebAuthn()
	if err != nil {
		return apierrors.NewInternalServerError("Failed to initialize WebAuthn").WithInternalError(err)
	}

	// Load existing passkeys for the user adapter
	existingCreds, err := models.FindWebAuthnCredentialsByUserID(db, user.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error loading passkeys").WithInternalError(err)
	}

	webAuthnUser := newWebAuthnUser(user, existingCreds)
	sessionData := *challenge.SessionData.SessionData

	credential, err := webAuthn.CreateCredential(webAuthnUser, sessionData, parsedResponse)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeWebAuthnVerificationFailed, "Credential verification failed").WithInternalError(err)
	}

	friendlyName := utilities.PasskeyFriendlyName(credential.Authenticator.AAGUID)
	passkeyCredential := models.NewWebAuthnCredential(user.ID, credential, friendlyName)

	err = db.Transaction(func(tx *storage.Connection) error {
		count, terr := models.CountWebAuthnCredentialsByUserID(tx, user.ID)
		if terr != nil {
			return terr
		}
		if count >= config.Passkey.MaxPasskeysPerUser {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeTooManyPasskeys, "Maximum number of passkeys reached")
		}

		if terr := tx.Create(passkeyCredential); terr != nil {
			if models.IsUniqueConstraintViolatedError(terr) {
				return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeWebAuthnCredentialExists, "This credential is already registered")
			}

			return terr
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.PasskeyCreatedAction, utilities.GetIPAddress(r), map[string]any{
			"passkey_id": passkeyCredential.ID,
		}); terr != nil {
			return terr
		}

		return nil
	})
	if err != nil {
		if httpErr, ok := err.(*apierrors.HTTPError); ok {
			return httpErr
		}
		return apierrors.NewInternalServerError("Database error creating passkey").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, &PasskeyMetadataResponse{
		ID:           passkeyCredential.ID.String(),
		FriendlyName: passkeyCredential.FriendlyName,
		CreatedAt:    passkeyCredential.CreatedAt,
	})
}

// parseCredentialCreationResponse parses a WebAuthn credential creation response from raw JSON.
func parseCredentialCreationResponse(raw json.RawMessage) (*protocol.ParsedCredentialCreationData, error) {
	var ccr protocol.CredentialCreationResponse
	if err := json.Unmarshal(raw, &ccr); err != nil {
		return nil, err
	}

	return ccr.Parse()
}
