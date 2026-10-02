package models

import (
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
)

func TestNewOAuthServerConsent(t *testing.T) {
	userID := uuid.Must(uuid.NewV4())
	clientID := uuid.Must(uuid.NewV4())
	scopes := []string{"openid", "profile", "email"}

	consent := NewOAuthServerConsent(userID, clientID, scopes)

	assert.NotEmpty(t, consent.ID)
	assert.Equal(t, userID, consent.UserID)
	assert.Equal(t, clientID, consent.ClientID)
	assert.Equal(t, "openid profile email", consent.Scopes)
	assert.False(t, consent.GrantedAt.IsZero())
	assert.Nil(t, consent.RevokedAt)
}

func TestOAuthServerConsent_IsRevoked(t *testing.T) {
	consent := &OAuthServerConsent{}

	// Initially not revoked
	assert.False(t, consent.IsRevoked())

	// After revocation
	now := time.Now()
	consent.RevokedAt = &now
	assert.True(t, consent.IsRevoked())
}

func TestOAuthServerConsent_Validate(t *testing.T) {
	validConsent := &OAuthServerConsent{
		UserID:    uuid.Must(uuid.NewV4()),
		ClientID:  uuid.Must(uuid.NewV4()),
		Scopes:    "openid profile",
		GrantedAt: time.Now(),
	}

	// Valid consent should pass
	assert.NoError(t, validConsent.Validate())

	// Test invalid cases
	tests := []struct {
		name    string
		modify  func(*OAuthServerConsent)
		wantErr bool
		errMsg  string
	}{
		{
			name:    "missing user_id",
			modify:  func(c *OAuthServerConsent) { c.UserID = uuid.Nil },
			wantErr: true,
			errMsg:  "user_id is required",
		},
		{
			name:    "missing client_id",
			modify:  func(c *OAuthServerConsent) { c.ClientID = uuid.Nil },
			wantErr: true,
			errMsg:  "client_id is required",
		},
		{
			name:    "empty scopes",
			modify:  func(c *OAuthServerConsent) { c.Scopes = "" },
			wantErr: true,
			errMsg:  "scopes cannot be empty",
		},
		{
			name:    "whitespace only scopes",
			modify:  func(c *OAuthServerConsent) { c.Scopes = "   " },
			wantErr: true,
			errMsg:  "scopes cannot be empty",
		},
		{
			name: "revoked_at before granted_at",
			modify: func(c *OAuthServerConsent) {
				revokedAt := c.GrantedAt.Add(-1 * time.Hour)
				c.RevokedAt = &revokedAt
			},
			wantErr: true,
			errMsg:  "revoked_at cannot be before granted_at",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			consent := *validConsent // Copy
			tt.modify(&consent)

			err := consent.Validate()
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
