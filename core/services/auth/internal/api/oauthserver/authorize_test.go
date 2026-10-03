package oauthserver

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gobwas/glob"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/shared"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
	"github.com/supabase/auth/internal/tokens"
)

func TestValidateRequestOrigin(t *testing.T) {
	// Setup test configuration
	globalConfig, err := confload.LoadGlobal(oauthServerTestConfig)
	require.NoError(t, err)

	// Set up test site URL for validation
	globalConfig.SiteURL = "https://example.com"
	globalConfig.URIAllowList = []string{
		"http://localhost:3000",
		"https://app.example.com",
	}

	// Set up URIAllowListMap manually for testing
	globalConfig.URIAllowListMap = make(map[string]glob.Glob)
	for _, uri := range globalConfig.URIAllowList {
		g := glob.MustCompile(uri, '.', '/')
		globalConfig.URIAllowListMap[uri] = g
	}

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)
	defer conn.Close()

	hooksMgr := &v0hooks.Manager{}
	tokenService := tokens.NewService(globalConfig, hooksMgr)
	server := NewServer(globalConfig, conn, tokenService)

	tests := []struct {
		name         string
		originHeader string
		expectError  bool
		errorMessage string
	}{
		{
			name:         "Empty Origin header should be allowed",
			originHeader: "",
			expectError:  false,
		},
		{
			name:         "Valid Origin matching site URL should be allowed",
			originHeader: "https://example.com",
			expectError:  false,
		},
		{
			name:         "Valid Origin with different path should be allowed",
			originHeader: "https://example.com/some/path",
			expectError:  false,
		},
		{
			name:         "Valid Origin matching allow list should be allowed",
			originHeader: "https://app.example.com",
			expectError:  false,
		},
		{
			name:         "Valid Origin with localhost should be allowed",
			originHeader: "http://localhost:3000",
			expectError:  false,
		},
		{
			name:         "Invalid Origin should be rejected",
			originHeader: "https://malicious.com",
			expectError:  true,
			errorMessage: "unauthorized request origin",
		},
		{
			name:         "Invalid Origin with IP address should be rejected",
			originHeader: "https://192.168.1.1",
			expectError:  true,
			errorMessage: "unauthorized request origin",
		},
		{
			name:         "Valid loopback IP should be allowed",
			originHeader: "http://127.0.0.1:3000",
			expectError:  false,
		},
		{
			name:         "Invalid Origin format should be rejected",
			originHeader: "not-a-valid-url",
			expectError:  true,
			errorMessage: "unauthorized request origin",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test request
			req := httptest.NewRequest(http.MethodGet, "/test", nil)

			// Set Origin header if provided
			if tt.originHeader != "" {
				req.Header.Set("Origin", tt.originHeader)
			}

			// Call validateRequestOrigin
			err := server.validateRequestOrigin(req)

			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMessage != "" {
					assert.Contains(t, err.Error(), tt.errorMessage)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateRequestOriginEdgeCases(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(oauthServerTestConfig)
	require.NoError(t, err)

	globalConfig.SiteURL = "https://example.com"

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)
	defer conn.Close()

	hooksMgr := &v0hooks.Manager{}
	tokenService := tokens.NewService(globalConfig, hooksMgr)
	server := NewServer(globalConfig, conn, tokenService)

	t.Run("Origin with different port on non-localhost should be rejected", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		req.Header.Set("Origin", "https://example.com:8080")

		// Must be rejected: port mismatch on a non-loopback host.
		// RFC 8252 Section 7.3 variable-port exception only applies to localhost.
		err := server.validateRequestOrigin(req)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "unauthorized request origin")
	})

	t.Run("Case sensitivity in Origin header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		req.Header.Set("Origin", "https://EXAMPLE.COM")

		// Should fail because hostname comparison is case-sensitive in URL parsing
		err := server.validateRequestOrigin(req)
		assert.Error(t, err)
	})

	t.Run("Origin with trailing slash should be handled", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		req.Header.Set("Origin", "https://example.com/")

		// Should pass - URL parsing should handle trailing slash correctly
		err := server.validateRequestOrigin(req)
		assert.NoError(t, err)
	})

	t.Run("Multiple Origin headers uses first one", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		// Add multiple Origin headers
		req.Header.Add("Origin", "https://example.com")   // First header (valid)
		req.Header.Add("Origin", "https://malicious.com") // Second header (invalid)

		// Go's http.Header.Get() returns only the first header value
		// So this should pass because first Origin is valid
		err := server.validateRequestOrigin(req)
		assert.NoError(t, err)
	})

	t.Run("Comma-separated origins in single header should fail", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		// Manually create comma-separated Origin header (malformed)
		req.Header.Set("Origin", "https://example.com,https://malicious.com")

		// This should fail because comma-separated origins is not a valid Origin header format
		err := server.validateRequestOrigin(req)
		assert.Error(t, err)
	})
}

