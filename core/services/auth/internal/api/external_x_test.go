package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	xUser           string = `{"data":{"id":"xTestId","name":"X Test","username":"xtest","confirmed_email":"x@example.com","profile_image_url":"https://pbs.twimg.com/profile_images/test.jpg","url":"https://example.com","created_at":"2020-01-01T00:00:00.000Z"}}`
	xUserWrongEmail string = `{"data":{"id":"xTestId","name":"X Test","username":"xtest","confirmed_email":"other@example.com","profile_image_url":"https://pbs.twimg.com/profile_images/test.jpg","url":"https://example.com","created_at":"2020-01-01T00:00:00.000Z"}}`
	xUserNoEmail    string = `{"data":{"id":"xTestId","name":"X Test","username":"xtest","profile_image_url":"https://pbs.twimg.com/profile_images/test.jpg","url":"https://example.com","created_at":"2020-01-01T00:00:00.000Z"}}`
)

func (ts *ExternalTestSuite) TestSignupExternalX() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=x", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.X.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.X.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("users.email tweet.read users.read offline.access", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "x")
}

func XTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/2/oauth2/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.X.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"x_token","expires_in":100000}`)
		case "/2/users/me":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown X oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.X.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalX_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUser)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "x@example.com", "X Test", "xTestId", "https://pbs.twimg.com/profile_images/test.jpg")
}

func (ts *ExternalTestSuite) TestSignupExternalX_AuthorizationCode_NoEmailWithEmailOptional() {
	// When EmailOptional is true, signup should succeed without email
	ts.Config.DisableSignup = false
	ts.Config.External.X.EmailOptional = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "", "X Test", "xTestId", "https://pbs.twimg.com/profile_images/test.jpg")
}

func (ts *ExternalTestSuite) TestSignupExternalX_AuthorizationCode_NoEmailWithoutEmailOptional() {
	// When EmailOptional is false, signup should fail without email
	ts.Config.DisableSignup = false
	ts.Config.External.X.EmailOptional = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "")
}

func (ts *ExternalTestSuite) TestSignupExternalXDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUser)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "x@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalXDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true
	ts.Config.External.X.EmailOptional = false

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "x@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalXDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("xTestId", "x@example.com", "X Test", "https://pbs.twimg.com/profile_images/test.jpg", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUser)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "x@example.com", "X Test", "xTestId", "https://pbs.twimg.com/profile_images/test.jpg")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalXSuccessWhenMatchingToken() {
	// name and avatar should be populated from X API
	ts.createUser("xTestId", "x@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUser)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "x@example.com", "X Test", "xTestId", "https://pbs.twimg.com/profile_images/test.jpg")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalXErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "x", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalXErrorWhenWrongToken() {
	ts.createUser("xTestId", "x@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "x", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalXErrorWhenEmailDoesntMatch() {
	ts.createUser("xTestId", "x@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := XTestSignupSetup(ts, &tokenCount, &userCount, code, xUserWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "x", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
