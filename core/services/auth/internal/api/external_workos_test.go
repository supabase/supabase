package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	workosUser           string = `{"id":"test_prof_workos","first_name":"John","last_name":"Doe","email":"workos@example.com","connection_id":"test_conn_1","organization_id":"test_org_1","connection_type":"test","idp_id":"test_idp_1","object": "profile","raw_attributes": {}}`
	workosUserWrongEmail string = `{"id":"test_prof_workos","first_name":"John","last_name":"Doe","email":"other@example.com","connection_id":"test_conn_1","organization_id":"test_org_1","connection_type":"test","idp_id":"test_idp_1","object": "profile","raw_attributes": {}}`
	workosUserNoEmail    string = `{"id":"test_prof_workos","first_name":"John","last_name":"Doe","connection_id":"test_conn_1","organization_id":"test_org_1","connection_type":"test","idp_id":"test_idp_1","object": "profile","raw_attributes": {}}`
)

func (ts *ExternalTestSuite) TestSignupExternalWorkOSWithConnection() {
	connection := "test_connection_id"
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("http://localhost/authorize?provider=workos&connection=%s", connection), nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.WorkOS.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.WorkOS.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("", q.Get("scope"))
	ts.Equal(connection, q.Get("connection"))

	assertValidOAuthState(ts, q.Get("state"), "workos")
}

func (ts *ExternalTestSuite) TestSignupExternalWorkOSWithOrganization() {
	organization := "test_organization_id"
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("http://localhost/authorize?provider=workos&organization=%s", organization), nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.WorkOS.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.WorkOS.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("", q.Get("scope"))
	ts.Equal(organization, q.Get("organization"))

	assertValidOAuthState(ts, q.Get("state"), "workos")
}

func (ts *ExternalTestSuite) TestSignupExternalWorkOSWithProvider() {
	provider := "test_provider"
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("http://localhost/authorize?provider=workos&workos_provider=%s", provider), nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.WorkOS.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.WorkOS.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("", q.Get("scope"))
	ts.Equal(provider, q.Get("provider"))

	assertValidOAuthState(ts, q.Get("state"), "workos")
}

func WorkosTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/sso/token":
			// WorkOS returns the user data along with the token.
			*tokenCount++
			*userCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.WorkOS.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprintf(w, `{"access_token":"workos_token","expires_in":100000,"profile":%s}`, user)
		default:
			fmt.Printf("%s", r.URL.Path)
			w.WriteHeader(500)
			ts.Fail("unknown workos oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.WorkOS.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalWorkosAuthorizationCode() {
	ts.Config.DisableSignup = false

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUser)
	defer server.Close()

	u := performAuthorization(ts, "workos", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "workos@example.com", "John Doe", "test_prof_workos", "")
}

func (ts *ExternalTestSuite) TestSignupExternalWorkosDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUser)
	defer server.Close()

	u := performAuthorization(ts, "workos", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "workos@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalWorkosDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "workos", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "workos@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalWorkosDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("test_prof_workos", "workos@example.com", "John Doe", "", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUser)
	defer server.Close()

	u := performAuthorization(ts, "workos", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "workos@example.com", "John Doe", "test_prof_workos", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalWorkosSuccessWhenMatchingToken() {
	ts.createUser("test_prof_workos", "workos@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUser)
	defer server.Close()

	u := performAuthorization(ts, "workos", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "workos@example.com", "John Doe", "test_prof_workos", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalWorkosErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "workos", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalWorkosErrorWhenWrongToken() {
	ts.createUser("test_prof_workos", "workos@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "workos", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalWorkosErrorWhenEmailDoesntMatch() {
	ts.createUser("test_prof_workos", "workos@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := WorkosTestSignupSetup(ts, &tokenCount, &userCount, code, workosUserWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "workos", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
