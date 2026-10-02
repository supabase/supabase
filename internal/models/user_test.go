package models

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
	"golang.org/x/crypto/bcrypt"
)

const modelsTestConfig = "../../hack/test.env"

func init() {
	crypto.PasswordHashCost = crypto.QuickHashCost
}

type UserTestSuite struct {
	suite.Suite
	db     *storage.Connection
	config *conf.GlobalConfiguration
}

func (ts *UserTestSuite) SetupTest() {
	TruncateAll(ts.db)
}

func TestUser(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	ts := &UserTestSuite{
		db:     conn,
		config: globalConfig,
	}
	defer ts.db.Close()

	suite.Run(t, ts)
}

func (ts *UserTestSuite) TestUpdateAppMetadata() {
	u, err := NewUser("", "", "", "", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), u.UpdateAppMetaData(ts.db, make(map[string]interface{})))

	require.NotNil(ts.T(), u.AppMetaData)

	require.NoError(ts.T(), u.UpdateAppMetaData(ts.db, map[string]interface{}{
		"foo": "bar",
	}))

	require.Equal(ts.T(), "bar", u.AppMetaData["foo"])
	require.NoError(ts.T(), u.UpdateAppMetaData(ts.db, map[string]interface{}{
		"foo": nil,
	}))
	require.Len(ts.T(), u.AppMetaData, 0)
	require.Equal(ts.T(), nil, u.AppMetaData["foo"])
}

func (ts *UserTestSuite) TestUpdateUserMetadata() {
	u, err := NewUser("", "", "", "", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), u.UpdateUserMetaData(ts.db, make(map[string]interface{})))

	require.NotNil(ts.T(), u.UserMetaData)

	require.NoError(ts.T(), u.UpdateUserMetaData(ts.db, map[string]interface{}{
		"foo": "bar",
	}))

	require.Equal(ts.T(), "bar", u.UserMetaData["foo"])
	require.NoError(ts.T(), u.UpdateUserMetaData(ts.db, map[string]interface{}{
		"foo": nil,
	}))
	require.Len(ts.T(), u.UserMetaData, 0)
	require.Equal(ts.T(), nil, u.UserMetaData["foo"])
}

func (ts *UserTestSuite) TestFindUserByConfirmationToken() {
	u := ts.createUser()
	tokenHash := "test_confirmation_token"
	require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, "relates_to not used", tokenHash, ConfirmationToken, ts.config.Mailer.OtpExpAsDuration(), true))

	n, err := FindUserByOneTimeToken(ts.db, tokenHash, ConfirmationToken)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), u.ID, n.ID)

	// the token type filters the lookup
	_, err = FindUserByOneTimeToken(ts.db, tokenHash, RecoveryToken)
	require.Error(ts.T(), err)
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *UserTestSuite) TestFindUserByEmailAndAudience() {
	u := ts.createUser()

	n, err := FindUserByEmailAndAudience(ts.db, u.GetEmail(), "test")
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), u.ID, n.ID)

	_, err = FindUserByEmailAndAudience(ts.db, u.GetEmail(), "invalid")
	require.EqualError(ts.T(), err, UserNotFoundError{}.Error())
}

func (ts *UserTestSuite) TestFindUsersInAudience() {
	u := ts.createUser()

	n, err := FindUsersInAudience(ts.db, u.Aud, nil, nil, "")
	require.NoError(ts.T(), err)
	require.Len(ts.T(), n, 1)

	p := Pagination{
		Page:    1,
		PerPage: 50,
	}
	n, err = FindUsersInAudience(ts.db, u.Aud, &p, nil, "")
	require.NoError(ts.T(), err)
	require.Len(ts.T(), n, 1)
	assert.Equal(ts.T(), uint64(1), p.Count)

	sp := &SortParams{
		Fields: []SortField{
			{Name: "created_at", Dir: Descending},
		},
	}
	n, err = FindUsersInAudience(ts.db, u.Aud, nil, sp, "")
	require.NoError(ts.T(), err)
	require.Len(ts.T(), n, 1)
}

// createUserAt inserts a user in the "test" audience with an exact created_at.
// pop sets created_at on insert, so we force it afterwards and reload to get
// the microsecond-truncated value Postgres actually stores.
func (ts *UserTestSuite) createUserAt(email string, createdAt time.Time) *User {
	user, err := NewUser("", email, "secret", "test", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))
	require.NoError(ts.T(), ts.db.RawQuery("UPDATE users SET created_at = ? WHERE id = ?", createdAt, user.ID).Exec())
	reloaded, err := FindUserByID(ts.db, user.ID)
	require.NoError(ts.T(), err)
	return reloaded
}

