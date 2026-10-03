package models

import (
	"database/sql"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

const OAuthClientStateTimeout = 5 * time.Minute

type OAuthClientState struct {
	ID           uuid.UUID `json:"id" db:"id"`
	ProviderType string    `json:"provider_type" db:"provider_type"`
	CodeVerifier *string   `json:"code_verifier,omitempty" db:"code_verifier"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

func (OAuthClientState) TableName() string {
	return "oauth_client_states"
}

func NewOAuthClientState(providerType string, codeVerifier *string) *OAuthClientState {
	return &OAuthClientState{
		ID:           uuid.Must(uuid.NewV4()),
		ProviderType: providerType,
		CodeVerifier: codeVerifier,
	}
}
func FindAndDeleteOAuthClientStateByID(tx *storage.Connection, id uuid.UUID) (*OAuthClientState, error) {
	obj := &OAuthClientState{}
	if err := tx.RawQuery("DELETE FROM "+obj.TableName()+" WHERE id = ? RETURNING *", id).First(obj); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, OAuthClientStateNotFoundError{}
		}
		return nil, errors.Wrap(err, "error deleting oauth state")
	}
	return obj, nil
}

func (s *OAuthClientState) IsExpired() bool {
	return time.Since(s.CreatedAt) > OAuthClientStateTimeout
}
