package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofrs/uuid"

	"github.com/pquerna/otp"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/mailer/mockclient"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/utilities"

	"github.com/pquerna/otp/totp"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type MFATestSuite struct {
	suite.Suite
	API                  *API
	Config               *conf.GlobalConfiguration
	Mailer               mailer.Mailer
	TestDomain           string
	TestEmail            string
	TestOTPKey           *otp.Key
	TestPassword         string
	TestUser             *models.User
	TestSession          *models.Session
	TestSecondarySession *models.Session
}

func TestMFA(t *testing.T) {
	mockMailer := &mockclient.MockMailer{}
	api, config, err := setupAPIForTest(WithMailer(mockMailer))
	require.NoError(t, err)
	ts := &MFATestSuite{
		API:    api,
		Config: config,
		Mailer: mockMailer,
	}
	defer api.db.Close()
	suite.Run(t, ts)
}

func TestIsFactorTypeVerifyEnabled(t *testing.T) {
	config := &conf.GlobalConfiguration{}
	config.MFA.TOTP.VerifyEnabled = true
	config.MFA.Phone.VerifyEnabled = false
	config.MFA.WebAuthn.VerifyEnabled = true
	config.MFA.RecoveryCodes.VerifyEnabled = false

	cases := map[string]bool{
		models.TOTP:         true,
		models.Phone:        false,
		models.WebAuthn:     true,
		models.RecoveryCode: false,
		"unknown":           false,
	}
	for factorType, want := range cases {
		require.Equal(t, want, isFactorTypeVerifyEnabled(config, factorType), factorType)
	}
}

func TestHasUsableNonRecoveryFactor(t *testing.T) {
	config := &conf.GlobalConfiguration{}
	config.MFA.TOTP.VerifyEnabled = true
	config.MFA.Phone.VerifyEnabled = false
	config.MFA.RecoveryCodes.VerifyEnabled = true

	factor := func(factorType string, state models.FactorState) models.Factor {
		return models.Factor{ID: uuid.Must(uuid.NewV4()), FactorType: factorType, Status: state.String()}
	}
	verifiedTOTP := factor(models.TOTP, models.FactorStateVerified)

	cases := []struct {
		name    string
		factors []models.Factor
		exclude uuid.UUID
		want    bool
	}{
		{name: "no factors", want: false},
		{name: "verified factor of a verify-enabled type", factors: []models.Factor{verifiedTOTP}, want: true},
		{name: "unverified factor", factors: []models.Factor{factor(models.TOTP, models.FactorStateUnverified)}, want: false},
		{name: "verified factor of a verify-disabled type", factors: []models.Factor{factor(models.Phone, models.FactorStateVerified)}, want: false},
		{name: "recovery-code factor never counts even when verify is enabled", factors: []models.Factor{factor(models.RecoveryCode, models.FactorStateVerified)}, want: false},
		{name: "excluded factor is skipped", factors: []models.Factor{verifiedTOTP}, exclude: verifiedTOTP.ID, want: false},
		{name: "another usable factor besides the excluded one", factors: []models.Factor{verifiedTOTP, factor(models.TOTP, models.FactorStateVerified)}, exclude: verifiedTOTP.ID, want: true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.want, hasUsableNonRecoveryFactor(config, tc.factors, tc.exclude))
		})
	}
}

func (ts *MFATestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	ts.TestEmail = "test@example.com"
	ts.TestPassword = "password"
	// Create user
	u, err := models.NewUser("123456789", ts.TestEmail, ts.TestPassword, ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")
	// Create Factor
	f := models.NewTOTPFactor(u, "test_factor")
	require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(f), "Error saving new test factor")
	// Create corresponding session
	s, err := models.NewSession(u.ID, &f.ID)
	require.NoError(ts.T(), err, "Error creating test session")
	require.NoError(ts.T(), ts.API.db.Create(s), "Error saving test session")

	u, err = models.FindUserByEmailAndAudience(ts.API.db, ts.TestEmail, ts.Config.JWT.Aud)
	ts.Require().NoError(err)

	ts.TestUser = u
	ts.TestSession = s

	secondarySession, err := models.NewSession(ts.TestUser.ID, &f.ID)
	require.NoError(ts.T(), err, "Error creating test session")
	require.NoError(ts.T(), ts.API.db.Create(secondarySession), "Error saving test session")

	ts.TestSecondarySession = secondarySession

	// Generate TOTP related settings
	testDomain := strings.Split(ts.TestEmail, "@")[1]
	ts.TestDomain = testDomain

	// By default MFA Phone is disabled
	ts.Config.MFA.Phone.EnrollEnabled = true
	ts.Config.MFA.Phone.VerifyEnabled = true

	ts.Config.MFA.WebAuthn.EnrollEnabled = true
	ts.Config.MFA.WebAuthn.VerifyEnabled = true
	ts.Config.WebAuthn = conf.WebAuthnConfiguration{
		RPID:                    "localhost",
		RPDisplayName:           "Test App",
		RPOrigins:               []string{"http://localhost:3000"},
		ChallengeExpiryDuration: 5 * time.Minute,
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      ts.TestDomain,
		AccountName: ts.TestEmail,
	})
	require.NoError(ts.T(), err)
	ts.TestOTPKey = key

}

