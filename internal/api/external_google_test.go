package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/provider"
)

const (
	googleUser           string = `{"id":"googleTestId","name":"Google Test","picture":"http://example.com/avatar","email":"google@example.com","verified_email":true}}`
	googleUserWrongEmail string = `{"id":"googleTestId","name":"Google Test","picture":"http://example.com/avatar","email":"other@example.com","verified_email":true}}`
	googleUserNoEmail    string = `{"id":"googleTestId","name":"Google Test","picture":"http://example.com/avatar","verified_email":false}}`
)

func (ts *ExternalTestSuite) TestSignupExternalGoogle() {
	provider.ResetGoogleProvider()

	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=google", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Google.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Google.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("email profile", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "google")
}

func GoogleTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	provider.ResetGoogleProvider()

	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			w.Header().Add("Content-Type", "application/json")
			require.NoError(ts.T(), json.NewEncoder(w).Encode(map[string]any{
				"issuer":         server.URL,
				"token_endpoint": server.URL + "/o/oauth2/token",
			}))
		case "/o/oauth2/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Google.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"google_token","expires_in":100000}`)
		case "/userinfo/v2/me":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown google oauth call %s", r.URL.Path)
		}
	}))

	provider.OverrideGoogleProvider(server.URL, server.URL+"/userinfo/v2/me")

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalGoogle_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUser)
	defer server.Close()

	u := performAuthorization(ts, "google", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "google@example.com", "Google Test", "googleTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalGoogleDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUser)
	defer server.Close()

	u := performAuthorization(ts, "google", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "google@example.com")
}
func (ts *ExternalTestSuite) TestSignupExternalGoogleDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "google", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "google@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalGoogleDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("googleTestId", "google@example.com", "Google Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUser)
	defer server.Close()

	u := performAuthorization(ts, "google", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "google@example.com", "Google Test", "googleTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGoogleSuccessWhenMatchingToken() {
	// name and avatar should be populated from Google API
	ts.createUser("googleTestId", "google@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUser)
	defer server.Close()

	u := performAuthorization(ts, "google", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "google@example.com", "Google Test", "googleTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGoogleErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "google", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGoogleErrorWhenWrongToken() {
	ts.createUser("googleTestId", "google@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "google", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGoogleErrorWhenEmailDoesntMatch() {
	ts.createUser("googleTestId", "google@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := GoogleTestSignupSetup(ts, &tokenCount, &userCount, code, googleUserWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "google", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
