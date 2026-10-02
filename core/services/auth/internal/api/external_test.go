package api

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

type ExternalTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestExternal(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &ExternalTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *ExternalTestSuite) SetupTest() {
	ts.Config.DisableSignup = false
	ts.Config.Mailer.Autoconfirm = false

	models.TruncateAll(ts.API.db)
}

func (ts *ExternalTestSuite) TestAutomaticLinkIdentityWritesAuditLog() {
	existingUser, err := ts.createUser("", "automatic-link@example.com", "", "", "")
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), existingUser.Confirm(ts.API.db))

	userData := &provider.UserProvidedData{
		Metadata: &provider.Claims{
			Subject:       "automatic-link-subject",
			Email:         existingUser.GetEmail(),
			EmailVerified: true,
		},
		Emails: []provider.Email{{
			Email:    existingUser.GetEmail(),
			Primary:  true,
			Verified: true,
		}},
	}
	r := httptest.NewRequest(http.MethodGet, "/callback", nil)
	r.RemoteAddr = "192.0.2.1:1234"

	decision, user, err := ts.API.createAccountFromExternalIdentity(ts.API.db, r, userData, "google", false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.LinkAccount, decision)
	require.Equal(ts.T(), existingUser.ID, user.ID)

	identity, err := models.FindIdentityByIdAndProvider(ts.API.db, userData.Metadata.Subject, "google")
	require.NoError(ts.T(), err)
	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.IdentityLinkAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
	require.Equal(ts.T(), string(models.IdentityLinkAction), logs[0].Payload["action"])
	require.Equal(ts.T(), "user", logs[0].Payload["log_type"])
	traits, ok := logs[0].Payload["traits"].(map[string]any)
	require.True(ts.T(), ok)
	require.Equal(ts.T(), identity.ID.String(), traits["identity_id"])
	require.Equal(ts.T(), "google", traits["provider"])
	require.Equal(ts.T(), userData.Metadata.Subject, traits["provider_id"])
	require.Equal(ts.T(), "192.0.2.1", logs[0].IPAddress)

	decision, _, err = ts.API.createAccountFromExternalIdentity(ts.API.db, r, userData, "google", false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.AccountExists, decision)

	logs, err = models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.IdentityLinkAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1, "signing in with an existing identity must not emit another audit log")
}

func (ts *ExternalTestSuite) createUser(providerId string, email string, name string, avatar string, confirmationToken string) (*models.User, error) {
	// Cleanup existing user, if they already exist
	if u, _ := models.FindUserByEmailAndAudience(ts.API.db, email, ts.Config.JWT.Aud); u != nil {
		require.NoError(ts.T(), ts.API.db.Destroy(u), "Error deleting user")
	}

	userData := map[string]interface{}{"provider_id": providerId, "full_name": name}
	if avatar != "" {
		userData["avatar_url"] = avatar
	}
	u, err := models.NewUser("", email, "test", ts.Config.JWT.Aud, userData)

	if confirmationToken != "" {
		u.ConfirmationToken = confirmationToken
	}
	ts.Require().NoError(err, "Error making new user")
	ts.Require().NoError(ts.API.db.Create(u), "Error creating user")

	if confirmationToken != "" {
		ts.Require().NoError(models.CreateOneTimeToken(ts.API.db, u.ID, email, u.ConfirmationToken, models.ConfirmationToken, ts.Config.Mailer.OtpExpAsDuration(), true), "Error creating one-time confirmation/invite token")
	}

	i, err := models.NewIdentity(u, "email", map[string]interface{}{
		"sub":   u.ID.String(),
		"email": email,
	})
	ts.Require().NoError(err)
	ts.Require().NoError(ts.API.db.Create(i), "Error creating identity")

	return u, err
}

