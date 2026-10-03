package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"gopkg.in/h2non/gock.v1"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	mail "github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/models"
)

// The typed-OTP verification path can read the challenge from either the legacy
// users.*_token columns or, with EnableOTTAsSourceOfTruth, from the one_time_tokens table.
//
// These tests run every flow once per store with identical seeding and ensure the outcome is equal.
const (
	parityOTP        = "123456"
	parityEmail      = "test@example.com"
	parityPhone      = "12345678"
	parityNewEmail   = "new@example.com"
	parityNewPhone   = "1234567890"
	parityForbidden  = "Token has expired or is invalid"
	twilioServiceSid = "VA-parity-test"
)

// otpParityOutcome is everything a client or an operator can observe after a
// POST /verify: the HTTP result, the user state it left, and the audit action it recorded.
type otpParityOutcome struct {
	Status         int
	ErrorCode      string
	Msg            string
	Action         string
	EmailConfirmed bool
	PhoneConfirmed bool
	Email          string
	Phone          string
}

type otpParityCase struct {
	// seed receives a user freshly created by the test suite's SetupTest fn, creates an OTT challenge
	// and modifies the user to include the relevant OTT values, given our dual-write approach today.
	seed        func(u *models.User)
	requestBody map[string]interface{}
	// configure applies per-case config, and runs once per store. It returns a restore function that will be called after the test.
	configure func() func()
	expected  otpParityOutcome
}

func (ts *VerifyTestSuite) TestVerifyOTPParityEmailFlows() {
	now := time.Now()
	expired := now.Add(-48 * time.Hour)
	emailHash := crypto.GenerateTokenHash(parityEmail, parityOTP)

	forbidden := otpParityOutcome{
		Status:    http.StatusForbidden,
		ErrorCode: apierrors.ErrorCodeOTPExpired,
		Msg:       parityForbidden,
		Email:     parityEmail,
		Phone:     parityPhone,
	}

	signedUp := otpParityOutcome{
		Status:         http.StatusOK,
		Action:         string(models.UserSignedUpAction),
		EmailConfirmed: true,
		Email:          parityEmail,
		Phone:          parityPhone,
	}

	loggedIn := otpParityOutcome{
		Status:         http.StatusOK,
		Action:         string(models.LoginAction),
		EmailConfirmed: true,
		Email:          parityEmail,
		Phone:          parityPhone,
	}

	cases := map[string]otpParityCase{
		"signup with a valid code confirms the user": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.SignupVerification, parityEmail),
			expected:    signedUp,
		},
		"signup with an expired code is rejected": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, expired, -time.Hour)
			},
			requestBody: emailOTPBody(mail.SignupVerification, parityEmail),
			expected:    forbidden,
		},
		"signup with the wrong code is rejected": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, crypto.GenerateTokenHash(parityEmail, "999999"), now, time.Hour)
			},
			requestBody: emailOTPBody(mail.SignupVerification, parityEmail),
			expected:    forbidden,
		},
		"invite with a valid code confirms the user": {
			seed: func(u *models.User) {
				u.InvitedAt = &now
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.InviteVerification, parityEmail),
			expected:    signedUp,
		},
		"magiclink with a valid code signs a confirmed user in": {
			seed: func(u *models.User) {
				u.EmailConfirmedAt = &now
				ts.seedChallenge(u, models.RecoveryToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.MagicLinkVerification, parityEmail),
			expected:    loggedIn,
		},
		"magiclink with a pkce_ prefixed stored hash accepts the plain code": {
			seed: func(u *models.User) {
				u.EmailConfirmedAt = &now
				ts.seedChallenge(u, models.RecoveryToken, parityEmail, PKCEPrefix+emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.MagicLinkVerification, parityEmail),
			expected:    loggedIn,
		},
		"recovery with a valid code signs a confirmed user in": {
			seed: func(u *models.User) {
				u.EmailConfirmedAt = &now
				ts.seedChallenge(u, models.RecoveryToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.RecoveryVerification, parityEmail),
			expected:    loggedIn,
		},
		"email type with a confirmation token runs the signup flow": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.EmailOTPVerification, parityEmail),
			expected:    signedUp,
		},
		"email type with a recovery token runs the magiclink flow": {
			seed: func(u *models.User) {
				u.EmailConfirmedAt = &now
				ts.seedChallenge(u, models.RecoveryToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.EmailOTPVerification, parityEmail),
			expected:    loggedIn,
		},
		"email type with no matching challenge is rejected": {
			requestBody: emailOTPBody(mail.EmailOTPVerification, parityEmail),
			expected:    forbidden,
		},
		"email change with a valid code moves the user to the new address": {
			// Secure email change defaults to on, which needs a OTP for the old email address too. Turn it off and then revert.
			configure: func() func() {
				previous := ts.Config.Mailer.SecureEmailChangeEnabled
				ts.Config.Mailer.SecureEmailChangeEnabled = false
				return func() { ts.Config.Mailer.SecureEmailChangeEnabled = previous }
			},
			seed: func(u *models.User) {
				u.EmailChange = parityNewEmail
				ts.seedChallenge(u, models.EmailChangeTokenNew, parityNewEmail, crypto.GenerateTokenHash(parityNewEmail, parityOTP), now, time.Hour)
			},
			requestBody: emailOTPBody(mail.EmailChangeVerification, parityNewEmail),
			expected: otpParityOutcome{
				Status:         http.StatusOK,
				Action:         string(models.UserModifiedAction),
				EmailConfirmed: true,
				Email:          parityNewEmail,
				Phone:          parityPhone,
			},
		},
		"a banned user is rejected": {
			seed: func(u *models.User) {
				bannedUntil := now.Add(time.Hour)
				u.BannedUntil = &bannedUntil
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.SignupVerification, parityEmail),
			expected: otpParityOutcome{
				Status:    http.StatusForbidden,
				ErrorCode: apierrors.ErrorCodeUserBanned,
				Msg:       "User is banned",
				Email:     parityEmail,
				Phone:     parityPhone,
			},
		},
		"an unknown verification type is rejected": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody("bogus", parityEmail),
			expected:    forbidden,
		},
	}

	ts.runOTPParityCases(cases)
}

