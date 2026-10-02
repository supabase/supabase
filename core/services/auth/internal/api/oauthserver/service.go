package oauthserver

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"net/url"
	"slices"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/utilities"
)

// validateRedirectURIList validates a list of redirect URIs
func validateRedirectURIList(redirectURIs []string, required bool) error {
	if required && len(redirectURIs) == 0 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "redirect_uris is required")
	}

	if len(redirectURIs) == 0 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "redirect_uris cannot be empty")
	}

	if len(redirectURIs) > 10 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "redirect_uris cannot exceed 10 items")
	}

	for _, uri := range redirectURIs {
		if err := validateRedirectURI(uri); err != nil {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid redirect_uri '%s': %v", uri, err)
		}
	}

	return nil
}

// validateGrantTypeList validates a list of grant types
func validateGrantTypeList(grantTypes []string) error {
	if len(grantTypes) == 0 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "grant_types cannot be empty")
	}

	for _, grantType := range grantTypes {
		if grantType != "authorization_code" && grantType != "refresh_token" {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "grant_types must only contain 'authorization_code' and/or 'refresh_token'")
		}
	}

	return nil
}

// validateClientName validates a client name
func validateClientName(clientName string) error {
	if len(clientName) > 1024 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_name cannot exceed 1024 characters")
	}
	return nil
}

// validateClientURI validates a client URI
func validateClientURI(clientURI string) error {
	if clientURI == "" {
		return nil
	}

	if len(clientURI) > 2048 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_uri cannot exceed 2048 characters")
	}

	if _, err := url.ParseRequestURI(clientURI); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_uri must be a valid URL")
	}

	return nil
}

// validateLogoURI validates a logo URI
func validateLogoURI(logoURI string) error {
	if logoURI == "" {
		return nil
	}

	if len(logoURI) > 2048 {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "logo_uri cannot exceed 2048 characters")
	}

	if _, err := url.ParseRequestURI(logoURI); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "logo_uri must be a valid URL")
	}

	return nil
}

// OAuthServerClientRegisterParams contains parameters for registering a new OAuth client
type OAuthServerClientRegisterParams struct {
	// Required fields
	RedirectURIs []string `json:"redirect_uris"`

	// Client type can be explicitly provided or inferred from token_endpoint_auth_method
	ClientType              string `json:"client_type,omitempty"`                // models.OAuthServerClientTypePublic or models.OAuthServerClientTypeConfidential
	TokenEndpointAuthMethod string `json:"token_endpoint_auth_method,omitempty"` // "none", "client_secret_basic", or "client_secret_post"

	GrantTypes []string `json:"grant_types,omitempty"`
	ClientName string   `json:"client_name,omitempty"`
	ClientURI  string   `json:"client_uri,omitempty"`
	LogoURI    string   `json:"logo_uri,omitempty"`

	// Internal field
	RegistrationType string `json:"-"`
}

// validate validates the OAuth client registration parameters
func (p *OAuthServerClientRegisterParams) validate() error {
	// Validate redirect URIs (required for registration)
	if err := validateRedirectURIList(p.RedirectURIs, true); err != nil {
		return err
	}

	// Validate grant types if provided
	if len(p.GrantTypes) > 0 {
		if err := validateGrantTypeList(p.GrantTypes); err != nil {
			return err
		}
	}

	// Validate client name
	if err := validateClientName(p.ClientName); err != nil {
		return err
	}

	// Validate client URI
	if err := validateClientURI(p.ClientURI); err != nil {
		return err
	}

	// Validate logo URI
	if err := validateLogoURI(p.LogoURI); err != nil {
		return err
	}

	if p.RegistrationType != "dynamic" && p.RegistrationType != "manual" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "registration_type must be 'dynamic' or 'manual'")
	}

	// Validate client_type if provided (defaults to confidential if not specified)
	if p.ClientType != "" && p.ClientType != models.OAuthServerClientTypePublic && p.ClientType != models.OAuthServerClientTypeConfidential {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_type must be '%s' or '%s'", models.OAuthServerClientTypePublic, models.OAuthServerClientTypeConfidential)
	}

	// Validate token_endpoint_auth_method if provided
	if p.TokenEndpointAuthMethod != "" {
		validMethods := GetAllValidAuthMethods()
		if !slices.Contains(validMethods, p.TokenEndpointAuthMethod) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "token_endpoint_auth_method must be one of: %v", validMethods)
		}
	}

	// Validate consistency between client_type and token_endpoint_auth_method
	if err := ValidateClientTypeConsistency(p.ClientType, p.TokenEndpointAuthMethod); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "%s", err.Error())
	}

	return nil
}

