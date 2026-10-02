package models

import (
	"database/sql"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

const (
	WebAuthnChallengeTypeSignup         = "signup"
	WebAuthnChallengeTypeRegistration   = "registration"
	WebAuthnChallengeTypeAuthentication = "authentication"
)

// WebAuthnChallenge maps to the webauthn_challenges table.
type WebAuthnChallenge struct {
	ID            uuid.UUID            `json:"id" db:"id"`
	UserID        *uuid.UUID           `json:"user_id,omitempty" db:"user_id"`
	ChallengeType string               `json:"challenge_type" db:"challenge_type"`
	SessionData   *WebAuthnSessionData `json:"session_data" db:"session_data"`
	CreatedAt     time.Time            `json:"created_at" db:"created_at"`
	ExpiresAt     time.Time            `json:"expires_at" db:"expires_at"`
}

func (WebAuthnChallenge) TableName() string {
	return "webauthn_challenges"
}

func NewWebAuthnChallenge(userID *uuid.UUID, challengeType string, sessionData *WebAuthnSessionData, expiresAt time.Time) *WebAuthnChallenge {
	id := uuid.Must(uuid.NewV4())
	return &WebAuthnChallenge{
		ID:            id,
		UserID:        userID,
		ChallengeType: challengeType,
		SessionData:   sessionData,
		ExpiresAt:     expiresAt,
	}
}

func FindWebAuthnChallengeByID(conn *storage.Connection, id uuid.UUID) (*WebAuthnChallenge, error) {
	var challenge WebAuthnChallenge
	err := conn.Find(&challenge, id)
	if err != nil && errors.Cause(err) == sql.ErrNoRows {
		return nil, WebAuthnChallengeNotFoundError{}
	} else if err != nil {
		return nil, err
	}
	return &challenge, nil
}

// ConsumeWebAuthnChallengeByID atomically deletes and returns a challenge row
func ConsumeWebAuthnChallengeByID(conn *storage.Connection, id uuid.UUID, challengeType string, userID *uuid.UUID) (*WebAuthnChallenge, error) {
	challenge := &WebAuthnChallenge{}
	table := challenge.TableName()

	var query string
	var args []any
	if userID != nil {
		query = "DELETE FROM " + table + " WHERE id = ? AND challenge_type = ? AND user_id = ? RETURNING *"
		args = []any{id, challengeType, *userID}
	} else {
		query = "DELETE FROM " + table + " WHERE id = ? AND challenge_type = ? AND user_id IS NULL RETURNING *"
		args = []any{id, challengeType}
	}

	if err := conn.RawQuery(query, args...).First(challenge); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, WebAuthnChallengeNotFoundError{}
		}

		return nil, err
	}

	return challenge, nil
}

func (c *WebAuthnChallenge) IsExpired() bool {
	return time.Now().After(c.ExpiresAt)
}

func (c *WebAuthnChallenge) Delete(tx *storage.Connection) error {
	return tx.Destroy(c)
}
