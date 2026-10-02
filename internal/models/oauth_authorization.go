package models

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/security"
	"github.com/supabase/auth/internal/storage"
)

// OAuthServerAuthorizationStatus represents the status of an OAuth server authorization request
type OAuthServerAuthorizationStatus string

const (
	OAuthServerAuthorizationPending  OAuthServerAuthorizationStatus = "pending"
	OAuthServerAuthorizationApproved OAuthServerAuthorizationStatus = "approved"
	OAuthServerAuthorizationDenied   OAuthServerAuthorizationStatus = "denied"
	OAuthServerAuthorizationExpired  OAuthServerAuthorizationStatus = "expired"
)

func (s OAuthServerAuthorizationStatus) String() string {
	return string(s)
}

// OAuthServerResponseType represents the OAuth server response type
type OAuthServerResponseType string

const (
	OAuthServerResponseTypeCode OAuthServerResponseType = "code"
)

func (rt OAuthServerResponseType) String() string {
	return string(rt)
}

// OAuthServerAuthorization represents an OAuth 2.1 server authorization request
type OAuthServerAuthorization struct {
	ID                  uuid.UUID                      `json:"-" db:"id"`
	AuthorizationID     string                         `json:"authorization_id" db:"authorization_id"`
	ClientID            uuid.UUID                      `json:"-" db:"client_id"`
	UserID              *uuid.UUID                     `json:"user_id" db:"user_id"`
	RedirectURI         string                         `json:"redirect_uri" db:"redirect_uri"`
	Scope               string                         `json:"scope" db:"scope"`
	State               *string                        `json:"state,omitempty" db:"state"`
	Resource            *string                        `json:"resource,omitempty" db:"resource"`
	CodeChallenge       *string                        `json:"code_challenge,omitempty" db:"code_challenge"`
	CodeChallengeMethod *string                        `json:"code_challenge_method,omitempty" db:"code_challenge_method"`
	Nonce               *string                        `json:"nonce,omitempty" db:"nonce"` // OIDC nonce parameter
	ResponseType        OAuthServerResponseType        `json:"response_type" db:"response_type"`
	Status              OAuthServerAuthorizationStatus `json:"status" db:"status"`
	AuthorizationCode   *string                        `json:"-" db:"authorization_code"`
	CreatedAt           time.Time                      `json:"created_at" db:"created_at"`
	ExpiresAt           time.Time                      `json:"expires_at" db:"expires_at"`
	ApprovedAt          *time.Time                     `json:"approved_at" db:"approved_at"`

	// Relations with OAuth clients
	Client *OAuthServerClient `json:"client,omitempty" db:"-"`
}

// TableName returns the table name for the OAuthServerAuthorization model
func (OAuthServerAuthorization) TableName() string {
	return "oauth_authorizations"
}

// NewOAuthServerAuthorizationParams contains parameters for creating a new OAuth server authorization
type NewOAuthServerAuthorizationParams struct {
	ClientID            uuid.UUID
	RedirectURI         string
	Scope               string
	State               string
	Resource            string
	CodeChallenge       string
	CodeChallengeMethod string
	TTL                 time.Duration
	Nonce               string
}

// NewOAuthServerAuthorization creates a new OAuth server authorization request without user (for initial flow)
func NewOAuthServerAuthorization(params NewOAuthServerAuthorizationParams) *OAuthServerAuthorization {
	id := uuid.Must(uuid.NewV4())
	authorizationID := crypto.SecureAlphanumeric(32) // Generate random ID for frontend

	now := time.Now()
	expiresAt := now.Add(params.TTL)

	auth := &OAuthServerAuthorization{
		ID:              id,
		AuthorizationID: authorizationID,
		ClientID:        params.ClientID,
		UserID:          nil, // No user yet
		RedirectURI:     params.RedirectURI,
		Scope:           params.Scope,
		ResponseType:    OAuthServerResponseTypeCode,
		Status:          OAuthServerAuthorizationPending,
		CreatedAt:       now,
		ExpiresAt:       expiresAt,
	}

	if params.State != "" {
		auth.State = &params.State
	}
	if params.Resource != "" {
		auth.Resource = &params.Resource
	}
	if params.CodeChallenge != "" {
		auth.CodeChallenge = &params.CodeChallenge
	}
	if params.CodeChallengeMethod != "" {
		// Normalize code challenge method to lowercase for database storage
		// Database enum expects 's256' and 'plain' (lowercase)
		normalizedMethod := strings.ToLower(params.CodeChallengeMethod)
		auth.CodeChallengeMethod = &normalizedMethod
	}
	if params.Nonce != "" {
		auth.Nonce = &params.Nonce
	}

	return auth
}