// validateRedirectURI validates OAuth 2.1 redirect URIs as specific in
//
// * https://tools.ietf.org/html/rfc6749#section-3.1.2
//   - The redirection endpoint URI MUST be an absolute URI as defined by [RFC3986] Section 4.3.
//   - The endpoint URI MUST NOT include a fragment component.
//   - https://tools.ietf.org/html/rfc3986#section-4.3
//     absolute-URI  = scheme ":" hier-part [ "?" query ]
//   - https://tools.ietf.org/html/rfc6819#section-5.1.1
func validateRedirectURI(uri string) error {
	if uri == "" {
		return fmt.Errorf("redirect URI cannot be empty")
	}

	parsedURL, err := url.Parse(uri)
	if err != nil {
		return fmt.Errorf("invalid URL format")
	}

	// Must have scheme and host
	if parsedURL.Scheme == "" || parsedURL.Host == "" {
		return fmt.Errorf("must have scheme and host")
	}

	// Block dangerous URI schemes that can lead to XSS or token leakage
	dangerousSchemes := []string{"javascript", "data", "file", "vbscript", "about", "blob"}
	for _, dangerous := range dangerousSchemes {
		if strings.EqualFold(parsedURL.Scheme, dangerous) {
			return fmt.Errorf("scheme '%s' is not allowed for security reasons", parsedURL.Scheme)
		}
	}

	// Only restrict HTTP (not HTTPS or custom schemes)
	// HTTP is only allowed for localhost/loopback addresses
	if parsedURL.Scheme == "http" {
		host := parsedURL.Hostname()
		if host != "localhost" && host != "127.0.0.1" && host != "::1" {
			return fmt.Errorf("HTTP scheme only allowed for localhost")
		}
	}
	// All other schemes (https, custom schemes like myapp://* etc.) are allowed

	// Must not have fragment
	if parsedURL.Fragment != "" {
		return fmt.Errorf("fragment not allowed in redirect URI")
	}

	return nil
}

// generateClientSecret generates a secure random client secret
func generateClientSecret() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// This should never happen, but fallback to panic for security
		panic(fmt.Sprintf("failed to generate random bytes for client secret: %v", err))
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

// hashClientSecret hashes a client secret using SHA-256
func hashClientSecret(secret string) (string, error) {
	sum := sha256.Sum256([]byte(secret))
	return base64.RawURLEncoding.EncodeToString(sum[:]), nil
}

// ValidateClientSecret validates a client secret against its hash using constant-time comparison
func ValidateClientSecret(providedSecret, storedHash string) bool {
	calc := sha256.Sum256([]byte(providedSecret))
	stored, err := base64.RawURLEncoding.DecodeString(storedHash)
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare(calc[:], stored) == 1
}

