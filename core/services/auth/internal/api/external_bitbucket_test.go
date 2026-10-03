package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	bitbucketUser string = `{"uuid":"bitbucketTestId","display_name":"Bitbucket Test","avatar":{"href":"http://example.com/avatar"}}`
)

func (ts *ExternalTestSuite) TestSignupExternalBitbucket() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=bitbucket", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Bitbucket.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Bitbucket.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("account email", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "bitbucket")
}

func BitbucketTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string, emails string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/site/oauth2/access_token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Bitbucket.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"bitbucket_token","expires_in":100000}`)
		case "/2.0/user":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		case "/2.0/user/emails":
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, emails)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown bitbucket oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Bitbucket.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalBitbucket_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `{"values":[{"email":"bitbucket@example.com","is_primary":true,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	u := performAuthorization(ts, "bitbucket", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "bitbucket@example.com", "Bitbucket Test", "bitbucketTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalBitbucketDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	bitbucketUser := `{"display_name":"Bitbucket Test","avatar":{"href":"http://example.com/avatar"}}`
	emails := `{"values":[{"email":"bitbucket@example.com","is_primary":true,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	u := performAuthorization(ts, "bitbucket", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "bitbucket@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalBitbucketDisableSignupErrorWhenNoEmail() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `{"values":[{}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	u := performAuthorization(ts, "bitbucket", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "bitbucket@example.com")

}

func (ts *ExternalTestSuite) TestSignupExternalBitbucketDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("bitbucketTestId", "bitbucket@example.com", "Bitbucket Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `{"values":[{"email":"bitbucket@example.com","is_primary":true,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	u := performAuthorization(ts, "bitbucket", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "bitbucket@example.com", "Bitbucket Test", "bitbucketTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalBitbucketDisableSignupSuccessWithSecondaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("bitbucketTestId", "secondary@example.com", "Bitbucket Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `{"values":[{"email":"primary@example.com","is_primary":true,"is_confirmed":true},{"email":"secondary@example.com","is_primary":false,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	u := performAuthorization(ts, "bitbucket", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "secondary@example.com", "Bitbucket Test", "bitbucketTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalBitbucketSuccessWhenMatchingToken() {
	// name and avatar should be populated from Bitbucket API
	ts.createUser("bitbucketTestId", "bitbucket@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `{"values":[{"email":"bitbucket@example.com","is_primary":true,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	u := performAuthorization(ts, "bitbucket", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "bitbucket@example.com", "Bitbucket Test", "bitbucketTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalBitbucketErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	bitbucketUser := `{"display_name":"Bitbucket Test","avatar":{"href":"http://example.com/avatar"}}`
	emails := `{"values":[{"email":"bitbucket@example.com","is_primary":true,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	w := performAuthorizationRequest(ts, "bitbucket", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalBitbucketErrorWhenWrongToken() {
	ts.createUser("bitbucketTestId", "bitbucket@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	bitbucketUser := `{"display_name":"Bitbucket Test","avatar":{"href":"http://example.com/avatar"}}`
	emails := `{"values":[{"email":"bitbucket@example.com","is_primary":true,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	w := performAuthorizationRequest(ts, "bitbucket", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalBitbucketErrorWhenEmailDoesntMatch() {
	ts.createUser("bitbucketTestId", "bitbucket@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `{"values":[{"email":"other@example.com","is_primary":true,"is_confirmed":true}]}`
	server := BitbucketTestSignupSetup(ts, &tokenCount, &userCount, code, bitbucketUser, emails)
	defer server.Close()

	u := performAuthorization(ts, "bitbucket", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