func (ts *UserTestSuite) TestFindUsersInAudienceKeyset() {
	base := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)

	ts.Run("first page fetches Limit+1 when more rows exist", func() {
		TruncateAll(ts.db)
		for i := 0; i < 5; i++ {
			ts.createUserAt(fmt.Sprintf("u%d@example.com", i), base.Add(time.Duration(i)*time.Minute))
		}

		p := &KeysetPagination{Limit: 2}
		users, err := FindUsersInAudienceKeyset(ts.db, "test", p, nil, "")
		require.NoError(ts.T(), err)
		// Limit+1 fetched so the caller can detect there is a next page.
		require.Len(ts.T(), users, 3)
		// default direction is DESC on created_at: newest first, non-increasing.
		for i := 1; i < len(users); i++ {
			require.False(ts.T(), users[i-1].CreatedAt.Before(users[i].CreatedAt),
				"rows must be ordered created_at DESC")
		}
	})

	ts.Run("tiebreaker walks same-created_at rows exactly once", func() {
		TruncateAll(ts.db)
		same := base
		want := map[string]bool{}
		for i := 0; i < 3; i++ {
			u := ts.createUserAt(fmt.Sprintf("tie%d@example.com", i), same)
			want[u.ID.String()] = true
		}

		seen := map[string]bool{}
		var after *KeysetCursor
		for page := 0; page < 10; page++ {
			p := &KeysetPagination{Limit: 1, After: after}
			users, err := FindUsersInAudienceKeyset(ts.db, "test", p, nil, "")
			require.NoError(ts.T(), err)
			if len(users) == 0 {
				break
			}

			hasMore := uint64(len(users)) > p.Limit
			rows := users
			if hasMore {
				rows = users[:p.Limit]
			}
			for _, u := range rows {
				require.False(ts.T(), seen[u.ID.String()], "row returned twice: %s", u.ID)
				seen[u.ID.String()] = true
			}
			if !hasMore {
				break
			}
			last := rows[len(rows)-1]
			after = &KeysetCursor{CreatedAt: last.CreatedAt, ID: last.ID}
		}
		require.Equal(ts.T(), want, seen, "every same-created_at row returned exactly once")
	})

	ts.Run("last page returns <= Limit", func() {
		TruncateAll(ts.db)
		for i := 0; i < 2; i++ {
			ts.createUserAt(fmt.Sprintf("last%d@example.com", i), base.Add(time.Duration(i)*time.Minute))
		}

		p := &KeysetPagination{Limit: 50}
		users, err := FindUsersInAudienceKeyset(ts.db, "test", p, nil, "")
		require.NoError(ts.T(), err)
		require.Len(ts.T(), users, 2)
	})

	ts.Run("filter still applies alongside keyset", func() {
		TruncateAll(ts.db)
		ts.createUserAt("needle@example.com", base)
		ts.createUserAt("haystack@example.com", base.Add(time.Minute))

		p := &KeysetPagination{Limit: 50}
		users, err := FindUsersInAudienceKeyset(ts.db, "test", p, nil, "needle")
		require.NoError(ts.T(), err)
		require.Len(ts.T(), users, 1)
		require.Equal(ts.T(), "needle@example.com", users[0].GetEmail())
	})

	ts.Run("non-created_at sort field is rejected", func() {
		TruncateAll(ts.db)
		ts.createUserAt("x@example.com", base)

		sp := &SortParams{Fields: []SortField{{Name: "email", Dir: Ascending}}}
		_, err := FindUsersInAudienceKeyset(ts.db, "test", &KeysetPagination{Limit: 10}, sp, "")
		require.Error(ts.T(), err)
	})

	ts.Run("ascending direction resumes with > comparison", func() {
		TruncateAll(ts.db)
		for i := 0; i < 3; i++ {
			ts.createUserAt(fmt.Sprintf("asc%d@example.com", i), base.Add(time.Duration(i)*time.Minute))
		}

		sp := &SortParams{Fields: []SortField{{Name: CreatedAt, Dir: Ascending}}}
		p := &KeysetPagination{Limit: 1}
		first, err := FindUsersInAudienceKeyset(ts.db, "test", p, sp, "")
		require.NoError(ts.T(), err)
		require.Len(ts.T(), first, 2) // Limit+1
		require.Equal(ts.T(), "asc0@example.com", first[0].GetEmail())

		after := &KeysetCursor{CreatedAt: first[0].CreatedAt, ID: first[0].ID}
		next, err := FindUsersInAudienceKeyset(ts.db, "test", &KeysetPagination{Limit: 1, After: after}, sp, "")
		require.NoError(ts.T(), err)
		require.Len(ts.T(), next, 2)
		require.Equal(ts.T(), "asc1@example.com", next[0].GetEmail())
	})
}

