package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	mail "github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/models"
)

type ResendTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestResend(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &ResendTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *ResendTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)
}

func (ts *ResendTestSuite) TestResendValidation() {
	cases := []struct {
		desc     string
		params   map[string]interface{}
		expected map[string]interface{}
	}{
		{
			desc: "Invalid type",
			params: map[string]interface{}{
				"type":  "invalid",
				"email": "foo@example.com",
			},
			expected: map[string]interface{}{
				"code":    http.StatusBadRequest,
				"message": "Missing one of these types: signup, email_change, sms, phone_change",
			},
		},
		{
			desc: "Type & email mismatch",
			params: map[string]interface{}{
				"type":  "sms",
				"email": "foo@example.com",
			},
			expected: map[string]interface{}{
				"code":    http.StatusBadRequest,
				"message": "Type provided requires a phone number",
			},
		},
		{
			desc: "Phone & email change type",
			params: map[string]interface{}{
				"type":  "email_change",
				"phone": "+123456789",
			},
			expected: map[string]interface{}{
				"code":    http.StatusOK,
				"message": nil,
			},
		},
		{
			desc: "Email & phone number provided",
			params: map[string]interface{}{
				"type":  "email_change",
				"phone": "+123456789",
				"email": "foo@example.com",
			},
			expected: map[string]interface{}{
				"code":    http.StatusBadRequest,
				"message": "Only an email address or phone number should be provided.",
			},
		},
	}
	for _, c := range cases {
		ts.Run(c.desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.params))
			req := httptest.NewRequest(http.MethodPost, "http://localhost/resend", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), c.expected["code"], w.Code)

			data := make(map[string]interface{})
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
			require.Equal(ts.T(), c.expected["message"], data["msg"])
		})
	}

}

func (ts *ResendTestSuite) TestResendPKCEValidation() {
	const validChallenge = "testtesttesttesttesttesttestteststeststesttesttesttest"
	cases := []struct {
		desc     string
		params   map[string]interface{}
		expected map[string]interface{}
	}{
		{
			desc: "Signup with code_challenge but missing code_challenge_method",
			params: map[string]interface{}{
				"type":           "signup",
				"email":          "foo@example.com",
				"code_challenge": validChallenge,
			},
			expected: map[string]interface{}{
				"code":    http.StatusBadRequest,
				"message": InvalidPKCEParamsErrorMessage,
			},
		},
		{
			desc: "Signup with code_challenge_method but missing code_challenge",
			params: map[string]interface{}{
				"type":                  "signup",
				"email":                 "foo@example.com",
				"code_challenge_method": "s256",
			},
			expected: map[string]interface{}{
				"code":    http.StatusBadRequest,
				"message": InvalidPKCEParamsErrorMessage,
			},
		},
		{
			desc: "Email change with code_challenge but missing code_challenge_method",
			params: map[string]interface{}{
				"type":           "email_change",
				"email":          "foo@example.com",
				"code_challenge": validChallenge,
			},
			expected: map[string]interface{}{
				"code":    http.StatusBadRequest,
				"message": InvalidPKCEParamsErrorMessage,
			},
		},
	}
	for _, c := range cases {
		ts.Run(c.desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.params))
			req := httptest.NewRequest(http.MethodPost, "http://localhost/resend", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), c.expected["code"], w.Code)

			data := make(map[string]interface{})
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
			require.Equal(ts.T(), c.expected["message"], data["msg"])
		})
	}
}

