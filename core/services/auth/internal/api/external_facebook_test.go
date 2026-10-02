package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	facebookUser           string = `{"id":"facebookTestId","name":"Facebook Test","first_name":"Facebook","last_name":"Test","email":"facebook@example.com","picture":{"data":{"url":"http://example.com/avatar"}}}}`
	facebookUserWrongEmail string = `{"id":"facebookTestId","name":"Facebook Test","first_name":"Facebook","last_name":"Test","email":"other@example.com","picture":{"data":{"url":"http://example.com/avatar"}}}}`
	facebookUserNoEmail    string = `{"id":"facebookTestId","name":"Facebook Test","first_name":"Facebook","last_name":"Test","picture":{"data":{"url":"http://example.com/avatar"}}}}`
)

func (ts *ExternalTestSuite) TestSignupExternalFacebook() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=facebook", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Facebook.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Facebook.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("email", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "facebook")
}

func FacebookTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth/access_token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Facebook.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"facebook_token","expires_in":100000}`)
		case "/me":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown facebook oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Facebook.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalFacebook_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUser)
	defer server.Close()

	u := performAuthorization(ts, "facebook", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "facebook@example.com", "Facebook Test", "facebookTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalFacebookDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUser)
	defer server.Close()

	u := performAuthorization(ts, "facebook", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "facebook@example.com")
}
func (ts *ExternalTestSuite) TestSignupExternalFacebookDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "facebook", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "facebook@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalFacebookDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("facebookTestId", "facebook@example.com", "Facebook Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUser)
	defer server.Close()

	u := performAuthorization(ts, "facebook", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "facebook@example.com", "Facebook Test", "facebookTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFacebookSuccessWhenMatchingToken() {
	// name and avatar should be populated from Facebook API
	ts.createUser("facebookTestId", "facebook@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUser)
	defer server.Close()

	u := performAuthorization(ts, "facebook", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "facebook@example.com", "Facebook Test", "facebookTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFacebookErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "facebook", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFacebookErrorWhenWrongToken() {
	ts.createUser("facebookTestId", "facebook@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "facebook", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFacebookErrorWhenEmailDoesntMatch() {
	ts.createUser("facebookTestId", "facebook@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := FacebookTestSignupSetup(ts, &tokenCount, &userCount, code, facebookUserWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "facebook", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