func (ts *VerifyTestSuite) TestVerifyOTPParityPhoneFlows() {
	now := time.Now()
	expired := now.Add(-48 * time.Hour)
	phoneHash := crypto.GenerateTokenHash(parityPhone, parityOTP)

	forbidden := otpParityOutcome{
		Status:    http.StatusForbidden,
		ErrorCode: apierrors.ErrorCodeOTPExpired,
		Msg:       parityForbidden,
		Email:     parityEmail,
		Phone:     parityPhone,
	}

	phoneSignedUp := otpParityOutcome{
		Status:         http.StatusOK,
		Action:         string(models.UserSignedUpAction),
		PhoneConfirmed: true,
		Email:          parityEmail,
		Phone:          parityPhone,
	}

	phoneChanged := otpParityOutcome{
		Status:         http.StatusOK,
		Action:         string(models.UserModifiedAction),
		PhoneConfirmed: true,
		Email:          parityEmail,
		Phone:          parityNewPhone,
	}

	cases := map[string]otpParityCase{
		"sms with a valid code confirms the phone": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, phoneHash, now, time.Hour)
			},
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    phoneSignedUp,
		},
		"sms with an expired code is rejected": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, phoneHash, expired, -time.Hour)
			},
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    forbidden,
		},
		"sms with the wrong code is rejected": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, crypto.GenerateTokenHash(parityPhone, "999999"), now, time.Hour)
			},
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    forbidden,
		},
		"phone change with a valid code moves the user to the new number": {
			seed: func(u *models.User) {
				u.PhoneChange = parityNewPhone
				ts.seedChallenge(u, models.PhoneChangeToken, parityNewPhone, crypto.GenerateTokenHash(parityNewPhone, parityOTP), now, time.Hour)
			},
			requestBody: phoneOTPBody(phoneChangeVerification, parityNewPhone),
			expected:    phoneChanged,
		},
		// A test OTP is accepted without any stored challenge. This is the
		// path app store reviewers and CI rely on.
		"sms with a test OTP succeeds with no stored challenge": {
			configure:   ts.configureTestOTP(parityPhone, parityOTP),
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    phoneSignedUp,
		},
		"sms with a wrong code falls through the test OTP check and is rejected": {
			configure:   ts.configureTestOTP(parityPhone, "000000"),
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    forbidden,
		},
		// Twilio Verify generates and delivers its own code, so the locally
		// stored hash never matches what the user types. Twilio's answer is the
		// only thing that counts.
		"sms with Twilio Verify accepts a code Twilio approves": {
			configure: ts.configureTwilioVerify(map[string]interface{}{"status": "approved", "valid": true}),
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, crypto.GenerateTokenHash(parityPhone, "999999"), now, time.Hour)
			},
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    phoneSignedUp,
		},
		"sms with Twilio Verify rejects a code Twilio does not approve": {
			configure: ts.configureTwilioVerify(map[string]interface{}{"status": "pending", "valid": false}),
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, phoneHash, now, time.Hour)
			},
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    forbidden,
		},
		// An SSO user has no local credentials to verify. Twilio approves the
		// code here, so only the SSO check can reject the request.
		"sms with Twilio Verify rejects an SSO user": {
			configure: ts.configureTwilioVerify(map[string]interface{}{"status": "approved", "valid": true}),
			seed: func(u *models.User) {
				u.IsSSOUser = true
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, phoneHash, now, time.Hour)
			},
			requestBody: phoneOTPBody(smsVerification, parityPhone),
			expected:    forbidden,
		},
	}

	ts.runOTPParityCases(cases)
}

