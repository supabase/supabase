package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	linkedinUser             string = `{"id":"linkedinTestId","firstName":{"localized":{"en_US":"Linkedin"},"preferredLocale":{"country":"US","language":"en"}},"lastName":{"localized":{"en_US":"Test"},"preferredLocale":{"country":"US","language":"en"}},"profilePicture":{"displayImage~":{"elements":[{"identifiers":[{"identifier":"http://example.com/avatar"}]}]}}}`
	linkedinUserNoProfilePic string = `{"id":"linkedinTestId","firstName":{"localized":{"en_US":"Linkedin"},"preferredLocale":{"country":"US","language":"en"}},"lastName":{"localized":{"en_US":"Test"},"preferredLocale":{"country":"US","language":"en"}},"profilePicture":{"displayImage~":{"elements":[]}}}`
	linkedinEmail            string = `{"elements": [{"handle": "","handle~": {"emailAddress": "linkedin@example.com"}}]}`
	linkedinWrongEmail       string = `{"elements": [{"handle": "","handle~": {"emailAddress": "other@example.com"}}]}`
)

func (ts *ExternalTestSuite) TestSignupExternalLinkedin() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=linkedin", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Linkedin.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Linkedin.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("r_emailaddress r_liteprofile", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "linkedin")
}

func LinkedinTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string, email string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth/v2/accessToken":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Linkedin.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"linkedin_token","expires_in":100000}`)
		case "/v2/me":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		case "/v2/emailAddress":
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, email)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown linkedin oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Linkedin.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalLinkedin_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUser, linkedinEmail)
	defer server.Close()

	u := performAuthorization(ts, "linkedin", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "linkedin@example.com", "Linkedin Test", "linkedinTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalLinkedinDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUser, linkedinEmail)
	defer server.Close()

	u := performAuthorization(ts, "linkedin", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "linkedin@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalLinkedinDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("linkedinTestId", "linkedin@example.com", "Linkedin Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUser, linkedinEmail)
	defer server.Close()

	u := performAuthorization(ts, "linkedin", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "linkedin@example.com", "Linkedin Test", "linkedinTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalLinkedinSuccessWhenMatchingToken() {
	// name and avatar should be populated from Linkedin API
	ts.createUser("linkedinTestId", "linkedin@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUser, linkedinEmail)
	defer server.Close()

	u := performAuthorization(ts, "linkedin", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "linkedin@example.com", "Linkedin Test", "linkedinTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalLinkedinErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUser, linkedinEmail)
	defer server.Close()

	w := performAuthorizationRequest(ts, "linkedin", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalLinkedinErrorWhenWrongToken() {
	ts.createUser("linkedinTestId", "linkedin@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUser, linkedinEmail)
	defer server.Close()

	w := performAuthorizationRequest(ts, "linkedin", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalLinkedinErrorWhenEmailDoesntMatch() {
	ts.createUser("linkedinTestId", "linkedin@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUser, linkedinWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "linkedin", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}

func (ts *ExternalTestSuite) TestSignupExternalLinkedin_MissingProfilePic() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := LinkedinTestSignupSetup(ts, &tokenCount, &userCount, code, linkedinUserNoProfilePic, linkedinEmail)
	defer server.Close()

	u := performAuthorization(ts, "linkedin", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "linkedin@example.com", "Linkedin Test", "linkedinTestId", "")
}
