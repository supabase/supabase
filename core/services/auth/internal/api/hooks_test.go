package api

import (
	"encoding/json"
	"net/http"
	"net/url"
	"testing"

	"net/http/httptest"

	"github.com/pkg/errors"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/hooks/hookserrors"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	mail "github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"

	"gopkg.in/h2non/gock.v1"
)

var handleApiRequest func(*http.Request) (*http.Response, error)

type HooksTestSuite struct {
	suite.Suite
	API      *API
	Config   *conf.GlobalConfiguration
	TestUser *models.User
}

type MockHttpClient struct {
	mock.Mock
}

func (m *MockHttpClient) Do(req *http.Request) (*http.Response, error) {
	return handleApiRequest(req)
}

func TestHooks(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &HooksTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)

	t.Run("CheckTX", func(t *testing.T) {
		require.NoError(t, checkTX(api.db))

		err := api.db.Transaction(func(tx *storage.Connection) error {
			require.Error(t, checkTX(tx))

			err := checkTX(tx)
			require.Error(t, err)
			return nil
		})
		require.NoError(t, err)
	})
}

func (ts *HooksTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)
	u, err := models.NewUser("123456789", "testemail@gmail.com", "securetestpassword", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")
	ts.TestUser = u
}

func (ts *HooksTestSuite) TestRunHTTPHook() {
	// setup mock requests for hooks
	defer gock.OffAll()

	testURL := "http://localhost:54321/functions/v1/custom-sms-sender"
	ts.Config.Hook.SendSMS.URI = testURL

	unsuccessfulResponse := hookserrors.Error{
		HTTPCode: http.StatusUnprocessableEntity,
		Message:  "test error",
	}

	testCases := []struct {
		description  string
		expectError  bool
		mockResponse hookserrors.Error
	}{
		{
			description:  "Hook returns success",
			expectError:  false,
			mockResponse: hookserrors.Error{},
		},
		{
			description:  "Hook returns error",
			expectError:  true,
			mockResponse: unsuccessfulResponse,
		},
	}

	gock.New(ts.Config.Hook.SendSMS.URI).
		Post("/").
		MatchType("json").
		Reply(http.StatusOK).
		JSON(v0hooks.SendSMSOutput{})

	gock.New(ts.Config.Hook.SendSMS.URI).
		Post("/").
		MatchType("json").
		Reply(http.StatusUnprocessableEntity).
		JSON(struct {
			Error *hookserrors.Error `json:"error,omitempty"`
		}{Error: &unsuccessfulResponse})

	for _, tc := range testCases {
		ts.Run(tc.description, func() {
			req, _ := http.NewRequest("POST", ts.Config.Hook.SendSMS.URI, nil)

			input := v0hooks.NewSendSMSInput(
				req,
				ts.TestUser,
				v0hooks.SMS{
					OTP: "123456",
				},
			)

			var output v0hooks.SendSMSOutput
			err := ts.API.hooksMgr.InvokeHook(ts.API.db, req, input, &output)

			if !tc.expectError {
				require.NoError(ts.T(), err)
			} else {
				require.Error(ts.T(), err)
				require.Equal(ts.T(), output, v0hooks.SendSMSOutput{})
			}
		})
	}
	require.True(ts.T(), gock.IsDone())
}

func (ts *HooksTestSuite) TestShouldRetryWithRetryAfterHeader() {
	defer gock.OffAll()

	testURL := "http://localhost:54321/functions/v1/custom-sms-sender"
	ts.Config.Hook.SendSMS.URI = testURL

	gock.New(testURL).
		Post("/").
		MatchType("json").
		Reply(http.StatusTooManyRequests).
		SetHeader("retry-after", "true").SetHeader("content-type", "application/json")

	// Simulate an additional response for the retry attempt
	gock.New(testURL).
		Post("/").
		MatchType("json").
		Reply(http.StatusOK).
		JSON(v0hooks.SendSMSOutput{}).SetHeader("content-type", "application/json")

	// Simulate the original HTTP request which triggered the hook
	req, err := http.NewRequest("POST", "http://localhost:9998/otp", nil)
	require.NoError(ts.T(), err)

	input := v0hooks.NewSendSMSInput(
		req,
		ts.TestUser,
		v0hooks.SMS{
			OTP: "123456",
		},
	)

	var output v0hooks.SendSMSOutput
	err = ts.API.hooksMgr.InvokeHook(ts.API.db, req, input, &output)
	require.NoError(ts.T(), err)

	// Ensure that all expected HTTP interactions (mocks) have been called
	require.True(ts.T(), gock.IsDone(), "Expected all mocks to have been called including retry")
}

