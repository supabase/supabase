package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/mailer/mockclient"
	"github.com/supabase/auth/internal/models"
)

type RecoveryCodesTestSuite struct {
	suite.Suite
	API         *API
	Config      *conf.GlobalConfiguration
	Mailer      mailer.Mailer
	TestEmail   string
	TestUser    *models.User
	TestFactor  *models.Factor
	TestSession *models.Session
}

func TestRecoveryCodes(t *testing.T) {
	mockMailer := &mockclient.MockMailer{}
	api, config, err := setupAPIForTest(WithMailer(mockMailer))
	require.NoError(t, err)
	ts := &RecoveryCodesTestSuite{
		API:    api,
		Config: config,
		Mailer: mockMailer,
	}
	defer api.db.Close()
	suite.Run(t, ts)
}

func TestUniqueRecoveryCodes(t *testing.T) {
	t.Run("regenerates a replacement for each duplicate", func(t *testing.T) {
		scripted := []string{"a", "b", "a", "c", "b", "d"}
		calls := 0
		generate := func(length int) string {
			require.Equal(t, 16, length)
			require.Less(t, calls, len(scripted), "generator called more times than scripted")
			code := scripted[calls]
			calls++
			return code
		}

		codes := uniqueRecoveryCodes(4, 16, generate)

		require.Equal(t, []string{"a", "b", "c", "d"}, codes)
		require.Equal(t, 6, calls, "4 for the batch plus one replacement per duplicate")
	})

	t.Run("no duplicates calls the generator exactly count times", func(t *testing.T) {
		calls := 0
		generate := func(int) string {
			calls++
			return fmt.Sprintf("code-%d", calls)
		}

		codes := uniqueRecoveryCodes(10, 16, generate)

		require.Len(t, codes, 10)
		require.Equal(t, 10, calls)
	})
}

func (ts *RecoveryCodesTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	ts.TestEmail = "test@example.com"
	u, err := models.NewUser("123456789", ts.TestEmail, "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")

	// A verified TOTP factor so recovery codes are never the sole factor.
	f := models.NewTOTPFactor(u, "test_factor")
	require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(f), "Error saving new test factor")
	require.NoError(ts.T(), f.UpdateStatus(ts.API.db, models.FactorStateVerified))

	s, err := models.NewSession(u.ID, &f.ID)
	require.NoError(ts.T(), err, "Error creating test session")
	require.NoError(ts.T(), ts.API.db.Create(s), "Error saving test session")

	u, err = models.FindUserByEmailAndAudience(ts.API.db, ts.TestEmail, ts.Config.JWT.Aud)
	ts.Require().NoError(err)

	ts.TestUser = u
	ts.TestFactor = f
	ts.TestSession = s

	// ts.Config is shared across tests; reset every knob this suite touches.
	ts.Config.MFA.RecoveryCodes.EnrollEnabled = true
	ts.Config.MFA.RecoveryCodes.VerifyEnabled = true
	ts.Config.MFA.RecoveryCodes.MaxVerifyAttempts = 5
	ts.Config.MFA.RecoveryCodes.LockoutDuration = 15 * time.Minute
	ts.Config.MFA.MaxEnrolledFactors = 10
	ts.Config.MFA.MaxVerifiedFactors = 10
	ts.Config.Hook.MFAVerificationAttempt.Enabled = false
	ts.Config.Mailer.Notifications.MFAFactorEnrolledEnabled = false
	ts.Config.Mailer.Notifications.MFAFactorUnenrolledEnabled = false
	if mockMailer, ok := ts.Mailer.(*mockclient.MockMailer); ok {
		mockMailer.Reset()
	}
}

func (ts *RecoveryCodesTestSuite) token(user *models.User, sessionID *uuid.UUID) string {
	req := httptest.NewRequest(http.MethodPost, "/factors/recovery-codes", nil)
	token, _, err := ts.API.generateAccessToken(req, ts.API.db, user, sessionID, models.TOTPSignIn)
	require.NoError(ts.T(), err, "Error generating access token")
	return token
}

// aal2Token upgrades the test session to AAL2 and mints a token for it.
func (ts *RecoveryCodesTestSuite) aal2Token() string {
	require.NoError(ts.T(), ts.TestSession.UpdateAALAndAssociatedFactor(ts.API.db, models.AAL2, &ts.TestFactor.ID))
	return ts.token(ts.TestUser, &ts.TestSession.ID)
}

func (ts *RecoveryCodesTestSuite) serveRequest(method, path, token string, body io.Reader) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, body)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Content-Type", "application/json")
	ts.API.handler.ServeHTTP(w, req)
	return w
}

func (ts *RecoveryCodesTestSuite) requireErrorCode(w *httptest.ResponseRecorder, expectedStatus int, expectedErrorCode apierrors.ErrorCode) {
	require.Equal(ts.T(), expectedStatus, w.Code)
	var data HTTPError
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	require.Equal(ts.T(), expectedErrorCode, data.ErrorCode)
}

