package models

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/storage"
)

// WebAuthnTransports is a JSON-serializable slice of authenticator transports.
type WebAuthnTransports []protocol.AuthenticatorTransport

func (t *WebAuthnTransports) Scan(value interface{}) error {
	if value == nil {
		*t = nil
		return nil
	}
	var data []byte
	switch v := value.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return fmt.Errorf("unsupported type for webauthn_transports: %T", value)
	}
	if len(data) == 0 {
		*t = nil
		return nil
	}
	return json.Unmarshal(data, t)
}

func (t WebAuthnTransports) Value() (driver.Value, error) {
	if t == nil {
		return "[]", nil
	}
	return json.Marshal(t)
}

// WebAuthnCredential maps to the webauthn_credentials table.
type WebAuthnCredential struct {
	ID              uuid.UUID          `json:"id" db:"id"`
	UserID          uuid.UUID          `json:"user_id" db:"user_id"`
	CredentialID    []byte             `json:"-" db:"credential_id"`
	PublicKey       []byte             `json:"-" db:"public_key"`
	AttestationType string             `json:"attestation_type" db:"attestation_type"`
	AAGUID          *uuid.UUID         `json:"aaguid,omitempty" db:"aaguid"`
	SignCount       uint32             `json:"sign_count" db:"sign_count"`
	Transports      WebAuthnTransports `json:"transports" db:"transports"`
	BackupEligible  bool               `json:"backup_eligible" db:"backup_eligible"`
	BackedUp        bool               `json:"backed_up" db:"backed_up"`
	FriendlyName    string             `json:"friendly_name" db:"friendly_name"`
	CreatedAt       time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at" db:"updated_at"`
	LastUsedAt      *time.Time         `json:"last_used_at,omitempty" db:"last_used_at"`
}

func (WebAuthnCredential) TableName() string {
	return "webauthn_credentials"
}

func NewWebAuthnCredential(userID uuid.UUID, cred *webauthn.Credential, friendlyName string) *WebAuthnCredential {
	id := uuid.Must(uuid.NewV4())

	pc := &WebAuthnCredential{
		ID:              id,
		UserID:          userID,
		CredentialID:    cred.ID,
		PublicKey:       cred.PublicKey,
		AttestationType: cred.AttestationType,
		SignCount:       cred.Authenticator.SignCount,
		Transports:      WebAuthnTransports(cred.Transport),
		BackupEligible:  cred.Flags.BackupEligible,
		BackedUp:        cred.Flags.BackupState,
		FriendlyName:    friendlyName,
	}

	if len(cred.Authenticator.AAGUID) > 0 {
		aaguidUUID, err := uuid.FromBytes(cred.Authenticator.AAGUID)
		if err == nil {
			pc.AAGUID = &aaguidUUID
		}
	}

	return pc
}

// ToWebAuthnCredential converts back to the library's Credential type for verification.
func (pc *WebAuthnCredential) ToWebAuthnCredential() webauthn.Credential {
	cred := webauthn.Credential{
		ID:              pc.CredentialID,
		PublicKey:       pc.PublicKey,
		AttestationType: pc.AttestationType,
		Transport:       []protocol.AuthenticatorTransport(pc.Transports),
		Flags: webauthn.CredentialFlags{
			BackupEligible: pc.BackupEligible,
			BackupState:    pc.BackedUp,
		},
		Authenticator: webauthn.Authenticator{
			SignCount: pc.SignCount,
		},
	}

	if pc.AAGUID != nil {
		cred.Authenticator.AAGUID = pc.AAGUID.Bytes()
	}

	return cred
}

func FindWebAuthnCredentialsByUserID(conn *storage.Connection, userID uuid.UUID) ([]*WebAuthnCredential, error) {
	var creds []*WebAuthnCredential
	if err := conn.Q().Where("user_id = ?", userID).Order("created_at asc").All(&creds); err != nil {
		return nil, err
	}
	return creds, nil
}

func FindWebAuthnCredentialByCredentialID(conn *storage.Connection, credentialID []byte) (*WebAuthnCredential, error) {
	var cred WebAuthnCredential
	err := conn.Q().Where("credential_id = ?", credentialID).First(&cred)
	if err != nil && errors.Cause(err) == sql.ErrNoRows {
		return nil, WebAuthnCredentialNotFoundError{}
	} else if err != nil {
		return nil, err
	}
	return &cred, nil
}

func FindWebAuthnCredentialByID(conn *storage.Connection, id uuid.UUID) (*WebAuthnCredential, error) {
	var cred WebAuthnCredential
	err := conn.Find(&cred, id)
	if err != nil && errors.Cause(err) == sql.ErrNoRows {
		return nil, WebAuthnCredentialNotFoundError{}
	} else if err != nil {
		return nil, err
	}
	return &cred, nil
}

func FindWebAuthnCredentialByIDAndUserID(conn *storage.Connection, id, userID uuid.UUID) (*WebAuthnCredential, error) {
	var cred WebAuthnCredential
	err := conn.Q().Where("id = ? AND user_id = ?", id, userID).First(&cred)
	if err != nil && errors.Cause(err) == sql.ErrNoRows {
		return nil, WebAuthnCredentialNotFoundError{}
	} else if err != nil {
		return nil, err
	}

	return &cred, nil
}

func CountWebAuthnCredentialsByUserID(conn *storage.Connection, userID uuid.UUID) (int, error) {
	count, err := conn.Q().Where("user_id = ?", userID).Count(&WebAuthnCredential{})
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (pc *WebAuthnCredential) UpdateSignCount(tx *storage.Connection, signCount uint32) error {
	pc.SignCount = signCount
	return tx.UpdateOnly(pc, "sign_count", "updated_at")
}

func (pc *WebAuthnCredential) UpdateLastUsedAt(tx *storage.Connection) error {
	now := time.Now()
	pc.LastUsedAt = &now
	return tx.UpdateOnly(pc, "last_used_at", "updated_at")
}

func (pc *WebAuthnCredential) UpdateLastUsedWithSignCount(tx *storage.Connection, signCount uint32) error {
	now := time.Now()
	pc.SignCount = signCount
	pc.LastUsedAt = &now
	return tx.UpdateOnly(pc, "sign_count", "last_used_at", "updated_at")
}

func (pc *WebAuthnCredential) UpdateFriendlyName(tx *storage.Connection, friendlyName string) error {
	pc.FriendlyName = friendlyName
	return tx.UpdateOnly(pc, "friendly_name", "updated_at")
}

func (pc *WebAuthnCredential) Delete(tx *storage.Connection) error {
	return tx.Destroy(pc)
}

func DeleteWebAuthnCredentialsByUserID(tx *storage.Connection, userID uuid.UUID) error {
	return tx.RawQuery("DELETE FROM "+(&WebAuthnCredential{}).TableName()+" WHERE user_id = ?", userID).Exec()
}