func (ts *UserTestSuite) TestFindUserByID() {
	u := ts.createUser()

	n, err := FindUserByID(ts.db, u.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), u.ID, n.ID)
}

func (ts *UserTestSuite) TestFindUserByRecoveryToken() {
	u := ts.createUser()
	tokenHash := "test_recovery_token"
	require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, "relates_to not used", tokenHash, RecoveryToken, ts.config.Mailer.OtpExpAsDuration(), true))

	n, err := FindUserByOneTimeToken(ts.db, tokenHash, RecoveryToken)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), u.ID, n.ID)
}

func (ts *UserTestSuite) TestFindUserByOneTimeTokenMultipleTypes() {
	u := ts.createUser()
	tokenHash := "test_confirmation_or_recovery_token"
	require.NoError(ts.T(), CreateOneTimeToken(ts.db, u.ID, "relates_to not used", tokenHash, RecoveryToken, time.Minute, true))

	n, err := FindUserByOneTimeToken(ts.db, tokenHash, ConfirmationToken, RecoveryToken)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), u.ID, n.ID)

	_, err = FindUserByOneTimeToken(ts.db, tokenHash, EmailChangeTokenCurrent, EmailChangeTokenNew)
	require.Error(ts.T(), err)
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *UserTestSuite) TestFindUserWithRefreshToken() {
	u := ts.createUser()
	r, err := GrantAuthenticatedUser(ts.db, u, GrantParams{})
	require.NoError(ts.T(), err)

	n, anyNR, s, err := FindUserWithRefreshToken(ts.db, ts.config.Security.DBEncryption, r.Token, true /* forUpdate */)
	require.NoError(ts.T(), err)

	nr := anyNR.(*RefreshToken)
	require.Equal(ts.T(), r.ID, nr.ID)
	require.Equal(ts.T(), u.ID, n.ID)
	require.NotNil(ts.T(), s)
	require.Equal(ts.T(), *r.SessionId, s.ID)
}

func (ts *UserTestSuite) TestIsDuplicatedEmail() {
	_ = ts.createUserWithEmail("david.calavera@netlify.com")

	e, err := IsDuplicatedEmail(ts.db, "david.calavera@netlify.com", "test", nil, nil)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), e, "expected email to be duplicated")

	e, err = IsDuplicatedEmail(ts.db, "davidcalavera@netlify.com", "test", nil, nil)
	require.NoError(ts.T(), err)
	require.Nil(ts.T(), e, "expected email to not be duplicated", nil, nil)

	e, err = IsDuplicatedEmail(ts.db, "david@netlify.com", "test", nil, nil)
	require.NoError(ts.T(), err)
	require.Nil(ts.T(), e, "expected same email to not be duplicated", nil, nil)

	e, err = IsDuplicatedEmail(ts.db, "david.calavera@netlify.com", "other-aud", nil, nil)
	require.NoError(ts.T(), err)
	require.Nil(ts.T(), e, "expected same email to not be duplicated")
}

func (ts *UserTestSuite) TestIsDuplicatedEmailWithLinkingDomains() {
	linkingDomains := map[string]string{"github": "social", "google": "social"}

	// A grouped-provider user (its own "social" linking domain, is_sso_user=true)
	// must NOT be treated as a default-pool duplicate: a default email signup with
	// the same address is allowed to coexist with it.
	githubUser, err := NewUser("", "grouped@example.com", "", "test", nil)
	require.NoError(ts.T(), err)
	githubUser.IsSSOUser = true
	require.NoError(ts.T(), ts.db.Create(githubUser))
	githubIdentity, err := NewIdentity(githubUser, "github", map[string]interface{}{
		"sub":   githubUser.ID.String(),
		"email": "grouped@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(githubIdentity))

	e, err := IsDuplicatedEmail(ts.db, "grouped@example.com", "test", nil, linkingDomains)
	require.NoError(ts.T(), err)
	require.Nil(ts.T(), e, "grouped-provider email must not count as a default-pool duplicate")

	// A default-pool email user with the same address IS still a duplicate.
	_ = ts.createUserWithEmail("default@example.com")
	e, err = IsDuplicatedEmail(ts.db, "default@example.com", "test", nil, linkingDomains)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), e, "default email must still count as a duplicate")
}