func (ts *RecoveryCodesTestSuite) performGenerate(token string, body io.Reader) RecoveryCodesResponse {
	w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, body)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	resp := RecoveryCodesResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))
	return resp
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesStatusNotEnrolled() {
	token := ts.token(ts.TestUser, &ts.TestSession.ID)
	w := ts.serveRequest(http.MethodGet, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusNotFound, apierrors.ErrorCodeMFAFactorNotFound)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesStatusEnrolled() {
	token := ts.aal2Token()
	generateResp := ts.performGenerate(token, nil)

	w := ts.serveRequest(http.MethodGet, "http://localhost/factors/recovery-codes", token, nil)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	statusResp := RecoveryCodesResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&statusResp))
	require.Equal(ts.T(), generateResp.ID, statusResp.ID)
	require.Equal(ts.T(), models.RecoveryCode, statusResp.Type)
	require.Equal(ts.T(), 10, statusResp.Total)
	require.NotNil(ts.T(), statusResp.Remaining)
	require.Equal(ts.T(), 10, *statusResp.Remaining)
	require.Empty(ts.T(), statusResp.Codes)
	require.Empty(ts.T(), statusResp.FriendlyName)

	// Consume one code directly via models (verify endpoint is a later task).
	set, err := models.FindRecoveryCodeSetByUser(ts.API.db, ts.TestUser.ID)
	require.NoError(ts.T(), err)
	entries, err := models.FindUnusedRecoveryCodes(ts.API.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), entries, 10)
	require.NoError(ts.T(), entries[0].MarkConsumed(ts.API.db))

	w = ts.serveRequest(http.MethodGet, "http://localhost/factors/recovery-codes", token, nil)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	statusResp = RecoveryCodesResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&statusResp))
	require.Equal(ts.T(), 10, statusResp.Total)
	require.Equal(ts.T(), 9, *statusResp.Remaining)

	// Consume the rest: "remaining": 0 must still be serialized while codes
	// and friendly_name stay absent.
	for i := 1; i < len(entries); i++ {
		require.NoError(ts.T(), entries[i].MarkConsumed(ts.API.db))
	}
	w = ts.serveRequest(http.MethodGet, "http://localhost/factors/recovery-codes", token, nil)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	rawResp := map[string]any{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&rawResp))
	remaining, ok := rawResp["remaining"]
	require.True(ts.T(), ok, "remaining should be present even when zero")
	require.EqualValues(ts.T(), 0, remaining)
	require.NotContains(ts.T(), rawResp, "codes")
	require.NotContains(ts.T(), rawResp, "friendly_name")
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerate() {
	token := ts.aal2Token()

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]any{"friendly_name": "My recovery codes"}))
	resp := ts.performGenerate(token, &buffer)

	require.Equal(ts.T(), models.RecoveryCode, resp.Type)
	require.Equal(ts.T(), "My recovery codes", resp.FriendlyName)
	require.Equal(ts.T(), 10, resp.Total)
	require.Nil(ts.T(), resp.Remaining)
	require.Len(ts.T(), resp.Codes, 10)

	// Codes are returned in canonical normalized form; display formatting is a client concern.
	codeFormat := regexp.MustCompile("^[a-z2-7]{16}$")
	seen := make(map[string]bool)
	for _, code := range resp.Codes {
		require.Regexp(ts.T(), codeFormat, code)
		require.Equal(ts.T(), code, crypto.NormalizeRecoveryCode(code))
		seen[code] = true
	}
	require.Len(ts.T(), seen, 10, "codes should be unique")

	factor, err := models.FindFactorByFactorID(ts.API.db, resp.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.RecoveryCode, factor.FactorType)
	require.True(ts.T(), factor.IsVerified())
	require.Equal(ts.T(), "My recovery codes", factor.FriendlyName)

	// Every returned plaintext verifies against exactly one stored hash.
	set, err := models.FindRecoveryCodeSetByUser(ts.API.db, ts.TestUser.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), factor.ID, set.MFAFactorID)
	entries, err := models.FindUnusedRecoveryCodes(ts.API.db, set.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), entries, 10)
	for _, code := range resp.Codes {
		matches := 0
		for _, entry := range entries {
			if crypto.CompareHashAndRecoveryCode(entry.CodeHash, code) == nil {
				matches++
			}
		}
		require.Equal(ts.T(), 1, matches, "code %q should match exactly one stored hash", code)
	}

	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.RecoveryCodesGeneratedAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
	require.Equal(ts.T(), string(models.RecoveryCodesGeneratedAction), logs[0].Payload["action"])
	require.Equal(ts.T(), "factor", logs[0].Payload["log_type"])
	traits, ok := logs[0].Payload["traits"].(map[string]any)
	require.True(ts.T(), ok)
	require.Equal(ts.T(), factor.ID.String(), traits["factor_id"])
	require.EqualValues(ts.T(), 10, traits["count"])
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateFriendlyName() {
	token := ts.aal2Token()

	cases := []struct {
		desc         string
		body         io.Reader
		expectedName string
	}{
		{desc: "No body", body: nil, expectedName: models.DefaultRecoveryCodeFriendlyName},
		{desc: "Empty object", body: bytes.NewBufferString(`{}`), expectedName: models.DefaultRecoveryCodeFriendlyName},
		{desc: "Whitespace-only name", body: bytes.NewBufferString(`{"friendly_name": "  "}`), expectedName: models.DefaultRecoveryCodeFriendlyName},
		{desc: "Supplied name", body: bytes.NewBufferString(`{"friendly_name": "Backup codes"}`), expectedName: "Backup codes"},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			resp := ts.performGenerate(token, c.body)
			require.Equal(ts.T(), c.expectedName, resp.FriendlyName)

			factor, err := models.FindRecoveryCodeFactorByUser(ts.API.db, ts.TestUser.ID)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), c.expectedName, factor.FriendlyName)

			// Remove the factor (set and codes cascade) so the next case can
			// generate again.
			require.NoError(ts.T(), ts.API.db.Destroy(factor))
		})
	}
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateEnrollDisabled() {
	ts.Config.MFA.RecoveryCodes.EnrollEnabled = false

	token := ts.aal2Token()
	w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesEnrollDisabled)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateRequiresAAL2() {
	token := ts.token(ts.TestUser, &ts.TestSession.ID)
	w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusForbidden, apierrors.ErrorCodeInsufficientAAL)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateSoleFactor() {
	token := ts.aal2Token()
	// With the TOTP factor unverified, recovery codes would be the sole verified factor.
	require.NoError(ts.T(), ts.TestFactor.UpdateStatus(ts.API.db, models.FactorStateUnverified))

	w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesSoleFactor)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateVerifyDisabledFactorNotCounted() {
	token := ts.aal2Token()
	// The verified TOTP factor cannot be used at sign-in once TOTP verification
	// is disabled, so recovery codes would become the only usable factor.
	prev := ts.Config.MFA.TOTP.VerifyEnabled
	defer func() { ts.Config.MFA.TOTP.VerifyEnabled = prev }()
	ts.Config.MFA.TOTP.VerifyEnabled = false

	w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesSoleFactor)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateAtFactorLimits() {
	token := ts.aal2Token()

	ts.Run("MaxEnrolledFactors", func() {
		ts.Config.MFA.MaxEnrolledFactors = 1
		defer func() { ts.Config.MFA.MaxEnrolledFactors = 10 }()

		w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeTooManyEnrolledMFAFactors)
	})

	ts.Run("MaxVerifiedFactors", func() {
		ts.Config.MFA.MaxVerifiedFactors = 1
		defer func() { ts.Config.MFA.MaxVerifiedFactors = 10 }()

		w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeTooManyEnrolledMFAFactors)
	})
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateAlreadyEnrolled() {
	token := ts.aal2Token()
	ts.performGenerate(token, nil)

	w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, bytes.NewBufferString(`{"friendly_name": "Second set"}`))
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerifiedFactorExists)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateFriendlyNameConflict() {
	token := ts.aal2Token()

	ts.Run("SuppliedNameTaken", func() {
		// The TOTP factor from SetupTest is named "test_factor".
		w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, bytes.NewBufferString(`{"friendly_name": "test_factor"}`))
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAFactorNameConflict)
	})

	ts.Run("DefaultNameTaken", func() {
		f := models.NewTOTPFactor(ts.TestUser, models.DefaultRecoveryCodeFriendlyName)
		require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
		require.NoError(ts.T(), ts.API.db.Create(f))

		w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAFactorNameConflict)
	})
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesAnonymousUserForbidden() {
	u, err := models.NewUser("", "", "", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	u.IsAnonymous = true
	require.NoError(ts.T(), ts.API.db.Create(u))

	s, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))

	token := ts.token(u, &s.ID)

	w := ts.serveRequest(http.MethodGet, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusForbidden, apierrors.ErrorCodeNoAuthorization)

	w = ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusForbidden, apierrors.ErrorCodeNoAuthorization)

	w = ts.serveRequest(http.MethodDelete, "http://localhost/factors/recovery-codes", token, nil)
	ts.requireErrorCode(w, http.StatusForbidden, apierrors.ErrorCodeNoAuthorization)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateEnrolledNotificationEnabled() {
	ts.Config.Mailer.Notifications.MFAFactorEnrolledEnabled = true

	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	ts.performGenerate(ts.aal2Token(), nil)

	require.Len(ts.T(), mockMailer.MFAFactorEnrolledMailCalls, 1, "Expected one MFA factor enrolled notification email to be sent")
	require.Equal(ts.T(), ts.TestUser.ID, mockMailer.MFAFactorEnrolledMailCalls[0].User.ID, "Email should be sent to the correct user")
	require.Equal(ts.T(), models.RecoveryCode, mockMailer.MFAFactorEnrolledMailCalls[0].FactorType, "Email should specify the correct factor type")
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenerateEnrolledNotificationDisabled() {
	ts.Config.Mailer.Notifications.MFAFactorEnrolledEnabled = false

	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	ts.performGenerate(ts.aal2Token(), nil)

	require.Empty(ts.T(), mockMailer.MFAFactorEnrolledMailCalls, "Expected no MFA factor enrolled notification email to be sent")
}

// grantSession creates an AAL1 session through the refresh-token grant flow
func (ts *RecoveryCodesTestSuite) grantSession() *models.Session {
	rt, err := models.GrantAuthenticatedUser(ts.API.db, ts.TestUser, models.GrantParams{})
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), rt.SessionId)
	session, err := models.FindSessionByID(ts.API.db, *rt.SessionId, false)
	require.NoError(ts.T(), err)
	return session
}