func (ts *MFATestSuite) generateAAL1Token(user *models.User, sessionId *uuid.UUID) string {
	// Not an actual path. Dummy request to simulate a signup request that we can use in generateAccessToken
	req := httptest.NewRequest(http.MethodPost, "/factors", nil)
	token, _, err := ts.API.generateAccessToken(req, ts.API.db, user, sessionId, models.TOTPSignIn)
	require.NoError(ts.T(), err, "Error generating access token")
	return token
}

func (ts *MFATestSuite) TestEnrollFactor() {
	testFriendlyName := "bob"
	alternativeFriendlyName := "john"

	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)

	var cases = []struct {
		desc         string
		friendlyName string
		factorType   string
		issuer       string
		phone        string
		expectedCode int
	}{
		{
			desc:         "TOTP: No issuer",
			friendlyName: alternativeFriendlyName,
			factorType:   models.TOTP,
			issuer:       "",
			phone:        "",
			expectedCode: http.StatusOK,
		},
		{
			desc:         "Invalid factor type",
			friendlyName: testFriendlyName,
			factorType:   "invalid_factor",
			issuer:       ts.TestDomain,
			phone:        "",
			expectedCode: http.StatusBadRequest,
		},
		{
			desc:         "TOTP: Factor has friendly name",
			friendlyName: testFriendlyName,
			factorType:   models.TOTP,
			issuer:       ts.TestDomain,
			phone:        "",
			expectedCode: http.StatusOK,
		},
		{
			desc:         "TOTP: Enrolling without friendly name",
			friendlyName: "",
			factorType:   models.TOTP,
			issuer:       ts.TestDomain,
			phone:        "",
			expectedCode: http.StatusOK,
		},
		{
			desc:         "Phone: Enroll with friendly name",
			friendlyName: "phone_factor",
			factorType:   models.Phone,
			phone:        "+12345677889",
			expectedCode: http.StatusOK,
		},
		{
			desc:         "Phone: Enroll with invalid phone number",
			friendlyName: "phone_factor",
			factorType:   models.Phone,
			phone:        "+1",
			expectedCode: http.StatusBadRequest,
		},
		{
			desc:         "Phone: Enroll without phone number should return error",
			friendlyName: "phone_factor_fail",
			factorType:   models.Phone,
			phone:        "",
			expectedCode: http.StatusBadRequest,
		},
		{
			desc:         "WebAuthn: Enroll with friendly name",
			friendlyName: "webauthn_factor",
			factorType:   models.WebAuthn,
			expectedCode: http.StatusOK,
		},
	}
	for _, c := range cases {
		ts.Run(c.desc, func() {
			w := performEnrollFlow(ts, token, c.friendlyName, c.factorType, c.issuer, c.phone, c.expectedCode)
			enrollResp := EnrollFactorResponse{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&enrollResp))

			if c.expectedCode == http.StatusOK {
				addedFactor, err := models.FindFactorByFactorID(ts.API.db, enrollResp.ID)
				require.NoError(ts.T(), err)
				require.False(ts.T(), addedFactor.IsVerified())

				if c.friendlyName != "" {
					require.Equal(ts.T(), c.friendlyName, addedFactor.FriendlyName)
				}

				if c.factorType == models.TOTP {
					qrCode := enrollResp.TOTP.QRCode
					hasSVGStartAndEnd := strings.Contains(qrCode, "<svg") && strings.Contains(qrCode, "</svg>")
					require.True(ts.T(), hasSVGStartAndEnd)
					require.Equal(ts.T(), c.friendlyName, enrollResp.FriendlyName)
				}
			}

		})
	}
}

func (ts *MFATestSuite) TestDuplicateEnrollPhoneFactor() {
	testPhoneNumber := "+12345677889"
	altPhoneNumber := "+987412444444"
	friendlyName := "phone_factor"
	altFriendlyName := "alt_phone_factor"
	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)

	var cases = []struct {
		desc                    string
		earlierFactorName       string
		laterFactorName         string
		phone                   string
		secondPhone             string
		expectedCode            int
		expectedNumberOfFactors int
	}{
		{
			desc:                    "Phone: Only the latest factor should persist when enrolling two unverified phone factors with the same number",
			earlierFactorName:       friendlyName,
			laterFactorName:         altFriendlyName,
			phone:                   testPhoneNumber,
			secondPhone:             testPhoneNumber,
			expectedNumberOfFactors: 1,
		},

		{
			desc:                    "Phone: Both factors should persist when enrolling two different unverified numbers",
			earlierFactorName:       friendlyName,
			laterFactorName:         altFriendlyName,
			phone:                   testPhoneNumber,
			secondPhone:             altPhoneNumber,
			expectedNumberOfFactors: 2,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			// Delete all test factors to start from clean slate
			require.NoError(ts.T(), ts.API.db.Destroy(ts.TestUser.Factors))
			_ = performEnrollFlow(ts, token, c.earlierFactorName, models.Phone, ts.TestDomain, c.phone, http.StatusOK)

			w := performEnrollFlow(ts, token, c.laterFactorName, models.Phone, ts.TestDomain, c.secondPhone, http.StatusOK)
			enrollResp := EnrollFactorResponse{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&enrollResp))

			laterFactor, err := models.FindFactorByFactorID(ts.API.db, enrollResp.ID)
			require.NoError(ts.T(), err)
			require.False(ts.T(), laterFactor.IsVerified())

			require.NoError(ts.T(), ts.API.db.Eager("Factors").Find(ts.TestUser, ts.TestUser.ID))
			require.Equal(ts.T(), len(ts.TestUser.Factors), c.expectedNumberOfFactors)

		})
	}
}

