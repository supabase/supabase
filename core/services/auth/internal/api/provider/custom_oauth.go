package provider

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

// CustomOAuthProvider implements OAuthProvider for custom OAuth2 providers
type CustomOAuthProvider struct {
	config                *oauth2.Config
	userinfoURL           string
	pkceEnabled           bool
	acceptableClientIDs   []string
	attributeMapping      map[string]interface{}
	authorizationParams   map[string]interface{}
	customClaimsAllowlist []string
}

// NewCustomOAuthProvider creates a new custom OAuth provider
func NewCustomOAuthProvider(
	clientID, clientSecret, authorizationURL, tokenURL, userinfoURL, redirectURL string,
	scopes []string,
	pkceEnabled bool,
	acceptableClientIDs []string,
	attributeMapping, authorizationParams map[string]interface{},
	customClaimsAllowlist []string,
) *CustomOAuthProvider {
	config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       scopes,
		Endpoint: oauth2.Endpoint{
			AuthURL:  authorizationURL,
			TokenURL: tokenURL,
		},
	}

	return &CustomOAuthProvider{
		config:                config,
		userinfoURL:           userinfoURL,
		pkceEnabled:           pkceEnabled,
		acceptableClientIDs:   acceptableClientIDs,
		attributeMapping:      attributeMapping,
		authorizationParams:   authorizationParams,
		customClaimsAllowlist: customClaimsAllowlist,
	}
}

// AuthCodeURL returns the authorization URL for the OAuth flow
func (p *CustomOAuthProvider) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	// Add any additional authorization parameters (values are validated as strings at the API layer)
	for key, value := range p.authorizationParams {
		if s, ok := value.(string); ok {
			opts = append(opts, oauth2.SetAuthURLParam(key, s))
		}
	}

	return p.config.AuthCodeURL(state, opts...)
}

// GetOAuthToken exchanges the authorization code for an access token
func (p *CustomOAuthProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return p.config.Exchange(ctx, code, opts...)
}

// GetUserData fetches user data from the provider's userinfo endpoint
func (p *CustomOAuthProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	claims, raw, err := fetchUserinfoClaims(ctx, tok, p.config, p.userinfoURL)
	if err != nil {
		return nil, err
	}

	// Capture allowlisted custom claims before attribute mapping
	captureAllowedClaims(raw, p.customClaimsAllowlist, &claims)

	// Apply attribute mapping if configured
	if len(p.attributeMapping) > 0 {
		claims = applyAttributeMapping(claims, p.attributeMapping)
	}

	// Extract emails
	emails := []Email{}
	if claims.Email != "" {
		emails = append(emails, Email{
			Email:    claims.Email,
			Verified: claims.EmailVerified,
			Primary:  true,
		})
	}

	return &UserProvidedData{
		Emails:   emails,
		Metadata: &claims,
	}, nil
}

// RequiresPKCE returns whether this provider requires PKCE
func (p *CustomOAuthProvider) RequiresPKCE() bool {
	return p.pkceEnabled
}

// CustomOIDCProvider implements OAuthProvider for custom OIDC providers
type CustomOIDCProvider struct {
	config                *oauth2.Config
	oidcProvider          *oidc.Provider
	userinfoEndpoint      string
	pkceEnabled           bool
	acceptableClientIDs   []string
	attributeMapping      map[string]interface{}
	authorizationParams   map[string]interface{}
	customClaimsAllowlist []string
}