// enrollForVerify generates a recovery-code set at AAL2 on the main test
// session, then returns the generate response plus a fresh AAL1 session
// (verify is issued from AAL1) and a token for it.
func (ts *RecoveryCodesTestSuite) enrollForVerify() (RecoveryCodesResponse, *models.Session, string) {
	resp := ts.performGenerate(ts.aal2Token(), nil)
	session := ts.grantSession()
	return resp, session, ts.token(ts.TestUser, &session.ID)
}

func (ts *RecoveryCodesTestSuite) performVerify(token, code string) *httptest.ResponseRecorder {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]any{"code": code}))
	return ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes/verify", token, &buffer)
}

// recoveryCodeSetState re-reads the set row so tests can assert on the internal lockout state directly.
func (ts *RecoveryCodesTestSuite) recoveryCodeSetState() *models.RecoveryCodeSet {
	set, err := models.FindRecoveryCodeSetByUser(ts.API.db, ts.TestUser.ID)
	require.NoError(ts.T(), err)
	return set
}

func (ts *RecoveryCodesTestSuite) unusedCodeCount() int {
	entries, err := models.FindUnusedRecoveryCodes(ts.API.db, ts.recoveryCodeSetState().ID)
	require.NoError(ts.T(), err)
	return len(entries)
}