func (ts *MFATestSuite) TestDuplicateEnrollPhoneFactorWithVerified() {
	testPhoneNumber := "+12345677889"
	friendlyName := "phone_factor"
	altFriendlyName := "alt_phone_factor"
	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)

	ts.Run("Phone: Enrolling a factor with the same number as an existing verified phone factor should result in an error", func() {
		require.NoError(ts.T(), ts.API.db.Destroy(ts.TestUser.Factors))

		// Setup verified factor
		w := performEnrollFlow(ts, token, friendlyName, models.Phone, ts.TestDomain, testPhoneNumber, http.StatusOK)
		enrollResp := EnrollFactorResponse{}
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&enrollResp))
		firstFactor, err := models.FindFactorByFactorID(ts.API.db, enrollResp.ID)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), firstFactor.UpdateStatus(ts.API.db, models.FactorStateVerified))

		expectedStatusCode := http.StatusUnprocessableEntity
		_ = performEnrollFlow(ts, token, altFriendlyName, models.Phone, ts.TestDomain, testPhoneNumber, expectedStatusCode)

		require.NoError(ts.T(), ts.API.db.Eager("Factors").Find(ts.TestUser, ts.TestUser.ID))
		require.Equal(ts.T(), len(ts.TestUser.Factors), 1)
	})
}

func (ts *MFATestSuite) TestDuplicateTOTPEnrollsReturnExpectedMessage() {
	friendlyName := "mary"
	issuer := "https://issuer.com"
	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)
	_ = performEnrollFlow(ts, token, friendlyName, models.TOTP, issuer, "", http.StatusOK)
	response := performEnrollFlow(ts, token, friendlyName, models.TOTP, issuer, "", http.StatusUnprocessableEntity)

	var errorResponse HTTPError
	err := json.NewDecoder(response.Body).Decode(&errorResponse)
	require.NoError(ts.T(), err)

	require.Contains(ts.T(), errorResponse.ErrorCode, apierrors.ErrorCodeMFAFactorNameConflict)
}

func (ts *MFATestSuite) AAL2RequiredToUpdatePasswordAfterEnrollment() {
	resp := performTestSignupAndVerify(ts, ts.TestEmail, ts.TestPassword, true /* <- requireStatusOK */)
	accessTokenResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(resp.Body).Decode(&accessTokenResp))

	var w *httptest.ResponseRecorder
	var buffer bytes.Buffer
	token := accessTokenResp.Token
	// Update Password to new password
	newPassword := "newpass"
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"password": newPassword,
	}))

	req := httptest.NewRequest(http.MethodPut, "http://localhost/user", &buffer)
	req.Header.Set("Content-Type", "application/json")

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// Logout
	reqURL := "http://localhost/logout"
	req = httptest.NewRequest(http.MethodPost, reqURL, nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	w = httptest.NewRecorder()

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusNoContent, w.Code)

	// Get AAL1 token
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"email":    ts.TestEmail,
		"password": newPassword,
	}))

	req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=password", &buffer)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	session1 := AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&session1))

	// Update Password again, this should fail
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"password": ts.TestPassword,
	}))

	req = httptest.NewRequest(http.MethodPut, "http://localhost/user", &buffer)
	req.Header.Set("Content-Type", "application/json")

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", session1.Token))

	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusUnauthorized, w.Code)

}

func (ts *MFATestSuite) TestMultipleEnrollsCleanupExpiredFactors() {
	// All factors are deleted when a subsequent enroll is made
	ts.API.config.MFA.FactorExpiryDuration = 0 * time.Second
	// Verified factor should not be deleted (Factor 1)
	resp := performTestSignupAndVerify(ts, ts.TestEmail, ts.TestPassword, true /* <- requireStatusOK */)
	numFactors := 5
	accessTokenResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(resp.Body).Decode(&accessTokenResp))

	var w *httptest.ResponseRecorder
	token := accessTokenResp.Token
	for i := 0; i < numFactors; i++ {
		w = performEnrollFlow(ts, token, "first-name", models.TOTP, "https://issuer.com", "", http.StatusOK)
	}

	enrollResp := EnrollFactorResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&enrollResp))

	// Make a challenge so last, unverified factor isn't deleted on next enroll (Factor 2)
	_ = performChallengeFlow(ts, enrollResp.ID, token)

	// Enroll another Factor (Factor 3)
	_ = performEnrollFlow(ts, token, "second-name", models.TOTP, "https://issuer.com", "", http.StatusOK)
	require.NoError(ts.T(), ts.API.db.Eager("Factors").Find(ts.TestUser, ts.TestUser.ID))
	require.Equal(ts.T(), 3, len(ts.TestUser.Factors))
}

