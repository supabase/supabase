package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/conf"
	mail "github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/mailer/mockclient"
	"github.com/supabase/auth/internal/models"
)

type IdentityTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
	Mailer mail.Mailer
}

func TestIdentity(t *testing.T) {
	mockMailer := &mockclient.MockMailer{}
	api, config, err := setupAPIForTest(WithMailer(mockMailer))
	require.NoError(t, err)
	ts := &IdentityTestSuite{
		API:    api,
		Config: config,
		Mailer: mockMailer,
	}
	defer api.db.Close()
	suite.Run(t, ts)
}

func (ts *IdentityTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	// Create user
	u, err := models.NewUser("", "one@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")
	require.NoError(ts.T(), u.Confirm(ts.API.db))

	// Create identity
	i, err := models.NewIdentity(u, "email", map[string]interface{}{
		"sub":   u.ID.String(),
		"email": u.GetEmail(),
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(i))

	// Create user with 2 identities
	u, err = models.NewUser("123456789", "two@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")
	require.NoError(ts.T(), u.Confirm(ts.API.db))
	require.NoError(ts.T(), u.ConfirmPhone(ts.API.db))

	i, err = models.NewIdentity(u, "email", map[string]interface{}{
		"sub":   u.ID.String(),
		"email": u.GetEmail(),
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(i))

	i2, err := models.NewIdentity(u, "phone", map[string]interface{}{
		"sub":   u.ID.String(),
		"phone": u.GetPhone(),
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(i2))
}

func (ts *IdentityTestSuite) TestLinkIdentityToUser() {
	u, err := models.FindUserByEmailAndAudience(ts.API.db, "one@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	ctx := withTargetUser(context.Background(), u)

	// link a valid identity
	testValidUserData := &provider.UserProvidedData{
		Metadata: &provider.Claims{
			Subject: "test_subject",
		},
	}
	// request is just used as a placeholder in the function
	r := httptest.NewRequest(http.MethodGet, "/identities", nil)
	r.RemoteAddr = "192.0.2.1:1234"
	u, err = ts.API.linkIdentityToUser(r, ctx, ts.API.db, testValidUserData, "test")
	require.NoError(ts.T(), err)

	// load associated identities for the user
	ts.API.db.Load(u, "Identities")
	require.Len(ts.T(), u.Identities, 2)
	require.Equal(ts.T(), u.AppMetaData["provider"], "email")
	require.Equal(ts.T(), u.AppMetaData["providers"], []string{"email", "test"})

	identity, err := models.FindIdentityByIdAndProvider(ts.API.db, testValidUserData.Metadata.Subject, "test")
	require.NoError(ts.T(), err)
	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.IdentityLinkAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
	require.Equal(ts.T(), string(models.IdentityLinkAction), logs[0].Payload["action"])
	require.Equal(ts.T(), "user", logs[0].Payload["log_type"])
	traits, ok := logs[0].Payload["traits"].(map[string]any)
	require.True(ts.T(), ok)
	require.Equal(ts.T(), identity.ID.String(), traits["identity_id"])
	require.Equal(ts.T(), "test", traits["provider"])
	require.Equal(ts.T(), testValidUserData.Metadata.Subject, traits["provider_id"])
	require.Equal(ts.T(), "192.0.2.1", logs[0].IPAddress)

	// link an already existing identity
	testExistingUserData := &provider.UserProvidedData{
		Metadata: &provider.Claims{
			Subject: u.ID.String(),
		},
	}
	u, err = ts.API.linkIdentityToUser(r, ctx, ts.API.db, testExistingUserData, "email")
	require.ErrorIs(ts.T(), err, apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeIdentityAlreadyExists, "Identity is already linked"))
	require.Nil(ts.T(), u)

	logs, err = models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.IdentityLinkAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1, "an already-linked identity must not emit another audit log")
}

func (ts *IdentityTestSuite) TestUnlinkIdentityError() {
	manualLinkingEnabled := ts.Config.Security.ManualLinkingEnabled
	ts.Config.Security.ManualLinkingEnabled = true
	defer func() { ts.Config.Security.ManualLinkingEnabled = manualLinkingEnabled }()

	userWithOneIdentity, err := models.FindUserByEmailAndAudience(ts.API.db, "one@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)

	userWithTwoIdentities, err := models.FindUserByEmailAndAudience(ts.API.db, "two@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	cases := []struct {
		desc          string
		user          *models.User
		identityId    uuid.UUID
		expectedError *HTTPError
	}{
		{
			desc:          "User must have at least 1 identity after unlinking",
			user:          userWithOneIdentity,
			identityId:    userWithOneIdentity.Identities[0].ID,
			expectedError: apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeSingleIdentityNotDeletable, "User must have at least 1 identity after unlinking"),
		},
		{
			desc:          "Identity doesn't exist",
			user:          userWithTwoIdentities,
			identityId:    uuid.Must(uuid.NewV4()),
			expectedError: apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeIdentityNotFound, "Identity doesn't exist"),
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			token := ts.generateAccessTokenAndSession(c.user)
			req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/user/identities/%s", c.identityId), nil)
			require.NoError(ts.T(), err)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
			w := httptest.NewRecorder()

			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), c.expectedError.HTTPStatus, w.Code)

			var data HTTPError
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
			require.Equal(ts.T(), c.expectedError.Message, data.Message)
		})
	}
}

