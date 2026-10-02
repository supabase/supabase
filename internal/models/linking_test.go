package models

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

func TestGetAccountLinkingDomain(t *testing.T) {
	// provider names are matched exactly. A builtin provider (github) and a
	// custom provider (custom:google) can share the same domain; the "custom:"
	// prefix is part of the key.
	linkingDomains := map[string]string{
		"github":        "social",
		"custom:google": "social",
	}

	// SSO providers always get their own isolated domain (the provider id).
	require.Equal(t, "sso:abc", GetAccountLinkingDomain("sso:abc", linkingDomains))

	// Providers sharing a linking domain resolve to that shared domain.
	require.Equal(t, "social", GetAccountLinkingDomain("github", linkingDomains))
	require.Equal(t, "social", GetAccountLinkingDomain("custom:google", linkingDomains))

	// A bare name is not the same key as its "custom:"-prefixed form.
	require.Equal(t, "default", GetAccountLinkingDomain("custom:github", linkingDomains))

	// Providers without a linking domain fall back to the default email-linked pool.
	require.Equal(t, "default", GetAccountLinkingDomain("apple", linkingDomains))
	require.Equal(t, "default", GetAccountLinkingDomain("github", nil))
}

type AccountLinkingTestSuite struct {
	suite.Suite

	config *conf.GlobalConfiguration
	db     *storage.Connection
}

func (ts *AccountLinkingTestSuite) SetupTest() {
	TruncateAll(ts.db)
}

func TestAccountLinking(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	ts := &AccountLinkingTestSuite{
		config: globalConfig,
		db:     conn,
	}
	defer ts.db.Close()

	suite.Run(t, ts)
}

func (ts *AccountLinkingTestSuite) TestCreateAccountDecisionNoAccounts() {
	// when there are no accounts in the system -- conventional provider
	testEmail := provider.Email{
		Email:    "test@example.com",
		Verified: true,
		Primary:  true,
	}
	decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{testEmail}, ts.config.JWT.Aud, "provider", "abcdefgh")
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), decision.Decision, CreateAccount)

	// when there are no accounts in the system -- SSO provider
	decision, err = DetermineAccountLinking(ts.db, ts.config, []provider.Email{testEmail}, ts.config.JWT.Aud, "sso:f06f9e3d-ff92-4c47-a179-7acf1fda6387", "abcdefgh")
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), decision.Decision, CreateAccount)
}

func (ts *AccountLinkingTestSuite) TestCreateAccountDecisionWithAccounts() {
	userA, err := NewUser("", "test@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	identityA, err := NewIdentity(userA, "provider", map[string]interface{}{
		"sub":   userA.ID.String(),
		"email": "test@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identityA))

	userB, err := NewUser("", "test@samltest.id", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userB))

	ssoProvider := "sso:f06f9e3d-ff92-4c47-a179-7acf1fda6387"
	identityB, err := NewIdentity(userB, ssoProvider, map[string]interface{}{
		"sub":   userB.ID.String(),
		"email": "test@samltest.id",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identityB))

	// when the email doesn't exist in the system -- conventional provider
	decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
		{
			Email:    "other@example.com",
			Verified: true,
			Primary:  true,
		},
	}, ts.config.JWT.Aud, "provider", "abcdefgh")
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), decision.Decision, CreateAccount)
	require.Equal(ts.T(), decision.LinkingDomain, "default")

	// when looking for an email that doesn't exist in the SSO linking domain
	decision, err = DetermineAccountLinking(ts.db, ts.config, []provider.Email{
		{
			Email:    "other@samltest.id",
			Verified: true,
			Primary:  true,
		},
	}, ts.config.JWT.Aud, ssoProvider, "abcdefgh")
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), decision.Decision, CreateAccount)
	require.Equal(ts.T(), decision.LinkingDomain, ssoProvider)
}

func (ts *AccountLinkingTestSuite) TestAccountExists() {
	userA, err := NewUser("", "test@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	identityA, err := NewIdentity(userA, "provider", map[string]interface{}{
		"sub":   userA.ID.String(),
		"email": "test@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identityA))

	decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
		{
			Email:    "test@example.com",
			Verified: true,
			Primary:  true,
		},
	}, ts.config.JWT.Aud, "provider", userA.ID.String())
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), decision.Decision, AccountExists)
	require.Equal(ts.T(), decision.User.ID, userA.ID)
}