func (ts *HooksTestSuite) TestShouldReturnErrorForNonJSONContentType() {
	defer gock.OffAll()

	testURL := "http://localhost:54321/functions/v1/custom-sms-sender"
	ts.Config.Hook.SendSMS.URI = testURL

	gock.New(testURL).
		Post("/").
		MatchType("json").
		Reply(http.StatusOK).
		SetHeader("content-type", "text/plain")

	req, err := http.NewRequest("POST", "http://localhost:9999/otp", nil)
	require.NoError(ts.T(), err)

	input := v0hooks.NewSendSMSInput(
		req,
		ts.TestUser,
		v0hooks.SMS{
			OTP: "123456",
		},
	)

	var output v0hooks.SendSMSOutput
	err = ts.API.hooksMgr.InvokeHook(ts.API.db, req, input, &output)
	require.Error(ts.T(), err, "Expected an error due to wrong content type")
	require.Contains(ts.T(), err.Error(), "Invalid JSON response.")
	require.True(ts.T(), gock.IsDone(), "Expected all mocks to have been called")
}

func (ts *HooksTestSuite) TestInvokeHookIntegration() {
	// We use the Send Email Hook as illustration
	defer gock.OffAll()
	hookFunctionSQL := `
        create or replace function invoke_test(input jsonb)
        returns json as $$
        begin
            return input;
        end; $$ language plpgsql;`
	require.NoError(ts.T(), ts.API.db.RawQuery(hookFunctionSQL).Exec())

	testHTTPUri := "http://myauthservice.com/signup"
	testHTTPSUri := "https://myauthservice.com/signup"
	testPGUri := "pg-functions://postgres/auth/invoke_test"
	successOutput := map[string]interface{}{}
	authEndpoint := "https://app.myapp.com/otp"
	gock.New(testHTTPUri).
		Post("/").
		MatchType("json").
		Reply(http.StatusOK).
		JSON(successOutput).SetHeader("content-type", "application/json")

	gock.New(testHTTPSUri).
		Post("/").
		MatchType("json").
		Reply(http.StatusOK).
		JSON(successOutput).SetHeader("content-type", "application/json")

	tests := []struct {
		description   string
		conn          *storage.Connection
		request       *http.Request
		input         any
		output        any
		uri           string
		expectedError error
	}{
		{
			description: "HTTP endpoint success",
			conn:        nil,
			request:     httptest.NewRequest("POST", authEndpoint, nil),
			input:       &v0hooks.SendEmailInput{},
			output:      &v0hooks.SendEmailOutput{},
			uri:         testHTTPUri,
		},
		{
			description: "HTTPS endpoint success",
			conn:        nil,
			request:     httptest.NewRequest("POST", authEndpoint, nil),
			input:       &v0hooks.SendEmailInput{},
			output:      &v0hooks.SendEmailOutput{},
			uri:         testHTTPSUri,
		},
		{
			description: "PostgreSQL function success",
			conn:        ts.API.db,
			request:     httptest.NewRequest("POST", authEndpoint, nil),
			input:       &v0hooks.SendEmailInput{},
			output:      &v0hooks.SendEmailOutput{},
			uri:         testPGUri,
		},
		{
			description:   "Unsupported protocol error",
			conn:          nil,
			request:       httptest.NewRequest("POST", authEndpoint, nil),
			input:         &v0hooks.SendEmailInput{},
			output:        &v0hooks.SendEmailOutput{},
			uri:           "ftp://example.com/path",
			expectedError: errors.New("unsupported protocol: \"ftp://example.com/path\" only postgres hooks and HTTPS functions are supported at the moment"),
		},
	}

	var err error
	for _, tc := range tests {
		// Set up hook config
		ts.Config.Hook.SendEmail.Enabled = true
		ts.Config.Hook.SendEmail.URI = tc.uri
		require.NoError(ts.T(), ts.Config.Hook.SendEmail.PopulateExtensibilityPoint())

		ts.Run(tc.description, func() {
			err = ts.API.hooksMgr.InvokeHook(tc.conn, tc.request, tc.input, tc.output)
			if tc.expectedError != nil {
				require.EqualError(ts.T(), err, tc.expectedError.Error())
			} else {
				require.NoError(ts.T(), err)
			}
		})

	}
	// Ensure that all expected HTTP interactions (mocks) have been called
	require.True(ts.T(), gock.IsDone(), "Expected all mocks to have been called including retry")
}