func (ts *IdentityTestSuite) TestUnlinkIdentity() {
	manualLinkingEnabled := ts.Config.Security.ManualLinkingEnabled
	ts.Config.Security.ManualLinkingEnabled = true
	defer func() { ts.Config.Security.ManualLinkingEnabled = manualLinkingEnabled }()

	// we want to test 2 cases here: unlinking a phone identity and email identity from a user
	cases := []struct {
		desc string
		// the provider to be unlinked
		provider string
		// the remaining provider that should be linked to the user
		providerRemaining string
	}{
		{
			desc:              "Unlink phone identity successfully",
			provider:          "phone",
			providerRemaining: "email",
		},
		{
			desc:              "Unlink email identity successfully",
			provider:          "email",
			providerRemaining: "phone",
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			// teardown and reset the state of the db to prevent running into errors
			ts.SetupTest()
			u, err := models.FindUserByEmailAndAudience(ts.API.db, "two@example.com", ts.Config.JWT.Aud)
			require.NoError(ts.T(), err)

			identity, err := models.FindIdentityByIdAndProvider(ts.API.db, u.ID.String(), c.provider)
			require.NoError(ts.T(), err)

			token := ts.generateAccessTokenAndSession(u)
			req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/user/identities/%s", identity.ID), nil)
			require.NoError(ts.T(), err)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
			req.RemoteAddr = "192.0.2.1:1234"
			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			// sanity checks
			u, err = models.FindUserByID(ts.API.db, u.ID)
			require.NoError(ts.T(), err)
			require.Len(ts.T(), u.Identities, 1)
			require.Equal(ts.T(), u.Identities[0].Provider, c.providerRemaining)

			// an audit log entry should be recorded for the unlinked identity
			logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.IdentityUnlinkAction), nil)
			require.NoError(ts.T(), err)
			require.Len(ts.T(), logs, 1)
			require.Equal(ts.T(), string(models.IdentityUnlinkAction), logs[0].Payload["action"])
			require.Equal(ts.T(), "user", logs[0].Payload["log_type"])
			traits, ok := logs[0].Payload["traits"].(map[string]any)
			require.True(ts.T(), ok)
			require.Equal(ts.T(), identity.ID.String(), traits["identity_id"])
			require.Equal(ts.T(), c.provider, traits["provider"])
			require.Equal(ts.T(), "192.0.2.1", logs[0].IPAddress)

			// conditional checks depending on the provider that was unlinked
			switch c.provider {
			case "phone":
				require.Equal(ts.T(), "", u.GetPhone())
				require.Nil(ts.T(), u.PhoneConfirmedAt)
			case "email":
				require.Equal(ts.T(), "", u.GetEmail())
				require.Nil(ts.T(), u.EmailConfirmedAt)
			}

			// user still has a phone / email identity linked so it should not be unconfirmed
			require.NotNil(ts.T(), u.ConfirmedAt)
		})
	}

}

