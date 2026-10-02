package models

import (
	"testing"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"

	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type WebAuthnChallengeTestSuite struct {
	suite.Suite
	db   *storage.Connection
	user *User
}

func TestWebAuthnChallenge(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)
	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)
	ts := &WebAuthnChallengeTestSuite{
		db: conn,
	}
	defer ts.db.Close()
	suite.Run(t, ts)
}

func (ts *WebAuthnChallengeTestSuite) SetupTest() {
	TruncateAll(ts.db)
	user, err := NewUser("", "challenge-test@example.com", "secret", "test", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))
	ts.user = user
}

func (ts *WebAuthnChallengeTestSuite) TestFindByID() {
	sessionData := &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{
			Challenge: "test-challenge",
			UserID:    []byte("test-user"),
		},
	}
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeRegistration, sessionData, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	found, err := FindWebAuthnChallengeByID(ts.db, challenge.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), challenge.ID, found.ID)
	require.Equal(ts.T(), WebAuthnChallengeTypeRegistration, found.ChallengeType)
}

func (ts *WebAuthnChallengeTestSuite) TestFindByIDNotFound() {
	_, err := FindWebAuthnChallengeByID(ts.db, uuid.Must(uuid.NewV4()))
	require.ErrorAs(ts.T(), err, &WebAuthnChallengeNotFoundError{})
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *WebAuthnChallengeTestSuite) TestIsExpiredFuture() {
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeAuthentication, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "c"},
	}, time.Now().Add(5*time.Minute))
	require.False(ts.T(), challenge.IsExpired())
}

func (ts *WebAuthnChallengeTestSuite) TestIsExpiredPast() {
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeAuthentication, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "c"},
	}, time.Now().Add(-1*time.Minute))
	require.True(ts.T(), challenge.IsExpired())
}

func (ts *WebAuthnChallengeTestSuite) TestDelete() {
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeRegistration, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "c"},
	}, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	require.NoError(ts.T(), challenge.Delete(ts.db))

	_, err := FindWebAuthnChallengeByID(ts.db, challenge.ID)
	require.ErrorAs(ts.T(), err, &WebAuthnChallengeNotFoundError{})
}

func (ts *WebAuthnChallengeTestSuite) TestNullableUserID() {
	// Discoverable flow — no user ID
	challenge := NewWebAuthnChallenge(nil, WebAuthnChallengeTypeSignup, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "discoverable"},
	}, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	found, err := FindWebAuthnChallengeByID(ts.db, challenge.ID)
	require.NoError(ts.T(), err)
	require.Nil(ts.T(), found.UserID)
}

func (ts *WebAuthnChallengeTestSuite) TestConsumeByID() {
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeRegistration, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "consume-me"},
	}, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	// First consume with matching type and user succeeds
	consumed, err := ConsumeWebAuthnChallengeByID(ts.db, challenge.ID, WebAuthnChallengeTypeRegistration, &ts.user.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), challenge.ID, consumed.ID)
	require.Equal(ts.T(), "consume-me", consumed.SessionData.Challenge)

	// Second consume returns not-found (row already deleted)
	_, err = ConsumeWebAuthnChallengeByID(ts.db, challenge.ID, WebAuthnChallengeTypeRegistration, &ts.user.ID)
	require.ErrorAs(ts.T(), err, &WebAuthnChallengeNotFoundError{})
}

func (ts *WebAuthnChallengeTestSuite) TestConsumeByIDWrongType() {
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeRegistration, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "type-mismatch"},
	}, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	// Consume with wrong type returns not-found without deleting the row
	_, err := ConsumeWebAuthnChallengeByID(ts.db, challenge.ID, WebAuthnChallengeTypeAuthentication, &ts.user.ID)
	require.ErrorAs(ts.T(), err, &WebAuthnChallengeNotFoundError{})

	// The row still exists
	found, err := FindWebAuthnChallengeByID(ts.db, challenge.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), challenge.ID, found.ID)
}

func (ts *WebAuthnChallengeTestSuite) TestConsumeByIDWrongUser() {
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeRegistration, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "user-mismatch"},
	}, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	// Consume with wrong user_id returns not-found without deleting the row
	otherID := uuid.Must(uuid.NewV4())
	_, err := ConsumeWebAuthnChallengeByID(ts.db, challenge.ID, WebAuthnChallengeTypeRegistration, &otherID)
	require.ErrorAs(ts.T(), err, &WebAuthnChallengeNotFoundError{})

	// The row still exists
	found, err := FindWebAuthnChallengeByID(ts.db, challenge.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), challenge.ID, found.ID)
}

func (ts *WebAuthnChallengeTestSuite) TestConsumeByIDNilUser() {
	// Discoverable flow — no user_id
	challenge := NewWebAuthnChallenge(nil, WebAuthnChallengeTypeAuthentication, &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{Challenge: "discoverable"},
	}, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	// Consume with nil userID and matching type succeeds
	consumed, err := ConsumeWebAuthnChallengeByID(ts.db, challenge.ID, WebAuthnChallengeTypeAuthentication, nil)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), challenge.ID, consumed.ID)
}

func (ts *WebAuthnChallengeTestSuite) TestConsumeByIDNotFound() {
	_, err := ConsumeWebAuthnChallengeByID(ts.db, uuid.Must(uuid.NewV4()), WebAuthnChallengeTypeRegistration, nil)
	require.ErrorAs(ts.T(), err, &WebAuthnChallengeNotFoundError{})
}

func (ts *WebAuthnChallengeTestSuite) TestSessionDataRoundTrip() {
	sessionData := &WebAuthnSessionData{
		SessionData: &webauthn.SessionData{
			Challenge:            "round-trip-challenge",
			UserID:               []byte("round-trip-user"),
			AllowedCredentialIDs: [][]byte{[]byte("cred1"), []byte("cred2")},
			UserVerification:     "required",
		},
	}
	challenge := NewWebAuthnChallenge(&ts.user.ID, WebAuthnChallengeTypeAuthentication, sessionData, time.Now().Add(5*time.Minute))
	require.NoError(ts.T(), ts.db.Create(challenge))

	found, err := FindWebAuthnChallengeByID(ts.db, challenge.ID)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), found.SessionData)
	require.NotNil(ts.T(), found.SessionData.SessionData)
	require.Equal(ts.T(), "round-trip-challenge", found.SessionData.Challenge)
	require.Equal(ts.T(), []byte("round-trip-user"), found.SessionData.UserID)
	require.Len(ts.T(), found.SessionData.AllowedCredentialIDs, 2)
}
