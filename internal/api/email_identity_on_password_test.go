package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

// EmailIdentityOnPasswordSetTestSuite asserts that adding a first password to an
// account creates the email identity, but only from a confirmed users.email.
type EmailIdentityOnPasswordSetTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration

	adminToken string
}

func TestEmailIdentityOnPasswordSet(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &EmailIdentityOnPasswordSetTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *EmailIdentityOnPasswordSetTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	ts.Config.DisableSignup = false
	ts.Config.External.Email.Enabled = true
	ts.Config.Mailer.Autoconfirm = false
	ts.Config.Mailer.AllowUnverifiedEmailSignIns = false
	ts.Config.Mailer.SecureEmailChangeEnabled = false
	ts.Config.Security.UpdatePasswordRequireReauthentication = false
	ts.Config.Security.UpdatePasswordRequireCurrentPassword = false
	ts.Config.Experimental.CreateEmailIdentityOnPasswordSetEnabled = true

	claims := &AccessTokenClaims{Role: "supabase_admin"}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err, "Error generating admin jwt")
	ts.adminToken = token
}

func (ts *EmailIdentityOnPasswordSetTestSuite) githubOAuthServer(code, email string, verified bool) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/login/oauth/access_token":
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			fmt.Fprint(w, `{"access_token":"github_token","expires_in":100000}`)
		case "/api/v3/user":
			fmt.Fprint(w, `{"id":123, "name":"GitHub Test", "avatar_url":"http://example.com/avatar"}`)
		case "/api/v3/user/emails":
			fmt.Fprintf(w, `[{"email":%q, "primary": true, "verified": %t}]`, email, verified)
		default:
			w.WriteHeader(http.StatusInternalServerError)
			ts.Fail("unknown github oauth call " + r.URL.Path)
		}
	}))

	ts.Config.External.Github.URL = server.URL
	return server
}

// createGitHubUser signs a new user up by driving /authorize and /callback to
// create a user with a single GitHub identity.
func (ts *EmailIdentityOnPasswordSetTestSuite) createGitHubUser(email string, verified bool) *models.User {
	if !verified {
		// an unverified provider email otherwise aborts the callback before a token
		// is issued, even though the user row is still committed
		ts.Config.Mailer.AllowUnverifiedEmailSignIns = true
	}

	const code = "authcode"
	server := ts.githubOAuthServer(code, email, verified)
	defer server.Close()

	// /authorize returns the provider URL, which carries the flow state
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=github", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusFound, w.Code)

	authorizeURL, err := url.Parse(w.Header().Get("Location"))
	require.NoError(ts.T(), err)
	state := authorizeURL.Query().Get("state")
	require.NotEmpty(ts.T(), state)

	// the provider sends the user back to /callback with the authorization code
	req = httptest.NewRequest(http.MethodGet, fmt.Sprintf(
		"http://localhost/callback?code=%s&state=%s", code, state), nil)
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusFound, w.Code)

	redirectURL, err := url.Parse(w.Header().Get("Location"))
	require.NoError(ts.T(), err)
	fragment, err := url.ParseQuery(redirectURL.Fragment)
	require.NoError(ts.T(), err)
	require.NotEmpty(ts.T(), fragment.Get("access_token"), "sign in failed: %s", redirectURL.RawQuery)

	user, err := models.FindUserByEmailAndAudience(ts.API.db, email, ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), verified, user.IsConfirmed())
	require.False(ts.T(), user.HasPassword())

	require.NoError(ts.T(), ts.API.db.Load(user, "Identities"))
	require.Len(ts.T(), user.Identities, 1)
	require.Equal(ts.T(), "github", user.Identities[0].Provider)
	require.Equal(ts.T(), "123", user.Identities[0].ProviderID)

	return user
}

func (ts *EmailIdentityOnPasswordSetTestSuite) createPhoneOnlyUser(phone string) *models.User {
	u, err := models.NewUser(phone, "", "", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	u.AppMetaData = models.JSONMap{
		"provider":  "phone",
		"providers": []any{"phone"},
	}
	require.NoError(ts.T(), ts.API.db.Create(u))
	require.NoError(ts.T(), u.ConfirmPhone(ts.API.db))

	_, err = ts.API.createNewIdentity(ts.API.db, u, "phone", map[string]any{
		"sub":   u.ID.String(),
		"phone": phone,
	})
	require.NoError(ts.T(), err)

	require.NoError(ts.T(), ts.API.db.Load(u, "Identities"))
	return u
}

func (ts *EmailIdentityOnPasswordSetTestSuite) sessionToken(u *models.User) string {
	session, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(session))

	req := httptest.NewRequest(http.MethodPost, "/token?grant_type=password", nil)
	token, _, err := ts.API.generateAccessToken(req, ts.API.db, u, &session.ID, models.PasswordGrant)
	require.NoError(ts.T(), err)
	return token
}