func (ts *IdentityTestSuite) TestUnlinkIdentityEmailVerification() {
	manualLinkingEnabled := ts.Config.Security.ManualLinkingEnabled
	originalAutoconfirm := ts.Config.Mailer.Autoconfirm
	ts.Config.Security.ManualLinkingEnabled = true
	defer func() {
		ts.Config.Security.ManualLinkingEnabled = manualLinkingEnabled
		ts.Config.Mailer.Autoconfirm = originalAutoconfirm
	}()

	boolPtr := func(b bool) *bool { return &b }
	cases := []struct {
		desc string
		// value of email_verified on the remaining identity; nil means
		// the key is absent from identity_data
		emailVerified     *bool
		autoconfirm       bool
		expectedConfirmed bool
	}{
		{
			desc:              "Promoting an unverified identity email unconfirms the user",
			emailVerified:     boolPtr(false),
			expectedConfirmed: false,
		},
		{
			desc:              "Promoting a verified identity email keeps the user confirmed",
			emailVerified:     boolPtr(true),
			expectedConfirmed: true,
		},
		{
			desc:              "Promoting an identity without email_verified unconfirms the user",
			emailVerified:     nil,
			expectedConfirmed: false,
		},
		{
			desc:              "Autoconfirm keeps an unverified identity email confirmed",
			emailVerified:     boolPtr(false),
			autoconfirm:       true,
			expectedConfirmed: true,
		},
		{
			desc:              "Autoconfirm keeps an identity without email_verified confirmed",
			emailVerified:     nil,
			autoconfirm:       true,
			expectedConfirmed: true,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			ts.SetupTest()
			ts.Config.Mailer.Autoconfirm = c.autoconfirm
			u, err := models.NewUser("", "primary@example.com", "password", ts.Config.JWT.Aud, nil)
			require.NoError(ts.T(), err)
			require.NoError(ts.T(), ts.API.db.Create(u))
			require.NoError(ts.T(), u.Confirm(ts.API.db))

			emailIdentity, err := models.NewIdentity(u, "email", map[string]any{
				"sub":            u.ID.String(),
				"email":          u.GetEmail(),
				"email_verified": true,
			})
			require.NoError(ts.T(), err)
			require.NoError(ts.T(), ts.API.db.Create(emailIdentity))

			googleData := map[string]any{
				"sub":   u.ID.String(),
				"email": "other@example.com",
			}
			if c.emailVerified != nil {
				googleData["email_verified"] = *c.emailVerified
			}
			googleIdentity, err := models.NewIdentity(u, "google", googleData)
			require.NoError(ts.T(), err)
			require.NoError(ts.T(), ts.API.db.Create(googleIdentity))

			token := ts.generateAccessTokenAndSession(u)
			req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/user/identities/%s", emailIdentity.ID), nil)
			require.NoError(ts.T(), err)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			u, err = models.FindUserByID(ts.API.db, u.ID)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), "other@example.com", u.GetEmail())
			if c.expectedConfirmed {
				require.NotNil(ts.T(), u.EmailConfirmedAt)
				require.NotNil(ts.T(), u.ConfirmedAt)
			} else {
				require.Nil(ts.T(), u.EmailConfirmedAt)
				require.Nil(ts.T(), u.ConfirmedAt)
				require.Equal(ts.T(), false, u.UserMetaData["email_verified"])
			}
		})
	}
}