// NewCustomOIDCProvider creates a new custom OIDC provider.
// discoveryURL is the URL to fetch the OIDC discovery document from
// (typically {issuer}/.well-known/openid-configuration, or an admin-configured
// override).
func NewCustomOIDCProvider(
	ctx context.Context,
	clientID, clientSecret, redirectURL string,
	scopes []string,
	issuer string,
	discoveryURL string,
	pkceEnabled bool,
	acceptableClientIDs []string,
	attributeMapping, authorizationParams map[string]interface{},
	customClaimsAllowlist []string,
	cache *OIDCProviderCache,
) (*CustomOIDCProvider, error) {
	// Ensure 'openid' scope is always present for OIDC
	hasOpenID := false
	for _, scope := range scopes {
		if scope == "openid" {
			hasOpenID = true
			break
		}
	}
	if !hasOpenID {
		scopes = append([]string{"openid"}, scopes...)
	}

	oidcProvider, err := cache.GetProviderFromURL(ctx, issuer, discoveryURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create OIDC provider: %w", err)
	}

	// Get endpoints from the OIDC provider
	endpoint := oidcProvider.Endpoint()
	userinfoEndpoint := oidcProvider.UserInfoEndpoint()

	config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       scopes,
		Endpoint:     endpoint,
	}

	return &CustomOIDCProvider{
		config:                config,
		oidcProvider:          oidcProvider,
		userinfoEndpoint:      userinfoEndpoint,
		pkceEnabled:           pkceEnabled,
		acceptableClientIDs:   acceptableClientIDs,
		attributeMapping:      attributeMapping,
		authorizationParams:   authorizationParams,
		customClaimsAllowlist: customClaimsAllowlist,
	}, nil
}

// AuthCodeURL returns the authorization URL for the OIDC flow
func (p *CustomOIDCProvider) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	// Add any additional authorization parameters (values are validated as strings at the API layer)
	for key, value := range p.authorizationParams {
		if s, ok := value.(string); ok {
			opts = append(opts, oauth2.SetAuthURLParam(key, s))
		}
	}

	return p.config.AuthCodeURL(state, opts...)
}

// GetOAuthToken exchanges the authorization code for an access token
func (p *CustomOIDCProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return p.config.Exchange(ctx, code, opts...)
}

// GetUserData fetches user data from the provider's userinfo endpoint or ID token
func (p *CustomOIDCProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	// First, try to extract and verify claims from ID token if present
	if idToken, ok := tok.Extra("id_token").(string); ok && idToken != "" {
		// Skip client ID check in the library and validate manually to support multiple client IDs
		idTokenObj, userData, err := ParseIDToken(ctx, p.oidcProvider, &oidc.Config{
			SkipClientIDCheck: true, // We'll validate audience manually
		}, idToken, ParseIDTokenOptions{
			SkipAccessTokenCheck: true, // We don't need at_hash validation in callback flow
		})
		if err != nil {
			return nil, fmt.Errorf("failed to verify ID token: %w", err)
		}

		// Validate audience claim against acceptable client IDs
		if err := p.validateAudience(idTokenObj.Audience); err != nil {
			return nil, err
		}

		// Capture allowlisted custom claims from the raw ID token before
		// attribute mapping. Because we only copy explicitly listed keys, there
		// is no risk of re-adding keys a parser intentionally stripped (e.g. Azure).
		if len(p.customClaimsAllowlist) > 0 && userData.Metadata != nil {
			var raw map[string]interface{}
			if err := idTokenObj.Claims(&raw); err != nil {
				return nil, fmt.Errorf("failed to read ID token claims: %w", err)
			}
			captureAllowedClaims(raw, p.customClaimsAllowlist, userData.Metadata)
		}

		// Apply attribute mapping to the metadata from ID token
		if len(p.attributeMapping) > 0 && userData.Metadata != nil {
			*userData.Metadata = applyAttributeMapping(*userData.Metadata, p.attributeMapping)
		}

		return userData, nil
	}

	// No ID token, use userinfo endpoint
	if p.userinfoEndpoint != "" {
		claims, raw, err := fetchUserinfoClaims(ctx, tok, p.config, p.userinfoEndpoint)
		if err != nil {
			return nil, err
		}

		// Capture allowlisted custom claims before attribute mapping
		captureAllowedClaims(raw, p.customClaimsAllowlist, &claims)

		// Apply attribute mapping
		if len(p.attributeMapping) > 0 {
			claims = applyAttributeMapping(claims, p.attributeMapping)
		}

		// Extract emails
		emails := []Email{}
		if claims.Email != "" {
			emails = append(emails, Email{
				Email:    claims.Email,
				Verified: claims.EmailVerified,
				Primary:  true,
			})
		}

		return &UserProvidedData{
			Emails:   emails,
			Metadata: &claims,
		}, nil
	}

	return nil, errors.New("no ID token or userinfo endpoint available")
}