// registerOAuthServerClient creates a new OAuth server client with generated credentials
func (s *Server) registerOAuthServerClient(ctx context.Context, params *OAuthServerClientRegisterParams) (*models.OAuthServerClient, string, error) {
	// Validate all parameters
	if err := params.validate(); err != nil {
		return nil, "", err
	}

	// Set defaults
	grantTypes := params.GrantTypes
	if len(grantTypes) == 0 {
		grantTypes = []string{"authorization_code", "refresh_token"}
	}

	// Determine client type using centralized logic
	clientType := DetermineClientType(params.ClientType, params.TokenEndpointAuthMethod)

	// Determine token_endpoint_auth_method
	// If explicitly provided, use it; otherwise set default based on client type
	// Per RFC 7591: "If unspecified or omitted, the default is 'client_secret_basic'"
	// For public clients, the default is 'none' since they don't have a client secret
	tokenEndpointAuthMethod := params.TokenEndpointAuthMethod
	if tokenEndpointAuthMethod == "" {
		if clientType == models.OAuthServerClientTypePublic {
			tokenEndpointAuthMethod = models.TokenEndpointAuthMethodNone
		} else {
			tokenEndpointAuthMethod = models.TokenEndpointAuthMethodClientSecretBasic
		}
	}

	db := s.db.WithContext(ctx)

	client := &models.OAuthServerClient{
		ID:                      uuid.Must(uuid.NewV4()),
		RegistrationType:        params.RegistrationType,
		ClientType:              clientType,
		TokenEndpointAuthMethod: tokenEndpointAuthMethod,
		ClientName:              utilities.StringPtr(params.ClientName),
		ClientURI:               utilities.StringPtr(params.ClientURI),
		LogoURI:                 utilities.StringPtr(params.LogoURI),
	}

	client.SetRedirectURIs(params.RedirectURIs)
	client.SetGrantTypes(grantTypes)

	var plaintextSecret string
	// Only generate client secret for confidential clients
	if client.IsConfidential() {
		plaintextSecret = generateClientSecret()
		hash, err := hashClientSecret(plaintextSecret)
		if err != nil {
			return nil, "", errors.Wrap(err, "failed to hash client secret")
		}
		client.ClientSecretHash = hash
	}

	if err := models.CreateOAuthServerClient(db, client); err != nil {
		return nil, "", errors.Wrap(err, "failed to create OAuth client")
	}

	return client, plaintextSecret, nil
}

// getOAuthServerClient retrieves an OAuth client by ID
func (s *Server) getOAuthServerClient(ctx context.Context, clientID uuid.UUID) (*models.OAuthServerClient, error) {
	db := s.db.WithContext(ctx)

	client, err := models.FindOAuthServerClientByID(db, clientID)
	if err != nil {
		return nil, err
	}

	return client, nil
}

// deleteOAuthServerClient soft-deletes an OAuth client
func (s *Server) deleteOAuthServerClient(ctx context.Context, clientID uuid.UUID) error {
	db := s.db.WithContext(ctx)

	client, err := models.FindOAuthServerClientByID(db, clientID)
	if err != nil {
		return err
	}

	// Soft delete by setting deleted_at
	now := time.Now()
	client.DeletedAt = &now

	if err := models.UpdateOAuthServerClient(db, client); err != nil {
		return errors.Wrap(err, "failed to delete OAuth client")
	}

	return nil
}

// regenerateOAuthServerClientSecret regenerates a client secret for confidential clients
func (s *Server) regenerateOAuthServerClientSecret(ctx context.Context, clientID uuid.UUID) (*models.OAuthServerClient, string, error) {
	db := s.db.WithContext(ctx)

	client, err := models.FindOAuthServerClientByID(db, clientID)
	if err != nil {
		return nil, "", err
	}

	// Only confidential clients can have their secrets regenerated
	if !client.IsConfidential() {
		return nil, "", errors.New("cannot regenerate secret for public client")
	}

	// Generate new client secret
	plaintextSecret := generateClientSecret()
	hash, err := hashClientSecret(plaintextSecret)
	if err != nil {
		return nil, "", errors.Wrap(err, "failed to hash client secret")
	}

	// Update client with new secret hash
	client.ClientSecretHash = hash

	if err := models.UpdateOAuthServerClient(db, client); err != nil {
		return nil, "", errors.Wrap(err, "failed to update OAuth client with new secret")
	}

	return client, plaintextSecret, nil
}

