package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/models"
)

// TestRegisterPasskeyHappyPath tests the full happy path: get registration options, simulate
// an authenticator creating a credential, and verify the registration.
func (ts *PasskeyTestSuite) TestRegisterPasskeyHappyPath() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)

	// Step 1: Get registration options
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyRegistrationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))
	ts.Require().NotEmpty(optionsResp.ChallengeID)
	ts.Require().NotNil(optionsResp.Options)

	// Step 2: Simulate the authenticator creating a credential
	authenticator := &virtualAuthenticator{
		rpID:   ts.Config.WebAuthn.RPID,
		origin: ts.Config.WebAuthn.RPOrigins[0],
	}

	credResp, err := authenticator.createCredential(optionsResp.Options)
	require.NoError(ts.T(), err)

	// Step 3: Verify the registration
	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential":   json.RawMessage(credResp.JSON),
	}, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w.Code)

	var passkeyResp PasskeyMetadataResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&passkeyResp))

	ts.NotEmpty(passkeyResp.ID)
	ts.NotZero(passkeyResp.CreatedAt)

	// Step 4: Verify the credential was persisted
	passkeyID, err := uuid.FromString(passkeyResp.ID)
	require.NoError(ts.T(), err)
	cred, err := models.FindWebAuthnCredentialByID(ts.API.db, passkeyID)
	require.NoError(ts.T(), err)
	ts.Equal(ts.TestUser.ID, cred.UserID)
	ts.Equal("none", cred.AttestationType)
	ts.NotEmpty(cred.CredentialID)
	ts.NotEmpty(cred.PublicKey)

	// Step 5: Verify the challenge was consumed (deleted)
	challengeID, err := uuid.FromString(optionsResp.ChallengeID)
	require.NoError(ts.T(), err)
	_, err = models.FindWebAuthnChallengeByID(ts.API.db, challengeID)
	ts.True(models.IsNotFoundError(err))
}

// TestRegistrationOptionsSuccess tests that an authenticated user can get registration options.
func (ts *PasskeyTestSuite) TestRegistrationOptionsSuccess() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var resp PasskeyRegistrationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))

	ts.NotEmpty(resp.ChallengeID)
	ts.NotNil(resp.Options)
	ts.NotZero(resp.ExpiresAt)

	// Verify challenge was stored in database
	challengeID, err := uuid.FromString(resp.ChallengeID)
	require.NoError(ts.T(), err)
	challenge, err := models.FindWebAuthnChallengeByID(ts.API.db, challengeID)
	require.NoError(ts.T(), err)
	ts.Equal(models.WebAuthnChallengeTypeRegistration, challenge.ChallengeType)
	ts.Equal(ts.TestUser.ID, *challenge.UserID)
}

// TestRegistrationOptionsWithExistingPasskeys tests that existing credentials are excluded.
func (ts *PasskeyTestSuite) TestRegistrationOptionsWithExistingPasskeys() {
	// Create an existing passkey
	cred := &models.WebAuthnCredential{
		ID:              uuid.Must(uuid.NewV4()),
		UserID:          ts.TestUser.ID,
		CredentialID:    []byte("existing-cred-id"),
		PublicKey:       []byte("existing-pub-key"),
		AttestationType: "none",
	}
	require.NoError(ts.T(), ts.API.db.Create(cred))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var resp PasskeyRegistrationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))
	ts.NotEmpty(resp.ChallengeID)

	// The exclusion list should contain the existing credential
	ts.Require().NotNil(resp.Options)
	ts.Require().NotNil(resp.Options.CredentialExcludeList)
	ts.Len(resp.Options.CredentialExcludeList, 1)
}

// TestRegistrationOptionsTooManyPasskeys tests that the limit is enforced.
func (ts *PasskeyTestSuite) TestRegistrationOptionsTooManyPasskeys() {
	ts.Config.Passkey.MaxPasskeysPerUser = 1

	// Create one existing passkey to hit the limit
	cred := &models.WebAuthnCredential{
		ID:              uuid.Must(uuid.NewV4()),
		UserID:          ts.TestUser.ID,
		CredentialID:    []byte("cred-1"),
		PublicKey:       []byte("pk-1"),
		AttestationType: "none",
	}
	require.NoError(ts.T(), ts.API.db.Create(cred))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))

	ts.Equal(http.StatusUnprocessableEntity, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("too_many_passkeys", errResp["error_code"])
}

// TestRegistrationOptionsUnauthenticated tests that unauthenticated requests are rejected.
func (ts *PasskeyTestSuite) TestRegistrationOptionsUnauthenticated() {
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil)
	ts.Equal(http.StatusUnauthorized, w.Code)
}

// TestRegistrationOptionsAnonymousUser tests that anonymous users are rejected.
func (ts *PasskeyTestSuite) TestRegistrationOptionsAnonymousUser() {
	ts.TestUser.IsAnonymous = true
	require.NoError(ts.T(), ts.API.db.Update(ts.TestUser))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))

	ts.Equal(http.StatusForbidden, w.Code)
}

