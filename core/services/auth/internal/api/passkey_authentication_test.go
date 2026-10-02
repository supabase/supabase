package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/security"
)

// TestDiscoverableAuthenticationHappyPath tests the full discoverable credential authentication flow.
func (ts *PasskeyTestSuite) TestDiscoverableAuthenticationHappyPath() {
	// First, register a passkey for the test user
	authenticator, _ := ts.registerPasskey()

	// Step 1: Get authentication options (discoverable — empty request body)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil)
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyAuthenticationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))
	ts.NotEmpty(optionsResp.ChallengeID)
	ts.NotNil(optionsResp.Options)
	ts.NotZero(optionsResp.ExpiresAt)

	// Verify allowCredentials is empty (discoverable)
	ts.Empty(optionsResp.Options.AllowedCredentials)

	// Step 2: Simulate the authenticator creating an assertion
	assertionResp, err := authenticator.getAssertion(optionsResp.Options)
	require.NoError(ts.T(), err)

	// Step 3: Verify the authentication
	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential":   json.RawMessage(assertionResp.JSON),
	})
	ts.Require().Equal(http.StatusOK, w.Code)

	var tokenResp AccessTokenResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&tokenResp))
	ts.NotEmpty(tokenResp.Token)
	ts.NotEmpty(tokenResp.RefreshToken)

	// Verify the challenge was consumed (deleted)
	challengeID, err := uuid.FromString(optionsResp.ChallengeID)
	require.NoError(ts.T(), err)
	_, err = models.FindWebAuthnChallengeByID(ts.API.db, challengeID)
	ts.True(models.IsNotFoundError(err))
}

// TestDiscoverableAuthenticationUnconfirmedEmail tests that an unconfirmed email user is rejected.
func (ts *PasskeyTestSuite) TestDiscoverableAuthenticationUnconfirmedEmail() {
	authenticator, _ := ts.registerPasskey()

	// Unconfirm the user's email
	ts.TestUser.EmailConfirmedAt = nil
	require.NoError(ts.T(), ts.API.db.Update(ts.TestUser))

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil)
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyAuthenticationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))

	assertionResp, err := authenticator.getAssertion(optionsResp.Options)
	require.NoError(ts.T(), err)

	// Verify — should fail with email_not_confirmed
	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential":   json.RawMessage(assertionResp.JSON),
	})
	ts.Equal(http.StatusForbidden, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("email_not_confirmed", errResp["error_code"])
}

// TestDiscoverableAuthenticationBannedUser tests that a banned user is rejected.
func (ts *PasskeyTestSuite) TestDiscoverableAuthenticationBannedUser() {
	authenticator, _ := ts.registerPasskey()

	// Ban the user
	bannedUntil := time.Now().Add(24 * time.Hour)
	ts.TestUser.BannedUntil = &bannedUntil
	require.NoError(ts.T(), ts.API.db.Update(ts.TestUser))

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil)
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyAuthenticationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))

	assertionResp, err := authenticator.getAssertion(optionsResp.Options)
	require.NoError(ts.T(), err)

	// Verify — should fail with user_banned
	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential":   json.RawMessage(assertionResp.JSON),
	})
	ts.Equal(http.StatusForbidden, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("user_banned", errResp["error_code"])
}

// TestDiscoverableAuthenticationChallengeExpired tests that an expired challenge is rejected.
func (ts *PasskeyTestSuite) TestDiscoverableAuthenticationChallengeExpired() {
	challenge := models.NewWebAuthnChallenge(
		nil,
		models.WebAuthnChallengeTypeAuthentication,
		dummySessionData(),
		time.Now().Add(-1*time.Minute), // already expired
	)
	require.NoError(ts.T(), ts.API.db.Create(challenge))

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/verify", map[string]any{
		"challenge_id": challenge.ID.String(),
		"credential":   map[string]any{},
	})
	ts.Equal(http.StatusBadRequest, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("webauthn_challenge_expired", errResp["error_code"])
}

// TestDiscoverableAuthenticationChallengeNotFound tests that a missing challenge is rejected.
func (ts *PasskeyTestSuite) TestDiscoverableAuthenticationChallengeNotFound() {
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/verify", map[string]any{
		"challenge_id": uuid.Must(uuid.NewV4()).String(),
		"credential":   map[string]any{},
	})
	ts.Equal(http.StatusBadRequest, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("webauthn_challenge_not_found", errResp["error_code"])
}

// TestDiscoverableAuthenticationInvalidAssertion tests that an invalid assertion response is rejected.
func (ts *PasskeyTestSuite) TestDiscoverableAuthenticationInvalidAssertion() {
	// Register a passkey first so we have a valid challenge
	ts.registerPasskey()

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil)
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyAuthenticationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))

	// Send garbage as credential response
	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential":   map[string]any{"garbage": true},
	})
	ts.Equal(http.StatusBadRequest, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("webauthn_verification_failed", errResp["error_code"])
}