// runOTPParityCases runs each case against both stores and asserts that both
// produce the expected outcome and agree with each other.
func (ts *VerifyTestSuite) runOTPParityCases(testCases map[string]otpParityCase) {
	// Run order does not matter: every store run truncates and re-seeds.
	for name, tc := range testCases {
		ts.Run(name, func() {
			legacyOutcome, ottOutcome := ts.runPerStore(func() otpParityOutcome {
				return ts.runOTPParityCase(tc)
			})

			require.Equal(ts.T(), legacyOutcome, ottOutcome,
				"legacy and one_time_tokens paths must produce the same outcome")
		})
	}
}

// runPerStore runs run once per store, each in its own subtest with a truncated
// database, and returns what each store produced. Tests that need more than one
// request per store use this directly instead of the case table.
func (ts *VerifyTestSuite) runPerStore(run func() otpParityOutcome) (legacy, ott otpParityOutcome) {
	originalFlag := ts.Config.Experimental.EnableOTTAsSourceOfTruth
	defer func() { ts.Config.Experimental.EnableOTTAsSourceOfTruth = originalFlag }()

	ts.Run("legacy users columns", func() {
		ts.SetupTest()
		ts.Config.Experimental.EnableOTTAsSourceOfTruth = false
		legacy = run()
	})
	ts.Run("one_time_tokens", func() {
		ts.SetupTest()
		ts.Config.Experimental.EnableOTTAsSourceOfTruth = true
		ott = run()
	})
	return legacy, ott
}

// runOTPParityCase arranges one case, sends its request, and asserts the
// outcome matches c.expected, so a failure names the store that diverged.
func (ts *VerifyTestSuite) runOTPParityCase(c otpParityCase) otpParityOutcome {
	if c.configure != nil {
		restore := c.configure()
		defer restore()
	}

	u := ts.parityUser()
	if c.seed != nil {
		c.seed(u)
	}

	since := time.Now()
	w := ts.postVerify(c.requestBody)
	outcome := ts.observeOutcome(w, u.ID, since)
	require.Equal(ts.T(), c.expected, outcome)
	return outcome
}