const wrongCode = "aaaaaaaaaaaaa"

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifySuccess() {
	generateResp, verifySession, token := ts.enrollForVerify()

	// A second AAL1 session that must be invalidated by the upgrade.
	secondSession, err := models.NewSession(ts.TestUser.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(secondSession))

	// Burn one failure first so success resets the counter.
	w := ts.performVerify(token, wrongCode)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)
	require.Equal(ts.T(), 1, ts.recoveryCodeSetState().FailedVerificationCount)

	w = ts.performVerify(token, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
	tokenResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(tokenResp))
	require.NotEmpty(ts.T(), tokenResp.Token)
	require.NotEmpty(ts.T(), tokenResp.RefreshToken)

	// The reissued access token is AAL2 with an mfa/recovery_code AMR entry.
	claims := &AccessTokenClaims{}
	_, _, err = jwt.NewParser().ParseUnverified(tokenResp.Token, claims)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.AAL2.String(), claims.AuthenticatorAssuranceLevel)
	methods := make([]string, 0, len(claims.AuthenticationMethodReference))
	for _, entry := range claims.AuthenticationMethodReference {
		methods = append(methods, entry.Method)
	}
	require.Contains(ts.T(), methods, models.MFARecoveryCode.String())

	// Code consumed, lockout state reset.
	set := ts.recoveryCodeSetState()
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)
	require.Equal(ts.T(), 9, ts.unusedCodeCount())

	// The caller's session was upgraded in place; the other AAL1 session is gone.
	upgraded, err := models.FindSessionByID(ts.API.db, verifySession.ID, false)
	require.NoError(ts.T(), err)
	require.True(ts.T(), upgraded.IsAAL2())
	_, err = models.FindSessionByID(ts.API.db, secondSession.ID, false)
	require.EqualError(ts.T(), err, models.SessionNotFoundError{}.Error())

	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.RecoveryCodesVerifiedAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
	require.Equal(ts.T(), "factor", logs[0].Payload["log_type"])
	traits, ok := logs[0].Payload["traits"].(map[string]any)
	require.True(ts.T(), ok)
	require.Equal(ts.T(), generateResp.ID.String(), traits["factor_id"])
	require.EqualValues(ts.T(), 9, traits["remaining"])
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyInputForgiveness() {
	generateResp, _, token := ts.enrollForVerify()

	cases := []struct {
		desc   string
		format func(string) string
	}{
		{desc: "Hyphenated", format: func(c string) string {
			return c[:4] + "-" + c[4:8] + "-" + c[8:12] + "-" + c[12:]
		}},
		{desc: "Spaced", format: func(c string) string {
			return " " + c[:8] + " " + c[8:] + " "
		}},
		{desc: "Uppercase", format: strings.ToUpper},
	}

	for i, c := range cases {
		ts.Run(c.desc, func() {
			w := ts.performVerify(token, c.format(generateResp.Codes[i]))
			require.Equal(ts.T(), http.StatusOK, w.Code)
		})
	}
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyReuseFails() {
	generateResp, _, token := ts.enrollForVerify()

	w := ts.performVerify(token, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// Reusing a consumed code is a failure like any other: uniform error and the counter increments.
	w = ts.performVerify(token, generateResp.Codes[0])
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)
	require.Equal(ts.T(), 1, ts.recoveryCodeSetState().FailedVerificationCount)
	require.Equal(ts.T(), 9, ts.unusedCodeCount())
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyUniformFailures() {
	// Absent set: no enrollment yet.
	absentSet := ts.performVerify(ts.token(ts.TestUser, &ts.TestSession.ID), wrongCode)

	generateResp, _, token := ts.enrollForVerify()

	// Wrong code.
	invalid := ts.performVerify(token, wrongCode)

	// Consumed code.
	w := ts.performVerify(token, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
	consumed := ts.performVerify(token, generateResp.Codes[0])

	// All three failure modes are indistinguishable: same status, identical body bytes.
	for _, recorder := range []*httptest.ResponseRecorder{absentSet, invalid, consumed} {
		require.Equal(ts.T(), http.StatusUnprocessableEntity, recorder.Code)
	}
	require.Equal(ts.T(), absentSet.Body.String(), invalid.Body.String())
	require.Equal(ts.T(), invalid.Body.String(), consumed.Body.String())

	// Failed verifications are not audited; only the one success above is.
	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.RecoveryCodesVerifiedAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyLockout() {
	ts.Config.MFA.RecoveryCodes.MaxVerifyAttempts = 3

	generateResp, _, token := ts.enrollForVerify()

	for range 3 {
		w := ts.performVerify(token, wrongCode)
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)
	}
	set := ts.recoveryCodeSetState()
	require.Equal(ts.T(), 3, set.FailedVerificationCount)
	require.NotNil(ts.T(), set.VerificationLockedUntil)
	lockedUntil := *set.VerificationLockedUntil

	// While locked, even a correct code is rejected without being evaluated and the lock is not extended.
	w := ts.performVerify(token, generateResp.Codes[0])
	ts.requireErrorCode(w, http.StatusTooManyRequests, apierrors.ErrorCodeMFARecoveryCodesLocked)
	set = ts.recoveryCodeSetState()
	require.Equal(ts.T(), 3, set.FailedVerificationCount)
	require.NotNil(ts.T(), set.VerificationLockedUntil)
	require.True(ts.T(), lockedUntil.Equal(*set.VerificationLockedUntil), "lockout must not be extended by attempts while locked")
	require.Equal(ts.T(), 10, ts.unusedCodeCount())

	// Backdate the lock to simulate expiry.
	past := time.Now().Add(-time.Minute)
	set.VerificationLockedUntil = &past
	require.NoError(ts.T(), ts.API.db.UpdateOnly(set, "verification_locked_until"))

	// The first attempt after expiry is processed with a fresh counter.
	w = ts.performVerify(token, wrongCode)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)
	set = ts.recoveryCodeSetState()
	require.Equal(ts.T(), 1, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)

	// A success after expiry works and resets everything.
	w = ts.performVerify(token, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
	set = ts.recoveryCodeSetState()
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)
}

func (ts *RecoveryCodesTestSuite) setVerificationHook(functionName, functionSQL string) {
	ts.Config.Hook.MFAVerificationAttempt.Enabled = true
	ts.Config.Hook.MFAVerificationAttempt.URI = "pg-functions://postgres/auth/" + functionName
	require.NoError(ts.T(), ts.Config.Hook.MFAVerificationAttempt.PopulateExtensibilityPoint())
	require.NoError(ts.T(), ts.API.db.RawQuery(functionSQL).Exec())
	ts.T().Cleanup(func() {
		require.NoError(ts.T(), ts.API.db.RawQuery(fmt.Sprintf("drop function if exists %s(input jsonb)", functionName)).Exec())
	})
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyHookContinue() {
	ts.setVerificationHook("recovery_codes_hook_continue", `
        create or replace function recovery_codes_hook_continue(input jsonb)
        returns json as $$
        begin
            return json_build_object('decision', 'continue');
        end; $$ language plpgsql;`)

	generateResp, _, token := ts.enrollForVerify()

	w := ts.performVerify(token, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
	require.Equal(ts.T(), 9, ts.unusedCodeCount())
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyHookRejection() {
	// Rejecting only on the recovery-code factor type also pins the hook payload:
	// if factor_type or factor_id were missing, the hook would continue and the
	// request would succeed, failing this test.
	ts.setVerificationHook("recovery_codes_hook_reject", `
        create or replace function recovery_codes_hook_reject(input jsonb)
        returns json as $$
        begin
            if input->>'factor_type' = 'recovery_code' and input->>'factor_id' is not null then
                return json_build_object('decision', 'reject', 'message', 'recovery code sign-in rejected');
            end if;
            return json_build_object('decision', 'continue');
        end; $$ language plpgsql;`)

	generateResp, _, token := ts.enrollForVerify()

	// A valid code is submitted; the rejection must not consume it.
	w := ts.performVerify(token, generateResp.Codes[0])
	ts.requireErrorCode(w, http.StatusForbidden, apierrors.ErrorCodeMFAVerificationRejected)

	// All the user's sessions are terminated.
	_, err := models.FindSessionByID(ts.API.db, ts.TestSession.ID, false)
	require.EqualError(ts.T(), err, models.SessionNotFoundError{}.Error())

	// No code burned, counter untouched.
	set := ts.recoveryCodeSetState()
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)
	require.Equal(ts.T(), 10, ts.unusedCodeCount())
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyHookError() {
	ts.setVerificationHook("recovery_codes_hook_error", `
        create or replace function recovery_codes_hook_error(input jsonb)
        returns json as $$
        begin
            RAISE EXCEPTION 'Intentional Error for Testing';
        end; $$ language plpgsql;`)

	generateResp, _, token := ts.enrollForVerify()

	w := ts.performVerify(token, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusInternalServerError, w.Code)

	// The request failed before the transaction: nothing consumed, nothing counted.
	set := ts.recoveryCodeSetState()
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Equal(ts.T(), 10, ts.unusedCodeCount())
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyHookSkippedWhenNoSet() {
	ts.setVerificationHook("recovery_codes_hook_reject_all", `
        create or replace function recovery_codes_hook_reject_all(input jsonb)
        returns json as $$
        begin
            return json_build_object('decision', 'reject');
        end; $$ language plpgsql;`)

	// No set enrolled: the uniform failure is returned without invoking the
	// hook, so no rejection (and no logout) can happen.
	token := ts.token(ts.TestUser, &ts.TestSession.ID)
	w := ts.performVerify(token, wrongCode)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)

	_, err := models.FindSessionByID(ts.API.db, ts.TestSession.ID, false)
	require.NoError(ts.T(), err, "sessions must survive when the hook is skipped")
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyCrossUserIsolation() {
	// Enroll the test user.
	_, _, token := ts.enrollForVerify()

	// A second user with their own verified factor, session, and codes.
	otherUser, err := models.NewUser("", "other@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(otherUser))
	otherFactor := models.NewTOTPFactor(otherUser, "other_factor")
	require.NoError(ts.T(), otherFactor.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(otherFactor))
	require.NoError(ts.T(), otherFactor.UpdateStatus(ts.API.db, models.FactorStateVerified))
	otherSession, err := models.NewSession(otherUser.ID, &otherFactor.ID)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(otherSession))
	require.NoError(ts.T(), otherSession.UpdateAALAndAssociatedFactor(ts.API.db, models.AAL2, &otherFactor.ID))
	otherResp := ts.performGenerate(ts.token(otherUser, &otherSession.ID), nil)

	// The test user submits the other user's valid code: uniform failure, the
	// test user's counter increments, and the other user's code stays unused.
	w := ts.performVerify(token, otherResp.Codes[0])
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)

	require.Equal(ts.T(), 1, ts.recoveryCodeSetState().FailedVerificationCount)

	otherSet, err := models.FindRecoveryCodeSetByUser(ts.API.db, otherUser.ID)
	require.NoError(ts.T(), err)
	otherEntries, err := models.FindUnusedRecoveryCodes(ts.API.db, otherSet.ID)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), otherEntries, 10)
	require.Equal(ts.T(), 0, otherSet.FailedVerificationCount)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyDisabled() {
	ts.Config.MFA.RecoveryCodes.VerifyEnabled = false

	generateResp, _, token := ts.enrollForVerify()
	w := ts.performVerify(token, generateResp.Codes[0])
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesVerifyDisabled)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesVerifyBadInput() {
	_, _, token := ts.enrollForVerify()

	cases := []struct {
		desc string
		body io.Reader
	}{
		{desc: "Missing body", body: nil},
		{desc: "Empty code", body: bytes.NewBufferString(`{"code": ""}`)},
		{desc: "Separators-only code", body: bytes.NewBufferString(`{"code": " -- - "}`)},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			w := ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes/verify", token, c.body)
			require.Equal(ts.T(), http.StatusBadRequest, w.Code)
		})
	}

	// Malformed input never reaches the failure counter.
	require.Equal(ts.T(), 0, ts.recoveryCodeSetState().FailedVerificationCount)
}

func (ts *RecoveryCodesTestSuite) performRegenerate(token string) *httptest.ResponseRecorder {
	return ts.serveRequest(http.MethodPost, "http://localhost/factors/recovery-codes/regenerate", token, nil)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesRegenerate() {
	token := ts.aal2Token()

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]any{"friendly_name": "My recovery codes"}))
	generateResp := ts.performGenerate(token, &buffer)

	// Consume one code from an AAL1 session so regeneration provably restores a full set.
	verifySession := ts.grantSession()
	verifyToken := ts.token(ts.TestUser, &verifySession.ID)
	w := ts.performVerify(verifyToken, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
	require.Equal(ts.T(), 9, ts.unusedCodeCount())

	w = ts.performRegenerate(token)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	resp := RecoveryCodesResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))

	// Same factor, same name; only the codes rotate.
	require.Equal(ts.T(), generateResp.ID, resp.ID)
	require.Equal(ts.T(), models.RecoveryCode, resp.Type)
	require.Equal(ts.T(), "My recovery codes", resp.FriendlyName)
	require.Equal(ts.T(), 10, resp.Total)
	require.Nil(ts.T(), resp.Remaining)
	require.Len(ts.T(), resp.Codes, 10)
	require.Equal(ts.T(), 10, ts.unusedCodeCount())

	codeFormat := regexp.MustCompile("^[a-z2-7]{16}$")
	oldCodes := make(map[string]bool)
	for _, code := range generateResp.Codes {
		oldCodes[code] = true
	}
	seen := make(map[string]bool)
	for _, code := range resp.Codes {
		require.Regexp(ts.T(), codeFormat, code)
		require.False(ts.T(), oldCodes[code], "regenerated code %q should not repeat an old code", code)
		seen[code] = true
	}
	require.Len(ts.T(), seen, 10, "codes should be unique")

	// An old (previously unused) code no longer verifies; a fresh one does.
	w = ts.performVerify(verifyToken, generateResp.Codes[1])
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)
	w = ts.performVerify(verifyToken, resp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)

	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.RecoveryCodesRegeneratedAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
	require.Equal(ts.T(), "factor", logs[0].Payload["log_type"])
	traits, ok := logs[0].Payload["traits"].(map[string]any)
	require.True(ts.T(), ok)
	require.Equal(ts.T(), generateResp.ID.String(), traits["factor_id"])
	require.EqualValues(ts.T(), 10, traits["count"])
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesRegenerateClearsLockout() {
	ts.Config.MFA.RecoveryCodes.MaxVerifyAttempts = 3

	_, _, verifyToken := ts.enrollForVerify()

	for range 3 {
		w := ts.performVerify(verifyToken, wrongCode)
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFAVerificationFailed)
	}
	require.NotNil(ts.T(), ts.recoveryCodeSetState().VerificationLockedUntil)

	// An AAL2 holder can always unlock themselves by rotating the set.
	w := ts.performRegenerate(ts.token(ts.TestUser, &ts.TestSession.ID))
	require.Equal(ts.T(), http.StatusOK, w.Code)
	resp := RecoveryCodesResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))

	set := ts.recoveryCodeSetState()
	require.Equal(ts.T(), 0, set.FailedVerificationCount)
	require.Nil(ts.T(), set.VerificationLockedUntil)

	// The lockout is gone: a fresh code verifies immediately, no 429.
	w = ts.performVerify(verifyToken, resp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesRegenerateEnrollDisabled() {
	token := ts.aal2Token()
	ts.performGenerate(token, nil)

	ts.Config.MFA.RecoveryCodes.EnrollEnabled = false

	w := ts.performRegenerate(token)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesEnrollDisabled)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesRegenerateRequiresAAL2() {
	_, _, aal1Token := ts.enrollForVerify()

	w := ts.performRegenerate(aal1Token)
	ts.requireErrorCode(w, http.StatusForbidden, apierrors.ErrorCodeInsufficientAAL)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesRegenerateNotEnrolled() {
	w := ts.performRegenerate(ts.aal2Token())
	ts.requireErrorCode(w, http.StatusNotFound, apierrors.ErrorCodeMFAFactorNotFound)
}

func (ts *RecoveryCodesTestSuite) performDelete(token string) *httptest.ResponseRecorder {
	return ts.serveRequest(http.MethodDelete, "http://localhost/factors/recovery-codes", token, nil)
}

func hasRecoveryCodeAMRClaim(session *models.Session) bool {
	for _, claim := range session.AMRClaims {
		if claim.GetAuthenticationMethod() == models.MFARecoveryCode.String() {
			return true
		}
	}
	return false
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesDelete() {
	generateResp, verifySession, verifyToken := ts.enrollForVerify()
	setID := ts.recoveryCodeSetState().ID

	// Upgrade the AAL1 session with a recovery code so deletion has a session to downgrade.
	w := ts.performVerify(verifyToken, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
	upgraded, err := models.FindSessionByID(ts.API.db, verifySession.ID, false)
	require.NoError(ts.T(), err)
	require.True(ts.T(), upgraded.IsAAL2())
	require.NotNil(ts.T(), upgraded.FactorID)
	require.Equal(ts.T(), generateResp.ID, *upgraded.FactorID)
	require.True(ts.T(), hasRecoveryCodeAMRClaim(upgraded))

	aal2Token := ts.aal2Token()
	w = ts.performDelete(aal2Token)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	resp := UnenrollFactorResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))
	require.Equal(ts.T(), generateResp.ID, resp.ID)

	// The factor is gone and the FK cascade removed the set and every code.
	_, err = models.FindFactorByFactorID(ts.API.db, generateResp.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
	_, err = models.FindRecoveryCodeSetByUser(ts.API.db, ts.TestUser.ID)
	require.True(ts.T(), models.IsNotFoundError(err))
	total, remaining, err := models.CountRecoveryCodes(ts.API.db, setID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), 0, total)
	require.Equal(ts.T(), 0, remaining)
	w = ts.serveRequest(http.MethodGet, "http://localhost/factors/recovery-codes", aal2Token, nil)
	ts.requireErrorCode(w, http.StatusNotFound, apierrors.ErrorCodeMFAFactorNotFound)

	// The session upgraded by a recovery code is downgraded and loses its AMR claim.
	downgraded, err := models.FindSessionByID(ts.API.db, verifySession.ID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.AAL1.String(), downgraded.GetAAL())
	require.Nil(ts.T(), downgraded.FactorID)
	require.False(ts.T(), hasRecoveryCodeAMRClaim(downgraded))

	// The TOTP-backed session is untouched.
	totpSession, err := models.FindSessionByID(ts.API.db, ts.TestSession.ID, false)
	require.NoError(ts.T(), err)
	require.True(ts.T(), totpSession.IsAAL2())
	require.NotNil(ts.T(), totpSession.FactorID)
	require.Equal(ts.T(), ts.TestFactor.ID, *totpSession.FactorID)

	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.RecoveryCodesDeletedAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
	require.Equal(ts.T(), "factor", logs[0].Payload["log_type"])
	traits, ok := logs[0].Payload["traits"].(map[string]any)
	require.True(ts.T(), ok)
	require.Equal(ts.T(), generateResp.ID.String(), traits["factor_id"])

	// The per-user slot is free again.
	ts.performGenerate(aal2Token, nil)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesDeleteRequiresAAL2() {
	generateResp, _, aal1Token := ts.enrollForVerify()

	w := ts.performDelete(aal1Token)
	ts.requireErrorCode(w, http.StatusForbidden, apierrors.ErrorCodeInsufficientAAL)

	_, err := models.FindFactorByFactorID(ts.API.db, generateResp.ID)
	require.NoError(ts.T(), err, "factor must survive a rejected delete")
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesDeleteNotEnrolled() {
	w := ts.performDelete(ts.aal2Token())
	ts.requireErrorCode(w, http.StatusNotFound, apierrors.ErrorCodeMFAFactorNotFound)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesDeleteUnenrolledNotificationEnabled() {
	ts.Config.Mailer.Notifications.MFAFactorUnenrolledEnabled = true

	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	token := ts.aal2Token()
	ts.performGenerate(token, nil)
	w := ts.performDelete(token)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	require.Len(ts.T(), mockMailer.MFAFactorUnenrolledMailCalls, 1, "Expected one MFA factor unenrolled notification email to be sent")
	require.Equal(ts.T(), ts.TestUser.ID, mockMailer.MFAFactorUnenrolledMailCalls[0].User.ID, "Email should be sent to the correct user")
	require.Equal(ts.T(), models.RecoveryCode, mockMailer.MFAFactorUnenrolledMailCalls[0].FactorType, "Email should specify the correct factor type")
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesDeleteUnenrolledNotificationDisabled() {
	ts.Config.Mailer.Notifications.MFAFactorUnenrolledEnabled = false

	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	token := ts.aal2Token()
	ts.performGenerate(token, nil)
	w := ts.performDelete(token)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	require.Empty(ts.T(), mockMailer.MFAFactorUnenrolledMailCalls, "Expected no MFA factor unenrolled notification email to be sent")
}

// adminToken mints a supabase_admin JWT for the admin factor endpoints.
func (ts *RecoveryCodesTestSuite) adminToken() string {
	claims := &AccessTokenClaims{Role: "supabase_admin"}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err, "Error generating admin jwt")
	return token
}

func (ts *RecoveryCodesTestSuite) createTOTPFactor(friendlyName string, state models.FactorState) *models.Factor {
	f := models.NewTOTPFactor(ts.TestUser, friendlyName)
	require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(f))
	if state == models.FactorStateVerified {
		require.NoError(ts.T(), f.UpdateStatus(ts.API.db, models.FactorStateVerified))
	}
	return f
}

func (ts *RecoveryCodesTestSuite) createPhoneFactor(friendlyName string, state models.FactorState) *models.Factor {
	f := models.NewPhoneFactor(ts.TestUser, "+15555555555", friendlyName)
	require.NoError(ts.T(), ts.API.db.Create(f))
	if state == models.FactorStateVerified {
		require.NoError(ts.T(), f.UpdateStatus(ts.API.db, models.FactorStateVerified))
	}
	return f
}

// performUnenroll hits the generic DELETE /factors/{factor_id} endpoint.
func (ts *RecoveryCodesTestSuite) performUnenroll(token string, factorID uuid.UUID) *httptest.ResponseRecorder {
	return ts.serveRequest(http.MethodDelete, fmt.Sprintf("http://localhost/factors/%s", factorID), token, nil)
}

// performEnrollTOTP hits the generic POST /factors endpoint with a TOTP factor.
func (ts *RecoveryCodesTestSuite) performEnrollTOTP(token, friendlyName string) *httptest.ResponseRecorder {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(EnrollFactorParams{
		FriendlyName: friendlyName,
		FactorType:   models.TOTP,
		Issuer:       "supabase.com",
	}))
	return ts.serveRequest(http.MethodPost, "http://localhost/factors/", token, &buffer)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesUnenrollLastSecondFactorBlocked() {
	token := ts.aal2Token()
	generateResp := ts.performGenerate(token, nil)

	// The TOTP factor is the only second factor; unenrolling it would strand the codes.
	w := ts.performUnenroll(token, ts.TestFactor.ID)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesSoleFactor)

	_, err := models.FindFactorByFactorID(ts.API.db, ts.TestFactor.ID)
	require.NoError(ts.T(), err)
	_, err = models.FindFactorByFactorID(ts.API.db, generateResp.ID)
	require.NoError(ts.T(), err)
	ts.recoveryCodeSetState()

	logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.UnenrollFactorAction), nil)
	require.NoError(ts.T(), err)
	require.Empty(ts.T(), logs, "a blocked unenroll must not be audited")

	// Deleting the recovery codes first lifts the guard.
	w = ts.performDelete(token)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	w = ts.performUnenroll(token, ts.TestFactor.ID)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	resp := UnenrollFactorResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))
	require.Equal(ts.T(), ts.TestFactor.ID, resp.ID)
	_, err = models.FindFactorByFactorID(ts.API.db, ts.TestFactor.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())

	logs, err = models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(models.UnenrollFactorAction), nil)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), logs, 1)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesUnenrollOtherSecondFactorAllowed() {
	token := ts.aal2Token()
	ts.performGenerate(token, nil)
	second := ts.createTOTPFactor("second_factor", models.FactorStateVerified)

	// Another verified second factor remains, so this unenroll is unaffected.
	w := ts.performUnenroll(token, second.ID)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	resp := UnenrollFactorResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&resp))
	require.Equal(ts.T(), second.ID, resp.ID)
	_, err := models.FindFactorByFactorID(ts.API.db, second.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())

	ts.recoveryCodeSetState()
	w = ts.serveRequest(http.MethodGet, "http://localhost/factors/recovery-codes", token, nil)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// The remaining TOTP factor is now the last second factor.
	w = ts.performUnenroll(token, ts.TestFactor.ID)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesSoleFactor)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesUnenrollVerifyDisabledFactorNotCounted() {
	token := ts.aal2Token()
	ts.performGenerate(token, nil)
	phone := ts.createPhoneFactor("phone_factor", models.FactorStateVerified)
	prev := ts.Config.MFA.Phone.VerifyEnabled
	defer func() { ts.Config.MFA.Phone.VerifyEnabled = prev }()

	// A verified phone factor does not count while phone verification is disabled,
	// so the TOTP factor is still the last usable second factor.
	ts.Config.MFA.Phone.VerifyEnabled = false
	w := ts.performUnenroll(token, ts.TestFactor.ID)
	ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeMFARecoveryCodesSoleFactor)
	_, err := models.FindFactorByFactorID(ts.API.db, ts.TestFactor.ID)
	require.NoError(ts.T(), err)

	// Enabling phone verification makes it a usable second factor and lifts the guard.
	ts.Config.MFA.Phone.VerifyEnabled = true
	w = ts.performUnenroll(token, ts.TestFactor.ID)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	_, err = models.FindFactorByFactorID(ts.API.db, ts.TestFactor.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
	_, err = models.FindFactorByFactorID(ts.API.db, phone.ID)
	require.NoError(ts.T(), err)
	ts.recoveryCodeSetState()
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesUnenrollUnverifiedFactorAllowed() {
	token := ts.aal2Token()
	ts.performGenerate(token, nil)
	unverified := ts.createTOTPFactor("pending_factor", models.FactorStateUnverified)

	// An unverified factor is not a usable second factor, so the guard does not apply
	w := ts.performUnenroll(token, unverified.ID)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	_, err := models.FindFactorByFactorID(ts.API.db, unverified.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
	ts.recoveryCodeSetState()
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenericUnenrollRejected() {
	generateResp, _, _ := ts.enrollForVerify()
	aal2Token := ts.token(ts.TestUser, &ts.TestSession.ID)

	ts.Run("AAL2", func() {
		w := ts.performUnenroll(aal2Token, generateResp.ID)
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeValidationFailed)
	})

	_, err := models.FindFactorByFactorID(ts.API.db, generateResp.ID)
	require.NoError(ts.T(), err)
	ts.recoveryCodeSetState()

	for _, action := range []models.AuditAction{models.RecoveryCodesDeletedAction, models.UnenrollFactorAction} {
		logs, err := models.FindAuditLogEntries(ts.API.db, []string{"action"}, string(action), nil)
		require.NoError(ts.T(), err)
		require.Empty(ts.T(), logs)
	}
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesGenericEndpointsRejectRecoveryFactor() {
	token := ts.aal2Token()
	generateResp := ts.performGenerate(token, nil)

	ts.Run("Enroll", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(EnrollFactorParams{FriendlyName: "codes", FactorType: models.RecoveryCode}))
		w := ts.serveRequest(http.MethodPost, "http://localhost/factors/", token, &buffer)
		ts.requireErrorCode(w, http.StatusBadRequest, apierrors.ErrorCodeValidationFailed)
	})

	ts.Run("Challenge", func() {
		w := ts.serveRequest(http.MethodPost, fmt.Sprintf("http://localhost/factors/%s/challenge", generateResp.ID), token, nil)
		ts.requireErrorCode(w, http.StatusBadRequest, apierrors.ErrorCodeValidationFailed)
	})

	ts.Run("Verify", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]any{"code": generateResp.Codes[0]}))
		w := ts.serveRequest(http.MethodPost, fmt.Sprintf("http://localhost/factors/%s/verify", generateResp.ID), token, &buffer)
		ts.requireErrorCode(w, http.StatusBadRequest, apierrors.ErrorCodeValidationFailed)
	})

	// The rejected generic verify did not consume the real code it was given.
	require.Equal(ts.T(), generateResp.Total, ts.unusedCodeCount())
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesOccupyFactorSlot() {
	token := ts.aal2Token()
	ts.performGenerate(token, nil)
	// The user now holds two verified factors: TOTP and recovery codes.

	ts.Run("MaxEnrolledFactors", func() {
		ts.Config.MFA.MaxEnrolledFactors = 2
		defer func() { ts.Config.MFA.MaxEnrolledFactors = 10 }()

		w := ts.performEnrollTOTP(token, "another_factor")
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeTooManyEnrolledMFAFactors)
	})

	ts.Run("MaxVerifiedFactors", func() {
		ts.Config.MFA.MaxVerifiedFactors = 2
		defer func() { ts.Config.MFA.MaxVerifiedFactors = 10 }()

		w := ts.performEnrollTOTP(token, "another_factor")
		ts.requireErrorCode(w, http.StatusUnprocessableEntity, apierrors.ErrorCodeTooManyEnrolledMFAFactors)
	})

	ts.Run("WithinLimits", func() {
		w := ts.performEnrollTOTP(token, "another_factor")
		require.Equal(ts.T(), http.StatusOK, w.Code)
	})
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesAdminDelete() {
	generateResp, verifySession, verifyToken := ts.enrollForVerify()
	setID := ts.recoveryCodeSetState().ID

	// Upgrade the AAL1 session with a recovery code so deletion has a session to downgrade.
	w := ts.performVerify(verifyToken, generateResp.Codes[0])
	require.Equal(ts.T(), http.StatusOK, w.Code)
	upgraded, err := models.FindSessionByID(ts.API.db, verifySession.ID, false)
	require.NoError(ts.T(), err)
	require.True(ts.T(), upgraded.IsAAL2())
	require.True(ts.T(), hasRecoveryCodeAMRClaim(upgraded))

	w = ts.serveRequest(http.MethodDelete, fmt.Sprintf("http://localhost/admin/users/%s/factors/%s/", ts.TestUser.ID, generateResp.ID), ts.adminToken(), nil)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// The factor is gone and the FK cascade removed the set and every code.
	_, err = models.FindFactorByFactorID(ts.API.db, generateResp.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
	_, err = models.FindRecoveryCodeSetByUser(ts.API.db, ts.TestUser.ID)
	require.True(ts.T(), models.IsNotFoundError(err))
	total, remaining, err := models.CountRecoveryCodes(ts.API.db, setID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), 0, total)
	require.Equal(ts.T(), 0, remaining)

	// The session upgraded by a recovery code is downgraded and loses its AMR claim.
	downgraded, err := models.FindSessionByID(ts.API.db, verifySession.ID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.AAL1.String(), downgraded.GetAAL())
	require.Nil(ts.T(), downgraded.FactorID)
	require.False(ts.T(), hasRecoveryCodeAMRClaim(downgraded))

	// The TOTP-backed session is untouched.
	totpSession, err := models.FindSessionByID(ts.API.db, ts.TestSession.ID, false)
	require.NoError(ts.T(), err)
	require.True(ts.T(), totpSession.IsAAL2())
	require.NotNil(ts.T(), totpSession.FactorID)
	require.Equal(ts.T(), ts.TestFactor.ID, *totpSession.FactorID)
}

