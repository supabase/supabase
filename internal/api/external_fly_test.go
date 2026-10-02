package api

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/models"
)

func (ts *ExternalTestSuite) TestSignupExternalFly() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=fly", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Fly.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Fly.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("read", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "fly")
}

func FlyTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, email string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Fly.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"fly_token","expires_in":100000,"refresh_token":"fly_refresh_token"}`)
		case "/oauth/token/info":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprintf(w, `{"resource_owner_id":"test_resource_owner_id","scope":["read"],"expires_in":1111,"application":{"uid":"test_app_uid"},"created_at":1696003692,"user_id":"test_user_id","user_name":"test_user","email":"%s","organizations":[{"id":"test_org_id","role":"test"}]}`, email)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown fly oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Fly.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalFly_AuthorizationCode() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "fly@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "fly", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "fly@example.com", "test_user", "test_user_id", "")
}

func (ts *ExternalTestSuite) TestSignupExternalFly_PKCE() {
	tokenCount, userCount := 0, 0
	code := "authcode"

	// for the plain challenge method, the code verifier == code challenge
	// code challenge has to be between 43 - 128 chars for the plain challenge method
	codeVerifier := "testtesttesttesttesttesttesttesttesttesttesttesttesttest"

	email := "fly@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	cases := []struct {
		desc                string
		codeChallengeMethod string
	}{
		{
			desc:                "SHA256",
			codeChallengeMethod: "s256",
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			var codeChallenge string
			if c.codeChallengeMethod == "s256" {
				hashedCodeVerifier := sha256.Sum256([]byte(codeVerifier))
				codeChallenge = base64.RawURLEncoding.EncodeToString(hashedCodeVerifier[:])
			} else {
				codeChallenge = codeVerifier
			}
			// Check for valid auth code returned
			u := performPKCEAuthorization(ts, "fly", code, codeChallenge, c.codeChallengeMethod)
			m, err := url.ParseQuery(u.RawQuery)
			authCode := m["code"][0]
			require.NoError(ts.T(), err)
			require.NotEmpty(ts.T(), authCode)

			// Check for valid provider access token, mock does not return refresh token
			user, err := models.FindUserByEmailAndAudience(ts.API.db, "fly@example.com", ts.Config.JWT.Aud)
			require.NoError(ts.T(), err)
			require.NotEmpty(ts.T(), user)
			flowState, err := models.FindFlowStateByAuthCode(ts.API.db, authCode)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), "fly_token", flowState.ProviderAccessToken)

			// Exchange Auth Code for token
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"code_verifier": codeVerifier,
				"auth_code":     authCode,
			}))
			req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=pkce", &buffer)
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			// Validate that access token and provider tokens are present
			data := AccessTokenResponse{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
			require.NotEmpty(ts.T(), data.Token)
			require.NotEmpty(ts.T(), data.RefreshToken)
			require.NotEmpty(ts.T(), data.ProviderAccessToken)
			require.Equal(ts.T(), data.User.ID, user.ID)
		})
	}
}

func (ts *ExternalTestSuite) TestSignupExternalFlyDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "fly@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "fly", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", email)
}

func (ts *ExternalTestSuite) TestSignupExternalFlyDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := ""
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "fly", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "fly@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalFlyDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("test_user_id", "fly@example.com", "test_user", "", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "fly@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "fly", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "fly@example.com", "test_user", "test_user_id", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFlySuccessWhenMatchingToken() {
	// name and avatar should be populated from fly API
	ts.createUser("test_user_id", "fly@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "fly@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "fly", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "fly@example.com", "test_user", "test_user_id", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFlyErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "fly@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	w := performAuthorizationRequest(ts, "fly", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFlyErrorWhenWrongToken() {
	ts.createUser("test_user_id", "fly@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "fly@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	w := performAuthorizationRequest(ts, "fly", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFlyErrorWhenEmailDoesntMatch() {
	ts.createUser("test_user_id", "fly@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "other@example.com"
	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "fly", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}

func (ts *ExternalTestSuite) TestSignupExternalFlyErrorWhenUserBanned() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "fly@example.com"

	server := FlyTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "fly", code, "")
	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "fly@example.com", "test_user", "test_user_id", "")

	user, err := models.FindUserByEmailAndAudience(ts.API.db, "fly@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	t := time.Now().Add(24 * time.Hour)
	user.BannedUntil = &t
	require.NoError(ts.T(), ts.API.db.UpdateOnly(user, "banned_until"))

	u = performAuthorization(ts, "fly", code, "")
	assertAuthorizationFailure(ts, u, "User is banned", "access_denied", "")
}
