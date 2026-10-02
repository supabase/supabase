package api

import (
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
)

// requirePasskeyManagementAAL enforces an AAL2 session for passkey credential
// management (registration and deletion) when the user has a verified MFA
// factor.
//
// When the user has no verified factor the check is skipped: their maximum
// assurance level is AAL1, so requiring AAL2 could never be satisfied. The
// check fails closed, treating a missing session as not meeting AAL2.
func requirePasskeyManagementAAL(user *models.User, session *models.Session) error {
	if user.HasMFAEnabled() && (session == nil || !session.IsAAL2()) {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeInsufficientAAL, "AAL2 session is required to manage passkeys when MFA is enabled")
	}
	return nil
}

// getPasskeyWebAuthn creates a *webauthn.WebAuthn instance from the shared server-side WebAuthn configuration.
func (a *API) getPasskeyWebAuthn() (*webauthn.WebAuthn, error) {
	rpConfig := a.config.WebAuthn

	return webauthn.New(&webauthn.Config{
		RPDisplayName:         rpConfig.RPDisplayName,
		RPID:                  rpConfig.RPID,
		RPOrigins:             rpConfig.RPOrigins,
		AttestationPreference: protocol.PreferNoAttestation,
		AuthenticatorSelection: protocol.AuthenticatorSelection{
			// required to support discoverable credentials
			ResidentKey:      protocol.ResidentKeyRequirementRequired,
			UserVerification: protocol.VerificationPreferred,
		},
	})
}

// TODO(fm): webAuthnUser is a thin adapter that wraps a *models.User and returns passkey
// credentials (from the webauthn_credentials table) instead of MFA factor
// credentials. This is necessary because the existing User.WebAuthnCredentials()
// method returns MFA WebAuthn factor credentials until they are consolidated.
type webAuthnUser struct {
	user        *models.User
	credentials []webauthn.Credential
}

func newWebAuthnUser(user *models.User, passkeyCredentials []*models.WebAuthnCredential) *webAuthnUser {
	credentials := make([]webauthn.Credential, len(passkeyCredentials))

	for i, pc := range passkeyCredentials {
		credentials[i] = pc.ToWebAuthnCredential()
	}

	return &webAuthnUser{
		user:        user,
		credentials: credentials,
	}
}

func (u *webAuthnUser) WebAuthnID() []byte {
	return u.user.WebAuthnID()
}

func (u *webAuthnUser) WebAuthnName() string {
	if email := u.user.GetEmail(); email != "" {
		return email
	}

	return u.user.GetPhone()
}

func (u *webAuthnUser) WebAuthnDisplayName() string {
	if meta := u.user.UserMetaData; meta != nil {
		if name, ok := meta["name"].(string); ok && name != "" {
			return name
		}
	}

	return u.WebAuthnName()
}

func (u *webAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	return u.credentials
}