func (ts *MFATestSuite) TestChallengeTOTPFactor() {
	// Test Factor is a TOTP Factor
	f := ts.TestUser.Factors[0]
	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)
	w := performChallengeFlow(ts, f.ID, token)
	challengeResp := ChallengeFactorResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&challengeResp))

	require.Equal(ts.T(), http.StatusOK, w.Code)
	require.Equal(ts.T(), challengeResp.Type, models.TOTP)

}

func (ts *MFATestSuite) TestChallengeSMSFactor() {
	// Challenge should still work with phone provider disabled
	ts.Config.External.Phone.Enabled = false
	ts.Config.Hook.SendSMS.Enabled = true
	ts.Config.Hook.SendSMS.URI = "pg-functions://postgres/auth/send_sms_mfa_mock"

	ts.Config.MFA.Phone.MaxFrequency = 0 * time.Second

	require.NoError(ts.T(), ts.Config.Hook.SendSMS.PopulateExtensibilityPoint())
	require.NoError(ts.T(), ts.API.db.RawQuery(`
        create or replace function send_sms_mfa_mock(input jsonb)
        returns json as $$
        begin
            return input;
       end; $$ language plpgsql;`).Exec())

	phone := "+1234567"
	friendlyName := "testchallengesmsfactor"

	f := models.NewPhoneFactor(ts.TestUser, phone, friendlyName)
	require.NoError(ts.T(), ts.API.db.Create(f), "Error creating new SMS factor")
	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)

	var cases = []struct {
		desc         string
		channel      string
		expectedCode int
	}{
		{
			desc:         "SMS Channel",
			channel:      sms_provider.SMSProvider,
			expectedCode: http.StatusOK,
		},
		{
			desc:         "WhatsApp Channel",
			channel:      sms_provider.WhatsappProvider,
			expectedCode: http.StatusOK,
		},
	}

	for _, tc := range cases {
		ts.Run(tc.desc, func() {
			w := performSMSChallengeFlow(ts, f.ID, token, tc.channel)
			challengeResp := ChallengeFactorResponse{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&challengeResp))
			require.Equal(ts.T(), challengeResp.Type, models.Phone)
			require.Equal(ts.T(), tc.expectedCode, w.Code, tc.desc)
		})
	}
}

func (ts *MFATestSuite) TestMFAVerifyFactor() {
	cases := []struct {
		desc             string
		validChallenge   bool
		validCode        bool
		factorType       string
		expectedHTTPCode int
	}{
		{
			desc:             "Invalid: Valid code and expired challenge",
			validChallenge:   false,
			validCode:        true,
			factorType:       models.TOTP,
			expectedHTTPCode: http.StatusUnprocessableEntity,
		},
		{
			desc:             "Invalid: Invalid code and valid challenge",
			validChallenge:   true,
			validCode:        false,
			factorType:       models.TOTP,
			expectedHTTPCode: http.StatusUnprocessableEntity,
		},
		{
			desc:             "Valid /verify request",
			validChallenge:   true,
			validCode:        true,
			factorType:       models.TOTP,
			expectedHTTPCode: http.StatusOK,
		},
		{
			desc:             "Invalid: Valid code and expired challenge (SMS)",
			validChallenge:   false,
			validCode:        true,
			factorType:       models.Phone,
			expectedHTTPCode: http.StatusUnprocessableEntity,
		},
		{
			desc:             "Invalid: Invalid code and valid challenge (SMS)",
			validChallenge:   true,
			validCode:        false,
			factorType:       models.Phone,
			expectedHTTPCode: http.StatusUnprocessableEntity,
		},
		{
			desc:             "Valid /verify request (SMS)",
			validChallenge:   true,
			validCode:        true,
			factorType:       models.Phone,
			expectedHTTPCode: http.StatusOK,
		},
	}
	for _, v := range cases {
		ts.Run(v.desc, func() {
			// Authenticate users and set secret
			var buffer bytes.Buffer
			r, err := models.GrantAuthenticatedUser(ts.API.db, ts.TestUser, models.GrantParams{})
			require.NoError(ts.T(), err)
			token := ts.generateAAL1Token(ts.TestUser, r.SessionId)
			var f *models.Factor
			var sharedSecret string

			switch v.factorType {
			case models.TOTP:
				friendlyName := uuid.Must(uuid.NewV4()).String()
				f = models.NewTOTPFactor(ts.TestUser, friendlyName)
				sharedSecret = ts.TestOTPKey.Secret()
				f.Secret = sharedSecret
				require.NoError(ts.T(), ts.API.db.Create(f), "Error updating new test factor")
			case models.Phone:
				friendlyName := uuid.Must(uuid.NewV4()).String()
				numDigits := 10
				otp := crypto.GenerateOtp(numDigits)
				require.NoError(ts.T(), err)
				phone := fmt.Sprintf("+%s", otp)
				f = models.NewPhoneFactor(ts.TestUser, phone, friendlyName)
				require.NoError(ts.T(), ts.API.db.Create(f), "Error creating new SMS factor")
			}

			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/factors/%s/verify", f.ID), &buffer)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

			var c *models.Challenge
			var code string
			switch v.factorType {
			case models.TOTP:
				c = f.CreateChallenge(utilities.GetIPAddress(req))
				// Verify TOTP code
				code, err = totp.GenerateCode(sharedSecret, time.Now().UTC())
				require.NoError(ts.T(), err)
			case models.Phone:
				code = "123456"
				c, err = f.CreatePhoneChallenge(utilities.GetIPAddress(req), code, ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey)
				require.NoError(ts.T(), err)
			}

			if !v.validCode && v.factorType == models.TOTP {
				code, err = totp.GenerateCode(sharedSecret, time.Now().UTC().Add(-1*time.Minute*time.Duration(1)))
				require.NoError(ts.T(), err)

			} else if !v.validCode && v.factorType == models.Phone {
				invalidSuffix := "1"
				code += invalidSuffix
			}

			require.NoError(ts.T(), ts.API.db.Create(c), "Error saving new test challenge")
			if !v.validChallenge {
				// Set challenge creation so that it has expired in present time.
				newCreatedAt := time.Now().UTC().Add(-1 * time.Second * time.Duration(ts.Config.MFA.ChallengeExpiryDuration+1))
				// created_at is managed by buffalo(ORM) needs to be raw query to be updated
				err := ts.API.db.RawQuery("UPDATE auth.mfa_challenges SET created_at = ? WHERE factor_id = ?", newCreatedAt, f.ID).Exec()
				require.NoError(ts.T(), err, "Error updating new test challenge")
			}

			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"challenge_id": c.ID,
				"code":         code,
			}))

			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), v.expectedHTTPCode, w.Code)

			if v.expectedHTTPCode == http.StatusOK {
				// Ensure alternate session has been deleted
				_, err = models.FindSessionByID(ts.API.db, ts.TestSecondarySession.ID, false)
				require.EqualError(ts.T(), err, models.SessionNotFoundError{}.Error())
			}
			if !v.validChallenge {
				// Ensure invalid challenges are deleted
				_, err := f.FindChallengeByID(ts.API.db, c.ID)
				require.EqualError(ts.T(), err, models.ChallengeNotFoundError{}.Error())
			}
		})
	}
}