// TestRegistrationOptionsSSOUser tests that SSO users are rejected.
func (ts *PasskeyTestSuite) TestRegistrationOptionsSSOUser() {
	ts.TestUser.IsSSOUser = true
	require.NoError(ts.T(), ts.API.db.Update(ts.TestUser))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))

	ts.Equal(http.StatusUnprocessableEntity, w.Code)
}

// TestRegistrationOptionsPasskeyDisabled tests that the feature gate works.
func (ts *PasskeyTestSuite) TestRegistrationOptionsPasskeyDisabled() {
	ts.Config.Passkey.Enabled = false

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))

	ts.Equal(http.StatusNotFound, w.Code)
}

// TestRegisterVerifyCapEnforcedAtVerifyTime tests that the passkey cap is enforced during verify,
// preventing a race where multiple challenges are issued under the cap but all verified after.
func (ts *PasskeyTestSuite) TestRegisterVerifyCapEnforcedAtVerifyTime() {
	ts.Config.Passkey.MaxPasskeysPerUser = 1

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	authenticator := &virtualAuthenticator{
		rpID:   ts.Config.WebAuthn.RPID,
		origin: ts.Config.WebAuthn.RPOrigins[0],
	}

	// Get two challenges while under the cap (0 existing, cap=1)
	w1 := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w1.Code)
	var opts1 PasskeyRegistrationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w1.Body).Decode(&opts1))

	w2 := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w2.Code)
	var opts2 PasskeyRegistrationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w2.Body).Decode(&opts2))

	// Simulate authenticator responses for both challenges
	cred1, err := authenticator.createCredential(opts1.Options)
	require.NoError(ts.T(), err)
	cred2, err := authenticator.createCredential(opts2.Options)
	require.NoError(ts.T(), err)

	// Verify the first challenge — should succeed
	v1 := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": opts1.ChallengeID,
		"credential":   json.RawMessage(cred1.JSON),
	}, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, v1.Code)

	// Verify the second challenge — should fail with too_many_passkeys
	v2 := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": opts2.ChallengeID,
		"credential":   json.RawMessage(cred2.JSON),
	}, withBearerToken(token))
	ts.Equal(http.StatusUnprocessableEntity, v2.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(v2.Body).Decode(&errResp))
	ts.Equal("too_many_passkeys", errResp["error_code"])
}

// TestRegisterVerifyChallengeNotFound tests that a missing challenge returns the correct error.
func (ts *PasskeyTestSuite) TestRegisterVerifyChallengeNotFound() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": uuid.Must(uuid.NewV4()).String(),
		"credential":   map[string]any{},
	}, withBearerToken(token))

	ts.Equal(http.StatusBadRequest, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("webauthn_challenge_not_found", errResp["error_code"])
}

// TestRegisterVerifyChallengeExpired tests that an expired challenge returns the correct error.
func (ts *PasskeyTestSuite) TestRegisterVerifyChallengeExpired() {
	challenge := models.NewWebAuthnChallenge(
		&ts.TestUser.ID,
		models.WebAuthnChallengeTypeRegistration,
		dummySessionData(),
		time.Now().Add(-1*time.Minute), // already expired
	)
	require.NoError(ts.T(), ts.API.db.Create(challenge))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": challenge.ID.String(),
		"credential":   map[string]any{},
	}, withBearerToken(token))

	ts.Equal(http.StatusBadRequest, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("webauthn_challenge_expired", errResp["error_code"])
}

// TestRegisterVerifyWrongUser tests that a challenge belonging to a different user is rejected.
func (ts *PasskeyTestSuite) TestRegisterVerifyWrongUser() {
	otherUser, err := models.NewUser("", "other@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(otherUser))

	challenge := models.NewWebAuthnChallenge(
		&otherUser.ID,
		models.WebAuthnChallengeTypeRegistration,
		dummySessionData(),
		time.Now().Add(5*time.Minute),
	)
	require.NoError(ts.T(), ts.API.db.Create(challenge))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": challenge.ID.String(),
		"credential":   map[string]any{},
	}, withBearerToken(token))

	ts.Equal(http.StatusBadRequest, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("webauthn_challenge_not_found", errResp["error_code"])
}

// TestRegisterVerifyMissingFields tests validation of required fields.
func (ts *PasskeyTestSuite) TestRegisterVerifyMissingFields() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)

	cases := []struct {
		desc string
		body map[string]any
	}{
		{
			desc: "missing challenge_id",
			body: map[string]any{
				"credential": map[string]any{},
			},
		},
		{
			desc: "missing credential",
			body: map[string]any{
				"challenge_id": uuid.Must(uuid.NewV4()).String(),
			},
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", c.body, withBearerToken(token))
			ts.Equal(http.StatusBadRequest, w.Code)
		})
	}
}

