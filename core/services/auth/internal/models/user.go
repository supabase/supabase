package models

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/storage"
	"golang.org/x/crypto/bcrypt"
)

// User respresents a registered user with email/password authentication
type User struct {
	ID uuid.UUID `json:"id" db:"id"`

	Aud       string             `json:"aud" db:"aud"`
	Role      string             `json:"role" db:"role"`
	Email     storage.NullString `json:"email" db:"email"`
	IsSSOUser bool               `json:"-" db:"is_sso_user"`

	EncryptedPassword *string    `json:"-" db:"encrypted_password"`
	EmailConfirmedAt  *time.Time `json:"email_confirmed_at,omitempty" db:"email_confirmed_at"`
	InvitedAt         *time.Time `json:"invited_at,omitempty" db:"invited_at"`

	Phone            storage.NullString `json:"phone" db:"phone"`
	PhoneConfirmedAt *time.Time         `json:"phone_confirmed_at,omitempty" db:"phone_confirmed_at"`

	ConfirmationToken  string     `json:"-" db:"confirmation_token"`
	ConfirmationSentAt *time.Time `json:"confirmation_sent_at,omitempty" db:"confirmation_sent_at"`

	// For backward compatibility only. Use EmailConfirmedAt or PhoneConfirmedAt instead.
	ConfirmedAt *time.Time `json:"confirmed_at,omitempty" db:"confirmed_at" rw:"r"`

	RecoveryToken  string     `json:"-" db:"recovery_token"`
	RecoverySentAt *time.Time `json:"recovery_sent_at,omitempty" db:"recovery_sent_at"`

	EmailChangeTokenCurrent  string     `json:"-" db:"email_change_token_current"`
	EmailChangeTokenNew      string     `json:"-" db:"email_change_token_new"`
	EmailChange              string     `json:"new_email,omitempty" db:"email_change"`
	EmailChangeSentAt        *time.Time `json:"email_change_sent_at,omitempty" db:"email_change_sent_at"`
	EmailChangeConfirmStatus int        `json:"-" db:"email_change_confirm_status"`

	PhoneChangeToken  string     `json:"-" db:"phone_change_token"`
	PhoneChange       string     `json:"new_phone,omitempty" db:"phone_change"`
	PhoneChangeSentAt *time.Time `json:"phone_change_sent_at,omitempty" db:"phone_change_sent_at"`

	ReauthenticationToken  string     `json:"-" db:"reauthentication_token"`
	ReauthenticationSentAt *time.Time `json:"reauthentication_sent_at,omitempty" db:"reauthentication_sent_at"`

	LastSignInAt *time.Time `json:"last_sign_in_at,omitempty" db:"last_sign_in_at"`

	AppMetaData  JSONMap `json:"app_metadata" db:"raw_app_meta_data"`
	UserMetaData JSONMap `json:"user_metadata" db:"raw_user_meta_data"`

	Factors    []Factor   `json:"factors,omitempty" has_many:"factors"`
	Identities []Identity `json:"identities" has_many:"identities"`

	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	BannedUntil *time.Time `json:"banned_until,omitempty" db:"banned_until"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	IsAnonymous bool       `json:"is_anonymous" db:"is_anonymous"`

	DONTUSEINSTANCEID uuid.UUID `json:"-" db:"instance_id"`
}

func NewUserWithPasswordHash(phone, email, passwordHash, aud string, userData map[string]interface{}) (*User, error) {
	if strings.HasPrefix(passwordHash, crypto.Argon2Prefix) {
		_, err := crypto.ParseArgon2Hash(passwordHash)
		if err != nil {
			return nil, err
		}
	} else if strings.HasPrefix(passwordHash, crypto.FirebaseScryptPrefix) {
		_, err := crypto.ParseFirebaseScryptHash(passwordHash)
		if err != nil {
			return nil, err
		}
	} else {
		// verify that the hash is a bcrypt hash
		_, err := bcrypt.Cost([]byte(passwordHash))
		if err != nil {
			return nil, err
		}
	}
	id := uuid.Must(uuid.NewV4())
	user := &User{
		ID:                id,
		Aud:               aud,
		Email:             storage.NullString(strings.ToLower(email)),
		Phone:             storage.NullString(phone),
		UserMetaData:      userData,
		EncryptedPassword: &passwordHash,
	}
	return user, nil
}

// NewUser initializes a new user from an email, password and user data.
func NewUser(phone, email, password, aud string, userData map[string]interface{}) (*User, error) {
	passwordHash := ""

	if password != "" {
		pw, err := crypto.GenerateFromPassword(context.Background(), password)
		if err != nil {
			return nil, err
		}

		passwordHash = pw
	}

	if userData == nil {
		userData = make(map[string]interface{})
	}

	id := uuid.Must(uuid.NewV4())
	user := &User{
		ID:                id,
		Aud:               aud,
		Email:             storage.NullString(strings.ToLower(email)),
		Phone:             storage.NullString(phone),
		UserMetaData:      userData,
		EncryptedPassword: &passwordHash,
	}
	return user, nil
}

// TableName overrides the table name used by pop
func (User) TableName() string {
	tableName := "users"
	return tableName
}

func (u *User) HasPassword() bool {
	var pwd string

	if u.EncryptedPassword != nil {
		pwd = *u.EncryptedPassword
	}

	return pwd != ""
}

// BeforeSave is invoked before the user is saved to the database
func (u *User) BeforeSave(tx *pop.Connection) error {
	if u.EmailConfirmedAt != nil && u.EmailConfirmedAt.IsZero() {
		u.EmailConfirmedAt = nil
	}
	if u.PhoneConfirmedAt != nil && u.PhoneConfirmedAt.IsZero() {
		u.PhoneConfirmedAt = nil
	}
	if u.InvitedAt != nil && u.InvitedAt.IsZero() {
		u.InvitedAt = nil
	}
	if u.ConfirmationSentAt != nil && u.ConfirmationSentAt.IsZero() {
		u.ConfirmationSentAt = nil
	}
	if u.RecoverySentAt != nil && u.RecoverySentAt.IsZero() {
		u.RecoverySentAt = nil
	}
	if u.EmailChangeSentAt != nil && u.EmailChangeSentAt.IsZero() {
		u.EmailChangeSentAt = nil
	}
	if u.PhoneChangeSentAt != nil && u.PhoneChangeSentAt.IsZero() {
		u.PhoneChangeSentAt = nil
	}
	if u.ReauthenticationSentAt != nil && u.ReauthenticationSentAt.IsZero() {
		u.ReauthenticationSentAt = nil
	}
	if u.LastSignInAt != nil && u.LastSignInAt.IsZero() {
		u.LastSignInAt = nil
	}
	if u.BannedUntil != nil && u.BannedUntil.IsZero() {
		u.BannedUntil = nil
	}
	return nil
}

// IsConfirmed checks if a user has already been
// registered and confirmed.
func (u *User) IsConfirmed() bool {
	return u.EmailConfirmedAt != nil
}

// HasBeenInvited checks if user has been invited
func (u *User) HasBeenInvited() bool {
	return u.InvitedAt != nil
}

// IsPhoneConfirmed checks if a user's phone has already been
// registered and confirmed.
func (u *User) IsPhoneConfirmed() bool {
	return u.PhoneConfirmedAt != nil
}

// SetRole sets the users Role to roleName
func (u *User) SetRole(tx *storage.Connection, roleName string) error {
	u.Role = strings.TrimSpace(roleName)
	return tx.UpdateOnly(u, "role")
}

// HasRole returns true when the users role is set to roleName
func (u *User) HasRole(roleName string) bool {
	return u.Role == roleName
}

// GetEmail returns the user's email as a string
func (u *User) GetEmail() string {
	return string(u.Email)
}

// GetPhone returns the user's phone number as a string
func (u *User) GetPhone() string {
	return string(u.Phone)
}

// UpdateUserMetaData sets all user data from a map of updates,
// ensuring that it doesn't override attributes that are not
// in the provided map.
func (u *User) UpdateUserMetaData(tx *storage.Connection, updates map[string]interface{}) error {
	if u.UserMetaData == nil {
		u.UserMetaData = updates
	} else {
		for key, value := range updates {
			if value != nil {
				u.UserMetaData[key] = value
			} else {
				delete(u.UserMetaData, key)
			}
		}
	}
	return tx.UpdateOnly(u, "raw_user_meta_data")
}

// UpdateAppMetaData updates all app data from a map of updates
func (u *User) UpdateAppMetaData(tx *storage.Connection, updates map[string]interface{}) error {
	if u.AppMetaData == nil {
		u.AppMetaData = updates
	} else {
		for key, value := range updates {
			if value != nil {
				u.AppMetaData[key] = value
			} else {
				delete(u.AppMetaData, key)
			}
		}
	}
	return tx.UpdateOnly(u, "raw_app_meta_data")
}

// UpdateAppMetaDataProviders updates the provider field in AppMetaData column
func (u *User) UpdateAppMetaDataProviders(tx *storage.Connection) error {
	providers, terr := FindProvidersByUser(tx, u)
	if terr != nil {
		return terr
	}
	payload := map[string]interface{}{
		"providers": providers,
	}
	if len(providers) > 0 {
		payload["provider"] = providers[0]
	}
	return u.UpdateAppMetaData(tx, payload)
}

// UpdateUserEmail updates the user's email to one of the identity's email
// if the current email used doesn't match any of the identities email.
// Unverified identity emails remain confirmed when mailer autoconfirm is enabled.
func (u *User) UpdateUserEmailFromIdentities(tx *storage.Connection, mailerAutoconfirm bool) error {
	identities, terr := FindIdentitiesByUserID(tx, u.ID)
	if terr != nil {
		return terr
	}
	for _, i := range identities {
		if u.GetEmail() == i.GetEmail() {
			// there's an existing identity that uses the same email
			// so the user's email can be kept
			return nil
		}
	}

	// We select identities in the following order of priority:
	// 	1. identities whose email was verified by the identity provider
	// 	2. identities with an unverified email
	// 	3. identities without an email (e.g. phone)
	identityRank := func(i *Identity) int {
		switch {
		case i.GetEmail() == "":
			return 2
		case !i.IsEmailVerified():
			return 1
		default:
			return 0
		}
	}
	sort.SliceStable(identities, func(a, b int) bool {
		ia, ib := identities[a], identities[b]
		if ra, rb := identityRank(ia), identityRank(ib); ra != rb {
			return ra < rb
		}
		if !ia.CreatedAt.Equal(ib.CreatedAt) {
			return ia.CreatedAt.Before(ib.CreatedAt)
		}
		return ia.ID.String() < ib.ID.String()
	})

	var primaryIdentity *Identity
	for _, i := range identities {
		if _, terr := FindUserByEmailAndAudience(tx, i.GetEmail(), u.Aud); terr != nil {
			if IsNotFoundError(terr) {
				// the identity's email is not used by another user
				// so we can set it as the primary identity
				primaryIdentity = i
				break
			}
			return terr
		}
	}
	if primaryIdentity == nil {
		return UserEmailUniqueConflictError{}
	}
	// default to the first identity's email
	if terr := u.SetEmail(tx, primaryIdentity.GetEmail()); terr != nil {
		return terr
	}
	// outstanding tokens and pending account changes were issued before the
	// primary email transition so they can't be trusted anymore
	if terr := u.ClearAllPendingTokens(tx); terr != nil {
		return terr
	}
	if primaryIdentity.GetEmail() == "" || (!primaryIdentity.IsEmailVerified() && !mailerAutoconfirm) {
		// the promoted email was neither verified by the IdP nor covered by
		// the project's autoconfirm policy, so it can't remain confirmed
		u.EmailConfirmedAt = nil
		if terr := tx.UpdateOnly(u, "email_confirmed_at"); terr != nil {
			return terr
		}
		if terr := u.UpdateUserMetaData(tx, map[string]any{
			"email_verified": false,
		}); terr != nil {
			return terr
		}
	}
	return nil
}

// ClearAllPendingTokens revokes all outstanding confirmation, recovery,
// email change, phone change and reauthentication tokens issued for the
// user, together with their one-time token rows.
func (u *User) ClearAllPendingTokens(tx *storage.Connection) error {
	u.ConfirmationToken = ""
	u.ConfirmationSentAt = nil
	u.RecoveryToken = ""
	u.RecoverySentAt = nil
	u.EmailChange = ""
	u.EmailChangeTokenCurrent = ""
	u.EmailChangeTokenNew = ""
	u.EmailChangeSentAt = nil
	u.EmailChangeConfirmStatus = 0
	u.PhoneChange = ""
	u.PhoneChangeToken = ""
	u.PhoneChangeSentAt = nil
	u.ReauthenticationToken = ""
	u.ReauthenticationSentAt = nil
	if terr := tx.UpdateOnly(
		u,
		"confirmation_token",
		"confirmation_sent_at",
		"recovery_token",
		"recovery_sent_at",
		"email_change",
		"email_change_token_current",
		"email_change_token_new",
		"email_change_sent_at",
		"email_change_confirm_status",
		"phone_change",
		"phone_change_token",
		"phone_change_sent_at",
		"reauthentication_token",
		"reauthentication_sent_at",
	); terr != nil {
		return terr
	}
	return ClearAllOneTimeTokensForUser(tx, u.ID)
}

// SetEmail sets the user's email
func (u *User) SetEmail(tx *storage.Connection, email string) error {
	u.Email = storage.NullString(email)
	return tx.UpdateOnly(u, "email")
}

// SetPhone sets the user's phone
func (u *User) SetPhone(tx *storage.Connection, phone string) error {
	u.Phone = storage.NullString(phone)
	return tx.UpdateOnly(u, "phone")
}

func (u *User) SetPassword(ctx context.Context, password string, encrypt bool, encryptionKeyID, encryptionKey string) error {
	if password == "" {
		u.EncryptedPassword = nil
		return nil
	}

	pw, err := crypto.GenerateFromPassword(ctx, password)
	if err != nil {
		return err
	}

	u.EncryptedPassword = &pw
	if encrypt {
		es, err := crypto.NewEncryptedString(u.ID.String(), []byte(pw), encryptionKeyID, encryptionKey)
		if err != nil {
			return err
		}

		encryptedPassword := es.String()
		u.EncryptedPassword = &encryptedPassword
	}

	return nil
}

// UpdatePassword updates the user's password. Use SetPassword outside of a transaction first!
func (u *User) UpdatePassword(tx *storage.Connection, sessionID *uuid.UUID) error {
	// These need to be reset because password change may mean the user no longer trusts the actions performed by the previous password.
	u.ConfirmationToken = ""
	u.ConfirmationSentAt = nil
	u.RecoveryToken = ""
	u.RecoverySentAt = nil
	u.EmailChangeTokenCurrent = ""
	u.EmailChangeTokenNew = ""
	u.EmailChangeSentAt = nil
	u.PhoneChangeToken = ""
	u.PhoneChangeSentAt = nil
	u.ReauthenticationToken = ""
	u.ReauthenticationSentAt = nil

	if err := tx.UpdateOnly(u, "encrypted_password", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_current", "email_change_token_new", "email_change_sent_at", "phone_change_token", "phone_change_sent_at", "reauthentication_token", "reauthentication_sent_at"); err != nil {
		return err
	}

	if err := ClearAllOneTimeTokensForUser(tx, u.ID); err != nil {
		return err
	}

	if sessionID == nil {
		// log out user from all sessions to ensure reauthentication after password change
		return Logout(tx, u.ID)
	} else {
		// log out user from all other sessions to ensure reauthentication after password change
		return LogoutAllExceptMe(tx, *sessionID, u.ID)
	}
}

// Authenticate a user from a password
func (u *User) Authenticate(ctx context.Context, tx *storage.Connection, password string, decryptionKeys map[string]string, encrypt bool, encryptionKeyID string) (bool, bool, error) {
	if u.EncryptedPassword == nil {
		return false, false, nil
	}

	hash := *u.EncryptedPassword

	if hash == "" {
		return false, false, nil
	}

	es := crypto.ParseEncryptedString(hash)
	if es != nil {
		h, err := es.Decrypt(u.ID.String(), decryptionKeys)
		if err != nil {
			return false, false, err
		}

		hash = string(h)
	}

	compareErr := crypto.CompareHashAndPassword(ctx, hash, password)

	if !strings.HasPrefix(hash, crypto.Argon2Prefix) && !strings.HasPrefix(hash, crypto.FirebaseScryptPrefix) {
		// check if cost exceeds default cost or is too low
		cost, err := bcrypt.Cost([]byte(hash))
		if err != nil {
			return compareErr == nil, false, err
		}

		if cost > bcrypt.DefaultCost || cost == bcrypt.MinCost {
			// don't bother with encrypting the password in Authenticate
			// since it's handled separately
			if err := u.SetPassword(ctx, password, false, "", ""); err != nil {
				return compareErr == nil, false, err
			}
		}
	}

	return compareErr == nil, encrypt && (es == nil || es.ShouldReEncrypt(encryptionKeyID)), nil
}

// ConfirmReauthentication resets the reauthentication token
func (u *User) ConfirmReauthentication(tx *storage.Connection) error {
	u.ReauthenticationToken = ""
	if err := tx.UpdateOnly(u, "reauthentication_token"); err != nil {
		return err
	}

	if err := ClearAllOneTimeTokensForUser(tx, u.ID); err != nil {
		return err
	}

	return nil
}

// Confirm resets the confimation token and sets the confirm timestamp
func (u *User) Confirm(tx *storage.Connection) error {
	u.ConfirmationToken = ""
	now := time.Now()
	u.EmailConfirmedAt = &now

	if err := tx.UpdateOnly(u, "confirmation_token", "email_confirmed_at"); err != nil {
		return err
	}

	if err := u.UpdateUserMetaData(tx, map[string]interface{}{
		"email_verified": true,
	}); err != nil {
		return err
	}

	if err := ClearAllOneTimeTokensForUser(tx, u.ID); err != nil {
		return err
	}

	return nil
}

// ConfirmPhone resets the confimation token and sets the confirm timestamp
func (u *User) ConfirmPhone(tx *storage.Connection) error {
	u.ConfirmationToken = ""
	now := time.Now()
	u.PhoneConfirmedAt = &now
	if err := tx.UpdateOnly(u, "confirmation_token", "phone_confirmed_at"); err != nil {
		return err
	}

	return ClearAllOneTimeTokensForUser(tx, u.ID)
}

// UpdateLastSignInAt update field last_sign_in_at for user according to specified field
func (u *User) UpdateLastSignInAt(tx *storage.Connection) error {
	return tx.UpdateOnly(u, "last_sign_in_at")
}

// ConfirmEmailChange confirm the change of email for a user
func (u *User) ConfirmEmailChange(tx *storage.Connection, status int) error {
	email := u.EmailChange

	u.Email = storage.NullString(email)
	u.EmailChange = ""
	u.EmailChangeTokenCurrent = ""
	u.EmailChangeTokenNew = ""
	u.EmailChangeConfirmStatus = status

	if err := tx.UpdateOnly(
		u,
		"email",
		"email_change",
		"email_change_token_current",
		"email_change_token_new",
		"email_change_confirm_status",
	); err != nil {
		return err
	}

	if err := ClearAllOneTimeTokensForUser(tx, u.ID); err != nil {
		return err
	}

	if !u.IsConfirmed() {
		if err := u.Confirm(tx); err != nil {
			return err
		}
	}

	identity, err := FindIdentityByIdAndProvider(tx, u.ID.String(), "email")
	if err != nil {
		if IsNotFoundError(err) {
			// no email identity, not an error
			return nil
		}
		return err
	}

	if _, ok := identity.IdentityData["email"]; ok {
		identity.IdentityData["email"] = email
		if err := tx.UpdateOnly(identity, "identity_data"); err != nil {
			return err
		}
	}

	return nil
}

// ConfirmPhoneChange confirms the change of phone for a user
func (u *User) ConfirmPhoneChange(tx *storage.Connection) error {
	now := time.Now()
	phone := u.PhoneChange

	u.Phone = storage.NullString(phone)
	u.PhoneChange = ""
	u.PhoneChangeToken = ""
	u.PhoneConfirmedAt = &now

	if err := tx.UpdateOnly(
		u,
		"phone",
		"phone_change",
		"phone_change_token",
		"phone_confirmed_at",
	); err != nil {
		return err
	}

	if err := ClearAllOneTimeTokensForUser(tx, u.ID); err != nil {
		return err
	}

	identity, err := FindIdentityByIdAndProvider(tx, u.ID.String(), "phone")
	if err != nil {
		if IsNotFoundError(err) {
			// no phone identity, not an error
			return nil
		}

		return err
	}

	if _, ok := identity.IdentityData["phone"]; ok {
		identity.IdentityData["phone"] = phone
	}

	if err := tx.UpdateOnly(identity, "identity_data"); err != nil {
		return err
	}

	return nil
}

// Recover resets the recovery token
func (u *User) Recover(tx *storage.Connection) error {
	u.RecoveryToken = ""
	if err := tx.UpdateOnly(u, "recovery_token"); err != nil {
		return err
	}

	return ClearAllOneTimeTokensForUser(tx, u.ID)
}

// HighestPossibleAAL returns the AAL level that this user can obtain. Derived
// from the number of verified MFA factors associated with the user object.
func (u *User) HighestPossibleAAL() AuthenticatorAssuranceLevel {
	for _, factor := range u.Factors {
		if factor.Status == FactorStateVerified.String() {
			return AAL2
		}
	}

	return AAL1
}

// CountOtherUsers counts how many other users exist besides the one provided
func CountOtherUsers(tx *storage.Connection, id uuid.UUID) (int, error) {
	userCount, err := tx.Q().Where("instance_id = ? and id != ?", uuid.Nil, id).Count(&User{})
	return userCount, errors.Wrap(err, "error finding registered users")
}

func findUser(tx *storage.Connection, query string, args ...interface{}) (*User, error) {
	obj := &User{}
	if err := tx.Eager().Q().Where(query, args...).First(obj); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, UserNotFoundError{}
		}
		return nil, errors.Wrap(err, "error finding user")
	}

	return obj, nil
}

// FindUserByEmailAndAudience finds a user with the matching email and audience.
func FindUserByEmailAndAudience(tx *storage.Connection, email, aud string) (*User, error) {
	return findUser(tx, "instance_id = ? and LOWER(email) = ? and aud = ? and is_sso_user = false", uuid.Nil, strings.ToLower(email), aud)
}

// FindUserByPhoneAndAudience finds a user with the matching email and audience.
func FindUserByPhoneAndAudience(tx *storage.Connection, phone, aud string) (*User, error) {
	return findUser(tx, "instance_id = ? and phone = ? and aud = ? and is_sso_user = false", uuid.Nil, phone, aud)
}

// FindUserByID finds a user matching the provided ID.
func FindUserByID(tx *storage.Connection, id uuid.UUID) (*User, error) {
	return findUser(tx, "instance_id = ? and id = ?", uuid.Nil, id)
}

// FindUserWithRefreshToken finds a user from the provided refresh token. If
// forUpdate is set to true, then the SELECT statement used by the query has
// the form SELECT ... FOR UPDATE SKIP LOCKED. This means that a FOR UPDATE
// lock will only be acquired if there's no other lock. In case there is a
// lock, a IsNotFound(err) error will be returned.
//
// Second value returned is either *models.RefreshToken or *crypto.RefreshToken.
func FindUserWithRefreshToken(tx *storage.Connection, dbEncryption conf.DatabaseEncryptionConfiguration, token string, forUpdate bool) (*User, any, *Session, error) {
	if len(token) < 12 {
		// not a valid refresh token so don't bother looking it up in the database
		return nil, nil, nil, SessionNotFoundError{}
	}

	if len(token) == 12 {
		return findUserWithLegacyRefreshToken(tx, token, forUpdate)
	}

	return findUserWithRefreshToken(tx, dbEncryption, token, forUpdate)
}

func findUserWithRefreshToken(tx *storage.Connection, dbEncryption conf.DatabaseEncryptionConfiguration, token string, forUpdate bool) (*User, *crypto.RefreshToken, *Session, error) {
	refreshToken, err := crypto.ParseRefreshToken(token)
	if err != nil {
		// refresh token is not valid
		return nil, nil, nil, SessionNotFoundError{}
	}

	session, err := FindSessionByID(tx, refreshToken.SessionID, forUpdate)
	if err != nil {
		return nil, nil, nil, err
	}

	if session.RefreshTokenHmacKey == nil || session.RefreshTokenCounter == nil {
		// if the session is not set up to support these encoded refresh tokens it's as if it doesn't exist
		// meaning someone is hand-crafting tokens for uuids that exist
		return nil, nil, nil, SessionNotFoundError{}
	}

	key, shouldReEncrypt, err := session.GetRefreshTokenHmacKey(dbEncryption)
	if err != nil {
		return nil, nil, nil, err
	}

	if !refreshToken.CheckSignature(key) {
		// refresh token signature is not valid for this session
		return nil, nil, nil, SessionNotFoundError{}
	}

	if shouldReEncrypt && forUpdate {
		err := session.ReEncryptRefreshTokenHmacKey(tx, dbEncryption)
		if err != nil {
			return nil, nil, nil, err
		}
	}

	user, err := FindUserByID(tx, session.UserID)
	if err != nil {
		return nil, nil, nil, err
	}

	return user, refreshToken, session, nil
}

func findUserWithLegacyRefreshToken(tx *storage.Connection, token string, forUpdate bool) (*User, any, *Session, error) {
	refreshToken := &RefreshToken{}

	if forUpdate {
		// pop does not provide us with a way to execute FOR UPDATE
		// queries which lock the rows affected by the query from
		// being accessed by any other transaction that also uses FOR
		// UPDATE
		if err := tx.RawQuery(fmt.Sprintf("SELECT * FROM %q WHERE token = ? LIMIT 1 FOR UPDATE SKIP LOCKED;", refreshToken.TableName()), token).First(refreshToken); err != nil {
			if errors.Cause(err) == sql.ErrNoRows {
				return nil, nil, nil, RefreshTokenNotFoundError{}
			}

			return nil, nil, nil, errors.Wrap(err, "error finding refresh token for update")
		}
	}

	// once the rows are locked (if forUpdate was true), we can query again using pop
	if err := tx.Where("token = ?", token).First(refreshToken); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil, nil, RefreshTokenNotFoundError{}
		}
		return nil, nil, nil, errors.Wrap(err, "error finding refresh token")
	}

	user, err := FindUserByID(tx, refreshToken.UserID)
	if err != nil {
		return nil, nil, nil, err
	}

	var session *Session

	if refreshToken.SessionId != nil {
		sessionId := *refreshToken.SessionId

		if sessionId != uuid.Nil {
			session, err = FindSessionByID(tx, sessionId, forUpdate)
			if err != nil {
				if forUpdate {
					return nil, nil, nil, err
				}

				if !IsNotFoundError(err) {
					return nil, nil, nil, errors.Wrap(err, "error finding session from refresh token")
				}

				// otherwise, there's no session for this refresh token
			}
		}
	}

	return user, refreshToken, session, nil
}

// FindUsersInAudience finds users with the matching audience.
func FindUsersInAudience(tx *storage.Connection, aud string, pageParams *Pagination, sortParams *SortParams, filter string) ([]*User, error) {
	users := []*User{}
	q := tx.Q().Where("instance_id = ? and aud = ?", uuid.Nil, aud)

	if filter != "" {
		lf := "%" + filter + "%"
		// we must specify the collation in order to get case insensitive search for the JSON column
		q = q.Where("(email LIKE ? OR raw_user_meta_data->>'full_name' ILIKE ?)", lf, lf)
	}

	if sortParams != nil && len(sortParams.Fields) > 0 {
		for _, field := range sortParams.Fields {
			q = q.Order(field.Name + " " + string(field.Dir))
		}
	}

	var err error
	if pageParams != nil {
		err = q.Paginate(int(pageParams.Page), int(pageParams.PerPage)).All(&users) // #nosec G115
		pageParams.Count = uint64(q.Paginator.TotalEntriesSize)                     // #nosec G115
	} else {
		err = q.All(&users)
	}

	return users, err
}

// FindUsersInAudienceKeyset finds users with the matching audience using
// keyset (cursor-based) pagination. Unlike FindUsersInAudience it issues no
// COUNT(*) and no OFFSET: it resumes from the cursor in p.After (if any) and
// fetches p.Limit+1 rows so the caller can detect whether another page exists.
//
// Ordering is (created_at, id) in the direction of the first sort field
// (default DESC). The id tiebreaker is required because created_at is not
// unique; without it a page boundary inside a same-timestamp group would skip
// or duplicate rows.
func FindUsersInAudienceKeyset(tx *storage.Connection, aud string, p *KeysetPagination, sortParams *SortParams, filter string) ([]*User, error) {
	users := []*User{}
	q := tx.Q().Where("instance_id = ? and aud = ?", uuid.Nil, aud)

	if filter != "" {
		lf := "%" + filter + "%"
		// we must specify the collation in order to get case insensitive search for the JSON column
		q = q.Where("(email LIKE ? OR raw_user_meta_data->>'full_name' ILIKE ?)", lf, lf)
	}

	dir := Descending
	if sortParams != nil && len(sortParams.Fields) > 0 {
		// Keyset pagination is only valid over created_at, which is exactly
		// what the cursor encodes; ordering by any other column would compare
		// rows against the cursor's timestamp value, which is meaningless.
		// Restricting the sort field is the caller's responsibility (e.g. the
		// admin handler's sort allowlist) — this guard makes misuse fail loudly
		// instead of silently mis-sorting.
		if sortParams.Fields[0].Name != CreatedAt {
			return nil, errors.Errorf("keyset pagination only supports ordering by %q", CreatedAt)
		}
		dir = sortParams.Fields[0].Dir
	}

	if p != nil && p.After != nil {
		// Row-value comparison, NOT the equivalent
		// (created_at <dir> ? OR (created_at = ? AND id <dir> ?)) form. Postgres
		// can push a row comparison's leading column into the btree as a range
		// bound (Index Cond: created_at <= ?) and seek straight to the cursor.
		// The OR form forces a full index scan + filter
		if dir == Ascending {
			q = q.Where("(created_at, id) > (?, ?)", p.After.CreatedAt, p.After.ID)
		} else {
			q = q.Where("(created_at, id) < (?, ?)", p.After.CreatedAt, p.After.ID)
		}
	}

	q = q.Order("created_at " + string(dir)).Order("id " + string(dir))

	if p != nil {
		limit := p.Limit
		// callers cap the page size well below this; the guard keeps the +1
		// below from overflowing if one ever doesn't
		if limit > math.MaxInt-1 {
			limit = math.MaxInt - 1
		}
		q = q.Limit(int(limit + 1)) // #nosec G115 -- bounded above
	}

	if err := q.All(&users); err != nil {
		return nil, err
	}

	return users, nil
}

// IsDuplicatedEmail returns whether a user exists with a matching email and
// audience importantly in the *default* identity linking domain (meaning SSO
// accounts and similar are not considered).
// If a currentUser is provided, we will need to filter out any identities that belong to the current user.
func IsDuplicatedEmail(tx *storage.Connection, email, aud string, currentUser *User, linkingDomains map[string]string) (*User, error) {
	var identities []Identity

	if err := tx.Eager().Q().Where("email = ?", strings.ToLower(email)).All(&identities); err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil
		}

		return nil, errors.Wrap(err, "unable to find identity by email for duplicates")
	}

	userIDs := make(map[string]uuid.UUID)
	for _, identity := range identities {
		if _, ok := userIDs[identity.UserID.String()]; !ok {
			if GetAccountLinkingDomain(identity.Provider, linkingDomains) == "default" {
				userIDs[identity.UserID.String()] = identity.UserID
			}
		}
	}

	var currentUserId uuid.UUID
	if currentUser != nil {
		currentUserId = currentUser.ID
	}

	for _, userID := range userIDs {
		if userID != currentUserId {
			user, err := FindUserByID(tx, userID)
			if err != nil {
				return nil, errors.Wrap(err, "unable to find user from email identity for duplicates")
			}
			if user.Aud == aud {
				return user, nil
			}
		}
	}

	// out of an abundance of caution, if nothing was found via the
	// identities table we also do a final check on the users table
	user, err := FindUserByEmailAndAudience(tx, email, aud)
	if err != nil && !IsNotFoundError(err) {
		return nil, errors.Wrap(err, "unable to find user email address for duplicates")
	}

	return user, nil
}

// IsDuplicatedPhone checks if the phone number already exists in the users table
func IsDuplicatedPhone(tx *storage.Connection, phone, aud string) (bool, error) {
	_, err := FindUserByPhoneAndAudience(tx, phone, aud)
	if err != nil {
		if IsNotFoundError(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// Ban a user for a given duration.
func (u *User) Ban(tx *storage.Connection, duration time.Duration) error {
	if duration == time.Duration(0) {
		u.BannedUntil = nil
	} else {
		t := time.Now().Add(duration)
		u.BannedUntil = &t
	}
	return tx.UpdateOnly(u, "banned_until")
}

// IsBanned checks if a user is banned or not
func (u *User) IsBanned() bool {
	if u.BannedUntil == nil {
		return false
	}
	return time.Now().Before(*u.BannedUntil)
}

func (u *User) HasMFAEnabled() bool {
	for _, factor := range u.Factors {
		if factor.IsVerified() {
			return true
		}
	}

	return false
}

func (u *User) UpdateBannedUntil(tx *storage.Connection) error {
	return tx.UpdateOnly(u, "banned_until")
}

// RemoveUnconfirmedIdentities removes potentially malicious unconfirmed identities from a user (if any)
func (u *User) RemoveUnconfirmedIdentities(tx *storage.Connection, identity *Identity) error {
	if identity.Provider != "email" && identity.Provider != "phone" {
		// user is unconfirmed so the password should be reset
		u.EncryptedPassword = nil
		if terr := tx.UpdateOnly(u, "encrypted_password"); terr != nil {
			return terr
		}
	}

	// user is unconfirmed so existing user_metadata should be overwritten
	// to use the current identity metadata
	u.UserMetaData = identity.IdentityData
	if terr := u.UpdateUserMetaData(tx, u.UserMetaData); terr != nil {
		return terr
	}

	// finally, remove all identities except the current identity being authenticated
	for i := range u.Identities {
		if u.Identities[i].ID != identity.ID {
			if terr := tx.Destroy(&u.Identities[i]); terr != nil {
				return terr
			}
		}
	}

	// user is unconfirmed so none of the providers associated to it are verified yet
	// only the current provider should be kept
	if terr := u.UpdateAppMetaDataProviders(tx); terr != nil {
		return terr
	}
	return nil
}

// SoftDeleteUser performs a soft deletion on the user by obfuscating and clearing certain fields
func (u *User) SoftDeleteUser(tx *storage.Connection) error {
	u.Email = storage.NullString(obfuscateEmail(u, u.GetEmail()))
	u.Phone = storage.NullString(obfuscatePhone(u, u.GetPhone()))
	u.EmailChange = obfuscateEmail(u, u.EmailChange)
	u.PhoneChange = obfuscatePhone(u, u.PhoneChange)
	u.EncryptedPassword = nil
	u.ConfirmationToken = ""
	u.RecoveryToken = ""
	u.EmailChangeTokenCurrent = ""
	u.EmailChangeTokenNew = ""
	u.PhoneChangeToken = ""

	// set deleted_at time
	now := time.Now()
	u.DeletedAt = &now

	if err := tx.UpdateOnly(
		u,
		"email",
		"phone",
		"encrypted_password",
		"email_change",
		"phone_change",
		"confirmation_token",
		"recovery_token",
		"email_change_token_current",
		"email_change_token_new",
		"phone_change_token",
		"deleted_at",
	); err != nil {
		return err
	}

	if err := ClearAllOneTimeTokensForUser(tx, u.ID); err != nil {
		return err
	}

	// set raw_user_meta_data to {}
	userMetaDataUpdates := map[string]interface{}{}
	for k := range u.UserMetaData {
		userMetaDataUpdates[k] = nil
	}

	if err := u.UpdateUserMetaData(tx, userMetaDataUpdates); err != nil {
		return err
	}

	// set raw_app_meta_data to {}
	appMetaDataUpdates := map[string]interface{}{}
	for k := range u.AppMetaData {
		appMetaDataUpdates[k] = nil
	}

	if err := u.UpdateAppMetaData(tx, appMetaDataUpdates); err != nil {
		return err
	}

	if err := Logout(tx, u.ID); err != nil {
		return err
	}

	return nil
}

// SoftDeleteUserIdentities performs a soft deletion on all identities associated to a user
func (u *User) SoftDeleteUserIdentities(tx *storage.Connection) error {
	identities, err := FindIdentitiesByUserID(tx, u.ID)
	if err != nil {
		return err
	}

	// set identity_data to {}
	for _, identity := range identities {
		identityDataUpdates := map[string]interface{}{}
		for k := range identity.IdentityData {
			identityDataUpdates[k] = nil
		}
		if err := identity.UpdateIdentityData(tx, identityDataUpdates); err != nil {
			return err
		}
		// updating the identity.ID has to happen last since the primary key is on (provider, id)
		// we use RawQuery here instead of UpdateOnly because UpdateOnly relies on the primary key of Identity
		if err := tx.RawQuery(
			"update "+
				(&pop.Model{Value: Identity{}}).TableName()+
				" set provider_id = ? where id = ?",
			obfuscateIdentityProviderId(identity),
			identity.ID,
		).Exec(); err != nil {
			return err
		}
	}
	return nil
}

func (u *User) FindOwnedFactorByID(tx *storage.Connection, factorID uuid.UUID) (*Factor, error) {
	var factor Factor
	err := tx.Where("user_id = ? AND id = ?", u.ID, factorID).First(&factor)
	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, &FactorNotFoundError{}
		}
		return nil, err
	}
	return &factor, nil
}

func (user *User) WebAuthnID() []byte {
	return []byte(user.ID.String())
}

func (user *User) WebAuthnName() string {
	return user.Email.String()
}

func (user *User) WebAuthnDisplayName() string {
	return user.Email.String()
}

func (user *User) WebAuthnCredentials() []webauthn.Credential {
	var credentials []webauthn.Credential

	for _, factor := range user.Factors {
		if factor.IsVerified() && factor.FactorType == WebAuthn {
			credential := factor.WebAuthnCredential.Credential
			credentials = append(credentials, credential)
		}
	}

	return credentials
}

func obfuscateValue(id uuid.UUID, value string) string {
	hash := sha256.Sum256([]byte(id.String() + value))
	return base64.RawURLEncoding.EncodeToString(hash[:])
}

func obfuscateEmail(u *User, email string) string {
	return obfuscateValue(u.ID, email)
}

func obfuscatePhone(u *User, phone string) string {
	// Field converted from VARCHAR(15) to text
	return obfuscateValue(u.ID, phone)[:15]
}

func obfuscateIdentityProviderId(identity *Identity) string {
	return obfuscateValue(identity.UserID, identity.Provider+":"+identity.ProviderID)
}

// FindUserByPhoneChangeAndAudience finds a user with the matching phone change and audience.
func FindUserByPhoneChangeAndAudience(tx *storage.Connection, phone, aud string) (*User, error) {
	return findUser(tx, "instance_id = ? and phone_change = ? and aud = ? and is_sso_user = false", uuid.Nil, phone, aud)
}