func (ts *MFATestSuite) TestUnenrollVerifiedFactor() {
	cases := []struct {
		desc             string
		isAAL2           bool
		expectedHTTPCode int
	}{
		{
			desc:             "Verified Factor: AAL1",
			isAAL2:           false,
			expectedHTTPCode: http.StatusUnprocessableEntity,
		},
		{
			desc:             "Verified Factor: AAL2, Success",
			isAAL2:           true,
			expectedHTTPCode: http.StatusOK,
		},
	}
	for _, v := range cases {
		ts.Run(v.desc, func() {
			var buffer bytes.Buffer

			// Create Session to test behaviour which downgrades other sessions
			f := ts.TestUser.Factors[0]
			require.NoError(ts.T(), f.UpdateStatus(ts.API.db, models.FactorStateVerified))
			if v.isAAL2 {
				ts.TestSession.UpdateAALAndAssociatedFactor(ts.API.db, models.AAL2, &f.ID)
			}
			token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)
			w := ServeAuthenticatedRequest(ts, http.MethodDelete, fmt.Sprintf("/factors/%s", f.ID), token, buffer)
			require.Equal(ts.T(), v.expectedHTTPCode, w.Code)

			if v.expectedHTTPCode == http.StatusOK {
				_, err := models.FindFactorByFactorID(ts.API.db, f.ID)
				require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
				session, _ := models.FindSessionByID(ts.API.db, ts.TestSecondarySession.ID, false)
				require.Equal(ts.T(), models.AAL1.String(), session.GetAAL())
				require.Nil(ts.T(), session.FactorID)

			}
		})
	}

}

func (ts *MFATestSuite) TestUnenrollUnverifiedFactor() {
	var buffer bytes.Buffer
	f := ts.TestUser.Factors[0]

	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"factor_id": f.ID,
	}))

	w := ServeAuthenticatedRequest(ts, http.MethodDelete, fmt.Sprintf("/factors/%s", f.ID), token, buffer)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	_, err := models.FindFactorByFactorID(ts.API.db, f.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
	session, _ := models.FindSessionByID(ts.API.db, ts.TestSecondarySession.ID, false)
	require.Equal(ts.T(), models.AAL1.String(), session.GetAAL())
	require.Nil(ts.T(), session.FactorID)

}

// Integration Tests
func (ts *MFATestSuite) TestSessionsMaintainAALOnRefresh() {
	ts.Config.Security.RefreshTokenRotationEnabled = true
	resp := performTestSignupAndVerify(ts, ts.TestEmail, ts.TestPassword, true /* <- requireStatusOK */)
	accessTokenResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(resp.Body).Decode(&accessTokenResp))

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": accessTokenResp.RefreshToken,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	ctx, err := ts.API.parseJWTClaims(data.Token, req)
	require.NoError(ts.T(), err)
	ctx, err = ts.API.maybeLoadUserOrSession(ctx)
	require.NoError(ts.T(), err)
	require.True(ts.T(), getSession(ctx).IsAAL2())
}