func (ts *AccountLinkingTestSuite) TestLinkingScenarios() {
	userA, err := NewUser("", "test@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	identityA, err := NewIdentity(userA, "provider", map[string]interface{}{
		"sub":   userA.ID.String(),
		"email": "test@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identityA))

	userB, err := NewUser("", "test@samltest.id", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userB))

	identityB, err := NewIdentity(userB, "sso:f06f9e3d-ff92-4c47-a179-7acf1fda6387", map[string]interface{}{
		"sub":   userB.ID.String(),
		"email": "test@samltest.id",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identityB))

	cases := []struct {
		desc     string
		email    provider.Email
		sub      string
		provider string
		decision AccountLinkingResult
	}{
		{
			// link decision because the below described identity is in the default linking domain but uses "other-provider" instead of "provder"
			desc: "same email address",
			email: provider.Email{
				Email:    "test@example.com",
				Verified: true,
				Primary:  true,
			},
			sub:      userA.ID.String(),
			provider: "other-provider",
			decision: AccountLinkingResult{
				Decision:      LinkAccount,
				User:          userA,
				LinkingDomain: "default",
				CandidateEmail: provider.Email{
					Email:    "test@example.com",
					Verified: true,
					Primary:  true,
				},
			},
		},
		{
			desc: "same email address in uppercase",
			email: provider.Email{
				Email:    "TEST@example.com",
				Verified: true,
				Primary:  true,
			},
			sub:      userA.ID.String(),
			provider: "other-provider",
			decision: AccountLinkingResult{
				Decision:      LinkAccount,
				User:          userA,
				LinkingDomain: "default",
				CandidateEmail: provider.Email{
					// expected email should be case insensitive
					Email:    "test@example.com",
					Verified: true,
					Primary:  true,
				},
			},
		},
		{
			desc: "no link decision because the SSO linking domain is scoped to the provider unique ID",
			email: provider.Email{
				Email:    "test@samltest.id",
				Verified: true,
				Primary:  true,
			},
			sub:      userB.ID.String(),
			provider: "sso:f06f9e3d-ff92-4c47-a179-7acf1fda6387",
			// decision: AccountExists,
			decision: AccountLinkingResult{
				Decision:      AccountExists,
				User:          userB,
				LinkingDomain: "sso:f06f9e3d-ff92-4c47-a179-7acf1fda6387",
				CandidateEmail: provider.Email{
					Email:    "test@samltest.id",
					Verified: true,
					Primary:  true,
				},
			},
		},
		{
			desc: "create account with empty email because email is unverified and user exists",
			email: provider.Email{
				Email:    "test@example.com",
				Verified: false,
				Primary:  true,
			},
			sub:      userA.ID.String(),
			provider: "other-provider",
			decision: AccountLinkingResult{
				Decision:      CreateAccount,
				LinkingDomain: "default",
				CandidateEmail: provider.Email{
					Email:    "",
					Verified: false,
					Primary:  true,
				},
			},
		},
		{
			desc: "create account because email is unverified and user doesn't exist",
			email: provider.Email{
				Email:    "other@example.com",
				Verified: false,
				Primary:  true,
			},
			sub:      "000000000",
			provider: "other-provider",
			decision: AccountLinkingResult{
				Decision:      CreateAccount,
				LinkingDomain: "default",
				CandidateEmail: provider.Email{
					Email:    "other@example.com",
					Verified: false,
					Primary:  true,
				},
			},
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{c.email}, ts.config.JWT.Aud, c.provider, c.sub)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), c.decision.Decision, decision.Decision)
			require.Equal(ts.T(), c.decision.LinkingDomain, decision.LinkingDomain)
			require.Equal(ts.T(), c.decision.CandidateEmail.Email, decision.CandidateEmail.Email)
			require.Equal(ts.T(), c.decision.CandidateEmail.Verified, decision.CandidateEmail.Verified)
			require.Equal(ts.T(), c.decision.CandidateEmail.Primary, decision.CandidateEmail.Primary)
		})
	}

}

func (ts *AccountLinkingTestSuite) TestSharedLinkingDomainLinking() {
	// a builtin provider (github) and a custom provider (custom:google) share the
	// "social" linking domain: they link to one another but stay isolated from
	// the default email-linked pool and from SSO. Mixing the two forms shows that
	// both a bare name and a colon-bearing "custom:" name are matched exactly.
	prevLinkingDomains := ts.config.Experimental.ProviderLinkingDomains
	ts.config.Experimental.ProviderLinkingDomains = map[string]string{
		"github":        "social",
		"custom:google": "social",
	}
	defer func() { ts.config.Experimental.ProviderLinkingDomains = prevLinkingDomains }()

	const sharedEmail = "shared@example.com"

	ts.Run("custom:google login links into existing github account in the same domain", func() {
		TruncateAll(ts.db)

		githubUser, err := NewUser("", sharedEmail, "", "authenticated", nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(githubUser))
		githubIdentity, err := NewIdentity(githubUser, "github", map[string]interface{}{
			"sub":   githubUser.ID.String(),
			"email": sharedEmail,
		})
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(githubIdentity))

		decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
			{Email: sharedEmail, Verified: true, Primary: true},
		}, ts.config.JWT.Aud, "custom:google", "google-sub")
		require.NoError(ts.T(), err)

		require.Equal(ts.T(), LinkAccount, decision.Decision)
		require.Equal(ts.T(), githubUser.ID, decision.User.ID)
		require.Equal(ts.T(), "social", decision.LinkingDomain)
	})

	ts.Run("google login does not link into a default email-only account", func() {
		TruncateAll(ts.db)

		emailUser, err := NewUser("", sharedEmail, "", "authenticated", nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(emailUser))
		emailIdentity, err := NewIdentity(emailUser, "email", map[string]interface{}{
			"sub":   emailUser.ID.String(),
			"email": sharedEmail,
		})
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(emailIdentity))

		decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
			{Email: sharedEmail, Verified: true, Primary: true},
		}, ts.config.JWT.Aud, "custom:google", "google-sub")
		require.NoError(ts.T(), err)

		// must create a brand new account in the "social" linking domain, never
		// link to the default email-linked user
		require.Equal(ts.T(), CreateAccount, decision.Decision)
		require.Equal(ts.T(), "social", decision.LinkingDomain)
	})

	ts.Run("google login does not link into an SSO account", func() {
		TruncateAll(ts.db)

		ssoProvider := "sso:f06f9e3d-ff92-4c47-a179-7acf1fda6387"
		ssoUser, err := NewUser("", sharedEmail, "", "authenticated", nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(ssoUser))
		ssoIdentity, err := NewIdentity(ssoUser, ssoProvider, map[string]interface{}{
			"sub":   ssoUser.ID.String(),
			"email": sharedEmail,
		})
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(ssoIdentity))

		decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
			{Email: sharedEmail, Verified: true, Primary: true},
		}, ts.config.JWT.Aud, "custom:google", "google-sub")
		require.NoError(ts.T(), err)

		require.Equal(ts.T(), CreateAccount, decision.Decision)
		require.Equal(ts.T(), "social", decision.LinkingDomain)
	})
}

