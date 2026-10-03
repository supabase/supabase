package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	zoomUser           string = `{"id":"zoomUserId","first_name":"John","last_name": "Doe","email": "zoom@example.com","verified": 1,"pic_url":"http://example.com/avatar"}`
	zoomUserWrongEmail string = `{"id":"zoomUserId","first_name":"John","last_name": "Doe","email": "other@example.com","verified": 1,"pic_url":"http://example.com/avatar"}`
	zoomUserNoEmail    string = `{"id":"zoomUserId","first_name":"John","last_name": "Doe","verified": 1,"pic_url":"http://example.com/avatar"}`
)

func (ts *ExternalTestSuite) TestSignupExternalZoom() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=zoom", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Zoom.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Zoom.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))

	assertValidOAuthState(ts, q.Get("state"), "zoom")
}

func ZoomTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Zoom.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"zoom_token","expires_in":100000}`)
		case "/v2/users/me":
			*userCount++
			ts.Contains(r.Header, "Authorization")
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown zoom oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Zoom.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalZoomAuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUser)
	defer server.Close()

	u := performAuthorization(ts, "zoom", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "zoom@example.com", "John Doe", "zoomUserId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalZoomDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUser)
	defer server.Close()

	u := performAuthorization(ts, "zoom", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "zoom@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalZoomDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "zoom", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "zoom@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalZoomDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("zoomUserId", "zoom@example.com", "John Doe", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUser)
	defer server.Close()

	u := performAuthorization(ts, "zoom", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "zoom@example.com", "John Doe", "zoomUserId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalZoomSuccessWhenMatchingToken() {
	ts.createUser("zoomUserId", "zoom@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUser)
	defer server.Close()

	u := performAuthorization(ts, "zoom", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "zoom@example.com", "John Doe", "zoomUserId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalZoomErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "zoom", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalZoomErrorWhenWrongToken() {
	ts.createUser("zoomUserId", "zoom@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "zoom", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalZoomErrorWhenEmailDoesntMatch() {
	ts.createUser("zoomUserId", "zoom@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := ZoomTestSignupSetup(ts, &tokenCount, &userCount, code, zoomUserWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "zoom", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