// Performing MFA Verification followed by a sign in should return an AAL1 session and an AAL2 session
func (ts *MFATestSuite) TestMFAFollowedByPasswordSignIn() {
	ts.Config.Security.RefreshTokenRotationEnabled = true
	resp := performTestSignupAndVerify(ts, ts.TestEmail, ts.TestPassword, true /* <- requireStatusOK */)
	accessTokenResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(resp.Body).Decode(&accessTokenResp))

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"email":    ts.TestEmail,
		"password": ts.TestPassword,
	}))
	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=password", &buffer)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	ctx, err := ts.API.parseJWTClaims(data.Token, req)
	require.NoError(ts.T(), err)

	ctx, err = ts.API.maybeLoadUserOrSession(ctx)
	require.NoError(ts.T(), err)

	require.Equal(ts.T(), models.AAL1.String(), getSession(ctx).GetAAL())
	session, err := models.FindSessionByUserID(ts.API.db, accessTokenResp.User.ID)
	require.NoError(ts.T(), err)
	require.True(ts.T(), session.IsAAL2())
}

func (ts *MFATestSuite) TestChallengeWebAuthnFactor() {
	factor := models.NewWebAuthnFactor(ts.TestUser, "WebAuthnfactor")
	require.NoError(ts.T(), ts.API.db.Create(factor), "Error saving new test factor")
	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)
	w := performChallengeWebAuthnFlow(ts, factor.ID, token, &WebAuthnParams{})
	require.Equal(ts.T(), http.StatusOK, w.Code)
}

func performChallengeWebAuthnFlow(ts *MFATestSuite, factorID uuid.UUID, token string, webauthn *WebAuthnParams) *httptest.ResponseRecorder {
	var buffer bytes.Buffer
	err := json.NewEncoder(&buffer).Encode(ChallengeFactorParams{WebAuthn: webauthn})
	require.NoError(ts.T(), err)
	w := ServeAuthenticatedRequest(ts, http.MethodPost, fmt.Sprintf("http://localhost/factors/%s/challenge", factorID), token, buffer)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	return w
}

func (ts *MFATestSuite) TestChallengeFactorNotOwnedByUser() {
	var buffer bytes.Buffer
	email := "nomfaenabled@test.com"
	password := "testpassword"
	signUpResp := signUp(ts, email, password)

	friendlyName := "testfactor"
	phoneNumber := "+1234567"

	otherUsersPhoneFactor := models.NewPhoneFactor(ts.TestUser, phoneNumber, friendlyName)
	require.NoError(ts.T(), ts.API.db.Create(otherUsersPhoneFactor), "Error creating factor")

	w := ServeAuthenticatedRequest(ts, http.MethodPost, fmt.Sprintf("http://localhost/factors/%s/challenge", otherUsersPhoneFactor.ID), signUpResp.Token, buffer)

	expectedError := apierrors.NewNotFoundError(apierrors.ErrorCodeMFAFactorNotFound, "Factor not found")

	var data HTTPError
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	require.Equal(ts.T(), expectedError.ErrorCode, data.ErrorCode)
	require.Equal(ts.T(), http.StatusNotFound, w.Code)

}

func signUp(ts *MFATestSuite, email, password string) (signUpResp AccessTokenResponse) {
	ts.API.config.Mailer.Autoconfirm = true
	var buffer bytes.Buffer

	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"email":    email,
		"password": password,
	}))

	// Setup request
	req := httptest.NewRequest(http.MethodPost, "http://localhost/signup", &buffer)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	data := AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	return data
}

func performTestSignupAndVerify(ts *MFATestSuite, email, password string, requireStatusOK bool) *httptest.ResponseRecorder {
	signUpResp := signUp(ts, email, password)
	resp := performEnrollAndVerify(ts, signUpResp.Token, requireStatusOK)

	return resp

}

func performEnrollFlow(ts *MFATestSuite, token, friendlyName, factorType, issuer string, phone string, expectedCode int) *httptest.ResponseRecorder {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(EnrollFactorParams{FriendlyName: friendlyName, FactorType: factorType, Issuer: issuer, Phone: phone}))
	w := ServeAuthenticatedRequest(ts, http.MethodPost, "http://localhost/factors/", token, buffer)
	require.Equal(ts.T(), expectedCode, w.Code)
	return w
}

func ServeAuthenticatedRequest(ts *MFATestSuite, method, path, token string, buffer bytes.Buffer) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, &buffer)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Content-Type", "application/json")

	ts.API.handler.ServeHTTP(w, req)
	return w
}

func performVerifyFlow(ts *MFATestSuite, challengeID, factorID uuid.UUID, token string, requireStatusOK bool) *httptest.ResponseRecorder {
	var buffer bytes.Buffer

	factor, err := models.FindFactorByFactorID(ts.API.db, factorID)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), factor)

	totpSecret := factor.Secret

	if es := crypto.ParseEncryptedString(factor.Secret); es != nil {
		secret, err := es.Decrypt(factor.ID.String(), ts.API.config.Security.DBEncryption.DecryptionKeys)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), secret)

		totpSecret = string(secret)
	}

	code, err := totp.GenerateCode(totpSecret, time.Now().UTC())
	require.NoError(ts.T(), err)

	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"challenge_id": challengeID,
		"code":         code,
	}))

	y := ServeAuthenticatedRequest(ts, http.MethodPost, fmt.Sprintf("/factors/%s/verify", factorID), token, buffer)

	if requireStatusOK {
		require.Equal(ts.T(), http.StatusOK, y.Code)
	}
	return y
}