func (ts *UserTestSuite) createUser() *User {
	return ts.createUserWithEmail("david@netlify.com")
}

func (ts *UserTestSuite) createUserWithEmail(email string) *User {
	user, err := NewUser("", email, "secret", "test", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))

	identity, err := NewIdentity(user, "email", map[string]interface{}{
		"sub":   user.ID.String(),
		"email": email,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identity))

	return user
}

func (ts *UserTestSuite) TestRemoveUnconfirmedIdentities() {
	user, err := NewUser("+29382983298", "someone@example.com", "abcdefgh", "authenticated", nil)
	require.NoError(ts.T(), err)

	user.AppMetaData = map[string]interface{}{
		"provider":  "email",
		"providers": []string{"email", "phone", "twitter"},
	}

	require.NoError(ts.T(), ts.db.Create(user))

	idEmail, err := NewIdentity(user, "email", map[string]interface{}{
		"sub": "someone@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(idEmail))

	idPhone, err := NewIdentity(user, "phone", map[string]interface{}{
		"sub": "+29382983298",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(idPhone))

	idTwitter, err := NewIdentity(user, "twitter", map[string]interface{}{
		"sub": "test_twitter_user_id",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(idTwitter))

	user.Identities = append(user.Identities, *idEmail, *idPhone, *idTwitter)

	// reload the user
	require.NoError(ts.T(), ts.db.Load(user))

	require.False(ts.T(), user.IsConfirmed(), "user's email must not be confirmed")

	require.NoError(ts.T(), user.RemoveUnconfirmedIdentities(ts.db, idTwitter))

	// reload the user to check that identities are deleted from the db too
	require.NoError(ts.T(), ts.db.Load(user))
	require.Empty(ts.T(), user.EncryptedPassword, "password still remains in user")

	require.Len(ts.T(), user.Identities, 1, "only one identity must be remaining")
	require.Equal(ts.T(), idTwitter.ID, user.Identities[0].ID, "remaining identity is not the expected one")

	require.NotNil(ts.T(), user.AppMetaData)
	require.Equal(ts.T(), user.AppMetaData["provider"], "twitter")
	require.Equal(ts.T(), user.AppMetaData["providers"], []string{"twitter"})
}

func (ts *UserTestSuite) TestConfirmEmailChange() {
	user, err := NewUser("", "test@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))

	identity, err := NewIdentity(user, "email", map[string]interface{}{
		"sub":   user.ID.String(),
		"email": "test@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identity))

	user.EmailChange = "new@example.com"
	require.NoError(ts.T(), ts.db.UpdateOnly(user, "email_change"))

	require.NoError(ts.T(), user.ConfirmEmailChange(ts.db, 0))

	require.NoError(ts.T(), ts.db.Eager().Load(user))
	identity, err = FindIdentityByIdAndProvider(ts.db, user.ID.String(), "email")
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), user.Email, storage.NullString("new@example.com"))
	require.Equal(ts.T(), user.EmailChange, "")

	require.NotNil(ts.T(), identity.IdentityData)
	require.Equal(ts.T(), identity.IdentityData["email"], "new@example.com")
}

func (ts *UserTestSuite) TestConfirmPhoneChange() {
	user, err := NewUser("123456789", "", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(user))

	identity, err := NewIdentity(user, "phone", map[string]interface{}{
		"sub":   user.ID.String(),
		"phone": "123456789",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identity))

	user.PhoneChange = "987654321"
	require.NoError(ts.T(), ts.db.UpdateOnly(user, "phone_change"))

	require.NoError(ts.T(), user.ConfirmPhoneChange(ts.db))

	require.NoError(ts.T(), ts.db.Eager().Load(user))
	identity, err = FindIdentityByIdAndProvider(ts.db, user.ID.String(), "phone")
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), user.Phone, storage.NullString("987654321"))
	require.Equal(ts.T(), user.PhoneChange, "")

	require.NotNil(ts.T(), identity.IdentityData)
	require.Equal(ts.T(), identity.IdentityData["phone"], "987654321")
}

func (ts *UserTestSuite) TestUpdateUserEmailSuccess() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	require.NoError(ts.T(), userA.Confirm(ts.db))

	primaryIdentity, err := NewIdentity(userA, "email", map[string]any{
		"sub":   userA.ID.String(),
		"email": "foo@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(primaryIdentity))

	// secondary identity without an email_verified key, must be treated as unverified
	secondaryIdentity, err := NewIdentity(userA, "google", map[string]any{
		"sub":   userA.ID.String(),
		"email": "bar@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(secondaryIdentity))

	// UpdateUserEmail should not do anything and the user's email should still use the primaryIdentity
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), primaryIdentity.GetEmail(), userA.GetEmail())
	require.NotNil(ts.T(), userA.EmailConfirmedAt)

	// remove primary identity
	require.NoError(ts.T(), ts.db.Destroy(primaryIdentity))

	// UpdateUserEmail should update the user to use the secondary identity's email
	// and clear the confirmation state since the promoted email was never verified
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), secondaryIdentity.GetEmail(), userA.GetEmail())
	require.Nil(ts.T(), userA.EmailConfirmedAt)
	require.Equal(ts.T(), false, userA.UserMetaData["email_verified"])
}

func (ts *UserTestSuite) TestUpdateUserEmailFromVerifiedIdentity() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	require.NoError(ts.T(), userA.Confirm(ts.db))

	secondaryIdentity, err := NewIdentity(userA, "google", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "bar@example.com",
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(secondaryIdentity))

	// the promoted email was verified by the identity provider so the
	// user's confirmation state should be kept
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), secondaryIdentity.GetEmail(), userA.GetEmail())
	require.NotNil(ts.T(), userA.EmailConfirmedAt)
}