func (ts *ExternalTestSuite) createUserWithIdentity(providerType, providerId string, email string, name string, avatar string, confirmationToken string) (*models.User, error) {
	// Cleanup existing user, if they already exist
	if u, _ := models.FindUserByEmailAndAudience(ts.API.db, email, ts.Config.JWT.Aud); u != nil {
		require.NoError(ts.T(), ts.API.db.Destroy(u), "Error deleting user")
	}

	userData := map[string]interface{}{"provider_id": providerId, "full_name": name}
	if avatar != "" {
		userData["avatar_url"] = avatar
	}
	u, err := models.NewUser("", email, "test", ts.Config.JWT.Aud, userData)

	if confirmationToken != "" {
		u.ConfirmationToken = confirmationToken
	}
	ts.Require().NoError(err, "Error making new user")
	ts.Require().NoError(ts.API.db.Create(u), "Error creating user")

	if confirmationToken != "" {
		ts.Require().NoError(models.CreateOneTimeToken(ts.API.db, u.ID, email, u.ConfirmationToken, models.ConfirmationToken, ts.Config.Mailer.OtpExpAsDuration(), true), "Error creating one-time confirmation/invite token")
	}

	if email != "" {
		i, err := models.NewIdentity(u, "email", map[string]interface{}{
			"sub":   u.ID.String(),
			"email": email,
		})
		ts.Require().NoError(err)
		ts.Require().NoError(ts.API.db.Create(i), "Error creating identity")
	}

	i, err := models.NewIdentity(u, providerType, map[string]interface{}{
		"sub": providerId,
	})
	ts.Require().NoError(err)
	ts.Require().NoError(ts.API.db.Create(i), "Error creating identity")

	return u, err
}

func performAuthorizationRequest(ts *ExternalTestSuite, provider string, inviteToken string) *httptest.ResponseRecorder {
	authorizeURL := "http://localhost/authorize?provider=" + provider
	if inviteToken != "" {
		authorizeURL = authorizeURL + "&invite_token=" + inviteToken
	}

	req := httptest.NewRequest(http.MethodGet, authorizeURL, nil)
	req.Header.Set("Referer", "https://example.netlify.com/admin")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)

	return w
}

func performPKCEAuthorizationRequest(ts *ExternalTestSuite, provider, codeChallenge, codeChallengeMethod string) *httptest.ResponseRecorder {
	authorizeURL := "http://localhost/authorize?provider=" + provider
	if codeChallenge != "" {
		authorizeURL = authorizeURL + "&code_challenge=" + codeChallenge + "&code_challenge_method=" + codeChallengeMethod
	}

	req := httptest.NewRequest(http.MethodGet, authorizeURL, nil)
	req.Header.Set("Referer", "https://example.supabase.com/admin")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	return w
}

func performPKCEAuthorization(ts *ExternalTestSuite, provider, code, codeChallenge, codeChallengeMethod string) *url.URL {
	w := performPKCEAuthorizationRequest(ts, provider, codeChallenge, codeChallengeMethod)
	ts.Require().Equal(http.StatusFound, w.Code)
	// Get code and state from the redirect
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	state := q.Get("state")
	testURL, err := url.Parse("http://localhost/callback")
	ts.Require().NoError(err)
	v := testURL.Query()
	v.Set("code", code)
	v.Set("state", state)
	testURL.RawQuery = v.Encode()
	// Use the code to get a token
	req := httptest.NewRequest(http.MethodGet, testURL.String(), nil)
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err = url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")

	return u

}

func performAuthorization(ts *ExternalTestSuite, provider string, code string, inviteToken string) *url.URL {
	w := performAuthorizationRequest(ts, provider, inviteToken)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	state := q.Get("state")

	// auth server callback
	testURL, err := url.Parse("http://localhost/callback")
	ts.Require().NoError(err)
	v := testURL.Query()
	v.Set("code", code)
	v.Set("state", state)
	testURL.RawQuery = v.Encode()
	req := httptest.NewRequest(http.MethodGet, testURL.String(), nil)
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err = url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	ts.Require().Equal("/admin", u.Path)

	return u
}

func assertAuthorizationSuccess(ts *ExternalTestSuite, u *url.URL, tokenCount int, userCount int, email string, name string, providerId string, avatar string) {
	// ensure redirect has #access_token=...
	v, err := url.ParseQuery(u.RawQuery)
	ts.Require().NoError(err)
	ts.Require().Empty(v.Get("error_description"))
	ts.Require().Empty(v.Get("error"))

	v, err = url.ParseQuery(u.Fragment)
	ts.Require().NoError(err)
	ts.NotEmpty(v.Get("access_token"))
	ts.NotEmpty(v.Get("refresh_token"))
	ts.NotEmpty(v.Get("expires_in"))
	ts.Equal("bearer", v.Get("token_type"))
	// Verify Supabase Auth identifier is present
	ts.Contains(v, "sb", "Fragment should contain Supabase Auth identifier 'sb'")

	ts.Equal(1, tokenCount)
	if userCount > -1 {
		ts.Equal(1, userCount)
	}

	// ensure user has been created with metadata
	var user *models.User
	if email != "" {
		user, err = models.FindUserByEmailAndAudience(ts.API.db, email, ts.Config.JWT.Aud)
	} else {
		identity := &models.Identity{}
		err = ts.API.db.Q().Where("provider_id = ?", providerId).First(identity)
		ts.Require().NoError(err)

		user, err = models.FindUserByID(ts.API.db, identity.UserID)
	}

	ts.Require().NoError(err)
	ts.Equal(providerId, user.UserMetaData["provider_id"])
	ts.Equal(name, user.UserMetaData["full_name"])
	if avatar == "" {
		ts.Equal(nil, user.UserMetaData["avatar_url"])
	} else {
		ts.Equal(avatar, user.UserMetaData["avatar_url"])
	}
}