func performChallengeFlow(ts *MFATestSuite, factorID uuid.UUID, token string) *httptest.ResponseRecorder {
	var buffer bytes.Buffer
	w := ServeAuthenticatedRequest(ts, http.MethodPost, fmt.Sprintf("http://localhost/factors/%s/challenge", factorID), token, buffer)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	return w

}

func performSMSChallengeFlow(ts *MFATestSuite, factorID uuid.UUID, token, channel string) *httptest.ResponseRecorder {
	params := ChallengeFactorParams{
		Channel: channel,
	}
	var buffer bytes.Buffer
	if err := json.NewEncoder(&buffer).Encode(params); err != nil {
		panic(err) // handle the error appropriately in real code
	}

	w := ServeAuthenticatedRequest(ts, http.MethodPost, fmt.Sprintf("http://localhost/factors/%s/challenge", factorID), token, buffer)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	return w

}

func performEnrollAndVerify(ts *MFATestSuite, token string, requireStatusOK bool) *httptest.ResponseRecorder {
	w := performEnrollFlow(ts, token, "", models.TOTP, ts.TestDomain, "", http.StatusOK)
	enrollResp := EnrollFactorResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&enrollResp))
	factorID := enrollResp.ID

	// Challenge
	w = performChallengeFlow(ts, factorID, token)

	challengeResp := EnrollFactorResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&challengeResp))
	challengeID := challengeResp.ID

	// Verify
	y := performVerifyFlow(ts, challengeID, factorID, token, requireStatusOK)

	return y
}

func (ts *MFATestSuite) TestVerificationHooks() {
	type verificationHookTestCase struct {
		desc                string
		enabled             bool
		uri                 string
		hookFunctionSQL     string
		emailSuffix         string
		expectToken         bool
		expectedCode        int
		cleanupHookFunction string
	}
	cases := []verificationHookTestCase{
		{
			desc:    "Default Success",
			enabled: true,
			uri:     "pg-functions://postgres/auth/verification_hook",
			hookFunctionSQL: `
                create or replace function verification_hook(input jsonb)
                returns json as $$
                begin
                    return json_build_object('decision', 'continue');
                end; $$ language plpgsql;`,
			emailSuffix:         "success",
			expectToken:         true,
			expectedCode:        http.StatusOK,
			cleanupHookFunction: "verification_hook(input jsonb)",
		},
		{
			desc:    "Error",
			enabled: true,
			uri:     "pg-functions://postgres/auth/test_verification_hook_error",
			hookFunctionSQL: `
                create or replace function test_verification_hook_error(input jsonb)
                returns json as $$
                begin
                    RAISE EXCEPTION 'Intentional Error for Testing';
                end; $$ language plpgsql;`,
			emailSuffix:         "error",
			expectToken:         false,
			expectedCode:        http.StatusInternalServerError,
			cleanupHookFunction: "test_verification_hook_error(input jsonb)",
		},
		{
			desc:    "Reject - Enabled",
			enabled: true,
			uri:     "pg-functions://postgres/auth/verification_hook_reject",
			hookFunctionSQL: `
        create or replace function verification_hook_reject(input jsonb)
        returns json as $$
        begin
            return json_build_object(
                'decision', 'reject',
                'message', 'authentication attempt rejected'
            );
        end; $$ language plpgsql;`,
			emailSuffix:         "reject_enabled",
			expectToken:         false,
			expectedCode:        http.StatusForbidden,
			cleanupHookFunction: "verification_hook_reject(input jsonb)",
		},
		{
			desc:    "Reject - Disabled",
			enabled: false,
			uri:     "pg-functions://postgres/auth/verification_hook_reject",
			hookFunctionSQL: `
        create or replace function verification_hook_reject(input jsonb)
        returns json as $$
        begin
            return json_build_object(
                'decision', 'reject',
                'message', 'authentication attempt rejected'
            );
        end; $$ language plpgsql;`,
			emailSuffix:         "reject_disabled",
			expectToken:         true,
			expectedCode:        http.StatusOK,
			cleanupHookFunction: "verification_hook_reject(input jsonb)",
		},
		{
			desc:    "Timeout",
			enabled: true,
			uri:     "pg-functions://postgres/auth/test_verification_hook_timeout",
			hookFunctionSQL: `
        create or replace function test_verification_hook_timeout(input jsonb)
        returns json as $$
        begin
            PERFORM pg_sleep(3);
            return json_build_object(
                'decision', 'continue'
            );
        end; $$ language plpgsql;`,
			emailSuffix:         "timeout",
			expectToken:         false,
			expectedCode:        http.StatusInternalServerError,
			cleanupHookFunction: "test_verification_hook_timeout(input jsonb)",
		},
	}

	for _, c := range cases {
		ts.T().Run(c.desc, func(t *testing.T) {
			ts.Config.Hook.MFAVerificationAttempt.Enabled = c.enabled
			ts.Config.Hook.MFAVerificationAttempt.URI = c.uri
			require.NoError(ts.T(), ts.Config.Hook.MFAVerificationAttempt.PopulateExtensibilityPoint())

			err := ts.API.db.RawQuery(c.hookFunctionSQL).Exec()
			require.NoError(t, err)

			email := fmt.Sprintf("testemail_%s@gmail.com", c.emailSuffix)
			password := "testpassword"
			resp := performTestSignupAndVerify(ts, email, password, c.expectToken)
			require.Equal(ts.T(), c.expectedCode, resp.Code)
			accessTokenResp := &AccessTokenResponse{}
			require.NoError(ts.T(), json.NewDecoder(resp.Body).Decode(&accessTokenResp))

			if c.expectToken {
				require.NotEqual(t, "", accessTokenResp.Token)
			} else {
				require.Equal(t, "", accessTokenResp.Token)
			}

			cleanupHook(ts, c.cleanupHookFunction)
		})
	}
}

