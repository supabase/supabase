package models

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

type OneTimeTokenType int

const (
	ConfirmationToken OneTimeTokenType = iota
	ReauthenticationToken
	RecoveryToken
	EmailChangeTokenNew
	EmailChangeTokenCurrent
	PhoneChangeToken
)

func (t OneTimeTokenType) String() string {
	switch t {
	case ConfirmationToken:
		return "confirmation_token"

	case ReauthenticationToken:
		return "reauthentication_token"

	case RecoveryToken:
		return "recovery_token"

	case EmailChangeTokenNew:
		return "email_change_token_new"

	case EmailChangeTokenCurrent:
		return "email_change_token_current"

	case PhoneChangeToken:
		return "phone_change_token"

	default:
		panic("OneTimeToken: unreachable case")
	}
}

func ParseOneTimeTokenType(s string) (OneTimeTokenType, error) {
	switch s {
	case "confirmation_token":
		return ConfirmationToken, nil

	case "reauthentication_token":
		return ReauthenticationToken, nil

	case "recovery_token":
		return RecoveryToken, nil

	case "email_change_token_new":
		return EmailChangeTokenNew, nil

	case "email_change_token_current":
		return EmailChangeTokenCurrent, nil

	case "phone_change_token":
		return PhoneChangeToken, nil

	default:
		return 0, fmt.Errorf("OneTimeTokenType: unrecognized string %q", s)
	}
}

func (t OneTimeTokenType) Value() (driver.Value, error) {
	return t.String(), nil
}

func (t *OneTimeTokenType) Scan(src interface{}) error {
	s, ok := src.(string)
	if !ok {
		return fmt.Errorf("OneTimeTokenType: scan type is not string but is %T", src)
	}

	parsed, err := ParseOneTimeTokenType(s)
	if err != nil {
		return err
	}

	*t = parsed
	return nil
}

const PKCEPrefix = "pkce_"

type OneTimeTokenNotFoundError struct {
}

func (e OneTimeTokenNotFoundError) Error() string {
	return "One-time token not found"
}

func (e OneTimeTokenNotFoundError) Is(target error) bool {
	return target == errNotFound
}