func (ts *ResendTestSuite) TestResendSuccess() {
	// Create user
	u, err := models.NewUser("123456789", "foo@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")

	// Avoid max freq limit error
	now := time.Now().Add(-1 * time.Minute)

	// Enable Phone Logoin for phone related tests
	ts.Config.External.Phone.Enabled = true
	// disable secure email change
	ts.Config.Mailer.SecureEmailChangeEnabled = false

	u.ConfirmationToken = "123456"
	u.ConfirmationSentAt = &now
	u.EmailChange = "bar@example.com"
	u.EmailChangeSentAt = &now
	u.EmailChangeTokenNew = "123456"
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.GetEmail(), u.ConfirmationToken, models.ConfirmationToken, ts.Config.Mailer.OtpExpAsDuration(), true))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.EmailChange, u.EmailChangeTokenNew, models.EmailChangeTokenNew, ts.Config.Mailer.OtpExpAsDuration(), true))

	phoneUser, err := models.NewUser("1234567890", "", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	phoneUser.EmailChange = "bar@example.com"
	phoneUser.EmailChangeSentAt = &now
	phoneUser.EmailChangeTokenNew = "123456"
	require.NoError(ts.T(), ts.API.db.Create(phoneUser), "Error saving new test user")
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, phoneUser.ID, phoneUser.EmailChange, phoneUser.EmailChangeTokenNew, models.EmailChangeTokenNew, ts.Config.Mailer.OtpExpAsDuration(), true))

	emailUser, err := models.NewUser("", "bar@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	phoneUser.PhoneChange = "1234567890"
	phoneUser.PhoneChangeSentAt = &now
	phoneUser.PhoneChangeToken = "123456"
	require.NoError(ts.T(), ts.API.db.Create(emailUser), "Error saving new test user")
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, phoneUser.ID, phoneUser.PhoneChange, phoneUser.PhoneChangeToken, models.PhoneChangeToken, ts.Config.Sms.OtpExpAsDuration(), true))

	cases := []struct {
		desc   string
		params map[string]interface{}
		user   *models.User
	}{
		{
			desc: "Resend signup confirmation",
			params: map[string]interface{}{
				"type":  "signup",
				"email": u.GetEmail(),
			},
			user: u,
		},
		{
			desc: "Resend email change",
			params: map[string]interface{}{
				"type":  "email_change",
				"email": u.GetEmail(),
			},
			user: u,
		},
		{
			desc: "Resend email change for phone user",
			params: map[string]interface{}{
				"type":  "email_change",
				"phone": phoneUser.GetPhone(),
			},
			user: phoneUser,
		},
		{
			desc: "Resend phone change for email user",
			params: map[string]interface{}{
				"type":  "phone_change",
				"email": emailUser.GetEmail(),
			},
			user: emailUser,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.params))
			req := httptest.NewRequest(http.MethodPost, "http://localhost/resend", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			switch c.params["type"] {
			case mail.SignupVerification, mail.EmailChangeVerification:
				dbUser, err := models.FindUserByID(ts.API.db, c.user.ID)
				require.NoError(ts.T(), err)
				require.NotEmpty(ts.T(), dbUser)

				switch c.params["type"] {
				case mail.SignupVerification:
					require.NotEqual(ts.T(), dbUser.ConfirmationToken, c.user.ConfirmationToken)
					require.NotEqual(ts.T(), dbUser.ConfirmationSentAt, c.user.ConfirmationSentAt)
				case mail.EmailChangeVerification:
					require.NotEqual(ts.T(), dbUser.EmailChangeTokenNew, c.user.EmailChangeTokenNew)
					require.NotEqual(ts.T(), dbUser.EmailChangeSentAt, c.user.EmailChangeSentAt)
				}
			}
		})
	}
}

func (ts *ResendTestSuite) TestResendPKCESuccess() {
	const testCodeChallenge = "testtesttesttesttesttesttestteststeststesttesttesttest"

	// Avoid max freq limit error
	now := time.Now().Add(-1 * time.Minute)

	ts.Config.Mailer.SecureEmailChangeEnabled = false

	// Fresh user for signup PKCE resend
	signupUser, err := models.NewUser("", "pkce-signup@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	signupUser.ConfirmationToken = "oldtoken"
	signupUser.ConfirmationSentAt = &now
	require.NoError(ts.T(), ts.API.db.Create(signupUser))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, signupUser.ID, signupUser.GetEmail(), signupUser.ConfirmationToken, models.ConfirmationToken, ts.Config.Mailer.OtpExpAsDuration(), true))

	// Fresh user for email_change PKCE resend
	emailChangeUser, err := models.NewUser("", "pkce-change@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	emailChangeUser.EmailChange = "pkce-change-new@example.com"
	emailChangeUser.EmailChangeSentAt = &now
	emailChangeUser.EmailChangeTokenNew = "oldchangetoken"
	require.NoError(ts.T(), ts.API.db.Create(emailChangeUser))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, emailChangeUser.ID, emailChangeUser.EmailChange, emailChangeUser.EmailChangeTokenNew, models.EmailChangeTokenNew, ts.Config.Mailer.OtpExpAsDuration(), true))

	ts.Run("Resend signup confirmation with PKCE", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"type":                  "signup",
			"email":                 signupUser.GetEmail(),
			"code_challenge":        testCodeChallenge,
			"code_challenge_method": "s256",
		}))
		req := httptest.NewRequest(http.MethodPost, "http://localhost/resend", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)

		dbUser, err := models.FindUserByID(ts.API.db, signupUser.ID)
		require.NoError(ts.T(), err)
		require.NotEqual(ts.T(), dbUser.ConfirmationToken, signupUser.ConfirmationToken)
		require.True(ts.T(), strings.HasPrefix(dbUser.ConfirmationToken, PKCEPrefix), "expected pkce_ prefix on ConfirmationToken, got: %s", dbUser.ConfirmationToken)
	})

	ts.Run("Resend email change with PKCE", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"type":                  "email_change",
			"email":                 emailChangeUser.GetEmail(),
			"code_challenge":        testCodeChallenge,
			"code_challenge_method": "s256",
		}))
		req := httptest.NewRequest(http.MethodPost, "http://localhost/resend", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)

		dbUser, err := models.FindUserByID(ts.API.db, emailChangeUser.ID)
		require.NoError(ts.T(), err)
		require.NotEqual(ts.T(), dbUser.EmailChangeTokenNew, emailChangeUser.EmailChangeTokenNew)
		require.True(ts.T(), strings.HasPrefix(dbUser.EmailChangeTokenNew, PKCEPrefix), "expected pkce_ prefix on EmailChangeTokenNew, got: %s", dbUser.EmailChangeTokenNew)
	})
}