func (ts *HooksTestSuite) TestAccountChangesNotificationsHookPayload() {
	// Setup hook config for send_email hook
	defer gock.OffAll()

	testURL := "http://localhost:8888/functions/v1/send-email"
	ts.Config.Hook.SendEmail.URI = testURL
	ts.Config.Hook.SendEmail.Enabled = true

	// Mock the hook endpoint to capture the payload
	var capturedPayload *v0hooks.SendEmailInput

	gock.New(testURL).
		Post("/").
		MatchType("json").
		SetMatcher(gock.NewMatcher()).
		AddMatcher(func(req *http.Request, greq *gock.Request) (bool, error) {
			// Capture the payload
			payload := &v0hooks.SendEmailInput{}
			if err := json.NewDecoder(req.Body).Decode(payload); err != nil {
				return false, err
			}
			capturedPayload = payload
			return true, nil
		}).
		Persist().
		Reply(http.StatusOK).
		JSON(v0hooks.SendEmailOutput{})

	testCases := []struct {
		description        string
		expectedActionType string
		expectedProvider   string
		expectedOldEmail   string
		expectedOldPhone   string
		expectedFactorType string
		setupFunc          func() error
		enableNotification func()
	}{
		{
			description:        "IdentityLinkedNotification contains provider",
			expectedActionType: mail.IdentityLinkedNotification,
			expectedProvider:   "google",
			enableNotification: func() {
				ts.Config.Mailer.Notifications.IdentityLinkedEnabled = true
			},
			setupFunc: func() error {
				req := httptest.NewRequest("POST", "/identities", nil)
				externalHost, err := url.Parse("http://example.com")
				require.NoError(ts.T(), err)
				req = req.WithContext(withExternalHost(req.Context(), externalHost))
				return ts.API.sendIdentityLinkedNotification(req, ts.API.db, ts.TestUser, "google")
			},
		},
		{
			description:        "IdentityUnlinkedNotification contains provider",
			expectedActionType: mail.IdentityUnlinkedNotification,
			expectedProvider:   "github",
			enableNotification: func() {
				ts.Config.Mailer.Notifications.IdentityUnlinkedEnabled = true
			},
			setupFunc: func() error {
				req := httptest.NewRequest("DELETE", "/identities/123", nil)
				externalHost, err := url.Parse("http://example.com")
				require.NoError(ts.T(), err)
				req = req.WithContext(withExternalHost(req.Context(), externalHost))
				return ts.API.sendIdentityUnlinkedNotification(req, ts.API.db, ts.TestUser, "github", "notification@example.com")
			},
		},
		{
			description:        "EmailChangedNotification contains old_email",
			expectedActionType: mail.EmailChangedNotification,
			expectedOldEmail:   "old@example.com",
			enableNotification: func() {
				ts.Config.Mailer.Notifications.EmailChangedEnabled = true
			},
			setupFunc: func() error {
				req := httptest.NewRequest("PUT", "/user", nil)
				externalHost, err := url.Parse("http://example.com")
				require.NoError(ts.T(), err)
				req = req.WithContext(withExternalHost(req.Context(), externalHost))
				return ts.API.sendEmailChangedNotification(req, ts.API.db, ts.TestUser, "old@example.com")
			},
		},
		{
			description:        "PhoneChangedNotification contains old_phone",
			expectedActionType: mail.PhoneChangedNotification,
			expectedOldPhone:   "+15551234567",
			enableNotification: func() {
				ts.Config.Mailer.Notifications.PhoneChangedEnabled = true
			},
			setupFunc: func() error {
				req := httptest.NewRequest("PUT", "/user", nil)
				externalHost, err := url.Parse("http://example.com")
				require.NoError(ts.T(), err)
				req = req.WithContext(withExternalHost(req.Context(), externalHost))
				return ts.API.sendPhoneChangedNotification(req, ts.API.db, ts.TestUser, "+15551234567")
			},
		},
		{
			description:        "MFAFactorEnrolledNotification contains factor_type",
			expectedActionType: mail.MFAFactorEnrolledNotification,
			expectedFactorType: "totp",
			enableNotification: func() {
				ts.Config.Mailer.Notifications.MFAFactorEnrolledEnabled = true
			},
			setupFunc: func() error {
				req := httptest.NewRequest("POST", "/factors", nil)
				externalHost, err := url.Parse("http://example.com")
				require.NoError(ts.T(), err)
				req = req.WithContext(withExternalHost(req.Context(), externalHost))
				return ts.API.sendMFAFactorEnrolledNotification(req, ts.API.db, ts.TestUser, "totp")
			},
		},
		{
			description:        "MFAFactorUnenrolledNotification contains factor_type",
			expectedActionType: mail.MFAFactorUnenrolledNotification,
			expectedFactorType: "phone",
			enableNotification: func() {
				ts.Config.Mailer.Notifications.MFAFactorUnenrolledEnabled = true
			},
			setupFunc: func() error {
				req := httptest.NewRequest("DELETE", "/factors/123", nil)
				externalHost, err := url.Parse("http://example.com")
				require.NoError(ts.T(), err)
				req = req.WithContext(withExternalHost(req.Context(), externalHost))
				return ts.API.sendMFAFactorUnenrolledNotification(req, ts.API.db, ts.TestUser, "phone")
			},
		},
	}

	for _, tc := range testCases {
		ts.Run(tc.description, func() {
			// Reset captured payload
			capturedPayload = nil

			// Enable the notification
			tc.enableNotification()

			// Execute the setup function that triggers the notification
			err := tc.setupFunc()
			require.NoError(ts.T(), err)

			// Verify the payload was captured
			require.NotNil(ts.T(), capturedPayload, "Hook should have been called")

			// Verify email action type
			require.Equal(ts.T(), tc.expectedActionType, capturedPayload.EmailData.EmailActionType)

			// Verify notification-specific fields
			if tc.expectedProvider != "" {
				require.Equal(ts.T(), tc.expectedProvider, capturedPayload.EmailData.Provider, "Provider should be set in EmailData")
			}
			if tc.expectedOldEmail != "" {
				require.Equal(ts.T(), tc.expectedOldEmail, capturedPayload.EmailData.OldEmail, "OldEmail should be set in EmailData")
			}
			if tc.expectedOldPhone != "" {
				require.Equal(ts.T(), tc.expectedOldPhone, capturedPayload.EmailData.OldPhone, "OldPhone should be set in EmailData")
			}
			if tc.expectedFactorType != "" {
				require.Equal(ts.T(), tc.expectedFactorType, capturedPayload.EmailData.FactorType, "FactorType should be set in EmailData")
			}

			// Verify common fields
			require.Equal(ts.T(), ts.TestUser.ID, capturedPayload.User.ID, "User ID should match")
			require.NotEmpty(ts.T(), capturedPayload.EmailData.SiteURL, "SiteURL should be set")
			require.NotEmpty(ts.T(), capturedPayload.EmailData.RedirectTo, "RedirectTo should be set")
		})
	}
}