// TestRegisterVerifyInvalidChallengeID tests that an invalid UUID is rejected.
func (ts *PasskeyTestSuite) TestRegisterVerifyInvalidChallengeID() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": "not-a-uuid",
		"credential":   map[string]any{},
	}, withBearerToken(token))

	ts.Equal(http.StatusBadRequest, w.Code)
}

// TestRegisterVerifyWrongChallengeType tests that a non-registration challenge is rejected.
func (ts *PasskeyTestSuite) TestRegisterVerifyWrongChallengeType() {
	challenge := models.NewWebAuthnChallenge(
		&ts.TestUser.ID,
		models.WebAuthnChallengeTypeAuthentication,
		dummySessionData(),
		time.Now().Add(5*time.Minute),
	)
	require.NoError(ts.T(), ts.API.db.Create(challenge))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": challenge.ID.String(),
		"credential":   map[string]any{},
	}, withBearerToken(token))

	ts.Equal(http.StatusBadRequest, w.Code)
}

// TestRegisterVerifyUnauthenticated tests that unauthenticated requests are rejected.
func (ts *PasskeyTestSuite) TestRegisterVerifyUnauthenticated() {
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": uuid.Must(uuid.NewV4()).String(),
		"credential":   map[string]any{},
	})
	ts.Equal(http.StatusUnauthorized, w.Code)
}

// TestRegisterVerifySSOUser tests that SSO users are rejected on verify too.
func (ts *PasskeyTestSuite) TestRegisterVerifySSOUser() {
	ts.TestUser.IsSSOUser = true
	require.NoError(ts.T(), ts.API.db.Update(ts.TestUser))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": uuid.Must(uuid.NewV4()).String(),
		"credential":   map[string]any{},
	}, withBearerToken(token))

	ts.Equal(http.StatusUnprocessableEntity, w.Code)
}

// TestRegistrationOptionsBlockedAtAAL1WhenMFAEnabled verifies that a user enrolled
// in a verified MFA factor cannot get registration options from an AAL1 session.
func (ts *PasskeyTestSuite) TestRegistrationOptionsBlockedAtAAL1WhenMFAEnabled() {
	ts.enrollVerifiedFactor(ts.TestUser)

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))

	ts.Equal(http.StatusForbidden, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("insufficient_aal", errResp["error_code"])
}

// TestRegistrationVerifyBlockedAtAAL1WhenMFAEnabled verifies that the AAL2 gate on
// verify runs before the registration challenge is consumed, so a blocked request
// leaves the challenge intact.
func (ts *PasskeyTestSuite) TestRegistrationVerifyBlockedAtAAL1WhenMFAEnabled() {
	ts.enrollVerifiedFactor(ts.TestUser)

	challenge := models.NewWebAuthnChallenge(
		&ts.TestUser.ID,
		models.WebAuthnChallengeTypeRegistration,
		dummySessionData(),
		time.Now().Add(5*time.Minute),
	)
	require.NoError(ts.T(), ts.API.db.Create(challenge))

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": challenge.ID.String(),
		"credential":   map[string]any{},
	}, withBearerToken(token))

	ts.Equal(http.StatusForbidden, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("insufficient_aal", errResp["error_code"])

	// The challenge must not have been consumed by a request that failed the gate.
	_, err := models.FindWebAuthnChallengeByID(ts.API.db, challenge.ID)
	require.NoError(ts.T(), err)
}

// TestRegisterPasskeyAAL2HappyPathWhenMFAEnabled verifies that a user with a
// verified MFA factor who has stepped up to AAL2 can still register a passkey
// end-to-end (both the options and verify endpoints pass the gate).
func (ts *PasskeyTestSuite) TestRegisterPasskeyAAL2HappyPathWhenMFAEnabled() {
	f := ts.enrollVerifiedFactor(ts.TestUser)
	ts.elevateSessionToAAL2(ts.TestSession, f.ID)

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)

	// Step 1: options succeed at AAL2
	w := ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/options", nil, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w.Code)

	var optionsResp PasskeyRegistrationOptionsResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&optionsResp))

	// Step 2: simulate the authenticator creating a credential
	authenticator := &virtualAuthenticator{
		rpID:   ts.Config.WebAuthn.RPID,
		origin: ts.Config.WebAuthn.RPOrigins[0],
	}
	credResp, err := authenticator.createCredential(optionsResp.Options)
	require.NoError(ts.T(), err)

	// Step 3: verify succeeds at AAL2
	w = ts.makeRequest(http.MethodPost, "http://localhost/passkeys/registration/verify", map[string]any{
		"challenge_id": optionsResp.ChallengeID,
		"credential":   json.RawMessage(credResp.JSON),
	}, withBearerToken(token))
	ts.Require().Equal(http.StatusOK, w.Code)

	var passkeyResp PasskeyMetadataResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&passkeyResp))
	ts.NotEmpty(passkeyResp.ID)
}