func (ts *RecoveryCodesTestSuite) TestRecoveryCodesFactorListings() {
	token := ts.aal2Token()
	generateResp := ts.performGenerate(token, nil)

	// Sensitive fields are not serialized
	forbiddenKeys := []string{"secret", "code_hash", "codes", "failed_verification_count", "verification_locked_until"}

	assertRecoveryFactorListed := func(factors []map[string]any) {
		var recovery map[string]any
		for _, f := range factors {
			if f["factor_type"] == models.RecoveryCode {
				require.Nil(ts.T(), recovery, "only one recovery-code factor expected")
				recovery = f
			}
		}
		require.NotNil(ts.T(), recovery, "recovery-code factor missing from listing")
		require.Equal(ts.T(), generateResp.ID.String(), recovery["id"])
		require.Equal(ts.T(), models.FactorStateVerified.String(), recovery["status"])
		require.Equal(ts.T(), models.DefaultRecoveryCodeFriendlyName, recovery["friendly_name"])
		for _, key := range forbiddenKeys {
			require.NotContains(ts.T(), recovery, key)
		}
	}

	ts.Run("AdminGetFactors", func() {
		w := ts.serveRequest(http.MethodGet, fmt.Sprintf("http://localhost/admin/users/%s/factors/", ts.TestUser.ID), ts.adminToken(), nil)
		require.Equal(ts.T(), http.StatusOK, w.Code)
		var factors []map[string]any
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&factors))
		require.Len(ts.T(), factors, 2)
		assertRecoveryFactorListed(factors)
	})

	ts.Run("UserGet", func() {
		w := ts.serveRequest(http.MethodGet, "http://localhost/user", token, nil)
		require.Equal(ts.T(), http.StatusOK, w.Code)
		var user struct {
			Factors []map[string]any `json:"factors"`
		}
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&user))
		require.Len(ts.T(), user.Factors, 2)
		assertRecoveryFactorListed(user.Factors)
	})
}