func assertAuthorizationFailure(ts *ExternalTestSuite, u *url.URL, errorDescription string, errorType string, email string) {
	// ensure new sign ups error
	v, err := url.ParseQuery(u.RawQuery)
	ts.Require().NoError(err)
	ts.Require().Equal(errorDescription, v.Get("error_description"))
	ts.Require().Equal(errorType, v.Get("error"))

	v, err = url.ParseQuery(u.Fragment)
	ts.Require().NoError(err)
	ts.Empty(v.Get("access_token"))
	ts.Empty(v.Get("refresh_token"))
	ts.Empty(v.Get("expires_in"))
	ts.Empty(v.Get("token_type"))
	// Verify Supabase Auth identifier is present even in error responses
	ts.Contains(v, "sb", "Fragment should contain Supabase Auth identifier 'sb' even in errors")

	// ensure user is nil
	user, err := models.FindUserByEmailAndAudience(ts.API.db, email, ts.Config.JWT.Aud)
	ts.Require().Error(err, "User not found")
	ts.Require().Nil(user)
}

// assertValidOAuthState verifies that the state parameter is a valid UUID
// and that a corresponding flow_state record exists in the database with the correct provider.
func assertValidOAuthState(ts *ExternalTestSuite, state string, expectedProvider string) {
	ts.Require().NotEmpty(state, "state should not be empty")

	// Verify state is a valid UUID
	stateUUID, err := uuid.FromString(state)
	require.NoError(ts.T(), err, "state should be a valid UUID")
	require.NotEqual(ts.T(), uuid.Nil, stateUUID, "state UUID should not be nil")

	// Verify flow state exists in database with correct provider
	flowState, err := models.FindFlowStateByID(ts.API.db, stateUUID.String())
	require.NoError(ts.T(), err, "flow state should exist in database")
	ts.Equal(expectedProvider, flowState.ProviderType, "flow state provider should match")
}

// TestSignupExternalUnsupported tests API /authorize for an unsupported external provider
func (ts *ExternalTestSuite) TestSignupExternalUnsupported() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=external", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Equal(w.Code, http.StatusBadRequest)
}

// TestAuthorizeStripsReservedOAuthParams verifies that OAuth params the auth
// server controls (see reservedOAuthParams in custom_oauth_admin.go) cannot
// be overridden by passing them as query params on the /authorize request -
// they must be stripped before being forwarded to the provider's authorize
// URL. code_challenge/code_challenge_method are exercised by the dedicated
// PKCE tests instead, since they go through separate validation.
func (ts *ExternalTestSuite) TestAuthorizeStripsReservedOAuthParams() {
	authorizeURL := "http://localhost/authorize?" + url.Values{
		"provider":      {"github"},
		"client_id":     {"attacker-client-id"},
		"client_secret": {"attacker-client-secret"},
		"redirect_uri":  {"https://evil.example/callback"},
		"response_type": {"token"},
		"state":         {"attacker-controlled-state"},
		"code_verifier": {"attacker-code-verifier"},
		"login_hint":    {"user@example.com"}, // non-reserved: should still pass through
	}.Encode()

	req := httptest.NewRequest(http.MethodGet, authorizeURL, nil)
	req.Header.Set("Referer", "https://example.netlify.com/admin")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)

	ts.Require().Equal(http.StatusFound, w.Code)

	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()

	// the auth server's own values are used, not the attacker-supplied ones
	ts.Equal("testclientid", q.Get("client_id"))
	ts.Equal("https://identity.services.netlify.com/callback", q.Get("redirect_uri"))
	ts.Equal("code", q.Get("response_type"))
	assertValidOAuthState(ts, q.Get("state"), "github")

	// none of the attacker-supplied reserved values made it through
	ts.Empty(q.Get("client_secret"), "client_secret should never be forwarded to the provider")
	ts.NotEqual("attacker-code-verifier", q.Get("code_verifier"))

	// a non-reserved param is still forwarded, proving the loop isn't
	// stripping everything
	ts.Equal("user@example.com", q.Get("login_hint"))
}

