package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	keycloakUser        string = `{"sub": "keycloaktestid", "name": "Keycloak Test", "email": "keycloak@example.com", "preferred_username": "keycloak", "email_verified": true}`
	keycloakUserNoEmail string = `{"sub": "keycloaktestid", "name": "Keycloak Test", "preferred_username": "keycloak", "email_verified": false}`
)

func (ts *ExternalTestSuite) TestSignupExternalKeycloak() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=keycloak", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Keycloak.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Keycloak.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("profile email", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "keycloak")
}

func KeycloakTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/protocol/openid-connect/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Keycloak.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"keycloak_token","expires_in":100000}`)
		case "/protocol/openid-connect/userinfo":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown keycloak oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Keycloak.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalKeycloakWithoutURLSetup() {
	ts.createUser("keycloaktestid", "keycloak@example.com", "Keycloak Test", "", "")
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	ts.Config.External.Keycloak.URL = ""
	defer server.Close()

	w := performAuthorizationRequest(ts, "keycloak", code)
	ts.Equal(w.Code, http.StatusBadRequest)
}

func (ts *ExternalTestSuite) TestSignupExternalKeycloak_AuthorizationCode() {
	ts.Config.DisableSignup = false
	ts.createUser("keycloaktestid", "keycloak@example.com", "Keycloak Test", "", "")
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	defer server.Close()

	u := performAuthorization(ts, "keycloak", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "keycloak@example.com", "Keycloak Test", "keycloaktestid", "")
}

func (ts *ExternalTestSuite) TestSignupExternalKeycloakDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	defer server.Close()

	u := performAuthorization(ts, "keycloak", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "keycloak@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalKeycloakDisableSignupErrorWhenNoEmail() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "keycloak", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "keycloak@example.com")

}

func (ts *ExternalTestSuite) TestSignupExternalKeycloakDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("keycloaktestid", "keycloak@example.com", "Keycloak Test", "", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	defer server.Close()

	u := performAuthorization(ts, "keycloak", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "keycloak@example.com", "Keycloak Test", "keycloaktestid", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalKeycloakSuccessWhenMatchingToken() {
	// name and avatar should be populated from Keycloak API
	ts.createUser("keycloaktestid", "keycloak@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	defer server.Close()

	u := performAuthorization(ts, "keycloak", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "keycloak@example.com", "Keycloak Test", "keycloaktestid", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalKeycloakErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	keycloakUser := `{"name":"Keycloak Test","avatar":{"href":"http://example.com/avatar"}}`
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "keycloak", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalKeycloakErrorWhenWrongToken() {
	ts.createUser("keycloaktestid", "keycloak@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	keycloakUser := `{"name":"Keycloak Test","avatar":{"href":"http://example.com/avatar"}}`
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "keycloak", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalKeycloakErrorWhenEmailDoesntMatch() {
	ts.createUser("keycloaktestid", "keycloak@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	keycloakUser := `{"name":"Keycloak Test", "email":"other@example.com", "avatar":{"href":"http://example.com/avatar"}}`
	server := KeycloakTestSignupSetup(ts, &tokenCount, &userCount, code, keycloakUser)
	defer server.Close()

	u := performAuthorization(ts, "keycloak", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
