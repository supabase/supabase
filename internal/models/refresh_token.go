package models

import (
	"database/sql"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// RefreshToken is the database model for refresh tokens.
type RefreshToken struct {
	ID int64 `db:"id"`

	Token string `db:"token"`

	UserID uuid.UUID `db:"user_id"`

	Parent    storage.NullString `db:"parent"`
	SessionId *uuid.UUID         `db:"session_id"`

	Revoked   bool      `db:"revoked"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`

	DONTUSEINSTANCEID uuid.UUID `json:"-" db:"instance_id"`
}

func (RefreshToken) TableName() string {
	tableName := "refresh_tokens"
	return tableName
}

// GrantParams is used to pass session-specific parameters when issuing a new
// refresh token to authenticated users.
type GrantParams struct {
	FactorID *uuid.UUID

	SessionNotAfter *time.Time
	SessionTag      *string

	OAuthClientID *uuid.UUID
	Scopes        *string

	UserAgent string
	IP        string
}

func (g *GrantParams) FillGrantParams(r *http.Request) {
	g.UserAgent = r.Header.Get("User-Agent")
	g.IP = utilities.GetIPAddress(r)
}

// GrantAuthenticatedUser creates a refresh token for the provided user.
func GrantAuthenticatedUser(tx *storage.Connection, user *User, params GrantParams) (*RefreshToken, error) {
	return createRefreshToken(tx, user, nil, &params)
}

// GrantRefreshTokenSwap swaps a refresh token for a new one, revoking the provided token.
func GrantRefreshTokenSwap(config conf.AuditLogConfiguration, r *http.Request, tx *storage.Connection, user *User, token *RefreshToken) (*RefreshToken, error) {
	var newToken *RefreshToken
	err := tx.Transaction(func(rtx *storage.Connection) error {
		var terr error
		if terr = NewAuditLogEntry(config, r, tx, user, TokenRevokedAction, "", nil); terr != nil {
			return errors.Wrap(terr, "error creating audit log entry")
		}

		token.Revoked = true
		if terr = tx.UpdateOnly(token, "revoked"); terr != nil {
			return terr
		}

		newToken, terr = createRefreshToken(rtx, user, token, &GrantParams{})
		return terr
	})
	return newToken, err
}

// RevokeTokenFamily revokes all refresh tokens that descended from the provided token.
func RevokeTokenFamily(tx *storage.Connection, token *RefreshToken) error {
	var err error
	tablename := (&pop.Model{Value: RefreshToken{}}).TableName()
	if token.SessionId != nil {
		err = tx.RawQuery(`update `+tablename+` set revoked = true, updated_at = now() where session_id = ? and revoked = false;`, token.SessionId).Exec()
	} else {
		err = tx.RawQuery(`
		with recursive token_family as (
			select id, user_id, token, revoked, parent from `+tablename+` where parent = ?
			union
			select r.id, r.user_id, r.token, r.revoked, r.parent from `+tablename+` r inner join token_family t on t.token = r.parent
		)
		update `+tablename+` r set revoked = true from token_family where token_family.id = r.id;`, token.Token).Exec()
	}
	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows || errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		return err
	}
	return nil
}

func FindTokenBySessionID(tx *storage.Connection, sessionId *uuid.UUID) (*RefreshToken, error) {
	refreshToken := &RefreshToken{}
	err := tx.Q().Where("instance_id = ? and session_id = ? and revoked = false", uuid.Nil, sessionId).Order("created_at asc").First(refreshToken)
	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, RefreshTokenNotFoundError{}
		}
		return nil, err
	}
	return refreshToken, nil
}

func (s *Session) ApplyGrantParams(params *GrantParams) {
	s.FactorID = params.FactorID

	if params.SessionNotAfter != nil {
		s.NotAfter = params.SessionNotAfter
	}

	if params.UserAgent != "" {
		s.UserAgent = &params.UserAgent
	}

	if params.IP != "" {
		s.IP = &params.IP
	}

	if params.SessionTag != nil && *params.SessionTag != "" {
		s.Tag = params.SessionTag
	}

	if params.OAuthClientID != nil && *params.OAuthClientID != uuid.Nil {
		s.OAuthClientID = params.OAuthClientID
	}

	if params.Scopes != nil && *params.Scopes != "" {
		s.Scopes = params.Scopes
	}
}

func (s *Session) SetupRefreshTokenData(dbEncryption conf.DatabaseEncryptionConfiguration) error {
	hmacKey := base64.RawURLEncoding.EncodeToString(crypto.GenerateRefreshTokenHmacKey())

	if dbEncryption.Encrypt {
		es, err := crypto.NewEncryptedString(s.ID.String(), []byte(hmacKey), dbEncryption.EncryptionKeyID, dbEncryption.EncryptionKey)
		if err != nil {
			return err
		}

		hmacKey = es.String()
	}

	counter := int64(0)

	s.RefreshTokenHmacKey = &hmacKey
	s.RefreshTokenCounter = &counter

	return nil
}

func (s *Session) UpdateRefreshTokenCounterAndHmacKey(tx *storage.Connection) error {
	return tx.UpdateOnly(s, "refresh_token_hmac_key", "refresh_token_counter")
}

func createRefreshToken(tx *storage.Connection, user *User, oldToken *RefreshToken, params *GrantParams) (*RefreshToken, error) {
	token := &RefreshToken{
		UserID: user.ID,
		Token:  crypto.SecureAlphanumeric(12),
		Parent: "",
	}
	if oldToken != nil {
		token.Parent = storage.NullString(oldToken.Token)
		token.SessionId = oldToken.SessionId
	}

	if token.SessionId == nil {
		session, err := NewSession(user.ID, params.FactorID)
		if err != nil {
			return nil, errors.Wrap(err, "error instantiating new session object")
		}

		session.ApplyGrantParams(params)

		if err := tx.Create(session); err != nil {
			return nil, errors.Wrap(err, "error creating new session")
		}

		token.SessionId = &session.ID
	}

	if err := tx.Create(token); err != nil {
		return nil, errors.Wrap(err, "error creating refresh token")
	}

	if err := user.UpdateLastSignInAt(tx); err != nil {
		return nil, errors.Wrap(err, "error update user`s last_sign_in field")
	}
	return token, nil
}
