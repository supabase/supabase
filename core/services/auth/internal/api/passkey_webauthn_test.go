package api

import (
	"testing"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

type PasskeyWebAuthnTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestPasskeyWebAuthn(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)
	ts := &PasskeyWebAuthnTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()
	suite.Run(t, ts)
}

func (ts *PasskeyWebAuthnTestSuite) TestGetPasskeyWebAuthn() {
	ts.API.config.WebAuthn = conf.WebAuthnConfiguration{
		RPID:          "example.com",
		RPDisplayName: "Example App",
		RPOrigins:     []string{"https://example.com"},
	}

	wn, err := ts.API.getPasskeyWebAuthn()
	ts.Require().NoError(err)
	ts.Require().NotNil(wn)
}

func (ts *PasskeyWebAuthnTestSuite) TestGetPasskeyWebAuthnMultipleOrigins() {
	ts.API.config.WebAuthn = conf.WebAuthnConfiguration{
		RPID:          "example.com",
		RPDisplayName: "Example App",
		RPOrigins:     []string{"https://example.com", "https://app.example.com"},
	}

	wn, err := ts.API.getPasskeyWebAuthn()
	ts.Require().NoError(err)
	ts.Require().NotNil(wn)
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnUserWithEmail() {
	userID := uuid.Must(uuid.NewV4())
	user := &models.User{
		ID: userID,
	}
	user.Email = "user@example.com"

	wu := newWebAuthnUser(user, nil)

	ts.Equal([]byte(userID.String()), wu.WebAuthnID())
	ts.Equal("user@example.com", wu.WebAuthnName())
	ts.Equal("user@example.com", wu.WebAuthnDisplayName())
	ts.Empty(wu.WebAuthnCredentials())
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnUserWithPhone() {
	userID := uuid.Must(uuid.NewV4())
	user := &models.User{
		ID: userID,
	}
	user.Phone = "+1234567890"

	wu := newWebAuthnUser(user, nil)

	ts.Equal("+1234567890", wu.WebAuthnName())
	ts.Equal("+1234567890", wu.WebAuthnDisplayName())
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnUserEmailTakesPrecedence() {
	user := &models.User{
		ID: uuid.Must(uuid.NewV4()),
	}
	user.Email = "user@example.com"
	user.Phone = "+1234567890"

	wu := newWebAuthnUser(user, nil)

	ts.Equal("user@example.com", wu.WebAuthnName())
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnDisplayNameFromMetadata() {
	user := &models.User{
		ID: uuid.Must(uuid.NewV4()),
		UserMetaData: map[string]any{
			"name": "John Doe",
		},
	}
	user.Email = "user@example.com"

	wu := newWebAuthnUser(user, nil)

	ts.Equal("user@example.com", wu.WebAuthnName())
	ts.Equal("John Doe", wu.WebAuthnDisplayName())
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnDisplayNameFallsBackToEmail() {
	user := &models.User{
		ID:           uuid.Must(uuid.NewV4()),
		UserMetaData: map[string]any{},
	}
	user.Email = "user@example.com"

	wu := newWebAuthnUser(user, nil)

	ts.Equal("user@example.com", wu.WebAuthnDisplayName())
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnDisplayNameSkipsEmptyMetadataName() {
	user := &models.User{
		ID: uuid.Must(uuid.NewV4()),
		UserMetaData: map[string]any{
			"name": "",
		},
	}
	user.Email = "user@example.com"

	wu := newWebAuthnUser(user, nil)

	ts.Equal("user@example.com", wu.WebAuthnDisplayName())
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnDisplayNameNilMetadata() {
	user := &models.User{
		ID: uuid.Must(uuid.NewV4()),
	}
	user.Phone = "+1234567890"

	wu := newWebAuthnUser(user, nil)

	ts.Equal("+1234567890", wu.WebAuthnDisplayName())
}

func (ts *PasskeyWebAuthnTestSuite) TestWebAuthnUserWithCredentials() {
	user := &models.User{
		ID: uuid.Must(uuid.NewV4()),
	}
	user.Email = "user@example.com"

	creds := []*models.WebAuthnCredential{
		{
			ID:              uuid.Must(uuid.NewV4()),
			UserID:          user.ID,
			CredentialID:    []byte("cred-1"),
			PublicKey:       []byte("pk-1"),
			AttestationType: "none",
			SignCount:       5,
			Transports:      models.WebAuthnTransports{protocol.USB},
			BackupEligible:  true,
			BackedUp:        false,
		},
		{
			ID:              uuid.Must(uuid.NewV4()),
			UserID:          user.ID,
			CredentialID:    []byte("cred-2"),
			PublicKey:       []byte("pk-2"),
			AttestationType: "none",
			SignCount:       0,
			Transports:      models.WebAuthnTransports{protocol.Internal},
			BackupEligible:  true,
			BackedUp:        true,
		},
	}

	wu := newWebAuthnUser(user, creds)

	webauthnCreds := wu.WebAuthnCredentials()
	ts.Require().Len(webauthnCreds, 2)

	ts.Equal([]byte("cred-1"), webauthnCreds[0].ID)
	ts.Equal([]byte("pk-1"), webauthnCreds[0].PublicKey)
	ts.Equal(uint32(5), webauthnCreds[0].Authenticator.SignCount)
	ts.True(webauthnCreds[0].Flags.BackupEligible)
	ts.False(webauthnCreds[0].Flags.BackupState)

	ts.Equal([]byte("cred-2"), webauthnCreds[1].ID)
	ts.True(webauthnCreds[1].Flags.BackupEligible)
	ts.True(webauthnCreds[1].Flags.BackupState)
}