// IsExpired checks if the authorization request has expired
func (auth *OAuthServerAuthorization) IsExpired() bool {
	return time.Now().After(auth.ExpiresAt)
}

// SetUser sets the user ID for the authorization request (after login)
func (auth *OAuthServerAuthorization) SetUser(tx *storage.Connection, userID uuid.UUID) error {
	auth.UserID = &userID
	return tx.UpdateOnly(auth, "user_id")
}

// GetScopeList returns the scopes as a slice
func (auth *OAuthServerAuthorization) GetScopeList() []string {
	return ParseScopeString(auth.Scope)
}

// GenerateAuthorizationCode generates a new authorization code if not already set
func (auth *OAuthServerAuthorization) GenerateAuthorizationCode() string {
	if auth.AuthorizationCode != nil && *auth.AuthorizationCode != "" {
		return *auth.AuthorizationCode
	}

	code := uuid.Must(uuid.NewV4()).String()
	auth.AuthorizationCode = &code
	return code
}

// Approve approves the authorization request and generates an authorization code
func (auth *OAuthServerAuthorization) Approve(tx *storage.Connection) error {
	if auth.IsExpired() {
		return fmt.Errorf("authorization request has expired")
	}

	if auth.Status != OAuthServerAuthorizationPending {
		return fmt.Errorf("authorization request is not pending (current status: %s)", auth.Status)
	}

	now := time.Now()
	auth.Status = OAuthServerAuthorizationApproved
	auth.ApprovedAt = &now
	auth.GenerateAuthorizationCode()

	return tx.UpdateOnly(auth, "status", "approved_at", "authorization_code")
}

// Deny denies the authorization request
func (auth *OAuthServerAuthorization) Deny(tx *storage.Connection) error {
	if auth.Status != OAuthServerAuthorizationPending {
		return fmt.Errorf("authorization request is not pending (current status: %s)", auth.Status)
	}

	auth.Status = OAuthServerAuthorizationDenied
	return tx.UpdateOnly(auth, "status")
}

// MarkExpired marks the authorization request as expired
func (auth *OAuthServerAuthorization) MarkExpired(tx *storage.Connection) error {
	if auth.Status != OAuthServerAuthorizationPending {
		return fmt.Errorf("authorization request is not pending (current status: %s)", auth.Status)
	}

	auth.Status = OAuthServerAuthorizationExpired
	return tx.UpdateOnly(auth, "status")
}

// Validate performs basic validation on the OAuth authorization
func (auth *OAuthServerAuthorization) Validate() error {
	if auth.ClientID == uuid.Nil {
		return fmt.Errorf("client_id is required")
	}
	// UserID can be nil initially for unauthenticated authorization requests
	// It will be set when user authenticates
	if auth.RedirectURI == "" {
		return fmt.Errorf("redirect_uri is required")
	}
	if auth.Scope == "" {
		return fmt.Errorf("scope is required")
	}
	if auth.ResponseType != OAuthServerResponseTypeCode {
		return fmt.Errorf("only response_type=code is supported")
	}
	if auth.ExpiresAt.Before(auth.CreatedAt) {
		return fmt.Errorf("expires_at must be after created_at")
	}

	return nil
}