func (ts *EmailIdentityOnPasswordSetTestSuite) request(method, path string, body map[string]any, opts ...requestOption) *httptest.ResponseRecorder {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(body))

	req := httptest.NewRequest(method, path, &buffer)
	req.Header.Set("Content-Type", "application/json")
	for _, opt := range opts {
		opt(req)
	}

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	return w
}

func (ts *EmailIdentityOnPasswordSetTestSuite) putUser(u *models.User, body map[string]any) *httptest.ResponseRecorder {
	return ts.request(http.MethodPut, "http://localhost/user", body, withBearerToken(ts.sessionToken(u)))
}

func (ts *EmailIdentityOnPasswordSetTestSuite) putAdminUser(u *models.User, body map[string]any) *httptest.ResponseRecorder {
	return ts.request(http.MethodPut, "http://localhost/admin/users/"+u.ID.String(), body, withBearerToken(ts.adminToken))
}

func (ts *EmailIdentityOnPasswordSetTestSuite) passwordGrant(email, password string) *httptest.ResponseRecorder {
	return ts.request(http.MethodPost, "http://localhost/token?grant_type=password", map[string]any{
		"email":    email,
		"password": password,
	})
}

// verifyEmailChange consumes the email change token issued by an earlier PUT /user.
func (ts *EmailIdentityOnPasswordSetTestSuite) verifyEmailChange(token string) *httptest.ResponseRecorder {
	verifyReq := httptest.NewRequest(http.MethodGet, fmt.Sprintf(
		"http://localhost/verify?type=email_change&token=%s&redirect_to=%s",
		token, url.QueryEscape(ts.Config.SiteURL),
	), nil)

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, verifyReq)
	return w
}

func (ts *EmailIdentityOnPasswordSetTestSuite) emailIdentities(u *models.User) []*models.Identity {
	identities, err := models.FindIdentitiesByUserID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)

	emailIdentities := []*models.Identity{}
	for _, i := range identities {
		if i.Provider == "email" {
			emailIdentities = append(emailIdentities, i)
		}
	}
	return emailIdentities
}

func (ts *EmailIdentityOnPasswordSetTestSuite) providers(u *models.User) any {
	reloaded, err := models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)
	return reloaded.AppMetaData["providers"]
}

// provider returns app_meta_data.provider, which is the oldest identity's provider
// and so must not change when an email identity is added later.
func (ts *EmailIdentityOnPasswordSetTestSuite) provider(u *models.User) any {
	reloaded, err := models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)
	return reloaded.AppMetaData["provider"]
}

func (ts *EmailIdentityOnPasswordSetTestSuite) hasPassword(u *models.User) bool {
	reloaded, err := models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)
	return reloaded.HasPassword()
}

func (ts *EmailIdentityOnPasswordSetTestSuite) TestFlagDisabledCreatesNoIdentity() {
	ts.Config.Experimental.CreateEmailIdentityOnPasswordSetEnabled = false

	u := ts.createGitHubUser("github-user@example.com", true)

	w := ts.putUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// sets password but does not create an identity (existing behavior)
	require.True(ts.T(), ts.hasPassword(u))
	require.Empty(ts.T(), ts.emailIdentities(u))
	require.Equal(ts.T(), []any{"github"}, ts.providers(u))
	require.Equal(ts.T(), "github", ts.provider(u))
}