func cleanupHook(ts *MFATestSuite, hookName string) {
	cleanupHookSQL := fmt.Sprintf("drop function if exists %s", hookName)
	err := ts.API.db.RawQuery(cleanupHookSQL).Exec()
	require.NoError(ts.T(), err)
}

func (ts *MFATestSuite) TestMFAFactorEnrolledNotificationEnabled() {
	ts.Config.Mailer.Notifications.MFAFactorEnrolledEnabled = true

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	res := performTestSignupAndVerify(ts, ts.TestEmail, ts.TestPassword, true /* <- requireStatusOK */)
	accessTokenResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(res.Body).Decode(&accessTokenResp))

	// Assert that MFA factor enrolled notification email was sent or not based on the config
	require.Len(ts.T(), mockMailer.MFAFactorEnrolledMailCalls, 1, "Expected one MFA factor enrolled notification email(s) to be sent")
	require.Equal(ts.T(), accessTokenResp.User.ID, mockMailer.MFAFactorEnrolledMailCalls[0].User.ID, "Email should be sent to the correct user")
	require.Equal(ts.T(), models.TOTP, mockMailer.MFAFactorEnrolledMailCalls[0].FactorType, "Email should specify the correct factor type")
}

func (ts *MFATestSuite) TestMFAFactorEnrolledNotificationDisabled() {
	ts.Config.Mailer.Notifications.MFAFactorEnrolledEnabled = false

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	res := performTestSignupAndVerify(ts, ts.TestEmail, ts.TestPassword, true /* <- requireStatusOK */)
	accessTokenResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(res.Body).Decode(&accessTokenResp))

	// Assert that MFA factor enrolled notification email was sent or not based on the config
	require.Len(ts.T(), mockMailer.MFAFactorEnrolledMailCalls, 0, "Expected 0 MFA factor enrolled notification email(s) to be sent")
}

func (ts *MFATestSuite) TestMFAFactorUnenrolledNotificationEnabled() {
	ts.Config.Mailer.Notifications.MFAFactorUnenrolledEnabled = true

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	var buffer bytes.Buffer
	f := ts.TestUser.Factors[0]

	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"factor_id": f.ID,
	}))

	w := ServeAuthenticatedRequest(ts, http.MethodDelete, fmt.Sprintf("/factors/%s", f.ID), token, buffer)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	_, err := models.FindFactorByFactorID(ts.API.db, f.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
	session, _ := models.FindSessionByID(ts.API.db, ts.TestSecondarySession.ID, false)
	require.Equal(ts.T(), models.AAL1.String(), session.GetAAL())
	require.Nil(ts.T(), session.FactorID)

	// Assert that MFA factor unenrolled notification email was sent or not based on the config
	require.Len(ts.T(), mockMailer.MFAFactorUnenrolledMailCalls, 1, "Expected one MFA factor unenrolled notification email(s) to be sent")
	require.Equal(ts.T(), ts.TestUser.ID, mockMailer.MFAFactorUnenrolledMailCalls[0].User.ID, "Email should be sent to the correct user")
	require.Equal(ts.T(), models.TOTP, mockMailer.MFAFactorUnenrolledMailCalls[0].FactorType, "Email should specify the correct factor type")
}

func (ts *MFATestSuite) TestMFAFactorUnenrolledNotificationDisabled() {
	ts.Config.Mailer.Notifications.MFAFactorUnenrolledEnabled = false

	// Get the mock mailer and reset it
	mockMailer, ok := ts.Mailer.(*mockclient.MockMailer)
	require.True(ts.T(), ok, "Mailer is not of type *MockMailer")
	mockMailer.Reset()

	var buffer bytes.Buffer
	f := ts.TestUser.Factors[0]

	token := ts.generateAAL1Token(ts.TestUser, &ts.TestSession.ID)
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"factor_id": f.ID,
	}))

	w := ServeAuthenticatedRequest(ts, http.MethodDelete, fmt.Sprintf("/factors/%s", f.ID), token, buffer)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	_, err := models.FindFactorByFactorID(ts.API.db, f.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())
	session, _ := models.FindSessionByID(ts.API.db, ts.TestSecondarySession.ID, false)
	require.Equal(ts.T(), models.AAL1.String(), session.GetAAL())
	require.Nil(ts.T(), session.FactorID)

	// Assert that MFA factor unenrolled notification email was sent or not based on the config
	require.Len(ts.T(), mockMailer.MFAFactorUnenrolledMailCalls, 0, "Expected 0 MFA factor unenrolled notification email(s) to be sent")
}