func (ts *UserTestSuite) TestUpdateUserEmailFromUnverifiedIdentity() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	require.NoError(ts.T(), userA.Confirm(ts.db))

	secondaryIdentity, err := NewIdentity(userA, "google", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "bar@example.com",
		"email_verified": false,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(secondaryIdentity))

	// the promoted email was never verified so the user should no longer
	// be considered confirmed
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), secondaryIdentity.GetEmail(), userA.GetEmail())
	require.Nil(ts.T(), userA.EmailConfirmedAt)
	require.Equal(ts.T(), false, userA.UserMetaData["email_verified"])
}

func (ts *UserTestSuite) TestUpdateUserEmailFromUnverifiedIdentityWithAutoconfirm() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	require.NoError(ts.T(), userA.Confirm(ts.db))

	secondaryIdentity, err := NewIdentity(userA, "google", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "bar@example.com",
		"email_verified": false,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(secondaryIdentity))

	// autoconfirm keeps the promoted email confirmed even when the identity
	// provider did not verify it
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, true))
	require.Equal(ts.T(), secondaryIdentity.GetEmail(), userA.GetEmail())
	require.NotNil(ts.T(), userA.EmailConfirmedAt)
	require.Equal(ts.T(), true, userA.UserMetaData["email_verified"])
}

func (ts *UserTestSuite) TestUpdateUserEmailPrefersVerifiedIdentity() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	require.NoError(ts.T(), userA.Confirm(ts.db))

	unverifiedIdentity, err := NewIdentity(userA, "google", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "unverified@example.com",
		"email_verified": false,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(unverifiedIdentity))

	verifiedIdentity, err := NewIdentity(userA, "github", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "verified@example.com",
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(verifiedIdentity))

	// the verified identity should be promoted even though the unverified
	// identity was created first
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), verifiedIdentity.GetEmail(), userA.GetEmail())
	require.NotNil(ts.T(), userA.EmailConfirmedAt)
}

func (ts *UserTestSuite) TestUpdateUserEmailVerifiedConflictFallsBack() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	require.NoError(ts.T(), userA.Confirm(ts.db))

	verifiedIdentity, err := NewIdentity(userA, "google", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "bar@example.com",
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(verifiedIdentity))

	unverifiedIdentity, err := NewIdentity(userA, "github", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "baz@example.com",
		"email_verified": false,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(unverifiedIdentity))

	userB, err := NewUser("", "bar@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userB))

	// the verified identity's email is taken by userB so the unverified
	// identity is promoted instead, which unconfirms the user
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), unverifiedIdentity.GetEmail(), userA.GetEmail())
	require.Nil(ts.T(), userA.EmailConfirmedAt)
	require.Equal(ts.T(), false, userA.UserMetaData["email_verified"])
}