// happy path: the identity is created from the confirmed users.email, providers is
// recomputed, and password sign-in works afterwards.
func (ts *EmailIdentityOnPasswordSetTestSuite) TestCreatesEmailIdentityOnFirstPassword() {
	u := ts.createGitHubUser("github-user@example.com", true)

	w := ts.putUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	emailIdentities := ts.emailIdentities(u)
	require.Len(ts.T(), emailIdentities, 1)

	identity := emailIdentities[0]
	require.Equal(ts.T(), u.ID.String(), identity.ProviderID)
	require.Equal(ts.T(), u.ID, identity.UserID)
	require.Equal(ts.T(), "github-user@example.com", identity.IdentityData["email"])
	require.Equal(ts.T(), true, identity.IdentityData["email_verified"])
	require.Equal(ts.T(), u.ID.String(), identity.IdentityData["sub"])
	require.Equal(ts.T(), "github-user@example.com", identity.GetEmail())

	require.ElementsMatch(ts.T(), []any{"github", "email"}, ts.providers(u))
	require.Equal(ts.T(), "github", ts.provider(u))

	var data models.User
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	require.Len(ts.T(), data.Identities, 2)

	require.Equal(ts.T(), http.StatusOK, ts.passwordGrant("github-user@example.com", "newpassword123").Code)
}

func (ts *EmailIdentityOnPasswordSetTestSuite) TestUnconfirmedEmailCreatesNoIdentity() {
	u := ts.createGitHubUser("unconfirmed@example.com", false)

	w := ts.putUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// the password is still set, but identity is not created (existing behavior)
	// TODO(fm): we may want to consider creating the identity as unconfirmed only if it's safe to do so
	require.True(ts.T(), ts.hasPassword(u))
	require.Empty(ts.T(), ts.emailIdentities(u))
	require.Equal(ts.T(), []any{"github"}, ts.providers(u))
	require.Equal(ts.T(), "github", ts.provider(u))
}

// setting a password on an account that doesn't have an email (e.g. phone-only) does not create an identity
func (ts *EmailIdentityOnPasswordSetTestSuite) TestNoEmailCreatesNoIdentity() {
	u := ts.createPhoneOnlyUser("123456789")

	w := ts.putUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	require.True(ts.T(), ts.hasPassword(u))
	require.Empty(ts.T(), ts.emailIdentities(u))
}

func (ts *EmailIdentityOnPasswordSetTestSuite) TestRequestEmailIsIgnored() {
	u := ts.createGitHubUser("github-user@example.com", true)

	w := ts.putUser(u, map[string]any{
		"password": "newpassword123",
		"email":    "not-valid@example.com", // email in the request is not used for the identity
	})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	emailIdentities := ts.emailIdentities(u)
	require.Len(ts.T(), emailIdentities, 1)
	require.Equal(ts.T(), "github-user@example.com", emailIdentities[0].GetEmail())

	// the user-supplied address is only a pending email change
	reloaded, err := models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), "github-user@example.com", reloaded.GetEmail())
	require.Equal(ts.T(), "not-valid@example.com", reloaded.EmailChange)

	// UpdatePassword clears the email change tokens, but sendEmailChange runs after it
	// within the same transaction, so the token issued by the PUT /user above is still live.
	require.NotEmpty(ts.T(), reloaded.EmailChangeTokenNew)

	// confirming the change updates the same identity rather than adding a second one
	w = ts.verifyEmailChange(reloaded.EmailChangeTokenNew)
	require.Equal(ts.T(), http.StatusSeeOther, w.Code)

	emailIdentities = ts.emailIdentities(u)
	require.Len(ts.T(), emailIdentities, 1)
	require.Equal(ts.T(), "not-valid@example.com", emailIdentities[0].GetEmail())
}

// a user that already has a password does not get an identity, even when one is missing
// TODO(fm): we may want to relax this. I added it to reduce the blast radius.
func (ts *EmailIdentityOnPasswordSetTestSuite) TestExistingPasswordIsNotBackfilled() {
	u := ts.createGitHubUser("has-password@example.com", true)
	require.NoError(ts.T(), u.SetPassword(ts.T().Context(), "oldpassword123", false, "", ""))
	require.NoError(ts.T(), ts.API.db.UpdateOnly(u, "encrypted_password"))

	w := ts.putUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	require.Empty(ts.T(), ts.emailIdentities(u))
	require.Equal(ts.T(), []any{"github"}, ts.providers(u))
	require.Equal(ts.T(), "github", ts.provider(u))
}

