package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	notionUser           string = `{"bot":{"owner":{"user":{"id":"notionTestId","name":"Notion Test","avatar_url":"http://example.com/avatar","person":{"email":"notion@example.com"},"verified_email":true}}}}`
	notionUserWrongEmail string = `{"bot":{"owner":{"user":{"id":"notionTestId","name":"Notion Test","avatar_url":"http://example.com/avatar","person":{"email":"other@example.com"},"verified_email":true}}}}`
	notionUserNoEmail    string = `{"bot":{"owner":{"user":{"id":"notionTestId","name":"Notion Test","avatar_url":"http://example.com/avatar","verified_email":true}}}}`
)

func (ts *ExternalTestSuite) TestSignupExternalNotion() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=notion", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Notion.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Notion.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))

	assertValidOAuthState(ts, q.Get("state"), "notion")
}

func NotionTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1/oauth/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Notion.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"notion_token","expires_in":100000}`)
		case "/v1/users/me":
			*userCount++
			ts.Contains(r.Header, "Authorization")
			ts.Contains(r.Header, "Notion-Version")
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown notion oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Notion.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalNotion_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUser)
	defer server.Close()

	u := performAuthorization(ts, "notion", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "notion@example.com", "Notion Test", "notionTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalNotionDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUser)
	defer server.Close()

	u := performAuthorization(ts, "notion", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "notion@example.com")
}
func (ts *ExternalTestSuite) TestSignupExternalNotionDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "notion", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "notion@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalNotionDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("notionTestId", "notion@example.com", "Notion Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUser)
	defer server.Close()

	u := performAuthorization(ts, "notion", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "notion@example.com", "Notion Test", "notionTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalNotionSuccessWhenMatchingToken() {
	// name and avatar should be populated from Notion API
	ts.createUser("notionTestId", "notion@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUser)
	defer server.Close()

	u := performAuthorization(ts, "notion", code, "invite_token")

	fmt.Printf("%+v\n", u)

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "notion@example.com", "Notion Test", "notionTestId", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalNotionErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "notion", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalNotionErrorWhenWrongToken() {
	ts.createUser("notionTestId", "notion@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "notion", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalNotionErrorWhenEmailDoesntMatch() {
	ts.createUser("notionTestId", "notion@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := NotionTestSignupSetup(ts, &tokenCount, &userCount, code, notionUserWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "notion", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
