package models

import (
	"database/sql"
	"fmt"
	"net/url"
	"slices"
	"strings"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

// OAuth client type constants
const (
	OAuthServerClientTypePublic       = "public"
	OAuthServerClientTypeConfidential = "confidential"
)

// OAuth token endpoint authentication method constants
const (
	TokenEndpointAuthMethodNone              = "none"
	TokenEndpointAuthMethodClientSecretBasic = "client_secret_basic"
	TokenEndpointAuthMethodClientSecretPost  = "client_secret_post"
)

// OAuthServerClient represents an OAuth client application registered with this OAuth server
type OAuthServerClient struct {
	ID                      uuid.UUID `json:"client_id" db:"id"`
	ClientSecretHash        string    `json:"-" db:"client_secret_hash"`
	RegistrationType        string    `json:"registration_type" db:"registration_type"`
	ClientType              string    `json:"client_type" db:"client_type"`
	TokenEndpointAuthMethod string    `json:"token_endpoint_auth_method" db:"token_endpoint_auth_method"`

	RedirectURIs string     `json:"-" db:"redirect_uris"`
	GrantTypes   string     `json:"grant_types" db:"grant_types"`
	ClientName   *string    `json:"client_name,omitempty" db:"client_name"`
	ClientURI    *string    `json:"client_uri,omitempty" db:"client_uri"`
	LogoURI      *string    `json:"logo_uri,omitempty" db:"logo_uri"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// TableName returns the table name for the OAuthServerClient model
func (OAuthServerClient) TableName() string {
	return "oauth_clients"
}

// BeforeSave is invoked before the OAuth client is saved to the database
func (c *OAuthServerClient) BeforeSave(tx *pop.Connection) error {
	c.UpdatedAt = time.Now()
	return nil
}

// Validate performs basic validation on the OAuth client
func (c *OAuthServerClient) Validate() error {
	if c.ID == uuid.Nil {
		return fmt.Errorf("id is required")
	}

	if c.RegistrationType != "dynamic" && c.RegistrationType != "manual" {
		return fmt.Errorf("registration_type must be 'dynamic' or 'manual'")
	}

	if c.ClientType != OAuthServerClientTypePublic && c.ClientType != OAuthServerClientTypeConfidential {
		return fmt.Errorf("client_type must be '%s' or '%s'", OAuthServerClientTypePublic, OAuthServerClientTypeConfidential)
	}

	if c.RedirectURIs == "" {
		return fmt.Errorf("at least one redirect_uri is required")
	}

	// Confidential clients must have a client secret
	if c.ClientType == OAuthServerClientTypeConfidential && c.ClientSecretHash == "" {
		return fmt.Errorf("client_secret is required for confidential clients")
	}

	// Public clients should not have a client secret (enforce PKCE instead)
	if c.ClientType == OAuthServerClientTypePublic && c.ClientSecretHash != "" {
		return fmt.Errorf("client_secret is not allowed for public clients, use PKCE instead")
	}

	// Apply default token_endpoint_auth_method per RFC 7591:
	// "If unspecified or omitted, the default is 'client_secret_basic'"
	// For public clients, the default is 'none' since they don't have a client secret
	if c.TokenEndpointAuthMethod == "" {
		if c.ClientType == OAuthServerClientTypePublic {
			c.TokenEndpointAuthMethod = TokenEndpointAuthMethodNone
		} else {
			c.TokenEndpointAuthMethod = TokenEndpointAuthMethodClientSecretBasic
		}
	}

	// Validate token_endpoint_auth_method
	validMethods := []string{TokenEndpointAuthMethodNone, TokenEndpointAuthMethodClientSecretBasic, TokenEndpointAuthMethodClientSecretPost}
	if !slices.Contains(validMethods, c.TokenEndpointAuthMethod) {
		return fmt.Errorf("token_endpoint_auth_method must be one of: %s, %s, %s",
			TokenEndpointAuthMethodNone, TokenEndpointAuthMethodClientSecretBasic, TokenEndpointAuthMethodClientSecretPost)
	}

	// Public clients must use 'none'
	if c.ClientType == OAuthServerClientTypePublic && c.TokenEndpointAuthMethod != TokenEndpointAuthMethodNone {
		return fmt.Errorf("public clients must use token_endpoint_auth_method '%s'", TokenEndpointAuthMethodNone)
	}

	// Confidential clients cannot use 'none'
	if c.ClientType == OAuthServerClientTypeConfidential && c.TokenEndpointAuthMethod == TokenEndpointAuthMethodNone {
		return fmt.Errorf("confidential clients cannot use token_endpoint_auth_method '%s'", TokenEndpointAuthMethodNone)
	}

	return nil
}

// GetRedirectURIs returns the redirect URIs as a slice
func (c *OAuthServerClient) GetRedirectURIs() []string {
	if c.RedirectURIs == "" {
		return []string{}
	}
	return strings.Split(c.RedirectURIs, ",")
}

// SetRedirectURIs sets the redirect URIs from a slice
func (c *OAuthServerClient) SetRedirectURIs(uris []string) {
	c.RedirectURIs = strings.Join(uris, ",")
}

// GetGrantTypes returns the grant types as a slice
func (c *OAuthServerClient) GetGrantTypes() []string {
	if c.GrantTypes == "" {
		return []string{}
	}
	return strings.Split(c.GrantTypes, ",")
}

// SetGrantTypes sets the grant types from a slice
func (c *OAuthServerClient) SetGrantTypes(types []string) {
	c.GrantTypes = strings.Join(types, ",")
}

// IsPublic returns true if the client is a public client
func (c *OAuthServerClient) IsPublic() bool {
	return c.ClientType == OAuthServerClientTypePublic
}

// IsConfidential returns true if the client is a confidential client
func (c *OAuthServerClient) IsConfidential() bool {
	return c.ClientType == OAuthServerClientTypeConfidential
}

// GetTokenEndpointAuthMethod returns the token endpoint auth method
func (c *OAuthServerClient) GetTokenEndpointAuthMethod() string {
	return c.TokenEndpointAuthMethod
}

// IsGrantTypeAllowed returns true if the client is allowed to use the specified grant type
func (c *OAuthServerClient) IsGrantTypeAllowed(grantType string) bool {
	allowedTypes := c.GetGrantTypes()
	for _, allowedType := range allowedTypes {
		if strings.TrimSpace(allowedType) == grantType {
			return true
		}
	}
	return false
}

// validateRedirectURI validates a single redirect URI according to OAuth 2.1 spec
func validateRedirectURI(uri string) error {
	if uri == "" {
		return fmt.Errorf("redirect URI cannot be empty")
	}

	parsedURL, err := url.Parse(uri)
	if err != nil {
		return fmt.Errorf("invalid URL format: %v", err)
	}

	if parsedURL.Scheme == "" {
		return fmt.Errorf("redirect URI must be absolute (include scheme)")
	}

	if parsedURL.Fragment != "" {
		return fmt.Errorf("redirect URI must not contain fragment")
	}

	// Allow localhost for development, otherwise require HTTPS
	if parsedURL.Scheme == "http" {
		if parsedURL.Hostname() != "localhost" && parsedURL.Hostname() != "127.0.0.1" {
			return fmt.Errorf("redirect URI must use HTTPS except for localhost")
		}
	} else if parsedURL.Scheme != "https" {
		return fmt.Errorf("redirect URI must use HTTPS or HTTP for localhost")
	}

	return nil
}

// Error types for OAuth client operations
type OAuthServerClientNotFoundError struct{}

func (e OAuthServerClientNotFoundError) Error() string {
	return "OAuth client not found"
}

func (e OAuthServerClientNotFoundError) Is(target error) bool {
	return target == errNotFound
}

type InvalidRedirectURIError struct {
	URI string
}

func (e InvalidRedirectURIError) Error() string {
	return fmt.Sprintf("invalid redirect URI: %s", e.URI)
}

// Query functions for OAuth clients

// FindOAuthServerClientByID finds an OAuth client by ID
func FindOAuthServerClientByID(tx *storage.Connection, id uuid.UUID) (*OAuthServerClient, error) {
	client := &OAuthServerClient{}
	if err := tx.Q().Where("id = ? AND deleted_at IS NULL", id).First(client); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, OAuthServerClientNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding OAuth client")
	}
	return client, nil
}

// CreateOAuthServerClient creates a new OAuth client in the database
func CreateOAuthServerClient(tx *storage.Connection, client *OAuthServerClient) error {
	if err := client.Validate(); err != nil {
		return err
	}

	now := time.Now()
	client.CreatedAt = now
	client.UpdatedAt = now

	return tx.Create(client)
}

// UpdateOAuthServerClient updates an existing OAuth client in the database
func UpdateOAuthServerClient(tx *storage.Connection, client *OAuthServerClient) error {
	if err := client.Validate(); err != nil {
		return err
	}

	client.UpdatedAt = time.Now()
	return tx.Update(client)
}
