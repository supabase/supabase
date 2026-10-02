package api

import (
	"net/http"

	"github.com/lestrrat-go/jwx/v2/jwa"
	jwk "github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/supabase/auth/internal/models"
)

type JwksResponse struct {
	Keys []jwk.Key `json:"keys"`
}

func (a *API) WellKnownJwks(w http.ResponseWriter, r *http.Request) error {
	config := a.config
	resp := JwksResponse{
		Keys: []jwk.Key{},
	}

	for _, key := range config.JWT.Keys {
		// don't expose hmac jwk in endpoint
		if key.PublicKey == nil || key.PublicKey.KeyType() == jwa.OctetSeq {
			continue
		}
		resp.Keys = append(resp.Keys, key.PublicKey)
	}

	w.Header().Set("Cache-Control", "public, max-age=600")
	return sendJSON(w, http.StatusOK, resp)
}

// OpenIDConfigurationResponse represents both OIDC Discovery and OAuth 2.0 Authorization Server Metadata
// This unified response serves both:
// - /.well-known/openid-configuration (OIDC Discovery per OpenID Connect Discovery 1.0)
// - /.well-known/oauth-authorization-server (OAuth Authorization Server Metadata per RFC 8414)
//
// Since OIDC Discovery extends RFC 8414, a single response structure satisfies both specifications.
type OpenIDConfigurationResponse struct {
	// Core Discovery Fields (Required by both OIDC and OAuth 2.0)
	Issuer                string `json:"issuer"`
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
	JWKSURL               string `json:"jwks_uri"`
	UserInfoEndpoint      string `json:"userinfo_endpoint,omitempty"` // OIDC-specific
	RegistrationEndpoint  string `json:"registration_endpoint,omitempty"`

	// Supported Parameters
	ScopesSupported                   []string `json:"scopes_supported,omitempty"`
	ResponseTypesSupported            []string `json:"response_types_supported"`
	ResponseModesSupported            []string `json:"response_modes_supported,omitempty"`
	GrantTypesSupported               []string `json:"grant_types_supported"`
	SubjectTypesSupported             []string `json:"subject_types_supported"`               // OIDC-specific
	IDTokenSigningAlgValuesSupported  []string `json:"id_token_signing_alg_values_supported"` // OIDC-specific
	TokenEndpointAuthMethodsSupported []string `json:"token_endpoint_auth_methods_supported"`
	ClaimsSupported                   []string `json:"claims_supported,omitempty"`       // OIDC-specific
	CodeChallengeMethodsSupported     []string `json:"code_challenge_methods_supported"` // OAuth 2.1/PKCE
}

// WellKnownOpenID handles both OIDC Discovery and OAuth 2.0 Authorization Server Metadata endpoints
// This unified handler serves:
// - GET /.well-known/openid-configuration (OIDC Discovery)
// - GET /.well-known/oauth-authorization-server (RFC 8414)
//
// Both endpoints return the same comprehensive metadata since OIDC Discovery is a superset of OAuth 2.0 metadata
func (a *API) WellKnownOpenID(w http.ResponseWriter, r *http.Request) error {
	config := a.config
	issuer := config.JWT.Issuer

	// Ensure issuer doesn't end with a slash to avoid double slashes in URLs
	for len(issuer) > 0 && issuer[len(issuer)-1] == '/' {
		issuer = issuer[:len(issuer)-1]
	}

	response := OpenIDConfigurationResponse{
		Issuer:                config.JWT.Issuer,
		AuthorizationEndpoint: issuer + "/oauth/authorize",
		TokenEndpoint:         issuer + "/oauth/token",
		JWKSURL:               issuer + "/.well-known/jwks.json",
		UserInfoEndpoint:      issuer + "/oauth/userinfo",

		// OAuth 2.1 / OIDC Supported Features
		ResponseTypesSupported:            []string{"code"},
		ResponseModesSupported:            []string{"query"},
		GrantTypesSupported:               []string{"authorization_code", "refresh_token"},
		SubjectTypesSupported:             []string{"public"},
		IDTokenSigningAlgValuesSupported:  []string{"RS256", "HS256", "ES256"}, // TODO :: should create this based on signing key config?
		TokenEndpointAuthMethodsSupported: []string{"client_secret_basic", "client_secret_post", "none"},
		CodeChallengeMethodsSupported:     []string{"S256", "plain"},
		ScopesSupported:                   models.SupportedOAuthScopes,

		// OIDC Standard Claims
		ClaimsSupported: []string{
			"sub",
			"aud",
			"iss",
			"exp",
			"iat",
			"auth_time",
			"nonce",
			"email",
			"email_verified",
			"phone_number",
			"phone_number_verified",
			"name",
			"picture",
			"preferred_username",
			"updated_at",
		},
	}

	// Include registration endpoint if dynamic registration is enabled
	if config.OAuthServer.Enabled && config.OAuthServer.AllowDynamicRegistration {
		response.RegistrationEndpoint = issuer + "/oauth/clients/register"
	}

	w.Header().Set("Cache-Control", "public, max-age=600")

	return sendJSON(w, http.StatusOK, response)
}