// parityUser returns the fixture user SetupTest created.
func (ts *VerifyTestSuite) parityUser() *models.User {
	u, err := models.FindUserByEmailAndAudience(ts.API.db, parityEmail, ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	return u
}

// saveUser persists every pending change on u. Call it from a seed that
// changes u but stores no challenge. seedChallenge calls it already.
func (ts *VerifyTestSuite) saveUser(u *models.User) {
	require.NoError(ts.T(), ts.API.db.Update(u))
}

// seedChallenge stores hash in the users column and the one_time_tokens row
// for tokenType, mirroring what the send paths write. relatesTo is the address
// or number the code was sent to; the Twilio Verify path finds the row by it.
// It persists u, so it also saves any other change the case made.
func (ts *VerifyTestSuite) seedChallenge(u *models.User, tokenType models.OneTimeTokenType, relatesTo, hash string, sentAt time.Time, validity time.Duration) {
	switch tokenType {
	case models.ConfirmationToken:
		u.ConfirmationToken = hash
		u.ConfirmationSentAt = &sentAt
	case models.RecoveryToken:
		u.RecoveryToken = hash
		u.RecoverySentAt = &sentAt
	case models.EmailChangeTokenNew:
		u.EmailChangeTokenNew = hash
		u.EmailChangeSentAt = &sentAt
	case models.EmailChangeTokenCurrent:
		u.EmailChangeTokenCurrent = hash
		u.EmailChangeSentAt = &sentAt
	case models.PhoneChangeToken:
		u.PhoneChangeToken = hash
		u.PhoneChangeSentAt = &sentAt
	default:
		ts.T().Fatalf("seedChallenge does not support token type %s", tokenType)
	}

	ts.saveUser(u)
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, relatesTo, hash, tokenType, validity, true))
}

func (ts *VerifyTestSuite) postVerify(body map[string]interface{}) *httptest.ResponseRecorder {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(body))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/verify", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	return w
}

func (ts *VerifyTestSuite) observeOutcome(w *httptest.ResponseRecorder, userID uuid.UUID, since time.Time) otpParityOutcome {
	outcome := otpParityOutcome{Status: w.Code}

	if w.Code != http.StatusOK {
		var body struct {
			ErrorCode string `json:"error_code"`
			Msg       string `json:"msg"`
		}
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&body))
		outcome.ErrorCode = body.ErrorCode
		outcome.Msg = body.Msg
	}

	u, err := models.FindUserByID(ts.API.db, userID)
	require.NoError(ts.T(), err)
	outcome.EmailConfirmed = u.EmailConfirmedAt != nil
	outcome.PhoneConfirmed = u.PhoneConfirmedAt != nil
	outcome.Email = u.GetEmail()
	outcome.Phone = u.GetPhone()

	logs, err := models.FindAuditLogEntries(ts.API.db, nil, "", nil)
	require.NoError(ts.T(), err)
	if len(logs) > 0 && !logs[0].CreatedAt.Before(since) {
		outcome.Action, _ = logs[0].Payload["action"].(string)
	}

	return outcome
}

func (ts *VerifyTestSuite) TestVerifyOTPParityCodeIsSingleUse() {
	now := time.Now()
	emailHash := crypto.GenerateTokenHash(parityEmail, parityOTP)
	requestBody := emailOTPBody(mail.SignupVerification, parityEmail)

	legacyOutcome, ottOutcome := ts.runPerStore(func() otpParityOutcome {
		u := ts.parityUser()
		ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)

		first := ts.observeOutcome(ts.postVerify(requestBody), u.ID, now)
		require.Equal(ts.T(), http.StatusOK, first.Status, "the first use must succeed")
		require.True(ts.T(), first.EmailConfirmed)

		// The row must be gone/
		_, err := models.FindOneTimeToken(ts.API.db, emailHash, models.ConfirmationToken)
		require.True(ts.T(), models.IsNotFoundError(err),
			"the challenge row must be deleted on success, got %v", err)

		since := time.Now()
		return ts.observeOutcome(ts.postVerify(requestBody), u.ID, since)
	})

	replayed := otpParityOutcome{
		Status:         http.StatusForbidden,
		ErrorCode:      apierrors.ErrorCodeOTPExpired,
		Msg:            parityForbidden,
		EmailConfirmed: true,
		Email:          parityEmail,
		Phone:          parityPhone,
	}
	require.Equal(ts.T(), replayed, legacyOutcome)
	require.Equal(ts.T(), replayed, ottOutcome)
}