func (ts *IdentityTestSuite) TestUnlinkIdentityPrefersVerifiedEmail() {
	manualLinkingEnabled := ts.Config.Security.ManualLinkingEnabled
	ts.Config.Security.ManualLinkingEnabled = true
	defer func() { ts.Config.Security.ManualLinkingEnabled = manualLinkingEnabled }()

	u, err := models.NewUser("", "primary@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(u))
	require.NoError(ts.T(), u.Confirm(ts.API.db))

	emailIdentity, err := models.NewIdentity(u, "email", map[string]any{
		"sub":            u.ID.String(),
		"email":          u.GetEmail(),
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(emailIdentity))

	unverifiedIdentity, err := models.NewIdentity(u, "google", map[string]any{
		"sub":            u.ID.String(),
		"email":          "unverified@example.com",
		"email_verified": false,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(unverifiedIdentity))

	verifiedIdentity, err := models.NewIdentity(u, "github", map[string]any{
		"sub":            u.ID.String(),
		"email":          "verified@example.com",
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(verifiedIdentity))

	token := ts.generateAccessTokenAndSession(u)
	req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/user/identities/%s", emailIdentity.ID), nil)
	require.NoError(ts.T(), err)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// the verified identity's email should be promoted even though the
	// unverified identity was created first, keeping the user confirmed
	u, err = models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), "verified@example.com", u.GetEmail())
	require.NotNil(ts.T(), u.EmailConfirmedAt)
}

func (ts *IdentityTestSuite) generateAccessTokenAndSession(u *models.User) string {
	s, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))

	req := httptest.NewRequest(http.MethodPost, "/token?grant_type=password", nil)
	token, _, err := ts.API.generateAccessToken(req, ts.API.db, u, &s.ID, models.PasswordGrant)
	require.NoError(ts.T(), err)
	return token

}