// RequiresPKCE returns whether this provider requires PKCE
func (p *CustomOIDCProvider) RequiresPKCE() bool {
	return p.pkceEnabled
}

// Config returns the OAuth2 config for accessing endpoints
func (p *CustomOIDCProvider) Config() *oauth2.Config {
	return p.config
}

// validateAudience validates that the token's audience matches one of the acceptable client IDs
func (p *CustomOIDCProvider) validateAudience(audiences []string) error {
	// Build list of acceptable audiences: main client_id + acceptable_client_ids
	acceptableAudiences := append([]string{p.config.ClientID}, p.acceptableClientIDs...)

	// Check if any audience in the token matches any acceptable audience
	for _, tokenAud := range audiences {
		for _, acceptableAud := range acceptableAudiences {
			if tokenAud == acceptableAud {
				return nil // Valid audience found
			}
		}
	}

	// No valid audience found
	return fmt.Errorf("token audience %v does not match any acceptable client ID", audiences)
}

// fetchUserinfoClaims fetches the userinfo response once and returns both the
// typed Claims and the raw claim map. The raw map is needed so that arbitrary
// allowlisted keys (which have no typed field) can be copied verbatim.
func fetchUserinfoClaims(ctx context.Context, tok *oauth2.Token, config *oauth2.Config, url string) (Claims, map[string]interface{}, error) {
	var raw map[string]interface{}
	if err := makeRequest(ctx, tok, config, url, &raw); err != nil {
		return Claims{}, nil, err
	}

	var claims Claims
	b, err := json.Marshal(raw)
	if err != nil {
		return Claims{}, nil, err
	}
	if err := json.Unmarshal(b, &claims); err != nil {
		return Claims{}, nil, err
	}

	return claims, raw, nil
}

// captureAllowedClaims copies each allowlisted key present in raw into
// c.CustomClaims verbatim. An empty allowlist captures nothing (D1), and keys
// absent from raw are silently skipped (no nil entry is created). Because only
// explicitly listed keys are copied, protocol/registered claims never leak.
func captureAllowedClaims(raw map[string]interface{}, allowlist []string, c *Claims) {
	for _, key := range allowlist {
		value, ok := raw[key]
		if !ok {
			continue
		}
		if c.CustomClaims == nil {
			c.CustomClaims = make(map[string]interface{})
		}
		c.CustomClaims[key] = value
	}
}

// applyAttributeMapping applies custom attribute mapping to claims
func applyAttributeMapping(claims Claims, mapping map[string]interface{}) Claims {
	// Create a map representation of claims for easier manipulation
	claimsMap := make(map[string]interface{})
	claimsBytes, _ := json.Marshal(claims)
	if err := json.Unmarshal(claimsBytes, &claimsMap); err != nil {
		// If unmarshaling fails, return original claims
		return claims
	}

	// Apply mappings
	for targetField, sourceFieldOrValue := range mapping {
		switch v := sourceFieldOrValue.(type) {
		case string:
			// If it's a string, treat it as a source field name
			if value, exists := claimsMap[v]; exists {
				claimsMap[targetField] = value
			}
		default:
			// Otherwise, use it as a literal value
			claimsMap[targetField] = v
		}
	}

	// Convert back to Claims struct
	var result Claims
	mappedBytes, _ := json.Marshal(claimsMap)
	if err := json.Unmarshal(mappedBytes, &result); err != nil {
		// If unmarshaling fails, return original claims
		return claims
	}

	return result
}
