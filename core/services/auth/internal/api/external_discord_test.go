package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
)

const (
	discordUser           string = `{"id":"discordTestId","avatar":"abc","email":"discord@example.com","username":"Discord Test","verified":true,"discriminator":"0001"}}`
	discordUserWrongEmail string = `{"id":"discordTestId","avatar":"abc","email":"other@example.com","username":"Discord Test","verified":true}}`
	discordUserNoEmail    string = `{"id":"discordTestId","avatar":"abc","username":"Discord Test","verified":true}}`
)

func (ts *ExternalTestSuite) TestSignupExternalDiscord() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=discord", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Discord.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Discord.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("email identify", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "discord")
}

func DiscordTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/oauth2/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Discord.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"discord_token","expires_in":100000}`)
		case "/api/users/@me":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, user)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown discord oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Discord.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalDiscord_AuthorizationCode() {
	ts.Config.DisableSignup = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUser)
	defer server.Close()

	u := performAuthorization(ts, "discord", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "discord@example.com", "Discord Test", "discordTestId", "https://cdn.discordapp.com/avatars/discordTestId/abc.png")
}

func (ts *ExternalTestSuite) TestSignupExternalDiscordDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUser)
	defer server.Close()

	u := performAuthorization(ts, "discord", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "discord@example.com")
}
func (ts *ExternalTestSuite) TestSignupExternalDiscordDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "discord", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "discord@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalDiscordDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("discordTestId", "discord@example.com", "Discord Test", "https://cdn.discordapp.com/avatars/discordTestId/abc.png", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUser)
	defer server.Close()

	u := performAuthorization(ts, "discord", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "discord@example.com", "Discord Test", "discordTestId", "https://cdn.discordapp.com/avatars/discordTestId/abc.png")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalDiscordSuccessWhenMatchingToken() {
	// name and avatar should be populated from Discord API
	ts.createUser("discordTestId", "discord@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUser)
	defer server.Close()

	u := performAuthorization(ts, "discord", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "discord@example.com", "Discord Test", "discordTestId", "https://cdn.discordapp.com/avatars/discordTestId/abc.png")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalDiscordErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "discord", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalDiscordErrorWhenWrongToken() {
	ts.createUser("discordTestId", "discord@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "discord", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalDiscordErrorWhenEmailDoesntMatch() {
	ts.createUser("discordTestId", "discord@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	server := DiscordTestSignupSetup(ts, &tokenCount, &userCount, code, discordUserWrongEmail)
	defer server.Close()

	u := performAuthorization(ts, "discord", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