// a normal email+password user keeps their single identity, with identity_data untouched.
func (ts *EmailIdentityOnPasswordSetTestSuite) TestExistingEmailIdentityIsUntouched() {
	u, err := models.NewUser("", "normal@example.com", "oldpassword123", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(u))
	require.NoError(ts.T(), u.Confirm(ts.API.db))

	_, err = ts.API.createNewIdentity(ts.API.db, u, "email", map[string]any{
		"sub":   u.ID.String(),
		"email": u.GetEmail(),
		"test":  "untouched",
	})
	require.NoError(ts.T(), err)

	w := ts.putUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	emailIdentities := ts.emailIdentities(u)
	require.Len(ts.T(), emailIdentities, 1)
	require.Equal(ts.T(), models.JSONMap{
		"sub":   u.ID.String(),
		"email": u.GetEmail(),
		"test":  "untouched",
	}, emailIdentities[0].IdentityData)
}

// An empty password *removes* the password (SetPassword nils it out), so it must
// not create an identity.
func (ts *EmailIdentityOnPasswordSetTestSuite) TestClearingPasswordCreatesNoIdentity() {
	u := ts.createGitHubUser("clearing@example.com", true)

	w := ts.putUser(u, map[string]any{"password": ""})
	require.Equal(ts.T(), http.StatusUnprocessableEntity, w.Code)
	require.Empty(ts.T(), ts.emailIdentities(u))

	// The default minimum length the strength check rejects it outright;
	// drop the minimum to reach the clearing path itself.
	minLength := ts.Config.Password.MinLength
	ts.Config.Password.MinLength = 0
	defer func() { ts.Config.Password.MinLength = minLength }()

	w = ts.putUser(u, map[string]any{"password": ""})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	require.False(ts.T(), ts.hasPassword(u))
	require.Empty(ts.T(), ts.emailIdentities(u))
}

func (ts *EmailIdentityOnPasswordSetTestSuite) TestSSOUserCreatesNoIdentity() {
	u, err := models.NewUser("", "sso@example.com", "", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	u.IsSSOUser = true
	require.NoError(ts.T(), ts.API.db.Create(u))
	require.NoError(ts.T(), u.Confirm(ts.API.db))

	// TODO(fm): we shouldn't allow a password to be set on an SSO user at all,
	// for now we maintain existing behaviour and just don't create an identity.
	// This is already enforced in PUT /user (self-serve).
	w := ts.putAdminUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	require.True(ts.T(), ts.hasPassword(u))
	require.Empty(ts.T(), ts.emailIdentities(u))
}

// An anonymous user converting with an autoconfirmed email gets one email identity
func (ts *EmailIdentityOnPasswordSetTestSuite) TestAnonymousUserGetsSingleIdentity() {
	ts.Config.Mailer.Autoconfirm = true

	u, err := models.NewUser("", "", "", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	u.IsAnonymous = true
	require.NoError(ts.T(), ts.API.db.Create(u))

	w := ts.putUser(u, map[string]any{
		"password": "newpassword123",
		"email":    "was-anonymous@example.com",
	})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	emailIdentities := ts.emailIdentities(u)
	require.Len(ts.T(), emailIdentities, 1)
	require.Equal(ts.T(), "was-anonymous@example.com", emailIdentities[0].GetEmail())
}

func (ts *EmailIdentityOnPasswordSetTestSuite) TestAdminUpdatePasswordOnly() {
	u := ts.createGitHubUser("admin-target@example.com", true)

	w := ts.putAdminUser(u, map[string]any{"password": "newpassword123"})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	emailIdentities := ts.emailIdentities(u)
	require.Len(ts.T(), emailIdentities, 1)
	require.Equal(ts.T(), "admin-target@example.com", emailIdentities[0].GetEmail())
	require.ElementsMatch(ts.T(), []any{"github", "email"}, ts.providers(u))
	require.Equal(ts.T(), "github", ts.provider(u))
}

func (ts *EmailIdentityOnPasswordSetTestSuite) TestAdminUpdatePasswordAndEmail() {
	u := ts.createGitHubUser("admin-target@example.com", true)

	w := ts.putAdminUser(u, map[string]any{
		"password":      "newpassword123",
		"email":         "admin-new@example.com",
		"email_confirm": true,
	})
	require.Equal(ts.T(), http.StatusOK, w.Code)

	emailIdentities := ts.emailIdentities(u)
	require.Len(ts.T(), emailIdentities, 1)
	require.Equal(ts.T(), "admin-new@example.com", emailIdentities[0].GetEmail())
}