func (ts *UserTestSuite) TestUpdateUserEmailClearsStaleTokens() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))
	require.NoError(ts.T(), userA.Confirm(ts.db))

	secondaryIdentity, err := NewIdentity(userA, "google", map[string]interface{}{
		"sub":            userA.ID.String(),
		"email":          "bar@example.com",
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(secondaryIdentity))

	// simulate outstanding tokens sent to the previous email
	now := time.Now()
	userA.ConfirmationToken = "confirmation-token-hash"
	userA.ConfirmationSentAt = &now
	userA.RecoveryToken = "recovery-token-hash"
	userA.RecoverySentAt = &now
	userA.EmailChange = "baz@example.com"
	userA.EmailChangeTokenCurrent = "email-change-current-hash"
	userA.EmailChangeTokenNew = "email-change-new-hash"
	userA.EmailChangeSentAt = &now
	userA.EmailChangeConfirmStatus = 1
	userA.PhoneChange = "123456789"
	userA.PhoneChangeToken = "phone-change-token-hash"
	userA.PhoneChangeSentAt = &now
	userA.ReauthenticationToken = "reauthentication-token-hash"
	userA.ReauthenticationSentAt = &now
	require.NoError(ts.T(), ts.db.UpdateOnly(
		userA,
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
	))
	require.NoError(ts.T(), CreateOneTimeToken(ts.db, userA.ID, userA.GetEmail(), userA.ConfirmationToken, ConfirmationToken, ts.config.Mailer.OtpExpAsDuration(), true))

	// promoting another identity's email must revoke every outstanding
	// token addressed to the previous email
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), secondaryIdentity.GetEmail(), userA.GetEmail())

	userA, err = FindUserByID(ts.db, userA.ID)
	require.NoError(ts.T(), err)
	require.Empty(ts.T(), userA.ConfirmationToken)
	require.Nil(ts.T(), userA.ConfirmationSentAt)
	require.Empty(ts.T(), userA.RecoveryToken)
	require.Nil(ts.T(), userA.RecoverySentAt)
	require.Empty(ts.T(), userA.EmailChange)
	require.Empty(ts.T(), userA.EmailChangeTokenCurrent)
	require.Empty(ts.T(), userA.EmailChangeTokenNew)
	require.Nil(ts.T(), userA.EmailChangeSentAt)
	require.Equal(ts.T(), 0, userA.EmailChangeConfirmStatus)
	require.Empty(ts.T(), userA.PhoneChange)
	require.Empty(ts.T(), userA.PhoneChangeToken)
	require.Nil(ts.T(), userA.PhoneChangeSentAt)
	require.Empty(ts.T(), userA.ReauthenticationToken)
	require.Nil(ts.T(), userA.ReauthenticationSentAt)

	// the one-time token must no longer be redeemable
	_, err = FindUserByOneTimeToken(ts.db, "confirmation-token-hash", ConfirmationToken)
	require.Error(ts.T(), err)
}