func (ts *IdentityTestSuite) TestLinkIdentitySendsNotificationEmailEnabled() {
	identityLinkedEnabled := ts.Config.Mailer.Notifications.IdentityLinkedEnabled
	ts.Config.Mailer.Notifications.IdentityLinkedEnabled = true
	defer func() { ts.Config.Mailer.Notifications.IdentityLinkedEnabled = identityLinkedEnabled }()

	u, err := models.FindUserByEmailAndAudience(ts.API.db, "one@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	ctx := withTargetUser(context.Background(), u)

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	// Link a new identity
	testValidUserData := &provider.UserProvidedData{
		Metadata: &provider.Claims{
			Subject: "test_subject",
		},
	}
	r := httptest.NewRequest(http.MethodGet, "/identities", nil)
	u, err = ts.API.linkIdentityToUser(r, ctx, ts.API.db, testValidUserData, "google")
	require.NoError(ts.T(), err)

	// Assert that identity linked notification email was sent
	require.Len(ts.T(), mockMailer.IdentityLinkedMailCalls, 1, "Expected 1 identity linked notification email(s) to be sent")
	require.Equal(ts.T(), u.ID, mockMailer.IdentityLinkedMailCalls[0].User.ID, "Email should be sent to the correct user")
	require.Equal(ts.T(), "google", mockMailer.IdentityLinkedMailCalls[0].Provider, "Provider should match")
	require.Equal(ts.T(), "one@example.com", mockMailer.IdentityLinkedMailCalls[0].User.GetEmail(), "Email should be sent to the correct email address")
}

func (ts *IdentityTestSuite) TestLinkIdentitySendsNotificationEmailDisabled() {
	identityLinkedEnabled := ts.Config.Mailer.Notifications.IdentityLinkedEnabled
	ts.Config.Mailer.Notifications.IdentityLinkedEnabled = false
	defer func() { ts.Config.Mailer.Notifications.IdentityLinkedEnabled = identityLinkedEnabled }()

	u, err := models.FindUserByEmailAndAudience(ts.API.db, "one@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	ctx := withTargetUser(context.Background(), u)

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	// Link a new identity
	testValidUserData := &provider.UserProvidedData{
		Metadata: &provider.Claims{
			Subject: "test_subject_disabled",
		},
	}
	r := httptest.NewRequest(http.MethodGet, "/identities", nil)
	_, err = ts.API.linkIdentityToUser(r, ctx, ts.API.db, testValidUserData, "facebook")
	require.NoError(ts.T(), err)

	// Assert that identity linked notification email was not sent
	require.Len(ts.T(), mockMailer.IdentityLinkedMailCalls, 0, "Expected 0 identity linked notification email(s) to be sent")
}

func (ts *IdentityTestSuite) TestUnlinkIdentitySendsNotificationEmailEnabled() {
	identityUnlinkedEnabled := ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled
	manualLinkingEnabled := ts.Config.Security.ManualLinkingEnabled
	ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled = true
	ts.Config.Security.ManualLinkingEnabled = true
	defer func() {
		ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled = identityUnlinkedEnabled
		ts.Config.Security.ManualLinkingEnabled = manualLinkingEnabled
	}()

	u, err := models.FindUserByEmailAndAudience(ts.API.db, "two@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)

	identity, err := models.FindIdentityByIdAndProvider(ts.API.db, u.ID.String(), "phone")
	require.NoError(ts.T(), err)

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	token := ts.generateAccessTokenAndSession(u)
	req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/user/identities/%s", identity.ID), nil)
	require.NoError(ts.T(), err)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// Assert that identity unlinked notification email was sent
	require.Len(ts.T(), mockMailer.IdentityUnlinkedMailCalls, 1, "Expected 1 identity unlinked notification email(s) to be sent")
	require.Equal(ts.T(), u.ID, mockMailer.IdentityUnlinkedMailCalls[0].User.ID, "Email should be sent to the correct user")
	require.Equal(ts.T(), "phone", mockMailer.IdentityUnlinkedMailCalls[0].Provider, "Provider should match")
	require.Equal(ts.T(), "two@example.com", mockMailer.IdentityUnlinkedMailCalls[0].User.GetEmail(), "Email should be sent to the correct email address")
	require.Equal(ts.T(), "two@example.com", mockMailer.IdentityUnlinkedMailCalls[0].RecipientEmail, "Notification should be sent to the correct email address")
}

func (ts *IdentityTestSuite) TestUnlinkIdentitySendsNotificationToPreviousEmail() {
	identityUnlinkedEnabled := ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled
	manualLinkingEnabled := ts.Config.Security.ManualLinkingEnabled
	ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled = true
	ts.Config.Security.ManualLinkingEnabled = true
	defer func() {
		ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled = identityUnlinkedEnabled
		ts.Config.Security.ManualLinkingEnabled = manualLinkingEnabled
	}()

	u, err := models.FindUserByEmailAndAudience(ts.API.db, "two@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)

	identity, err := models.FindIdentityByIdAndProvider(ts.API.db, u.ID.String(), "email")
	require.NoError(ts.T(), err)

	replacementIdentity, err := models.NewIdentity(u, "google", map[string]interface{}{
		"sub":            u.ID.String(),
		"email":          "new@example.com",
		"email_verified": true,
	})
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(replacementIdentity))

	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	token := ts.generateAccessTokenAndSession(u)
	req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/user/identities/%s", identity.ID), nil)
	require.NoError(ts.T(), err)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	updatedUser, err := models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), "new@example.com", updatedUser.GetEmail())
	require.Len(ts.T(), mockMailer.IdentityUnlinkedMailCalls, 1)
	require.Equal(ts.T(), "new@example.com", mockMailer.IdentityUnlinkedMailCalls[0].User.GetEmail(), "Notification should receive the updated user")
	require.Equal(ts.T(), "two@example.com", mockMailer.IdentityUnlinkedMailCalls[0].RecipientEmail, "Email should be sent to the address on the user before unlinking")
	require.Equal(ts.T(), "email", mockMailer.IdentityUnlinkedMailCalls[0].Provider)
}

func (ts *IdentityTestSuite) TestUnlinkIdentitySendsNotificationEmailDisabled() {
	identityUnlinkedEnabled := ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled
	manualLinkingEnabled := ts.Config.Security.ManualLinkingEnabled
	ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled = false
	ts.Config.Security.ManualLinkingEnabled = true
	defer func() {
		ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled = identityUnlinkedEnabled
		ts.Config.Security.ManualLinkingEnabled = manualLinkingEnabled
	}()

	u, err := models.FindUserByEmailAndAudience(ts.API.db, "two@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)

	identity, err := models.FindIdentityByIdAndProvider(ts.API.db, u.ID.String(), "phone")
	require.NoError(ts.T(), err)

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	token := ts.generateAccessTokenAndSession(u)
	req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/user/identities/%s", identity.ID), nil)
	require.NoError(ts.T(), err)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// Assert that identity unlinked notification email was not sent
	require.Len(ts.T(), mockMailer.IdentityUnlinkedMailCalls, 0, "Expected 0 identity unlinked notification email(s) to be sent")
}
