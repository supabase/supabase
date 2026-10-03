package metering

import (
	"github.com/gofrs/uuid"
	"github.com/sirupsen/logrus"
)

// LoginType represents the type of login method used
type LoginType string

// LoginType constants for consistent login analytics
const (
	LoginTypeAnonymous LoginType = "anonymous"
	LoginTypeSSO       LoginType = "sso"
	LoginTypeOAuth     LoginType = "oauth"
	LoginTypeWeb3      LoginType = "web3"
	LoginTypeImplicit  LoginType = "implicit"
	LoginTypeOIDC      LoginType = "oidc"
	LoginTypeOTP       LoginType = "otp"
	LoginTypePassword  LoginType = "password"
	LoginTypePKCE      LoginType = "pkce"
	LoginTypeToken     LoginType = "token" // for refresh token flows, to be backward-compatible with existing data
	LoginTypeMFA       LoginType = "mfa"   // for MFA verifications
	LoginTypePasskey   LoginType = "passkey"

	// LoginTypeOAuthServer is for the OAuth 2.1 authorization server (this app acting as the
	// OAuth server, not a third-party provider)
	LoginTypeOAuthServer LoginType = "oauth_server"
)

// Provider constants for consistent login analytics
const (
	// Password/OTP based providers
	ProviderEmail = "email"
	ProviderPhone = "phone"

	// MFA providers
	ProviderMFATOTP         = "totp"
	ProviderMFAPhone        = "phone"
	ProviderMFAWebAuthn     = "webauthn"
	ProviderMFARecoveryCode = "recovery_code"

	// SSO providers
	ProviderSAML = "saml"
)

// LoginData contains structured data for login events
type LoginData struct {
	// Provider is the authentication provider (e.g., "email", "phone", "google", "github", "web3", etc.)
	Provider string `json:"provider"`

	// Web3 specific data (for blockchain authentication)
	Web3 *Web3Data `json:"web3,omitempty"`

	// OAuthServer specific data (for LoginTypeOAuthServer events)
	OAuthServer *OAuthServerData `json:"oauth_server,omitempty"`

	// Additional context for future extensibility
	Extra map[string]interface{} `json:"extra,omitempty"`
}

// Web3Data contains Web3/blockchain-specific authentication data
type Web3Data struct {
	// Chain name (e.g., "ethereum", "polygon", "arbitrum")
	Chain string `json:"chain,omitempty"`
	// Network ID (e.g., "1" for mainnet)
	Network string `json:"network,omitempty"`
	// Wallet address that signed the message
	Address string `json:"address,omitempty"`
	// Domain
	Domain string `json:"domain,omitempty"`
	// URI
	URI string `json:"uri,omitempty"`
}

// OAuthServerData contains OAuth 2.1 authorization server specific data
type OAuthServerData struct {
	// ClientID is the OAuth server client ID, for per-client usage reporting
	ClientID string `json:"client_id,omitempty"`
	// GrantType is the OAuth 2.1 grant type behind this login event
	// (e.g. "authorization_code", "refresh_token")
	GrantType string `json:"grant_type,omitempty"`
}

var logger = logrus.StandardLogger().WithField("metering", true)

func RecordLogin(loginType LoginType, userID uuid.UUID, data *LoginData) {
	fields := logrus.Fields{
		"action":       "login",
		"login_method": string(loginType),
		"instance_id":  uuid.Nil.String(),
		"user_id":      userID.String(),
	}

	if data != nil {
		if data.Provider != "" {
			fields["provider"] = data.Provider
		}

		// Add OAuth server context fields
		if data.OAuthServer != nil {
			if data.OAuthServer.ClientID != "" {
				fields["client_id"] = data.OAuthServer.ClientID
			}
			if data.OAuthServer.GrantType != "" {
				fields["grant_type"] = data.OAuthServer.GrantType
			}
		}

		// Add Web3 context fields
		if data.Web3 != nil {
			if data.Web3.Chain != "" {
				fields["web3_chain"] = data.Web3.Chain
			}
			if data.Web3.Network != "" {
				fields["web3_network"] = data.Web3.Network
			}
			if data.Web3.Address != "" {
				fields["web3_address"] = data.Web3.Address
			}
			if data.Web3.Domain != "" {
				fields["web3_domain"] = data.Web3.Domain
			}
			if data.Web3.URI != "" {
				fields["web3_uri"] = data.Web3.URI
			}
		}

		// Add any extra fields
		if data.Extra != nil {
			for key, value := range data.Extra {
				fields[key] = value
			}
		}
	}

	logger.WithFields(fields).Info("Login")
}