func (ts *UserTestSuite) TestUpdateUserEmailFromEmptyClearsStaleTokens() {
	// a user without an email or identities, e.g. an anonymous user
	userA, err := NewUser("", "", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))

	identity, err := NewIdentity(userA, "google", map[string]any{
		"sub":            userA.ID.String(),
		"email":          "bar@example.com",
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(identity))

	// simulate a phone change requested before the identity was linked
	now := time.Now()
	userA.PhoneChange = "123456789"
	userA.PhoneChangeToken = "phone-change-token-hash"
	userA.PhoneChangeSentAt = &now
	require.NoError(ts.T(), ts.db.UpdateOnly(
		userA,
		"phone_change",
		"phone_change_token",
		"phone_change_sent_at",
	))
	require.NoError(ts.T(), CreateOneTimeToken(ts.db, userA.ID, userA.PhoneChange, userA.PhoneChangeToken, PhoneChangeToken, ts.config.Sms.OtpExpAsDuration(), true))

	// promoting an identity's email over an empty one is still a primary
	// email transition, so outstanding tokens must be revoked
	require.NoError(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false))
	require.Equal(ts.T(), identity.GetEmail(), userA.GetEmail())

	userA, err = FindUserByID(ts.db, userA.ID)
	require.NoError(ts.T(), err)
	require.Empty(ts.T(), userA.PhoneChange)
	require.Empty(ts.T(), userA.PhoneChangeToken)
	require.Nil(ts.T(), userA.PhoneChangeSentAt)

	_, err = FindOneTimeToken(ts.db, "phone-change-token-hash", PhoneChangeToken)
	require.Error(ts.T(), err)
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *UserTestSuite) TestUpdateUserEmailFailure() {
	userA, err := NewUser("", "foo@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userA))

	primaryIdentity, err := NewIdentity(userA, "email", map[string]interface{}{
		"sub":   userA.ID.String(),
		"email": "foo@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(primaryIdentity))

	secondaryIdentity, err := NewIdentity(userA, "google", map[string]interface{}{
		"sub":   userA.ID.String(),
		"email": "bar@example.com",
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(secondaryIdentity))

	userB, err := NewUser("", "bar@example.com", "", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.db.Create(userB))

	// remove primary identity
	require.NoError(ts.T(), ts.db.Destroy(primaryIdentity))

	// UpdateUserEmail should fail with the email unique constraint violation error
	//  since userB is using the secondary identity's email
	require.ErrorIs(ts.T(), userA.UpdateUserEmailFromIdentities(ts.db, false), UserEmailUniqueConflictError{})
	require.Equal(ts.T(), primaryIdentity.GetEmail(), userA.GetEmail())
}

func (ts *UserTestSuite) TestNewUserWithPasswordHashSuccess() {
	cases := []struct {
		desc string
		hash string
	}{
		{
			desc: "Valid bcrypt hash",
			hash: "$2y$10$SXEz2HeT8PUIGQXo9yeUIem8KzNxgG0d7o/.eGj2rj8KbRgAuRVlq",
		},
		{
			desc: "Valid argon2i hash",
			hash: "$argon2i$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		},
		{
			desc: "Valid argon2id hash",
			hash: "$argon2id$v=19$m=32,t=3,p=2$SFVpOWJ0eXhjRzVkdGN1RQ$RXnb8rh7LaDcn07xsssqqulZYXOM/EUCEFMVcAcyYVk",
		},
		{
			desc: "Valid Firebase scrypt hash",
			hash: "$fbscrypt$v=1,n=14,r=8,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$ZGlmZmVyZW50aGFzaA==",
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			u, err := NewUserWithPasswordHash("", "", c.hash, "", nil)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), u)
		})
	}
}

func (ts *UserTestSuite) TestNewUserWithPasswordHashFailure() {
	cases := []struct {
		desc string
		hash string
	}{
		{
			desc: "Invalid argon2i hash",
			hash: "$argon2id$test",
		},
		{
			desc: "Invalid bcrypt hash",
			hash: "plaintest_password",
		},
		{
			desc: "Invalid scrypt hash",
			hash: "$fbscrypt$invalid",
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			u, err := NewUserWithPasswordHash("", "", c.hash, "", nil)
			require.Error(ts.T(), err)
			require.Nil(ts.T(), u)
		})
	}
}

func (ts *UserTestSuite) TestAuthenticate() {
	// every case uses "test" as the password
	cases := []struct {
		desc             string
		hash             string
		expectedHashCost int
	}{
		{
			desc:             "Invalid bcrypt hash cost of 11",
			hash:             "$2y$11$4lH57PU7bGATpRcx93vIoObH3qDmft/pytbOzDG9/1WsyNmN5u4di",
			expectedHashCost: bcrypt.MinCost,
		},
		{
			desc:             "Valid bcrypt hash cost of 10",
			hash:             "$2y$10$va66S4MxFrH6G6L7BzYl0.QgcYgvSr/F92gc.3botlz7bG4p/g/1i",
			expectedHashCost: bcrypt.DefaultCost,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			u, err := NewUserWithPasswordHash("", "", c.hash, "", nil)
			require.NoError(ts.T(), err)
			require.NoError(ts.T(), ts.db.Create(u))
			require.NotNil(ts.T(), u)

			isAuthenticated, _, err := u.Authenticate(context.Background(), ts.db, "test", nil, false, "")
			require.NoError(ts.T(), err)
			require.True(ts.T(), isAuthenticated)

			// check hash cost
			hashCost, err := bcrypt.Cost([]byte(*u.EncryptedPassword))
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), c.expectedHashCost, hashCost)
		})
	}
}
