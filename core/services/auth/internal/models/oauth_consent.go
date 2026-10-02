package models

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

// OAuthServerConsent represents user consent for an OAuth server client's access to specific scopes
type OAuthServerConsent struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	ClientID  uuid.UUID  `json:"-" db:"client_id"`
	Scopes    string     `json:"scopes" db:"scopes"`
	GrantedAt time.Time  `json:"granted_at" db:"granted_at"`
	RevokedAt *time.Time `json:"revoked_at" db:"revoked_at"`
}

// TableName returns the table name for the OAuthConsent model
func (OAuthServerConsent) TableName() string {
	return "oauth_consents"
}

// NewOAuthConsent creates a new OAuth consent record
func NewOAuthServerConsent(userID uuid.UUID, clientID uuid.UUID, scopes []string) *OAuthServerConsent {
	return &OAuthServerConsent{
		ID:        uuid.Must(uuid.NewV4()),
		UserID:    userID,
		ClientID:  clientID,
		Scopes:    strings.Join(scopes, " "),
		GrantedAt: time.Now(),
	}
}

// GetScopeList returns the granted scopes as a slice
func (consent *OAuthServerConsent) GetScopeList() []string {
	return ParseScopeString(consent.Scopes)
}

// HasScope checks if the consent includes a specific scope
func (consent *OAuthServerConsent) HasScope(scope string) bool {
	return HasScope(consent.GetScopeList(), scope)
}

// HasAllScopes checks if the consent includes all of the requested scopes
func (consent *OAuthServerConsent) HasAllScopes(requestedScopes []string) bool {
	return HasAllScopes(consent.GetScopeList(), requestedScopes)
}

// IsRevoked checks if the consent has been revoked
func (consent *OAuthServerConsent) IsRevoked() bool {
	return consent.RevokedAt != nil
}

// Revoke revokes the consent
func (consent *OAuthServerConsent) Revoke(tx *storage.Connection) error {
	if consent.IsRevoked() {
		return fmt.Errorf("consent is already revoked")
	}

	now := time.Now()
	consent.RevokedAt = &now
	return tx.UpdateOnly(consent, "revoked_at")
}

// UpdateScopes updates the granted scopes for this consent
func (consent *OAuthServerConsent) UpdateScopes(tx *storage.Connection, scopes []string) error {
	if consent.IsRevoked() {
		return fmt.Errorf("cannot update scopes for revoked consent")
	}

	consent.Scopes = strings.Join(scopes, " ")
	consent.GrantedAt = time.Now() // Update granted time to reflect the change
	return tx.UpdateOnly(consent, "scopes", "granted_at")
}

// Validate performs basic validation on the OAuth consent
func (consent *OAuthServerConsent) Validate() error {
	if consent.UserID == uuid.Nil {
		return fmt.Errorf("user_id is required")
	}
	if consent.ClientID == uuid.Nil {
		return fmt.Errorf("client_id is required")
	}
	if strings.TrimSpace(consent.Scopes) == "" {
		return fmt.Errorf("scopes cannot be empty")
	}
	if consent.RevokedAt != nil && consent.RevokedAt.Before(consent.GrantedAt) {
		return fmt.Errorf("revoked_at cannot be before granted_at")
	}

	return nil
}

// Query functions for OAuth consents

// FindOAuthServerConsentByUserAndClient finds an OAuth consent by user and client
func FindOAuthServerConsentByUserAndClient(tx *storage.Connection, userID uuid.UUID, clientID uuid.UUID) (*OAuthServerConsent, error) {
	consent := &OAuthServerConsent{}
	if err := tx.Eager().Q().Where("user_id = ? AND client_id = ?", userID, clientID).First(consent); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil // No consent found (not an error)
		}
		return nil, errors.Wrap(err, "error finding OAuth consent")
	}
	return consent, nil
}

// FindActiveOAuthServerConsentByUserAndClient finds an active (non-revoked) OAuth consent
func FindActiveOAuthServerConsentByUserAndClient(tx *storage.Connection, userID uuid.UUID, clientID uuid.UUID) (*OAuthServerConsent, error) {
	consent := &OAuthServerConsent{}
	if err := tx.Q().Where("user_id = ? AND client_id = ? AND revoked_at IS NULL", userID, clientID).First(consent); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil // No active consent found (not an error)
		}
		return nil, errors.Wrap(err, "error finding active OAuth consent")
	}

	return consent, nil
}

// FindOAuthServerConsentsByUser finds all OAuth consents for a user
func FindOAuthServerConsentsByUser(tx *storage.Connection, userID uuid.UUID, includeRevoked bool) ([]*OAuthServerConsent, error) {
	var consents []*OAuthServerConsent
	query := tx.Q().Where("user_id = ?", userID)

	if !includeRevoked {
		query = query.Where("revoked_at IS NULL")
	}

	if err := query.Order("granted_at desc").All(&consents); err != nil {
		return nil, errors.Wrap(err, "error finding OAuth consents by user")
	}

	return consents, nil
}

// UpsertOAuthServerConsent creates or updates an OAuth consent
func UpsertOAuthServerConsent(tx *storage.Connection, consent *OAuthServerConsent) error {
	if err := consent.Validate(); err != nil {
		return err
	}

	existing, err := FindOAuthServerConsentByUserAndClient(tx, consent.UserID, consent.ClientID)
	if err != nil {
		return err
	}

	if existing != nil {
		// Update existing consent
		existing.Scopes = consent.Scopes
		existing.GrantedAt = time.Now()
		existing.RevokedAt = nil // Un-revoke if previously revoked
		return tx.Update(existing)
	}

	// Create new consent
	if consent.ID == uuid.Nil {
		consent.ID = uuid.Must(uuid.NewV4())
	}
	return tx.Create(consent)
}

// RevokeOAuthServerConsentsByClient revokes all consents for a specific client
func RevokeOAuthServerConsentsByClient(tx *storage.Connection, clientID uuid.UUID) error {
	now := time.Now()
	query := "UPDATE " + (&OAuthServerConsent{}).TableName() + " SET revoked_at = ? WHERE client_id = ? AND revoked_at IS NULL"
	return tx.RawQuery(query, now, clientID).Exec()
}

// RevokeOAuthServerConsentsByUser revokes all consents for a specific user
func RevokeOAuthServerConsentsByUser(tx *storage.Connection, userID uuid.UUID) error {
	now := time.Now()
	query := "UPDATE " + (&OAuthServerConsent{}).TableName() + " SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL"
	return tx.RawQuery(query, now, userID).Exec()
}