func (ts *ExternalTestSuite) TestRedirectErrorsShouldPreserveParams() {
	// Request with invalid external provider
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=external", nil)
	w := httptest.NewRecorder()
	cases := []struct {
		Desc         string
		RedirectURL  string
		QueryParams  []string
		ErrorMessage string
	}{
		{
			Desc:         "Should preserve redirect query params on error",
			RedirectURL:  "http://example.com/path?paramforpreservation=value2",
			QueryParams:  []string{"paramforpreservation"},
			ErrorMessage: "invalid_request",
		},
		{
			Desc:         "Error param should be overwritten",
			RedirectURL:  "http://example.com/path?error=abc",
			QueryParams:  []string{"error"},
			ErrorMessage: "invalid_request",
		},
	}
	for _, c := range cases {
		parsedURL, err := url.Parse(c.RedirectURL)
		require.Equal(ts.T(), err, nil)

		redirectErrors(ts.API.internalExternalProviderCallback, w, req, parsedURL)

		parsedParams, err := url.ParseQuery(parsedURL.RawQuery)
		require.Equal(ts.T(), err, nil)

		// An error and description should be returned
		expectedQueryParams := append(c.QueryParams, "error", "error_description")

		for _, expectedQueryParam := range expectedQueryParams {
			val, exists := parsedParams[expectedQueryParam]
			require.True(ts.T(), exists)
			if expectedQueryParam == "error" {
				require.Equal(ts.T(), val[0], c.ErrorMessage)
			}
		}
	}
}

// setupGenericOAuthServer creates a mock OAuth server for testing state format handling.
// It handles token exchange and user info endpoints for mock GitHub provider.
func setupGenericOAuthServer(ts *ExternalTestSuite, code string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/login/oauth/access_token":
			ts.Equal(code, r.FormValue("code"))
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"test_token","expires_in":100000}`)
		case "/api/v3/user":
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"id":123,"name":"Test User","avatar_url":"http://example.com/avatar"}`)
		case "/api/v3/user/emails":
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `[{"email":"test@example.com","primary":true,"verified":true}]`)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown oauth call %s", r.URL.Path)
		}
	}))
	ts.Config.External.Github.URL = server.URL
	return server
}

// TestOAuthState_UUIDFormat tests that the callback endpoint processes UUID state correctly.
func (ts *ExternalTestSuite) TestOAuthState_UUIDFormat() {
	code := "authcode"
	server := setupGenericOAuthServer(ts, code)
	defer server.Close()

	// Use the standard authorization flow which generates UUID state
	w := performAuthorizationRequest(ts, "github", "")
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err)

	state := u.Query().Get("state")
	ts.Require().NotEmpty(state)

	stateUUID, err := uuid.FromString(state)
	require.NoError(ts.T(), err, "state should be a valid UUID")
	require.NotEqual(ts.T(), uuid.Nil, stateUUID)

	testURL, err := url.Parse("http://localhost/callback")
	require.NoError(ts.T(), err)
	v := testURL.Query()
	v.Set("code", code)
	v.Set("state", state)
	testURL.RawQuery = v.Encode()

	req := httptest.NewRequest(http.MethodGet, testURL.String(), nil)
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)

	ts.Require().Equal(http.StatusFound, w.Code)
	resultURL, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err)

	fragment, err := url.ParseQuery(resultURL.Fragment)
	ts.Require().NoError(err)
	ts.NotEmpty(fragment.Get("access_token"), "UUID state should result in access_token")
}

// TestOAuthState_InvalidFormat tests that non-UUID state parameters are rejected.
func (ts *ExternalTestSuite) TestOAuthState_InvalidFormat() {
	code := "authcode"
	server := setupGenericOAuthServer(ts, code)
	defer server.Close()

	testURL, err := url.Parse("http://localhost/callback")
	require.NoError(ts.T(), err)
	v := testURL.Query()
	v.Set("code", code)
	v.Set("state", "not-a-valid-uuid")
	testURL.RawQuery = v.Encode()

	req := httptest.NewRequest(http.MethodGet, testURL.String(), nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)

	// Should redirect to site URL with error since state is invalid
	ts.Require().Equal(http.StatusSeeOther, w.Code)
}

