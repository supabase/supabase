package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

// The caller chooses the validity window, so this suite asserts only what this
// layer owns: the value survives the round trip, and a resend replaces it. The
// per-flow window choice is asserted in the api package.
type OneTimeTokenTestSuite struct {
	suite.Suite
	db     *storage.Connection
	config *conf.GlobalConfiguration
}

func TestOneTimeToken(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	ts := &OneTimeTokenTestSuite{
		db:     conn,
		config: globalConfig,
	}
	defer ts.db.Close()

	suite.Run(t, ts)
}

func (ts *OneTimeTokenTestSuite) SetupTest() {
	TruncateAll(ts.db)
}

func (ts *OneTimeTokenTestSuite) createUser() *User {
	u, err := NewUser("", "test@example.com", "password", ts.config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.db.Create(u), "Error saving new test user")
	return u
}

// seedToken starts from an empty table and returns the user who owns the row.
func (ts *OneTimeTokenTestSuite) seedToken(hash string, tokenType OneTimeTokenType) *User {
	TruncateAll(ts.db)
	u := ts.createUser()
	require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, u.GetEmail(), hash, tokenType, time.Minute, true))
	return u
}

func (ts *OneTimeTokenTestSuite) TestCreateOneTimeToken() {
	cases := map[string]time.Duration{
		"future window": 15 * time.Minute,
		// CreateOneTimeToken neither validates nor clamps the window.
		// The caller owns it. The api verify tests rely on this to build
		// expired tokens.
		"past window": -24 * time.Hour,
	}

	for name, validity := range cases {
		ts.Run(name, func() {
			TruncateAll(ts.db)
			u := ts.createUser()

			before := time.Now()
			require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, u.GetEmail(), name, ConfirmationToken, validity, true))
			after := time.Now()

			ott, err := FindOneTimeToken(ts.db, name, ConfirmationToken)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), ott.ExpiresAt)

			require.False(ts.T(), ott.ExpiresAt.Before(before.Add(validity)),
				"expires_at %s precedes the window opened at %s", ott.ExpiresAt, before.Add(validity))
			require.False(ts.T(), ott.ExpiresAt.After(after.Add(validity)),
				"expires_at %s follows the window closed at %s", ott.ExpiresAt, after.Add(validity))
		})
	}
}

func (ts *OneTimeTokenTestSuite) TestCreateOneTimeTokenResendReplacesWindow() {
	u := ts.createUser()

	require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, u.GetEmail(), "first-hash", ConfirmationToken, time.Minute, true))
	first, err := FindOneTimeToken(ts.db, "first-hash", ConfirmationToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), first.ExpiresAt)

	require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, u.GetEmail(), "second-hash", ConfirmationToken, time.Hour, true))

	_, err = FindOneTimeToken(ts.db, "first-hash", ConfirmationToken)
	require.True(ts.T(), IsNotFoundError(err), "resend must clear the previous token, got %v", err)

	second, err := FindOneTimeToken(ts.db, "second-hash", ConfirmationToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), second.ExpiresAt)
	require.True(ts.T(), second.ExpiresAt.After(*first.ExpiresAt),
		"resend must move expires_at forward, first=%s second=%s", first.ExpiresAt, second.ExpiresAt)
}

func (ts *OneTimeTokenTestSuite) TestCreateOneTimeTokenSkipsExpiresAtWhenDisabled() {
	u := ts.createUser()

	require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, u.GetEmail(), "no-expiry-hash", ConfirmationToken, 15*time.Minute, false))

	ott, err := FindOneTimeToken(ts.db, "no-expiry-hash", ConfirmationToken)
	require.NoError(ts.T(), err)
	require.Nil(ts.T(), ott.ExpiresAt, "expires_at must stay null while the write is disabled")
}

func (ts *OneTimeTokenTestSuite) TestFindOneTimeToken() {
	ts.Run("matches the exact hash only, not the pkce_ prefixed form", func() {
		ts.seedToken("pkce_hash", ConfirmationToken)

		ott, err := FindOneTimeToken(ts.db, "hash", ConfirmationToken)
		require.True(ts.T(), IsNotFoundError(err), "expected not found error, got %v", err)
		require.Nil(ts.T(), ott)
	})

	ts.Run("does not return a row of another token type", func() {
		ts.seedToken("hash", RecoveryToken)

		ott, err := FindOneTimeToken(ts.db, "hash", ConfirmationToken)
		require.True(ts.T(), IsNotFoundError(err), "expected not found error, got %v", err)
		require.Nil(ts.T(), ott)
	})

	ts.Run("matches either of two token types", func() {
		u := ts.seedToken("hash", RecoveryToken)

		// The row has the second type, so this also checks the argument order.
		ott, err := FindOneTimeToken(ts.db, "hash", ConfirmationToken, RecoveryToken)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), RecoveryToken, ott.TokenType)
		require.Equal(ts.T(), u.ID, ott.UserID)
	})
}