// TestVerifyOTPParitySecureEmailChange covers the dual-confirmation flow
// where a code goes to both the old and the new address and both tokens must be redeemed in order to be fully verified.
func (ts *VerifyTestSuite) TestVerifyOTPParitySecureEmailChange() {
	now := time.Now()
	newHash := crypto.GenerateTokenHash(parityNewEmail, parityOTP)
	currentHash := crypto.GenerateTokenHash(parityEmail, parityOTP)

	legacyOutcome, ottOutcome := ts.runPerStore(func() otpParityOutcome {
		require.True(ts.T(), ts.Config.Mailer.SecureEmailChangeEnabled,
			"this test covers the secure flow, which is the default")

		u := ts.parityUser()
		u.EmailChange = parityNewEmail
		ts.seedChallenge(u, models.EmailChangeTokenNew, parityNewEmail, newHash, now, time.Hour)
		ts.seedChallenge(u, models.EmailChangeTokenCurrent, parityEmail, currentHash, now, time.Hour)

		w := ts.postVerify(emailOTPBody(mail.EmailChangeVerification, parityNewEmail))
		require.Equal(ts.T(), http.StatusOK, w.Code, "the new address code must be accepted")
		require.Equal(ts.T(), singleConfirmationAccepted, ts.responseMsg(w))

		pending := ts.parityUser()
		require.Equal(ts.T(), singleConfirmation, pending.EmailChangeConfirmStatus)
		require.Equal(ts.T(), parityEmail, pending.GetEmail(),
			"one code must not be enough to move the address")

		since := time.Now()
		return ts.observeOutcome(
			ts.postVerify(emailOTPBody(mail.EmailChangeVerification, parityEmail)), u.ID, since)
	})

	changed := otpParityOutcome{
		Status:         http.StatusOK,
		Action:         string(models.UserModifiedAction),
		EmailConfirmed: true,
		Email:          parityNewEmail,
		Phone:          parityPhone,
	}
	require.Equal(ts.T(), changed, legacyOutcome)
	require.Equal(ts.T(), changed, ottOutcome)
}

// TestVerifyOTPParitySecureEmailChangeDisabled covers a leftover code for the
// current address, which only the secure flow sends. If secure email change is
// off when the user verifies, that code must not complete the change, because
// nothing confirmed the new address.
func (ts *VerifyTestSuite) TestVerifyOTPParitySecureEmailChangeDisabled() {
	now := time.Now()
	currentHash := crypto.GenerateTokenHash(parityEmail, parityOTP)

	cases := map[string]otpParityCase{
		"a leftover current address code does not move the user to the new address": {
			configure: func() func() {
				previous := ts.Config.Mailer.SecureEmailChangeEnabled
				ts.Config.Mailer.SecureEmailChangeEnabled = false
				return func() { ts.Config.Mailer.SecureEmailChangeEnabled = previous }
			},
			seed: func(u *models.User) {
				u.EmailChange = parityNewEmail
				ts.seedChallenge(u, models.EmailChangeTokenCurrent, parityEmail, currentHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.EmailChangeVerification, parityEmail),
			expected: otpParityOutcome{
				Status:    http.StatusForbidden,
				ErrorCode: apierrors.ErrorCodeOTPExpired,
				Msg:       parityForbidden,
				Email:     parityEmail,
				Phone:     parityPhone,
			},
		},
	}

	ts.runOTPParityCases(cases)
}

// responseMsg reads the msg field out of a response body.
func (ts *VerifyTestSuite) responseMsg(w *httptest.ResponseRecorder) string {
	var body struct {
		Msg string `json:"msg"`
	}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&body))
	return body.Msg
}

func (ts *VerifyTestSuite) configureTestOTP(phone, otp string) func() func() {
	return func() func() {
		previous := ts.Config.Sms.TestOTP
		ts.Config.Sms.TestOTP = map[string]string{phone: otp}
		return func() { ts.Config.Sms.TestOTP = previous }
	}
}