func (ts *AccountLinkingTestSuite) TestOwnLinkingDomainLegacyBackfillUnchanged() {
	// Regression: a legacy deployment configured with
	// GOTRUE_EXPERIMENTAL_PROVIDERS_WITH_OWN_LINKING_DOMAIN="github" must behave
	// identically after the migration. ApplyDefaults backfills the deprecated
	// list into ProviderLinkingDomains as {github: github}.
	prevLinkingDomains := ts.config.Experimental.ProviderLinkingDomains
	prevLegacy := ts.config.Experimental.ProvidersWithOwnLinkingDomain
	ts.config.Experimental.ProviderLinkingDomains = nil
	ts.config.Experimental.ProvidersWithOwnLinkingDomain = []string{"github"}
	require.NoError(ts.T(), ts.config.ApplyDefaults())
	require.Equal(ts.T(), "github", ts.config.Experimental.ProviderLinkingDomains["github"])
	defer func() {
		ts.config.Experimental.ProviderLinkingDomains = prevLinkingDomains
		ts.config.Experimental.ProvidersWithOwnLinkingDomain = prevLegacy
	}()

	const githubEmail = "githubonly@example.com"

	ts.Run("github stays isolated from a default email-only account", func() {
		TruncateAll(ts.db)

		emailUser, err := NewUser("", githubEmail, "", "authenticated", nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(emailUser))
		emailIdentity, err := NewIdentity(emailUser, "email", map[string]interface{}{
			"sub":   emailUser.ID.String(),
			"email": githubEmail,
		})
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(emailIdentity))

		decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
			{Email: githubEmail, Verified: true, Primary: true},
		}, ts.config.JWT.Aud, "github", "github-sub")
		require.NoError(ts.T(), err)

		require.Equal(ts.T(), CreateAccount, decision.Decision)
		require.Equal(ts.T(), "github", decision.LinkingDomain)
	})

	ts.Run("github links into existing github account with the same email", func() {
		TruncateAll(ts.db)

		githubUser, err := NewUser("", githubEmail, "", "authenticated", nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(githubUser))
		githubIdentity, err := NewIdentity(githubUser, "github", map[string]interface{}{
			"sub":   githubUser.ID.String(),
			"email": githubEmail,
		})
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.db.Create(githubIdentity))

		decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
			{Email: githubEmail, Verified: true, Primary: true},
		}, ts.config.JWT.Aud, "github", "another-github-sub")
		require.NoError(ts.T(), err)

		require.Equal(ts.T(), LinkAccount, decision.Decision)
		require.Equal(ts.T(), githubUser.ID, decision.User.ID)
		require.Equal(ts.T(), "github", decision.LinkingDomain)
	})
}

func (ts *AccountLinkingTestSuite) TestMultipleAccounts() {
	userA, err := NewUser("", "test@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	identityA, err := NewIdentity(userA, "provider", map[string]interface{}{
		"sub":   userA.ID.String(),
		"email": "test@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identityA))

	userB, err := NewUser("", "test-b@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userB))
	identityB, err := NewIdentity(userB, "provider", map[string]interface{}{
		"sub":   userB.ID.String(),
		"email": "test@example.com", // intentionally same as userA
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identityB))

	// decision is multiple accounts because there are two distinct
	// identities in the same "default" linking domain with the same email
	// address pointing to two different user accounts
	decision, err := DetermineAccountLinking(ts.db, ts.config, []provider.Email{
		{
			Email:    "test@example.com",
			Verified: true,
			Primary:  true,
		},
	}, ts.config.JWT.Aud, "provider", "abcdefgh")
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), decision.Decision, MultipleAccounts)
}
