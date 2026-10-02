package models

import (
	"testing"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"

	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type WebAuthnCredentialTestSuite struct {
	suite.Suite
	db   *storage.Connection
	user *User
}

func TestWebAuthnCredential(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)
	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)
	ts := &WebAuthnCredentialTestSuite{
		db: conn,
	}
	defer ts.db.Close()
	suite.Run(t, ts)
}

func (ts *WebAuthnCredentialTestSuite) SetupTest() {
	TruncateAll(ts.db)
	user, err := NewUser("", "passkey-test@example.com", "secret", "test", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))
	ts.user = user
}

func (ts *WebAuthnCredentialTestSuite) createTestCredential(friendlyName string, backupEligible bool) *WebAuthnCredential {
	cred := &webauthn.Credential{
		ID:              []byte("test-credential-id-" + friendlyName),
		PublicKey:       []byte("test-public-key"),
		AttestationType: "none",
		Transport:       []protocol.AuthenticatorTransport{protocol.USB, protocol.Internal},
		Flags: webauthn.CredentialFlags{
			BackupEligible: backupEligible,
			BackupState:    backupEligible,
			UserPresent:    true,
			UserVerified:   true,
		},
		Authenticator: webauthn.Authenticator{
			AAGUID:    []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10},
			SignCount: 5,
		},
	}
	pc := NewWebAuthnCredential(ts.user.ID, cred, friendlyName)
	require.NoError(ts.T(), ts.db.Create(pc))
	return pc
}

func (ts *WebAuthnCredentialTestSuite) TestFindByID() {
	pc := ts.createTestCredential("test-key", false)

	found, err := FindWebAuthnCredentialByID(ts.db, pc.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), pc.ID, found.ID)
	require.Equal(ts.T(), pc.FriendlyName, found.FriendlyName)
}

func (ts *WebAuthnCredentialTestSuite) TestFindByIDNotFound() {
	_, err := FindWebAuthnCredentialByID(ts.db, uuid.Must(uuid.NewV4()))
	require.ErrorAs(ts.T(), err, &WebAuthnCredentialNotFoundError{})
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *WebAuthnCredentialTestSuite) TestFindByCredentialID() {
	pc := ts.createTestCredential("cred-id-test", false)

	found, err := FindWebAuthnCredentialByCredentialID(ts.db, pc.CredentialID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), pc.ID, found.ID)
}

func (ts *WebAuthnCredentialTestSuite) TestFindByCredentialIDNotFound() {
	_, err := FindWebAuthnCredentialByCredentialID(ts.db, []byte("nonexistent"))
	require.ErrorAs(ts.T(), err, &WebAuthnCredentialNotFoundError{})
}

func (ts *WebAuthnCredentialTestSuite) TestFindByUserID() {
	ts.createTestCredential("key1", false)
	ts.createTestCredential("key2", false)

	creds, err := FindWebAuthnCredentialsByUserID(ts.db, ts.user.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), creds, 2)
}

func (ts *WebAuthnCredentialTestSuite) TestCount() {
	ts.createTestCredential("count1", false)
	ts.createTestCredential("count2", false)

	count, err := CountWebAuthnCredentialsByUserID(ts.db, ts.user.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), 2, count)
}

func (ts *WebAuthnCredentialTestSuite) TestUpdateSignCount() {
	pc := ts.createTestCredential("sign-count-test", false)

	require.NoError(ts.T(), pc.UpdateSignCount(ts.db, 42))
	require.Equal(ts.T(), uint32(42), pc.SignCount)

	found, err := FindWebAuthnCredentialByID(ts.db, pc.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), uint32(42), found.SignCount)
}

func (ts *WebAuthnCredentialTestSuite) TestUpdateLastUsedAt() {
	pc := ts.createTestCredential("last-used-test", false)
	require.Nil(ts.T(), pc.LastUsedAt)

	require.NoError(ts.T(), pc.UpdateLastUsedAt(ts.db))
	require.NotNil(ts.T(), pc.LastUsedAt)
}

func (ts *WebAuthnCredentialTestSuite) TestUpdateFriendlyName() {
	pc := ts.createTestCredential("old-name", false)

	require.NoError(ts.T(), pc.UpdateFriendlyName(ts.db, "new-name"))
	require.Equal(ts.T(), "new-name", pc.FriendlyName)

	found, err := FindWebAuthnCredentialByID(ts.db, pc.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), "new-name", found.FriendlyName)
}

func (ts *WebAuthnCredentialTestSuite) TestDelete() {
	pc := ts.createTestCredential("delete-test", false)

	require.NoError(ts.T(), pc.Delete(ts.db))

	_, err := FindWebAuthnCredentialByID(ts.db, pc.ID)
	require.ErrorAs(ts.T(), err, &WebAuthnCredentialNotFoundError{})
}

func (ts *WebAuthnCredentialTestSuite) TestToWebAuthnCredentialRoundTrip() {
	cred := &webauthn.Credential{
		ID:              []byte("round-trip-cred"),
		PublicKey:       []byte("round-trip-pubkey"),
		AttestationType: "none",
		Transport:       []protocol.AuthenticatorTransport{protocol.USB},
		Flags: webauthn.CredentialFlags{
			BackupEligible: true,
			BackupState:    true,
			UserPresent:    true,
			UserVerified:   true,
		},
		Authenticator: webauthn.Authenticator{
			AAGUID:    []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10},
			SignCount: 10,
		},
	}

	pc := NewWebAuthnCredential(ts.user.ID, cred, "round-trip")
	result := pc.ToWebAuthnCredential()

	require.Equal(ts.T(), cred.ID, result.ID)
	require.Equal(ts.T(), cred.PublicKey, result.PublicKey)
	require.Equal(ts.T(), cred.AttestationType, result.AttestationType)
	require.Equal(ts.T(), cred.Transport, result.Transport)
	require.Equal(ts.T(), cred.Authenticator.SignCount, result.Authenticator.SignCount)
	require.Equal(ts.T(), cred.Flags.BackupEligible, result.Flags.BackupEligible)
	require.Equal(ts.T(), cred.Flags.BackupState, result.Flags.BackupState)
}

func (ts *WebAuthnCredentialTestSuite) TestBackupEligible() {
	pc := ts.createTestCredential("eligible", true)
	require.True(ts.T(), pc.BackupEligible)
}

func (ts *WebAuthnCredentialTestSuite) TestBackupNotEligible() {
	pc := ts.createTestCredential("not-eligible", false)
	require.False(ts.T(), pc.BackupEligible)
}
