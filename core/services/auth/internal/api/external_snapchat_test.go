package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	snapchatUser = `{"data":{"me":{"email":"snapchattestid@snapchat.id","externalId":"snapchatTestId","displayName":"Snapchat Test","bitmoji":{"avatar":"http://example.com/bitmoji"}}}}`
)

func (ts *ExternalTestSuite) TestSignupExternalSnapchat() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=snapchat", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Snapchat.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Snapchat.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("https://auth.snapchat.com/oauth2/api/user.external_id https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "snapchat")
}

func SnapchatTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/accounts/oauth2/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Snapchat.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"snapchat_token","expires_in":3600}`)
		case "/v1/me":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown snapchat oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Snapchat.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalSnapchat_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := SnapchatTestSignupSetup(ts, &tokenCount, &userCount, code, snapchatUser)
	defer server.Close()

	u := performAuthorization(ts, "snapchat", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "", "Snapchat Test", "snapchatTestId", "http://example.com/bitmoji")
}

func (ts *ExternalTestSuite) TestSignupExternalSnapchatDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := SnapchatTestSignupSetup(ts, &tokenCount, &userCount, code, snapchatUser)
	defer server.Close()

	u := performAuthorization(ts, "snapchat", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "")
}

func (ts *ExternalTestSuite) TestSignupExternalSnapchatDisableSignupSuccessWithExistingUser() {
	ts.Config.DisableSignup = true

	ts.createUserWithIdentity("snapchat", "snapchatTestId", "", "Snapchat Test", "http://example.com/bitmoji", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := SnapchatTestSignupSetup(ts, &tokenCount, &userCount, code, snapchatUser)
	defer server.Close()

	u := performAuthorization(ts, "snapchat", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "", "Snapchat Test", "snapchatTestId", "http://example.com/bitmoji")
}

// Snapchat may not send email address so Invite Token flow can't apply.
