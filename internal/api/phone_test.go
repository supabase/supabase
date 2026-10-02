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

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

type PhoneTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

type TestSmsProvider struct {
	mock.Mock

	SentMessages int
}

func (t *TestSmsProvider) SendMessage(phone, message, channel, otp string) (string, error) {
	t.SentMessages += 1
	return "", nil
}
func (t *TestSmsProvider) VerifyOTP(phone, otp string) error {
	return nil
}

func TestPhone(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &PhoneTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *PhoneTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	// Create user
	u, err := models.NewUser("123456789", "", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")
}

func (ts *PhoneTestSuite) TestValidateE164Format() {
	isValid := validateE164Format("0123456789")
	assert.Equal(ts.T(), false, isValid)
}

func (ts *PhoneTestSuite) TestFormatPhoneNumber() {
	actual := formatPhoneNumber("+1 23456789 ")
	assert.Equal(ts.T(), "123456789", actual)
}

func doTestSendPhoneConfirmation(ts *PhoneTestSuite, useTestOTP bool) {
	u, err := models.FindUserByPhoneAndAudience(ts.API.db, "123456789", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	req, err := http.NewRequest("POST", "http://localhost:9998/otp", nil)
	require.NoError(ts.T(), err)
	cases := []struct {
		desc     string
		otpType  string
		expected error
	}{
		{
			desc:     "send confirmation otp",
			otpType:  phoneConfirmationOtp,
			expected: nil,
		},
		{
			desc:     "send phone_change otp",
			otpType:  phoneChangeVerification,
			expected: nil,
		},
		{
			desc:     "send recovery otp",
			otpType:  phoneReauthenticationOtp,
			expected: nil,
		},
		{
			desc:     "send invalid otp type ",
			otpType:  "invalid otp type",
			expected: apierrors.NewInternalServerError("invalid otp type"),
		},
	}

	if useTestOTP {
		ts.API.config.Sms.TestOTP = map[string]string{
			"123456789": "123456",
		}
	} else {
		ts.API.config.Sms.TestOTP = nil
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			provider := &TestSmsProvider{}
			sms_provider.MockProvider = provider

			_, err = ts.API.sendPhoneConfirmation(req, ts.API.db, u, "123456789", c.otpType, sms_provider.SMSProvider)
			require.Equal(ts.T(), c.expected, err)
			u, err = models.FindUserByPhoneAndAudience(ts.API.db, "123456789", ts.Config.JWT.Aud)
			require.NoError(ts.T(), err)

			if c.expected == nil {
				if useTestOTP {
					require.Equal(ts.T(), provider.SentMessages, 0)
				} else {
					require.Equal(ts.T(), provider.SentMessages, 1)
				}
			}

			switch c.otpType {
			case phoneConfirmationOtp:
				require.NotEmpty(ts.T(), u.ConfirmationToken)
				require.NotEmpty(ts.T(), u.ConfirmationSentAt)
			case phoneChangeVerification:
				require.NotEmpty(ts.T(), u.PhoneChangeToken)
				require.NotEmpty(ts.T(), u.PhoneChangeSentAt)
			case phoneReauthenticationOtp:
				require.NotEmpty(ts.T(), u.ReauthenticationToken)
				require.NotEmpty(ts.T(), u.ReauthenticationSentAt)
			default:
			}
		})
	}
	// Reset at end of test
	ts.API.config.Sms.TestOTP = nil

}

func (ts *PhoneTestSuite) TestSendPhoneConfirmation() {
	doTestSendPhoneConfirmation(ts, false)
}

func (ts *PhoneTestSuite) TestSendPhoneConfirmationWithTestOTP() {
	doTestSendPhoneConfirmation(ts, true)
}