type OAuthAuthorizeTestSuite struct {
	suite.Suite
	Server *Server
	Config *conf.GlobalConfiguration
	DB     *storage.Connection
}

func TestOAuthAuthorize(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(oauthServerTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	globalConfig.OAuthServer.Enabled = true
	globalConfig.OAuthServer.AllowDynamicRegistration = true
	if globalConfig.OAuthServer.AuthorizationTTL == 0 {
		globalConfig.OAuthServer.AuthorizationTTL = 10 * time.Minute
	}
	// OAuthServerAuthorize bails to a server_error redirect if this is empty.
	if globalConfig.OAuthServer.AuthorizationPath == "" {
		globalConfig.OAuthServer.AuthorizationPath = "/oauth/authorize-frontend"
	}

	hooksMgr := &v0hooks.Manager{}
	tokenService := tokens.NewService(globalConfig, hooksMgr)
	server := NewServer(globalConfig, conn, tokenService)

	ts := &OAuthAuthorizeTestSuite{
		Server: server,
		Config: globalConfig,
		DB:     conn,
	}
	defer ts.DB.Close()

	suite.Run(t, ts)
}

func (ts *OAuthAuthorizeTestSuite) SetupTest() {
	require.NoError(ts.T(), models.TruncateAll(ts.DB))
	ts.Config.OAuthServer.Enabled = true
	ts.Config.OAuthServer.AllowDynamicRegistration = true
}

// ---------- helpers ----------

func (ts *OAuthAuthorizeTestSuite) createUser(email string) *models.User {
	u, err := models.NewUser("", email, "password123", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.DB.Create(u))
	return u
}

func (ts *OAuthAuthorizeTestSuite) createClient() *models.OAuthServerClient {
	params := &OAuthServerClientRegisterParams{
		ClientName:       "Test Authorize Client",
		RedirectURIs:     []string{"https://example.com/callback"},
		RegistrationType: "dynamic",
	}
	client, _, err := ts.Server.registerOAuthServerClient(context.Background(), params)
	require.NoError(ts.T(), err)
	return client
}

// createAuthorization creates an authorization using the OAuthServerAuthorize handler
func (ts *OAuthAuthorizeTestSuite) createAuthorization(clientID uuid.UUID, scope string) *models.OAuthServerAuthorization {
	q := url.Values{
		"client_id":             []string{clientID.String()},
		"redirect_uri":          []string{"https://example.com/callback"},
		"scope":                 []string{scope},
		"code_challenge":        []string{"abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG"},
		"code_challenge_method": []string{"S256"},
	}
	req := httptest.NewRequest(http.MethodGet, "/oauth/authorize?"+q.Encode(), nil)
	w := httptest.NewRecorder()
	require.NoError(ts.T(), ts.Server.OAuthServerAuthorize(w, req))
	require.Equal(ts.T(), http.StatusFound, w.Code, "authorize: %s", w.Body.String())

	loc, err := url.Parse(w.Header().Get("Location"))
	require.NoError(ts.T(), err)
	authID := loc.Query().Get("authorization_id")
	require.NotEmpty(ts.T(), authID, "authorize redirect missing authorization_id (got %q, error=%q)",
		w.Header().Get("Location"), loc.Query().Get("error"))
	return ts.reload(authID)
}

// expireAuthorization pushes expires_at into the past so IsExpired() returns true
func (ts *OAuthAuthorizeTestSuite) expireAuthorization(authorizationID string) {
	require.NoError(ts.T(), ts.DB.RawQuery(
		"UPDATE oauth_authorizations SET created_at = now() - interval '2 hours', expires_at = now() - interval '1 hour' WHERE authorization_id = ?",
		authorizationID,
	).Exec())
}

// newRequest builds a request with the authorization_id and the user attached.
func (ts *OAuthAuthorizeTestSuite) newRequest(method, authorizationID string, user *models.User, body []byte) *http.Request {
	req := httptest.NewRequest(method, "/oauth/authorizations/"+authorizationID, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("authorization_id", authorizationID)
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	if user != nil {
		ctx = shared.WithUser(ctx, user)
	}
	return req.WithContext(ctx)
}

func (ts *OAuthAuthorizeTestSuite) assertHTTPError(err error, status int, code apierrors.ErrorCode) {
	ts.T().Helper()
	httpErr, ok := err.(*apierrors.HTTPError)
	require.True(ts.T(), ok, "expected *apierrors.HTTPError, got %T (%v)", err, err)
	assert.Equal(ts.T(), status, httpErr.HTTPStatus)
	assert.Equal(ts.T(), string(code), httpErr.ErrorCode)
}

func (ts *OAuthAuthorizeTestSuite) reload(authorizationID string) *models.OAuthServerAuthorization {
	a, err := models.FindOAuthServerAuthorizationByID(ts.DB, authorizationID)
	require.NoError(ts.T(), err)
	return a
}

// ---------- OAuthServerGetAuthorization ----------

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_SetsUserAndReturnsDetails() {
	user := ts.createUser("get-details@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid profile")

	req := ts.newRequest(http.MethodGet, auth.AuthorizationID, user, nil)
	w := httptest.NewRecorder()

	require.NoError(ts.T(), ts.Server.OAuthServerGetAuthorization(w, req))
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var resp AuthorizationDetailsResponse
	require.NoError(ts.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(ts.T(), auth.AuthorizationID, resp.AuthorizationID)
	assert.Equal(ts.T(), client.ID.String(), resp.Client.ID)
	assert.Equal(ts.T(), "Test Authorize Client", resp.Client.Name)
	assert.Equal(ts.T(), user.ID.String(), resp.User.ID)
	assert.Equal(ts.T(), "openid profile", resp.Scope)

	var maybeConsent ConsentResponse
	_ = json.Unmarshal(w.Body.Bytes(), &maybeConsent)
	assert.Empty(ts.T(), maybeConsent.RedirectURL, "should not have auto-approved without consent")

	reloaded := ts.reload(auth.AuthorizationID)
	require.NotNil(ts.T(), reloaded.UserID)
	assert.Equal(ts.T(), user.ID, *reloaded.UserID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationPending, reloaded.Status)
	assert.Nil(ts.T(), reloaded.AuthorizationCode)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_AutoApprovesWhenConsentCoversScopes() {
	user := ts.createUser("auto-approve@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid profile")

	consent := models.NewOAuthServerConsent(user.ID, client.ID, []string{"openid", "profile"})
	require.NoError(ts.T(), models.UpsertOAuthServerConsent(ts.DB, consent))

	req := ts.newRequest(http.MethodGet, auth.AuthorizationID, user, nil)
	w := httptest.NewRecorder()

	require.NoError(ts.T(), ts.Server.OAuthServerGetAuthorization(w, req))
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var resp ConsentResponse
	require.NoError(ts.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	require.NotEmpty(ts.T(), resp.RedirectURL)
	parsed, err := url.Parse(resp.RedirectURL)
	require.NoError(ts.T(), err)
	assert.NotEmpty(ts.T(), parsed.Query().Get("code"), "redirect_url must carry an authorization code")

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationApproved, reloaded.Status)
	require.NotNil(ts.T(), reloaded.AuthorizationCode)
	assert.NotEmpty(ts.T(), *reloaded.AuthorizationCode)
	assert.NotNil(ts.T(), reloaded.ApprovedAt)
	require.NotNil(ts.T(), reloaded.UserID)
	assert.Equal(ts.T(), user.ID, *reloaded.UserID)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_ConsentDoesNotCoverScopes() {
	user := ts.createUser("partial-consent@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid profile")

	// Consent only covers "openid" — missing "profile".
	consent := models.NewOAuthServerConsent(user.ID, client.ID, []string{"openid"})
	require.NoError(ts.T(), models.UpsertOAuthServerConsent(ts.DB, consent))

	req := ts.newRequest(http.MethodGet, auth.AuthorizationID, user, nil)
	w := httptest.NewRecorder()

	require.NoError(ts.T(), ts.Server.OAuthServerGetAuthorization(w, req))
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var resp AuthorizationDetailsResponse
	require.NoError(ts.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(ts.T(), client.ID.String(), resp.Client.ID)

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationPending, reloaded.Status)
	assert.Nil(ts.T(), reloaded.AuthorizationCode)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_SameUserRepeatCall() {
	user := ts.createUser("repeat@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid profile")

	for i := range 2 {
		req := ts.newRequest(http.MethodGet, auth.AuthorizationID, user, nil)
		w := httptest.NewRecorder()
		require.NoError(ts.T(), ts.Server.OAuthServerGetAuthorization(w, req), "call %d", i)
		assert.Equal(ts.T(), http.StatusOK, w.Code, "call %d", i)

		var resp AuthorizationDetailsResponse
		require.NoError(ts.T(), json.Unmarshal(w.Body.Bytes(), &resp), "call %d", i)
		assert.Equal(ts.T(), auth.AuthorizationID, resp.AuthorizationID, "call %d", i)
	}

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationPending, reloaded.Status)
	require.NotNil(ts.T(), reloaded.UserID)
	assert.Equal(ts.T(), user.ID, *reloaded.UserID)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_DifferentUserReturnsNotFound() {
	owner := ts.createUser("owner@example.com")
	otherUser := ts.createUser("other-user@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	require.NoError(ts.T(), auth.SetUser(ts.DB, owner.ID))

	req := ts.newRequest(http.MethodGet, auth.AuthorizationID, otherUser, nil)
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerGetAuthorization(w, req)
	ts.assertHTTPError(err, http.StatusNotFound, apierrors.ErrorCodeOAuthAuthorizationNotFound)

	reloaded := ts.reload(auth.AuthorizationID)
	require.NotNil(ts.T(), reloaded.UserID)
	assert.Equal(ts.T(), owner.ID, *reloaded.UserID, "row ownership should be unchanged")
	assert.Equal(ts.T(), models.OAuthServerAuthorizationPending, reloaded.Status)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_ExpiredCommitsMarkExpired() {
	user := ts.createUser("expired-get@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	ts.expireAuthorization(auth.AuthorizationID)

	req := ts.newRequest(http.MethodGet, auth.AuthorizationID, user, nil)
	w := httptest.NewRecorder()

	// Expired path returns a CommitWithError so MarkExpired persists.
	err := ts.Server.OAuthServerGetAuthorization(w, req)
	cwe, ok := err.(*storage.CommitWithError)
	require.True(ts.T(), ok, "expected *storage.CommitWithError, got %T (%v)", err, err)
	ts.assertHTTPError(cwe.Err, http.StatusNotFound, apierrors.ErrorCodeOAuthAuthorizationNotFound)

	// The MarkExpired update must be committed even though the handler
	// returns an error — otherwise an expired row would remain pending.
	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationExpired, reloaded.Status)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_NonPendingStatusRejected() {
	user := ts.createUser("non-pending-get@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	require.NoError(ts.T(), auth.SetUser(ts.DB, user.ID))
	require.NoError(ts.T(), auth.Deny(ts.DB))

	req := ts.newRequest(http.MethodGet, auth.AuthorizationID, user, nil)
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerGetAuthorization(w, req)
	ts.assertHTTPError(err, http.StatusBadRequest, apierrors.ErrorCodeValidationFailed)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_UnknownAuthorizationID() {
	user := ts.createUser("unknown-get@example.com")

	req := ts.newRequest(http.MethodGet, "nonexistent-authorization-id", user, nil)
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerGetAuthorization(w, req)
	ts.assertHTTPError(err, http.StatusNotFound, apierrors.ErrorCodeOAuthAuthorizationNotFound)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_MissingAuthorizationID() {
	user := ts.createUser("missing-get@example.com")

	req := ts.newRequest(http.MethodGet, "", user, nil)
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerGetAuthorization(w, req)
	ts.assertHTTPError(err, http.StatusBadRequest, apierrors.ErrorCodeValidationFailed)
}

func (ts *OAuthAuthorizeTestSuite) TestGetAuthorization_NoUserInContext() {
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")

	req := ts.newRequest(http.MethodGet, auth.AuthorizationID, nil, nil)
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerGetAuthorization(w, req)
	ts.assertHTTPError(err, http.StatusForbidden, apierrors.ErrorCodeBadJWT)
}

// ---------- OAuthServerConsent ----------

func consentBody(action OAuthServerConsentAction) []byte {
	b, _ := json.Marshal(ConsentRequest{Action: action})
	return b
}

func (ts *OAuthAuthorizeTestSuite) TestConsent_ApproveIssuesCodeAndStoresConsent() {
	user := ts.createUser("consent-approve@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid profile")
	require.NoError(ts.T(), auth.SetUser(ts.DB, user.ID))

	req := ts.newRequest(http.MethodPost, auth.AuthorizationID, user, consentBody(OAuthServerConsentActionApprove))
	w := httptest.NewRecorder()

	require.NoError(ts.T(), ts.Server.OAuthServerConsent(w, req))
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var resp ConsentResponse
	require.NoError(ts.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	require.NotEmpty(ts.T(), resp.RedirectURL)
	parsed, err := url.Parse(resp.RedirectURL)
	require.NoError(ts.T(), err)
	assert.NotEmpty(ts.T(), parsed.Query().Get("code"), "approve should return redirect with code")
	assert.Empty(ts.T(), parsed.Query().Get("error"))

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationApproved, reloaded.Status)
	require.NotNil(ts.T(), reloaded.AuthorizationCode)
	assert.NotEmpty(ts.T(), *reloaded.AuthorizationCode)

	stored, err := models.FindActiveOAuthServerConsentByUserAndClient(ts.DB, user.ID, client.ID)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), stored)
	assert.True(ts.T(), stored.HasAllScopes([]string{"openid", "profile"}))
}

func (ts *OAuthAuthorizeTestSuite) TestConsent_DenyReturnsAccessDenied() {
	user := ts.createUser("consent-deny@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	require.NoError(ts.T(), auth.SetUser(ts.DB, user.ID))

	req := ts.newRequest(http.MethodPost, auth.AuthorizationID, user, consentBody(OAuthServerConsentActionDeny))
	w := httptest.NewRecorder()

	require.NoError(ts.T(), ts.Server.OAuthServerConsent(w, req))
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var resp ConsentResponse
	require.NoError(ts.T(), json.Unmarshal(w.Body.Bytes(), &resp))
	require.NotEmpty(ts.T(), resp.RedirectURL)
	parsed, err := url.Parse(resp.RedirectURL)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), oAuth2ErrorAccessDenied, parsed.Query().Get("error"))
	assert.Empty(ts.T(), parsed.Query().Get("code"))

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationDenied, reloaded.Status)

	// Deny must NOT upsert a consent record.
	stored, err := models.FindActiveOAuthServerConsentByUserAndClient(ts.DB, user.ID, client.ID)
	require.NoError(ts.T(), err)
	assert.Nil(ts.T(), stored)
}

func (ts *OAuthAuthorizeTestSuite) TestConsent_UserIDMismatchReturnsNotFound() {
	owner := ts.createUser("consent-owner@example.com")
	otherUser := ts.createUser("consent-other-user@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	require.NoError(ts.T(), auth.SetUser(ts.DB, owner.ID))

	req := ts.newRequest(http.MethodPost, auth.AuthorizationID, otherUser, consentBody(OAuthServerConsentActionApprove))
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerConsent(w, req)
	ts.assertHTTPError(err, http.StatusNotFound, apierrors.ErrorCodeOAuthAuthorizationNotFound)

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationPending, reloaded.Status, "row must be untouched")
	assert.Nil(ts.T(), reloaded.AuthorizationCode)
}

func (ts *OAuthAuthorizeTestSuite) TestConsent_UserIDNilReturnsNotFound() {
	user := ts.createUser("consent-nil@example.com")
	client := ts.createClient()
	// No UserID set — user never went through GetAuthorization first.
	auth := ts.createAuthorization(client.ID, "openid")

	req := ts.newRequest(http.MethodPost, auth.AuthorizationID, user, consentBody(OAuthServerConsentActionApprove))
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerConsent(w, req)
	ts.assertHTTPError(err, http.StatusNotFound, apierrors.ErrorCodeOAuthAuthorizationNotFound)

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Nil(ts.T(), reloaded.UserID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationPending, reloaded.Status)
}

func (ts *OAuthAuthorizeTestSuite) TestConsent_ExpiredCommitsMarkExpired() {
	user := ts.createUser("consent-expired@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	require.NoError(ts.T(), auth.SetUser(ts.DB, user.ID))
	ts.expireAuthorization(auth.AuthorizationID)

	req := ts.newRequest(http.MethodPost, auth.AuthorizationID, user, consentBody(OAuthServerConsentActionApprove))
	w := httptest.NewRecorder()

	// Expired path returns a CommitWithError so MarkExpired persists.
	err := ts.Server.OAuthServerConsent(w, req)
	cwe, ok := err.(*storage.CommitWithError)
	require.True(ts.T(), ok, "expected *storage.CommitWithError, got %T (%v)", err, err)
	ts.assertHTTPError(cwe.Err, http.StatusNotFound, apierrors.ErrorCodeOAuthAuthorizationNotFound)

	reloaded := ts.reload(auth.AuthorizationID)
	assert.Equal(ts.T(), models.OAuthServerAuthorizationExpired, reloaded.Status,
		"MarkExpired update must be committed via NewCommitWithError")
}

func (ts *OAuthAuthorizeTestSuite) TestConsent_NonPendingStatusRejected() {
	user := ts.createUser("consent-nonpending@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	require.NoError(ts.T(), auth.SetUser(ts.DB, user.ID))
	require.NoError(ts.T(), auth.Approve(ts.DB))

	req := ts.newRequest(http.MethodPost, auth.AuthorizationID, user, consentBody(OAuthServerConsentActionApprove))
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerConsent(w, req)
	ts.assertHTTPError(err, http.StatusBadRequest, apierrors.ErrorCodeValidationFailed)
}

func (ts *OAuthAuthorizeTestSuite) TestConsent_InvalidActionRejected() {
	user := ts.createUser("consent-invalid-action@example.com")
	client := ts.createClient()
	auth := ts.createAuthorization(client.ID, "openid")
	require.NoError(ts.T(), auth.SetUser(ts.DB, user.ID))

	body, _ := json.Marshal(map[string]string{"action": "maybe"})
	req := ts.newRequest(http.MethodPost, auth.AuthorizationID, user, body)
	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerConsent(w, req)
	ts.assertHTTPError(err, http.StatusBadRequest, apierrors.ErrorCodeValidationFailed)
}