// TestDiscoverableAuthenticationUnknownCredential tests that an assertion with unknown userHandle is rejected.
func (ts *PasskeyTestSuite) TestDiscoverableAuthenticationUnknownCredential() {
	// Get options (no passkey registered)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil)
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyAuthenticationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))

	// The assertion response needs to be parseable but the handler callback will fail
	// because the userHandle points to a non-existent user.
	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential": map[string]any{
			"id":    "ZmFrZS1jcmVkZW50aWFsLWlk",
			"type":  "public-key",
			"rawId": "ZmFrZS1jcmVkZW50aWFsLWlk",
			"response": map[string]any{
				"clientDataJSON":    "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0",
				"authenticatorData": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAABA",
				"signature":         "AAAA",
				"userHandle":        "ZmFrZS11c2VyLWlk",
			},
		},
	})
	ts.Equal(http.StatusBadRequest, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("webauthn_verification_failed", errResp["error_code"])
}

// TestAuthenticationPasskeyDisabled tests that the feature gate works.
func (ts *PasskeyTestSuite) TestAuthenticationPasskeyDisabled() {
	ts.Config.Passkey.Enabled = false

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil)
	ts.Equal(http.StatusNotFound, w.Code)
}

// TestAuthenticationOptionsCaptchaRequired tests that CAPTCHA enabled + no token → 400.
func (ts *PasskeyTestSuite) TestAuthenticationOptionsCaptchaRequired() {
	ts.Config.Security.Captcha.Enabled = true
	ts.Config.Security.Captcha.Provider = "hcaptcha"
	ts.Config.Security.Captcha.Secret = "test-secret"

	// No captcha_token in request body
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", map[string]any{})
	ts.Equal(http.StatusBadRequest, w.Code)

	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("captcha_failed", errResp["error_code"])
}

// TestAuthenticationOptionsCaptchaValid tests that CAPTCHA enabled + valid token → 200.
func (ts *PasskeyTestSuite) TestAuthenticationOptionsCaptchaValid() {
	ts.Config.Security.Captcha.Enabled = true
	ts.Config.Security.Captcha.Provider = "hcaptcha"
	ts.Config.Security.Captcha.Secret = "test-secret"

	ts.CaptchaVerifier.Result = &security.VerificationResponse{Success: true}
	ts.CaptchaVerifier.Err = nil

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", map[string]any{
		"gotrue_meta_security": map[string]any{
			"captcha_token": "valid-token",
		},
	})
	ts.Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyAuthenticationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))
	ts.NotEmpty(optionsResp.ChallengeID)
}

// TestAuthenticationOptionsCaptchaInvalid tests that CAPTCHA enabled + mock failure → 400.
func (ts *PasskeyTestSuite) TestAuthenticationOptionsCaptchaInvalid() {
	ts.Config.Security.Captcha.Enabled = true
	ts.Config.Security.Captcha.Provider = "hcaptcha"
	ts.Config.Security.Captcha.Secret = "test-secret"

	ts.CaptchaVerifier.Result = &security.VerificationResponse{
		Success:    false,
		ErrorCodes: []string{"invalid-input-response"},
	}
	ts.CaptchaVerifier.Err = nil

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", map[string]any{
		"gotrue_meta_security": map[string]any{
			"captcha_token": "bad-token",
		},
	})
	ts.Equal(http.StatusBadRequest, w.Code)

	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("captcha_failed", errResp["error_code"])
}

// TestAuthenticationOptionsCaptchaDisabled tests that CAPTCHA disabled → 200 without token.
func (ts *PasskeyTestSuite) TestAuthenticationOptionsCaptchaDisabled() {
	ts.Config.Security.Captcha.Enabled = false

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil)
	ts.Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyAuthenticationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))
	ts.NotEmpty(optionsResp.ChallengeID)
}

// TestAuthenticationOptionsRateLimited tests that the passkey authentication options endpoint is rate limited.
func (ts *PasskeyTestSuite) TestAuthenticationOptionsRateLimited() {
	// The passkey authentication limiter has a burst of 30 (from newLimiterPer5mOver1h).
	// Send 30 requests that consume the burst, then verify the 31st is rejected.
	for i := 0; i < 30; i++ {
		w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil, withHeader(ts.Config.RateLimitHeader, "1.2.3.4"))
		require.Equal(ts.T(), http.StatusOK, w.Code)
	}

	// 31st request should be rate limited
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/authentication/options", nil, withHeader(ts.Config.RateLimitHeader, "1.2.3.4"))
	require.Equal(ts.T(), http.StatusTooManyRequests, w.Code)
}

// registerPasskey is a test helper that registers a passkey for the test user
// and returns the authenticator (with stored credential) for later assertion.
func (ts *PasskeyTestSuite) registerPasskey() (*virtualAuthenticator, *PasskeyMetadataResponse) {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	authenticator := &virtualAuthenticator{
		rpID:   ts.Config.WebAuthn.RPID,
		origin: ts.Config.WebAuthn.RPOrigins[0],
	}

	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyRegistrationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))

	credResp, err := authenticator.createCredential(optionsResp.Options)
	require.NoError(ts.T(), err)

	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential":   json.RawMessage(credResp.JSON),
	}, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w.Code)

	var passkeyResp PasskeyMetadataResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&passkeyResp))

	return authenticator, &passkeyResp
}