func (ts *PhoneTestSuite) TestMissingSmsProviderConfig() {
	u, err := models.FindUserByPhoneAndAudience(ts.API.db, "123456789", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	now := time.Now()
	u.PhoneConfirmedAt = &now
	require.NoError(ts.T(), ts.API.db.Update(u), "Error updating new test user")

	s, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))

	req := httptest.NewRequest(http.MethodPost, "/token?grant_type=password", nil)
	token, _, err := ts.API.generateAccessToken(req, ts.API.db, u, &s.ID, models.PasswordGrant)
	require.NoError(ts.T(), err)

	cases := []struct {
		desc     string
		endpoint string
		method   string
		header   string
		body     map[string]string
		expected map[string]interface{}
	}{
		{
			desc:     "Signup",
			endpoint: "/signup",
			method:   http.MethodPost,
			header:   "",
			body: map[string]string{
				"phone":    "1234567890",
				"password": "testpassword",
			},
			expected: map[string]interface{}{
				"code":    http.StatusInternalServerError,
				"message": "Unable to get SMS provider",
			},
		},
		{
			desc:     "Sms OTP",
			endpoint: "/otp",
			method:   http.MethodPost,
			header:   "",
			body: map[string]string{
				"phone": "123456789",
			},
			expected: map[string]interface{}{
				"code":    http.StatusInternalServerError,
				"message": "Unable to get SMS provider",
			},
		},
		{
			desc:     "Phone change",
			endpoint: "/user",
			method:   http.MethodPut,
			header:   token,
			body: map[string]string{
				"phone": "111111111",
			},
			expected: map[string]interface{}{
				"code":    http.StatusInternalServerError,
				"message": "Unable to get SMS provider",
			},
		},
		{
			desc:     "Reauthenticate",
			endpoint: "/reauthenticate",
			method:   http.MethodGet,
			header:   "",
			body:     nil,
			expected: map[string]interface{}{
				"code":    http.StatusInternalServerError,
				"message": "Unable to get SMS provider",
			},
		},
	}

	smsProviders := []string{"twilio", "messagebird", "textlocal", "vonage"}
	ts.Config.External.Phone.Enabled = true
	ts.Config.Sms.Twilio.AccountSid = ""
	ts.Config.Sms.Messagebird.AccessKey = ""
	ts.Config.Sms.Textlocal.ApiKey = ""
	ts.Config.Sms.Vonage.ApiKey = ""

	for _, c := range cases {
		for _, provider := range smsProviders {
			ts.Config.Sms.Provider = provider
			desc := fmt.Sprintf("[%v] %v", provider, c.desc)
			ts.Run(desc, func() {
				var buffer bytes.Buffer
				require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.body))

				req := httptest.NewRequest(c.method, "http://localhost"+c.endpoint, &buffer)
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

				w := httptest.NewRecorder()
				ts.API.handler.ServeHTTP(w, req)
				require.Equal(ts.T(), c.expected["code"], w.Code)

				body := w.Body.String()
				require.True(ts.T(),
					strings.Contains(body, "Unable to get SMS provider") ||
						strings.Contains(body, "Error finding SMS provider") ||
						strings.Contains(body, "Failed to get SMS provider"),
					"unexpected body message %q", body,
				)
			})
		}
	}
}
func (ts *PhoneTestSuite) TestSendSMSHook() {
	u, err := models.FindUserByPhoneAndAudience(ts.API.db, "123456789", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	now := time.Now()
	u.PhoneConfirmedAt = &now
	require.NoError(ts.T(), ts.API.db.Update(u), "Error updating new test user")

	s, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))

	req := httptest.NewRequest(http.MethodPost, "/token?grant_type=password", nil)
	token, _, err := ts.API.generateAccessToken(req, ts.API.db, u, &s.ID, models.PasswordGrant)
	require.NoError(ts.T(), err)

	// We setup a job table to enqueue SMS requests to send. Similar in spirit to the pg_boss postgres extension
	createJobsTableSQL := `CREATE TABLE job_queue (
    id serial PRIMARY KEY,
    job_type text,
    payload jsonb,
    status text DEFAULT 'pending', -- Possible values: 'pending', 'processing', 'completed', 'failed'
    created_at timestamp without time zone DEFAULT NOW()
    );`
	require.NoError(ts.T(), ts.API.db.RawQuery(createJobsTableSQL).Exec())

	type sendSMSHookTestCase struct {
		desc                   string
		uri                    string
		endpoint               string
		method                 string
		header                 string
		body                   map[string]string
		hookFunctionSQL        string
		expectedCode           int
		expectToken            bool
		hookFunctionIdentifier string
	}
	cases := []sendSMSHookTestCase{
		{
			desc:     "Phone signup using Hook",
			endpoint: "/signup",
			method:   http.MethodPost,
			uri:      "pg-functions://postgres/auth/send_sms_signup",
			hookFunctionSQL: `
		            create or replace function send_sms_signup(input jsonb)
		            returns json as $$
		            begin
		              insert into job_queue(job_type, payload)
		              values ('sms_signup', input);
		                return input;
		            end; $$ language plpgsql;`,
			header: "",
			body: map[string]string{
				"phone":    "1234567890",
				"password": "testpassword",
			},
			expectedCode:           http.StatusOK,
			hookFunctionIdentifier: "send_sms_signup(input jsonb)",
		},
		{
			desc:     "SMS OTP sign in using hook",
			endpoint: "/otp",
			method:   http.MethodPost,
			uri:      "pg-functions://postgres/auth/send_sms_otp",
			hookFunctionSQL: `
		            create or replace function send_sms_otp(input jsonb)
		            returns json as $$
		            begin
		              insert into job_queue(job_type, payload)
		              values ('sms_signup', input);
		                return input;
		            end; $$ language plpgsql;`,
			header: "",
			body: map[string]string{
				"phone": "123456789",
			},
			expectToken:            false,
			expectedCode:           http.StatusOK,
			hookFunctionIdentifier: "send_sms_otp(input jsonb)",
		},
		{
			desc:     "Phone Change",
			endpoint: "/user",
			method:   http.MethodPut,
			uri:      "pg-functions://postgres/auth/send_sms_phone_change",
			hookFunctionSQL: `
		    create or replace function send_sms_phone_change(input jsonb)
		    returns json as $$
		    begin
		       insert into job_queue(job_type, payload)
		       values ('phone_change', input);
		       return input;
		    end; $$ language plpgsql;`,
			header: token,
			body: map[string]string{
				"phone": "111111111",
			},
			expectToken:            true,
			expectedCode:           http.StatusOK,
			hookFunctionIdentifier: "send_sms_phone_change(input jsonb)",
		},
		{
			desc:     "Reauthenticate",
			endpoint: "/reauthenticate",
			method:   http.MethodGet,
			uri:      "pg-functions://postgres/auth/reauthenticate",
			hookFunctionSQL: `
		    create or replace function reauthenticate(input jsonb)
		    returns json as $$
		    begin
		        return input;
		   end; $$ language plpgsql;`,
			header:                 "",
			body:                   nil,
			expectToken:            true,
			expectedCode:           http.StatusOK,
			hookFunctionIdentifier: "reauthenticate(input jsonb)",
		},
		{
			desc:     "SMS OTP Hook (Error)",
			endpoint: "/otp",
			method:   http.MethodPost,
			uri:      "pg-functions://postgres/auth/send_sms_otp_failure",
			hookFunctionSQL: `
                create or replace function send_sms_otp(input jsonb)
                returns json as $$
                begin
                    RAISE EXCEPTION 'Intentional Error for Testing';
                end; $$ language plpgsql;`,
			header: "",
			body: map[string]string{
				"phone": "123456789",
			},
			expectToken:            false,
			expectedCode:           http.StatusInternalServerError,
			hookFunctionIdentifier: "send_sms_otp_failure(input jsonb)",
		},
	}

	for _, c := range cases {
		ts.T().Run(c.desc, func(t *testing.T) {

			ts.Config.External.Phone.Enabled = true
			ts.Config.Hook.SendSMS.Enabled = true
			ts.Config.Hook.SendSMS.URI = c.uri
			// Disable FrequencyLimit to allow back to back sending
			ts.Config.Sms.MaxFrequency = 0 * time.Second
			require.NoError(ts.T(), ts.Config.Hook.SendSMS.PopulateExtensibilityPoint())

			require.NoError(t, ts.API.db.RawQuery(c.hookFunctionSQL).Exec())

			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.body))
			req := httptest.NewRequest(c.method, "http://localhost"+c.endpoint, &buffer)
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)

			require.Equal(t, c.expectedCode, w.Code, "Unexpected HTTP status code")

			// Delete the function and reset env
			cleanupHookSQL := fmt.Sprintf("drop function if exists %s", ts.Config.Hook.SendSMS.HookName)
			require.NoError(t, ts.API.db.RawQuery(cleanupHookSQL).Exec())
			ts.Config.Hook.SendSMS.Enabled = false
			ts.Config.Sms.MaxFrequency = 1 * time.Second
		})
	}

	// Cleanup
	deleteJobsTableSQL := `drop table if exists job_queue`
	require.NoError(ts.T(), ts.API.db.RawQuery(deleteJobsTableSQL).Exec())

}