// TestPKCEFlowStateReuseRejected verifies that a PKCE flow state cannot be reused
// after the OAuth callback has been completed
func (ts *ExternalTestSuite) TestPKCEFlowStateReuseRejected() {
	code := "authcode"
	server := setupGenericOAuthServer(ts, code)
	defer server.Close()

	codeVerifier := "testtesttesttesttesttesttesttesttesttesttesttesttesttest"
	hashedCodeVerifier := sha256.Sum256([]byte(codeVerifier))
	codeChallenge := base64.RawURLEncoding.EncodeToString(hashedCodeVerifier[:])

	// Step 1: Initiate PKCE authorization flow and extract the state parameter
	w := performPKCEAuthorizationRequest(ts, "github", codeChallenge, "s256")
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err)
	state := u.Query().Get("state")
	ts.Require().NotEmpty(state)

	// Step 2: First callback completes successfully (sets UserID on the flow state)
	callbackURL, err := url.Parse("http://localhost/callback")
	ts.Require().NoError(err)
	v := callbackURL.Query()
	v.Set("code", code)
	v.Set("state", state)
	callbackURL.RawQuery = v.Encode()

	req := httptest.NewRequest(http.MethodGet, callbackURL.String(), nil)
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)

	firstRedirect, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err)
	firstQuery, err := url.ParseQuery(firstRedirect.RawQuery)
	ts.Require().NoError(err)
	ts.Require().NotEmpty(firstQuery.Get("code"), "first callback should return an auth code")

	// Step 3: Second callback with the same state must be rejected
	req = httptest.NewRequest(http.MethodGet, callbackURL.String(), nil)
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)

	// The callback redirects errors to the redirect URL with error parameters
	redirectURL, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err)
	errorQuery, err := url.ParseQuery(redirectURL.RawQuery)
	ts.Require().NoError(err)
	ts.Contains(errorQuery.Get("error_description"), "already been used",
		"second callback with same state should be rejected as already used")
}

// startAfterUserCreatedHookServer points the after-user-created hook at a test
// server and returns its invocation count.
func startAfterUserCreatedHookServer(ts *ExternalTestSuite) (calls func() int, cleanup func()) {
	var mu sync.Mutex
	count := 0

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		count++
		mu.Unlock()

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{}`)
	}))

	ts.Config.Hook.AfterUserCreated = conf.ExtensibilityPointConfiguration{
		Enabled: true,
		URI:     server.URL,
	}

	calls = func() int {
		mu.Lock()
		defer mu.Unlock()
		return count
	}
	cleanup = func() {
		server.Close()
		ts.Config.Hook.AfterUserCreated = conf.ExtensibilityPointConfiguration{}
	}

	return calls, cleanup
}

// TestAfterUserCreatedHookOnlyFiresOnAccountCreation signs in twice with the same
// GitHub account and asserts the hook fires only for the first sign-in.
func (ts *ExternalTestSuite) TestAfterUserCreatedHookOnlyFiresOnAccountCreation() {
	hookCalls, cleanup := startAfterUserCreatedHookServer(ts)
	defer cleanup()

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")
	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "github@example.com", "GitHub Test", "123", "http://example.com/avatar")
	ts.Require().Equal(1, hookCalls())

	// Signing in again resolves to models.AccountExists.
	u = performAuthorization(ts, "github", code, "")
	v, err := url.ParseQuery(u.Fragment)
	ts.Require().NoError(err)
	ts.Require().NotEmpty(v.Get("access_token"), "second sign-in should succeed")

	ts.Require().Equal(1, hookCalls(), "hook must not fire again for a returning user")
}

// TestAfterUserCreatedHookNotFiredOnIdentityLinking signs in with GitHub as a user
// who already has an email identity and asserts the hook does not fire.
func (ts *ExternalTestSuite) TestAfterUserCreatedHookNotFiredOnIdentityLinking() {
	hookCalls, cleanup := startAfterUserCreatedHookServer(ts)
	defer cleanup()

	// The existing email identity makes this resolve to models.LinkAccount.
	_, err := ts.createUser("123", "github@example.com", "GitHub Test", "http://example.com/avatar", "")
	ts.Require().NoError(err)

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")
	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "github@example.com", "GitHub Test", "123", "http://example.com/avatar")

	ts.Require().Equal(0, hookCalls(), "hook must not fire when an identity is linked to an existing user")
}
