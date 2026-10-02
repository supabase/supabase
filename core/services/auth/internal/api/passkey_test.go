package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

// PasskeyTestSuite is the shared test suite for all passkey flow tests.
// Flow-specific test methods live in their own files (passkey_register_test.go, etc.).
type PasskeyTestSuite struct {
	suite.Suite
	API             *API
	Config          *conf.GlobalConfiguration
	TestUser        *models.User
	TestSession     *models.Session
	CaptchaVerifier *MockCaptchaVerifier
}

func TestPasskey(t *testing.T) {
	mockCaptcha := &MockCaptchaVerifier{}
	api, config, err := setupAPIForTest(WithCaptchaVerifier(mockCaptcha))
	require.NoError(t, err)
	ts := &PasskeyTestSuite{
		API:             api,
		Config:          config,
		CaptchaVerifier: mockCaptcha,
	}
	defer api.db.Close()
	suite.Run(t, ts)
}

func (ts *PasskeyTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	// Reset captcha state
	ts.Config.Security.Captcha.Enabled = false
	ts.CaptchaVerifier.Result = nil
	ts.CaptchaVerifier.Err = nil

	// Enable passkeys
	ts.Config.Passkey.Enabled = true
	ts.Config.Passkey.MaxPasskeysPerUser = 10
	ts.Config.WebAuthn = conf.WebAuthnConfiguration{
		RPID:                    "localhost",
		RPDisplayName:           "Test App",
		RPOrigins:               []string{"http://localhost:3000"},
		ChallengeExpiryDuration: 5 * time.Minute,
	}

	// Create test user with confirmed email
	u, err := models.NewUser("", "passkey@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	now := time.Now()
	u.EmailConfirmedAt = &now
	require.NoError(ts.T(), ts.API.db.Create(u))

	// Create session
	s, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))

	ts.TestUser = u
	ts.TestSession = s
}

// generateToken creates a JWT access token for the given user and session.
func (ts *PasskeyTestSuite) generateToken(user *models.User, sessionID *uuid.UUID) string {
	req := httptest.NewRequest(http.MethodPost, "/passkeys", nil)
	token, _, err := ts.API.generateAccessToken(req, ts.API.db, user, sessionID, models.PasswordGrant)
	require.NoError(ts.T(), err)

	return token
}

// enrollVerifiedFactor creates a verified TOTP MFA factor for the user so that
// user.HasMFAEnabled() returns true, exercising the passkey AAL2 step-up gate.
func (ts *PasskeyTestSuite) enrollVerifiedFactor(user *models.User) *models.Factor {
	f := models.NewTOTPFactor(user, fmt.Sprintf("factor-%s", uuid.Must(uuid.NewV4()).String()[:8]))
	require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(f))
	require.NoError(ts.T(), f.UpdateStatus(ts.API.db, models.FactorStateVerified))
	return f
}

// elevateSessionToAAL2 marks the session as AAL2 in the database, simulating a
// completed MFA verification.
func (ts *PasskeyTestSuite) elevateSessionToAAL2(session *models.Session, factorID uuid.UUID) {
	require.NoError(ts.T(), session.UpdateAALAndAssociatedFactor(ts.API.db, models.AAL2, &factorID))
}

// requestOption configures an HTTP request built by makeRequest.
type requestOption func(*http.Request)

// withBearerToken adds a Bearer authorization header.
func withBearerToken(token string) requestOption {
	return func(req *http.Request) {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}
}

// withHeader adds an arbitrary header.
func withHeader(key, value string) requestOption {
	return func(req *http.Request) {
		req.Header.Set(key, value)
	}
}

// makeRequest sends an HTTP request, applying any supplied options.
func (ts *PasskeyTestSuite) makeRequest(method, path string, body any, opts ...requestOption) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		require.NoError(ts.T(), json.NewEncoder(&buf).Encode(body))
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	for _, opt := range opts {
		opt(req)
	}
	ts.API.handler.ServeHTTP(w, req)

	return w
}

// dummySessionData creates a minimal WebAuthnSessionData for test challenges.
func dummySessionData() *models.WebAuthnSessionData {
	return &models.WebAuthnSessionData{
		SessionData: &webauthn.SessionData{
			Challenge:        "dGVzdC1jaGFsbGVuZ2U",
			UserID:           []byte("test-user"),
			UserVerification: protocol.VerificationPreferred,
		},
	}
}