// OAuthServerClientUpdateParams contains parameters for updating an OAuth client
type OAuthServerClientUpdateParams struct {
	RedirectURIs            *[]string `json:"redirect_uris,omitempty"`
	GrantTypes              *[]string `json:"grant_types,omitempty"`
	ClientName              *string   `json:"client_name,omitempty"`
	ClientURI               *string   `json:"client_uri,omitempty"`
	LogoURI                 *string   `json:"logo_uri,omitempty"`
	TokenEndpointAuthMethod *string   `json:"token_endpoint_auth_method,omitempty"`
}

// isEmpty returns true if no fields are set for update
func (p *OAuthServerClientUpdateParams) isEmpty() bool {
	return p.RedirectURIs == nil &&
		p.GrantTypes == nil &&
		p.ClientName == nil &&
		p.ClientURI == nil &&
		p.LogoURI == nil &&
		p.TokenEndpointAuthMethod == nil
}

// validate validates the OAuth client update parameters
func (p *OAuthServerClientUpdateParams) validate() error {
	// Validate redirect URIs if provided
	if p.RedirectURIs != nil {
		if err := validateRedirectURIList(*p.RedirectURIs, false); err != nil {
			return err
		}
	}

	// Validate grant types if provided
	if p.GrantTypes != nil {
		if err := validateGrantTypeList(*p.GrantTypes); err != nil {
			return err
		}
	}

	// Validate client name if provided
	if p.ClientName != nil {
		if err := validateClientName(*p.ClientName); err != nil {
			return err
		}
	}

	// Validate client URI if provided
	if p.ClientURI != nil {
		if err := validateClientURI(*p.ClientURI); err != nil {
			return err
		}
	}

	// Validate logo URI if provided
	if p.LogoURI != nil {
		if err := validateLogoURI(*p.LogoURI); err != nil {
			return err
		}
	}

	// Validate token endpoint auth method if provided
	if p.TokenEndpointAuthMethod != nil {
		validMethods := GetAllValidAuthMethods()
		if !slices.Contains(validMethods, *p.TokenEndpointAuthMethod) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid token_endpoint_auth_method: must be one of %v", validMethods)
		}
	}

	return nil
}

// updateOAuthServerClient updates an existing OAuth client
func (s *Server) updateOAuthServerClient(ctx context.Context, clientID uuid.UUID, params *OAuthServerClientUpdateParams) (*models.OAuthServerClient, error) {
	// Validate all parameters
	if err := params.validate(); err != nil {
		return nil, err
	}

	db := s.db.WithContext(ctx)

	client, err := models.FindOAuthServerClientByID(db, clientID)
	if err != nil {
		return nil, err
	}

	// Update only the provided fields
	if params.RedirectURIs != nil {
		client.SetRedirectURIs(*params.RedirectURIs)
	}

	if params.GrantTypes != nil {
		client.SetGrantTypes(*params.GrantTypes)
	}

	if params.ClientName != nil {
		client.ClientName = utilities.StringPtr(*params.ClientName)
	}

	if params.ClientURI != nil {
		client.ClientURI = utilities.StringPtr(*params.ClientURI)
	}

	if params.LogoURI != nil {
		client.LogoURI = utilities.StringPtr(*params.LogoURI)
	}

	if params.TokenEndpointAuthMethod != nil {
		if !IsValidAuthMethodForClientType(client.ClientType, *params.TokenEndpointAuthMethod) {
			return nil, apierrors.NewBadRequestError(
				apierrors.ErrorCodeValidationFailed,
				"token_endpoint_auth_method '%s' is not valid for client_type '%s'; valid methods: %v",
				*params.TokenEndpointAuthMethod, client.ClientType, GetValidAuthMethodsForClientType(client.ClientType),
			)
		}
		client.TokenEndpointAuthMethod = *params.TokenEndpointAuthMethod
	}

	if err := models.UpdateOAuthServerClient(db, client); err != nil {
		return nil, errors.Wrap(err, "failed to update OAuth client")
	}

	return client, nil
}