// VerifyPKCE verifies the PKCE code verifier against the stored challenge
func (auth *OAuthServerAuthorization) VerifyPKCE(codeVerifier string) error {
	if auth.CodeChallenge == nil || *auth.CodeChallenge == "" {
		// No PKCE challenge stored, verification passes
		return nil
	}

	if codeVerifier == "" {
		return fmt.Errorf("code_verifier is required when PKCE challenge is present")
	}

	// Use the shared PKCE verification function
	var codeChallengeMethod string
	if auth.CodeChallengeMethod != nil {
		codeChallengeMethod = *auth.CodeChallengeMethod
	}
	return security.VerifyPKCEChallenge(*auth.CodeChallenge, codeChallengeMethod, codeVerifier)
}

// Query functions for OAuth authorizations

// FindOAuthServerAuthorizationByID finds an OAuth authorization by authorization_id
func FindOAuthServerAuthorizationByID(tx *storage.Connection, authorizationID string) (*OAuthServerAuthorization, error) {
	auth := &OAuthServerAuthorization{}
	if err := tx.Q().Where("authorization_id = ?", authorizationID).First(auth); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, OAuthServerAuthorizationNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding OAuth authorization")
	}

	if auth.ClientID != uuid.Nil {
		client := &OAuthServerClient{}
		if err := tx.Q().Where("id = ?", auth.ClientID).First(client); err == nil {
			auth.Client = client
		}
	}

	return auth, nil
}

// FindOAuthServerAuthorizationByIDForUpdate finds an OAuth authorization by
// authorization_id and locks the row with FOR UPDATE SKIP LOCKED.
// Must be called inside a transaction.
func FindOAuthServerAuthorizationByIDForUpdate(tx *storage.Connection, authorizationID string) (*OAuthServerAuthorization, error) {
	auth := &OAuthServerAuthorization{}
	if err := tx.RawQuery(
		fmt.Sprintf("SELECT * FROM %q WHERE authorization_id = ? LIMIT 1 FOR UPDATE SKIP LOCKED", auth.TableName()),
		authorizationID,
	).First(auth); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, OAuthServerAuthorizationNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding OAuth authorization")
	}
	return auth, nil
}

// FindOAuthServerAuthorizationByCode finds an OAuth authorization by authorization code
func FindOAuthServerAuthorizationByCode(tx *storage.Connection, code string) (*OAuthServerAuthorization, error) {
	auth := &OAuthServerAuthorization{}
	if err := tx.Q().Where("authorization_code = ? AND status = ?", code, OAuthServerAuthorizationApproved).First(auth); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, OAuthServerAuthorizationNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding OAuth authorization by code")
	}

	// Load client relationship (always present)
	if auth.ClientID != uuid.Nil {
		client := &OAuthServerClient{}
		if err := tx.Q().Where("id = ?", auth.ClientID).First(client); err == nil {
			auth.Client = client
		}
	}

	return auth, nil
}

// CreateOAuthServerAuthorization creates a new OAuth authorization in the database
func CreateOAuthServerAuthorization(tx *storage.Connection, auth *OAuthServerAuthorization) error {
	if err := auth.Validate(); err != nil {
		return err
	}

	if auth.ID == uuid.Nil {
		auth.ID = uuid.Must(uuid.NewV4())
	}

	if auth.AuthorizationID == "" {
		auth.AuthorizationID = crypto.SecureAlphanumeric(32)
	}

	return tx.Create(auth)
}

// CleanupExpiredOAuthServerAuthorizations marks expired authorizations as expired
func CleanupExpiredOAuthServerAuthorizations(tx *storage.Connection) error {
	query := "UPDATE " + (&OAuthServerAuthorization{}).TableName() + " SET status = ? WHERE status = ? AND expires_at < now()"
	return tx.RawQuery(query, OAuthServerAuthorizationExpired, OAuthServerAuthorizationPending).Exec()
}

// Error types for OAuth authorization operations

type OAuthServerAuthorizationNotFoundError struct{}

func (e OAuthServerAuthorizationNotFoundError) Error() string {
	return "OAuth authorization not found"
}

func (e OAuthServerAuthorizationNotFoundError) Is(target error) bool {
	return target == errNotFound
}
