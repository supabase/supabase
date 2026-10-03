package models

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type RefreshTokenTestSuite struct {
	suite.Suite
	db     *storage.Connection
	config *conf.GlobalConfiguration
}

func (ts *RefreshTokenTestSuite) SetupTest() {
	TruncateAll(ts.db)
}

func TestRefreshToken(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	ts := &RefreshTokenTestSuite{
		db:     conn,
		config: globalConfig,
	}
	defer ts.db.Close()

	suite.Run(t, ts)
}

func (ts *RefreshTokenTestSuite) TestGrantAuthenticatedUser() {
	u := ts.createUser()
	r, err := GrantAuthenticatedUser(ts.db, u, GrantParams{})
	require.NoError(ts.T(), err)

	require.NotEmpty(ts.T(), r.Token)
	require.Equal(ts.T(), u.ID, r.UserID)
}

func (ts *RefreshTokenTestSuite) TestGrantRefreshTokenSwap() {
	u := ts.createUser()
	r, err := GrantAuthenticatedUser(ts.db, u, GrantParams{})
	require.NoError(ts.T(), err)

	s, err := GrantRefreshTokenSwap(ts.config.AuditLog, &http.Request{}, ts.db, u, r)
	require.NoError(ts.T(), err)

	_, anyNR, _, err := FindUserWithRefreshToken(ts.db, ts.config.Security.DBEncryption, r.Token, false)
	require.NoError(ts.T(), err)

	nr := anyNR.(*RefreshToken)

	require.Equal(ts.T(), r.ID, nr.ID)
	require.True(ts.T(), nr.Revoked, "expected old token to be revoked")

	require.NotEqual(ts.T(), r.ID, s.ID)
	require.Equal(ts.T(), u.ID, s.UserID)
}

func (ts *RefreshTokenTestSuite) TestFindTokenBySessionID() {
	u := ts.createUser()
	r, err := GrantAuthenticatedUser(ts.db, u, GrantParams{})
	require.NoError(ts.T(), err)

	found, err := FindTokenBySessionID(ts.db, r.SessionId)
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), r.ID, found.ID)
	require.Equal(ts.T(), r.Token, found.Token)
	require.False(ts.T(), found.Revoked)
}

func (ts *RefreshTokenTestSuite) TestFindTokenBySessionIDExcludesRevokedToken() {
	u := ts.createUser()
	r, err := GrantAuthenticatedUser(ts.db, u, GrantParams{})
	require.NoError(ts.T(), err)

	s, err := GrantRefreshTokenSwap(ts.config.AuditLog, &http.Request{}, ts.db, u, r)
	require.NoError(ts.T(), err)

	found, err := FindTokenBySessionID(ts.db, r.SessionId)
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), s.ID, found.ID, "expected the active (post-swap) token, not the revoked one")
	require.NotEqual(ts.T(), r.ID, found.ID)
	require.False(ts.T(), found.Revoked)
}

func (ts *RefreshTokenTestSuite) TestFindTokenBySessionIDNotFoundWhenAllRevoked() {
	u := ts.createUser()
	r, err := GrantAuthenticatedUser(ts.db, u, GrantParams{})
	require.NoError(ts.T(), err)

	r.Revoked = true
	require.NoError(ts.T(), ts.db.UpdateOnly(r, "revoked"))

	_, err = FindTokenBySessionID(ts.db, r.SessionId)
	require.Error(ts.T(), err)
	require.True(ts.T(), IsNotFoundError(err), "expected NotFoundError")
}

func (ts *RefreshTokenTestSuite) TestLogout() {
	u := ts.createUser()
	r, err := GrantAuthenticatedUser(ts.db, u, GrantParams{})
	require.NoError(ts.T(), err)

	var anyR any

	require.NoError(ts.T(), Logout(ts.db, u.ID))
	u, anyR, _, err = FindUserWithRefreshToken(ts.db, ts.config.Security.DBEncryption, r.Token, false)
	require.Errorf(ts.T(), err, "expected error when there are no refresh tokens to authenticate. user: %v token: %v", u, anyR)

	require.True(ts.T(), IsNotFoundError(err), "expected NotFoundError")
}

func (ts *RefreshTokenTestSuite) createUser() *User {
	return ts.createUserWithEmail("david@netlify.com")
}

func (ts *RefreshTokenTestSuite) createUserWithEmail(email string) *User {
	user, err := NewUser("", email, "secret", "test", nil)
	require.NoError(ts.T(), err)

	err = ts.db.Create(user)
	require.NoError(ts.T(), err)

	return user
}