// configureTwilioVerify switches the SMS provider to Twilio Verify and arms a
// single mocked VerificationCheck response.
func (ts *VerifyTestSuite) configureTwilioVerify(response map[string]interface{}) func() func() {
	return func() func() {
		previousProvider := ts.Config.Sms.Provider
		previousTwilio := ts.Config.Sms.TwilioVerify
		previousMock := sms_provider.MockProvider

		ts.Config.Sms.Provider = "twilio_verify"
		ts.Config.Sms.TwilioVerify = conf.TwilioVerifyProviderConfiguration{
			AccountSid:        "AC-parity-test",
			AuthToken:         "parity-test-token",
			MessageServiceSid: twilioServiceSid,
		}
		// The mock provider would short-circuit GetSmsProvider and never reach
		// the Twilio Verify type assertion.
		sms_provider.MockProvider = nil

		gock.New("https://verify.twilio.com/v2/Services/" + twilioServiceSid + "/VerificationCheck").
			Post("").
			Reply(http.StatusOK).
			JSON(response)

		return func() {
			gock.OffAll()
			sms_provider.MockProvider = previousMock
			ts.Config.Sms.TwilioVerify = previousTwilio
			ts.Config.Sms.Provider = previousProvider
		}
	}
}

func emailOTPBody(verifyType, email string) map[string]interface{} {
	return map[string]interface{}{
		"type":  verifyType,
		"token": parityOTP,
		"email": email,
	}
}

func phoneOTPBody(verifyType, phone string) map[string]interface{} {
	return map[string]interface{}{
		"type":  verifyType,
		"token": parityOTP,
		"phone": phone,
	}
}

// TestVerifyOTPParityIdentifierBinding covers the guarantee that the
// identifier in the request is the one the challenge was issued for.
//
// The legacy path gets this from its identifier-keyed user lookups: the email or phone in the
// body is the lookup key, so a mismatch is a not-found. The one_time_tokens path finds the user
// by token hash, so it has to check the binding itself.
func (ts *VerifyTestSuite) TestVerifyOTPParityIdentifierBinding() {
	now := time.Now()
	emailHash := crypto.GenerateTokenHash(parityEmail, parityOTP)
	phoneHash := crypto.GenerateTokenHash(parityPhone, parityOTP)

	forbidden := otpParityOutcome{
		Status:    http.StatusForbidden,
		ErrorCode: apierrors.ErrorCodeOTPExpired,
		Msg:       parityForbidden,
		Email:     parityEmail,
		Phone:     parityPhone,
	}

	testCases := map[string]otpParityCase{
		"a phone code posted as signup does not confirm the email": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, phoneHash, now, time.Hour)
			},
			requestBody: phoneOTPBody(mail.SignupVerification, parityPhone),
			expected:    forbidden,
		},
		"a phone code posted as the generic email type does not confirm the email": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityPhone, phoneHash, now, time.Hour)
			},
			requestBody: phoneOTPBody(mail.EmailOTPVerification, parityPhone),
			expected:    forbidden,
		},
		"an email code posted as sms does not confirm the phone": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(smsVerification, parityEmail),
			expected:    forbidden,
		},
		"an SSO user cannot verify a typed OTP": {
			seed: func(u *models.User) {
				u.IsSSOUser = true
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.SignupVerification, parityEmail),
			expected:    forbidden,
		},
		"a user in another audience cannot verify a typed OTP": {
			seed: func(u *models.User) {
				u.Aud = "other-audience"
				ts.seedChallenge(u, models.ConfirmationToken, parityEmail, emailHash, now, time.Hour)
			},
			requestBody: emailOTPBody(mail.SignupVerification, parityEmail),
			expected:    forbidden,
		},
		// The challenge exists, but the user has no pending change to that
		// number, so nothing entitles the request to move the phone.
		"a phone change code is rejected when the user has no pending change": {
			seed: func(u *models.User) {
				ts.seedChallenge(u, models.PhoneChangeToken, parityNewPhone,
					crypto.GenerateTokenHash(parityNewPhone, parityOTP), now, time.Hour)
			},
			requestBody: phoneOTPBody(phoneChangeVerification, parityNewPhone),
			expected:    forbidden,
		},
	}

	ts.runOTPParityCases(testCases)
}