func (ts *OneTimeTokenTestSuite) TestFindOneTimeTokenWithPKCEFallback() {
	ts.Run("exact hash match", func() {
		u := ts.seedToken("hash", ConfirmationToken)

		ott, err := FindOneTimeTokenWithPKCEFallback(ts.db, "hash", ConfirmationToken)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), "hash", ott.TokenHash)
		require.Equal(ts.T(), u.ID, ott.UserID)
	})

	ts.Run("falls back to pkce_ prefixed hash", func() {
		u := ts.seedToken("pkce_hash", ConfirmationToken)

		ott, err := FindOneTimeTokenWithPKCEFallback(ts.db, "hash", ConfirmationToken)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), "pkce_hash", ott.TokenHash)
		require.Equal(ts.T(), u.ID, ott.UserID)
	})

	ts.Run("prefers exact match over pkce_ prefixed hash", func() {
		// (user_id, token_type) is unique, so the two candidates have to be
		// different types. Both types are passed so both are eligible.
		u := ts.seedToken("hash", ConfirmationToken)
		require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, u.GetEmail(), "pkce_hash", RecoveryToken, time.Minute, true))

		ott, err := FindOneTimeTokenWithPKCEFallback(ts.db, "hash", ConfirmationToken, RecoveryToken)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), "hash", ott.TokenHash)
		require.Equal(ts.T(), ConfirmationToken, ott.TokenType)
	})

	ts.Run("not found when neither hash exists", func() {
		TruncateAll(ts.db)
		ts.createUser()

		ott, err := FindOneTimeTokenWithPKCEFallback(ts.db, "missing", ConfirmationToken)
		require.True(ts.T(), IsNotFoundError(err), "expected not found error, got %v", err)
		require.Nil(ts.T(), ott)
	})

	ts.Run("token type filter applies to the pkce_ fallback", func() {
		ts.seedToken("pkce_hash", RecoveryToken)

		ott, err := FindOneTimeTokenWithPKCEFallback(ts.db, "hash", ConfirmationToken)
		require.True(ts.T(), IsNotFoundError(err), "expected not found error, got %v", err)
		require.Nil(ts.T(), ott)
	})
}

func (ts *OneTimeTokenTestSuite) TestFindOneTimeTokenByRelatesTo() {
	ts.Run("returns the row matching relates_to and token type", func() {
		TruncateAll(ts.db)
		u := ts.createUser()
		require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, "+15551234567", "hash", PhoneChangeToken, time.Minute, true))

		ott, err := FindOneTimeTokenByRelatesTo(ts.db, "+15551234567", PhoneChangeToken)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), "hash", ott.TokenHash)
		require.Equal(ts.T(), u.ID, ott.UserID)
		require.Equal(ts.T(), PhoneChangeToken, ott.TokenType)
	})

	ts.Run("lowercases relates_to before matching", func() {
		TruncateAll(ts.db)
		u := ts.createUser()
		require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, "User@Example.com", "hash", ConfirmationToken, time.Minute, true))

		ott, err := FindOneTimeTokenByRelatesTo(ts.db, "USER@EXAMPLE.COM", ConfirmationToken)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), "user@example.com", ott.RelatesTo)
		require.Equal(ts.T(), u.ID, ott.UserID)
	})

	ts.Run("does not leak across token types", func() {
		TruncateAll(ts.db)
		u := ts.createUser()
		require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, "+15551234567", "hash", PhoneChangeToken, time.Minute, true))

		ott, err := FindOneTimeTokenByRelatesTo(ts.db, "+15551234567", ConfirmationToken)
		require.True(ts.T(), IsNotFoundError(err), "expected not found error, got %v", err)
		require.Nil(ts.T(), ott)
	})

	ts.Run("not found when no row has the relates_to value", func() {
		TruncateAll(ts.db)
		u := ts.createUser()
		require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, "+15551234567", "hash", PhoneChangeToken, time.Minute, true))

		ott, err := FindOneTimeTokenByRelatesTo(ts.db, "+15559999999", PhoneChangeToken)
		require.True(ts.T(), IsNotFoundError(err), "expected not found error, got %v", err)
		require.Nil(ts.T(), ott)
	})

	ts.Run("returns the newest row when two users share the value", func() {
		TruncateAll(ts.db)
		first := ts.createUser()

		second, err := NewUser("", "other@example.com", "password", ts.config.JWT.Aud, nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(second))

		require.NoError(ts.T(), CreateOneTimeToken(ts.db, first.ID, "+15551234567", "first-hash", PhoneChangeToken, time.Minute, true))
		require.NoError(ts.T(), CreateOneTimeToken(ts.db, second.ID, "+15551234567", "second-hash", PhoneChangeToken, time.Minute, true))

		ott, err := FindOneTimeTokenByRelatesTo(ts.db, "+15551234567", PhoneChangeToken)
		require.NoError(ts.T(), err)
		require.Equal(ts.T(), "second-hash", ott.TokenHash)
		require.Equal(ts.T(), second.ID, ott.UserID)
	})
}