type OneTimeToken struct {
	ID uuid.UUID `json:"id" db:"id"`

	UserID    uuid.UUID        `json:"user_id" db:"user_id"`
	TokenType OneTimeTokenType `json:"token_type" db:"token_type"`

	TokenHash string `json:"token_hash" db:"token_hash"`
	RelatesTo string `json:"relates_to" db:"relates_to"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	ExpiresAt *time.Time `json:"expires_at" db:"expires_at"`
}

// IsExpired treats nil ExpiresAt as expired. This is a security measure to avoid accidentally treating a token with no expiration as valid.
func (o OneTimeToken) IsExpired() bool {
	return o.ExpiresAt == nil || time.Now().After(*o.ExpiresAt)
}

func (OneTimeToken) TableName() string {
	return "one_time_tokens"
}

func ClearAllOneTimeTokensForUser(tx *storage.Connection, userID uuid.UUID) error {
	return tx.Q().Where("user_id = ?", userID).Delete(OneTimeToken{})
}

func ClearOneTimeTokenForUser(tx *storage.Connection, userID uuid.UUID, tokenType OneTimeTokenType) error {
	if err := tx.Q().Where("token_type = ? and user_id = ?", tokenType, userID).Delete(OneTimeToken{}); err != nil {
		return err
	}

	return nil
}

func CreateOneTimeToken(
	tx *storage.Connection,
	userID uuid.UUID,
	relatesTo, tokenHash string,
	tokenType OneTimeTokenType,
	validityDuration time.Duration,
	writeExpiresAt bool) error {
	if err := ClearOneTimeTokenForUser(tx, userID, tokenType); err != nil {
		return err
	}

	oneTimeToken := &OneTimeToken{
		ID:        uuid.Must(uuid.NewV4()),
		UserID:    userID,
		TokenType: tokenType,
		TokenHash: tokenHash,
		RelatesTo: strings.ToLower(relatesTo),
	}

	if writeExpiresAt {
		expiresAt := time.Now().Add(validityDuration)
		oneTimeToken.ExpiresAt = &expiresAt
	}

	if err := tx.Eager().Create(oneTimeToken); err != nil {
		return err
	}

	return nil
}

func FindOneTimeToken(tx *storage.Connection, tokenHash string, tokenTypes ...OneTimeTokenType) (*OneTimeToken, error) {
	return findOneTimeToken(tx, tokenHash, false, tokenTypes...)
}

// FindOneTimeTokenWithPKCEFallback finds the one time token of the given
// types whose hash is either tokenHash or tokenHash with the "pkce_" prefix,
// in a single query. An exact match is preferred over a prefixed one.
// It returns OneTimeTokenNotFoundError when no row exists.
func FindOneTimeTokenWithPKCEFallback(tx *storage.Connection, tokenHash string, tokenTypes ...OneTimeTokenType) (*OneTimeToken, error) {
	return findOneTimeToken(tx, tokenHash, true, tokenTypes...)
}

// findOneTimeToken finds the one time token of the given types by tokenHash.
// With pkceFallback it also accepts PKCEPrefix+tokenHash and prefers the
// exact match. It returns OneTimeTokenNotFoundError when no row exists.
func findOneTimeToken(tx *storage.Connection, tokenHash string, pkceFallback bool, tokenTypes ...OneTimeTokenType) (*OneTimeToken, error) {
	oneTimeToken := &OneTimeToken{}

	query := tx.Eager().Q()

	hashClause, hashArgs := "token_hash = ?", []interface{}{tokenHash}
	if pkceFallback {
		hashClause, hashArgs = "token_hash in (?, ?)", []interface{}{tokenHash, PKCEPrefix + tokenHash}
	}

	switch len(tokenTypes) {
	case 2:
		args := append([]interface{}{tokenTypes[0], tokenTypes[1]}, hashArgs...) // #nosec G602
		query = query.Where("(token_type = ? or token_type = ?) and "+hashClause, args...)

	case 1:
		args := append([]interface{}{tokenTypes[0]}, hashArgs...)
		query = query.Where("token_type = ? and "+hashClause, args...)

	default:
		panic("at most 2 token types are accepted")
	}

	if pkceFallback {
		// true sorts before false in descending order, so this allows us to prefer an exact match
		query = query.Order("token_hash = ? desc", tokenHash)
	}

	if err := query.First(oneTimeToken); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, OneTimeTokenNotFoundError{}
		}

		return nil, errors.Wrap(err, "error finding one time token")
	}

	return oneTimeToken, nil
}

// FindOneTimeTokenByRelatesTo finds the newest one time token of the given
// token type by the relatesTo field.
//
// relates_to is not unique across users. For PhoneChangeToken in particular,
// two users can hold rows for the same phone number, so the returned row does
// not identify a user on its own. Callers must check the user against the
// request before they trust the result.
//
// It returns OneTimeTokenNotFoundError when no row exists.
func FindOneTimeTokenByRelatesTo(tx *storage.Connection, relatesTo string, tokenType OneTimeTokenType) (*OneTimeToken, error) {
	oneTimeToken := &OneTimeToken{}

	err := tx.Eager().Q().
		Where("token_type = ? and relates_to = ?", tokenType, strings.ToLower(relatesTo)).
		Order("created_at desc").
		First(oneTimeToken)
	if errors.Cause(err) == sql.ErrNoRows {
		return nil, OneTimeTokenNotFoundError{}
	} else if err != nil {
		return nil, errors.Wrap(err, "error finding one time token")
	}
	return oneTimeToken, nil
}

// FindUserByOneTimeToken finds the user holding the one-time token matching
// tokenHash for any of the given token types.
func FindUserByOneTimeToken(tx *storage.Connection, tokenHash string, tokenTypes ...OneTimeTokenType) (*User, error) {
	ott, err := FindOneTimeToken(tx, tokenHash, tokenTypes...)
	if err != nil {
		return nil, err
	}

	return FindUserByID(tx, ott.UserID)
}

// FindUserByEmailChangeCurrentAndAudience finds a user with the matching email change and audience.
func FindUserByEmailChangeCurrentAndAudience(tx *storage.Connection, email, token, aud string) (*User, error) {
	ott, err := FindOneTimeToken(tx, token, EmailChangeTokenCurrent)
	if err != nil && !IsNotFoundError(err) {
		return nil, err
	}

	if ott == nil {
		ott, err = FindOneTimeToken(tx, PKCEPrefix+token, EmailChangeTokenCurrent)
		if err != nil {
			return nil, err
		}
	}
	if ott == nil {
		return nil, err
	}

	user, err := FindUserByID(tx, ott.UserID)
	if err != nil {
		return nil, err
	}

	if user.Aud != aud && strings.EqualFold(user.GetEmail(), email) {
		return nil, UserNotFoundError{}
	}

	return user, nil
}

// FindUserByEmailChangeNewAndAudience finds a user with the matching email change and audience.
func FindUserByEmailChangeNewAndAudience(tx *storage.Connection, email, token, aud string) (*User, error) {
	ott, err := FindOneTimeToken(tx, token, EmailChangeTokenNew)
	if err != nil && !IsNotFoundError(err) {
		return nil, err
	}

	if ott == nil {
		ott, err = FindOneTimeToken(tx, PKCEPrefix+token, EmailChangeTokenNew)
		if err != nil && !IsNotFoundError(err) {
			return nil, err
		}
	}
	if ott == nil {
		return nil, err
	}

	user, err := FindUserByID(tx, ott.UserID)
	if err != nil {
		return nil, err
	}

	if user.Aud != aud && strings.EqualFold(user.EmailChange, email) {
		return nil, UserNotFoundError{}
	}

	return user, nil
}

// FindUserForEmailChange finds a user requesting for an email change
func FindUserForEmailChange(tx *storage.Connection, email, token, aud string, secureEmailChangeEnabled bool) (*User, error) {
	if secureEmailChangeEnabled {
		if user, err := FindUserByEmailChangeCurrentAndAudience(tx, email, token, aud); err == nil {
			return user, err
		} else if !IsNotFoundError(err) {
			return nil, err
		}
	}
	return FindUserByEmailChangeNewAndAudience(tx, email, token, aud)
}
