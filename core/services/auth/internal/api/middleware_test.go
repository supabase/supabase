package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/didip/tollbooth/v5"
	"github.com/didip/tollbooth/v5/limiter"
	"github.com/gofrs/uuid"
	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/sbff"
	"github.com/supabase/auth/internal/security"
	"github.com/supabase/auth/internal/storage"
)

const captchaResponse string = "10000000-aaaa-bbbb-cccc-000000000001"

type MiddlewareTestSuite struct {
	suite.Suite
	API             *API
	Config          *conf.GlobalConfiguration
	CaptchaVerifier *MockCaptchaVerifier
}

func TestMiddlewareFunctions(t *testing.T) {
	mockCaptcha := &MockCaptchaVerifier{}
	api, config, err := setupAPIForTest(WithCaptchaVerifier(mockCaptcha))
	require.NoError(t, err)

	ts := &MiddlewareTestSuite{
		API:             api,
		Config:          config,
		CaptchaVerifier: mockCaptcha,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *MiddlewareTestSuite) TestVerifyCaptchaValid() {
	ts.Config.Security.Captcha.Enabled = true
	ts.Config.Security.Captcha.Provider = "hcaptcha"
	ts.Config.Security.Captcha.Secret = "test-secret"

	// Configure mock to return success
	ts.CaptchaVerifier.Result = &security.VerificationResponse{Success: true}
	ts.CaptchaVerifier.Err = nil

	adminClaims := &AccessTokenClaims{
		Role: "supabase_admin",
	}
	adminJwt, err := jwt.NewWithClaims(jwt.SigningMethodHS256, adminClaims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err)
	cases := []struct {
		desc          string
		adminJwt      string
		captcha_token string
		expectVerify  bool
	}{
		{
			"Valid captcha response",
			"",
			captchaResponse,
			true,
		},
		{
			"Ignore captcha if admin role is present",
			adminJwt,
			"",
			false,
		},
	}
	for _, c := range cases {
		// Reset mock state between cases
		ts.CaptchaVerifier.LastToken = ""
		ts.CaptchaVerifier.LastClientIP = ""

		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"email":    "test@example.com",
			"password": "secret",
			"gotrue_meta_security": map[string]interface{}{
				"captcha_token": c.captcha_token,
			},
		}))
		req := httptest.NewRequest(http.MethodPost, "http://localhost", &buffer)
		req.Header.Set("Content-Type", "application/json")
		if c.adminJwt != "" {
			req.Header.Set("Authorization", "Bearer "+c.adminJwt)
		}

		beforeCtx := context.Background()
		req = req.WithContext(beforeCtx)

		w := httptest.NewRecorder()

		afterCtx, err := ts.API.verifyCaptcha(w, req)
		require.NoError(ts.T(), err)

		if c.expectVerify {
			require.Equal(ts.T(), c.captcha_token, ts.CaptchaVerifier.LastToken)
		} else {
			require.Empty(ts.T(), ts.CaptchaVerifier.LastToken)
		}

		body, err := io.ReadAll(req.Body)
		require.NoError(ts.T(), err)

		// re-initialize buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"email":    "test@example.com",
			"password": "secret",
			"gotrue_meta_security": map[string]interface{}{
				"captcha_token": c.captcha_token,
			},
		}))

		// check if body is the same
		require.Equal(ts.T(), body, buffer.Bytes())
		require.Equal(ts.T(), afterCtx, beforeCtx)
	}
}

func (ts *MiddlewareTestSuite) TestVerifyCaptchaInvalid() {
	cases := []struct {
		desc         string
		errorCodes   []string
		expectedCode int
		expectedMsg  string
	}{
		{
			"Captcha validation failed",
			[]string{"not-using-dummy-secret"},
			http.StatusBadRequest,
			"captcha protection: request disallowed (not-using-dummy-secret)",
		},
		{
			"Captcha validation failed",
			[]string{"invalid-input-secret"},
			http.StatusBadRequest,
			"captcha protection: request disallowed (invalid-input-secret)",
		},
	}
	for _, c := range cases {
		ts.Run(c.desc, func() {
			ts.Config.Security.Captcha.Enabled = true
			ts.Config.Security.Captcha.Provider = "hcaptcha"
			ts.Config.Security.Captcha.Secret = "test-secret"

			ts.CaptchaVerifier.Result = &security.VerificationResponse{
				Success:    false,
				ErrorCodes: c.errorCodes,
			}
			ts.CaptchaVerifier.Err = nil

			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"email":    "test@example.com",
				"password": "secret",
				"gotrue_meta_security": map[string]interface{}{
					"captcha_token": captchaResponse,
				},
			}))
			req := httptest.NewRequest(http.MethodPost, "http://localhost", &buffer)
			req.Header.Set("Content-Type", "application/json")

			req = req.WithContext(context.Background())

			w := httptest.NewRecorder()

			_, err := ts.API.verifyCaptcha(w, req)
			require.Equal(ts.T(), c.expectedCode, err.(*HTTPError).HTTPStatus)
			require.Equal(ts.T(), c.expectedMsg, err.(*HTTPError).Message)
		})
	}
}

func (ts *MiddlewareTestSuite) TestIsValidExternalHost() {
	cases := []struct {
		desc          string
		externalHosts []string

		requestURL string
		headers    http.Header

		expectedURL string
	}{
		{
			desc:        "no defined external hosts, no headers, no absolute request URL",
			requestURL:  "/some-path",
			expectedURL: ts.API.config.API.ExternalURL,
		},

		{
			desc: "no defined external hosts, unauthorized X-Forwarded-Host without any external hosts",
			headers: http.Header{
				"X-Forwarded-Host": []string{
					"external-host.com",
				},
			},
			requestURL:  "/some-path",
			expectedURL: ts.API.config.API.ExternalURL,
		},

		{
			desc:          "defined external hosts, unauthorized X-Forwarded-Host",
			externalHosts: []string{"authorized-host.com"},
			headers: http.Header{
				"X-Forwarded-Proto": []string{"https"},
				"X-Forwarded-Host": []string{
					"external-host.com",
				},
			},
			requestURL:  "/some-path",
			expectedURL: ts.API.config.API.ExternalURL,
		},

		{
			desc:        "no defined external hosts, unauthorized Host",
			requestURL:  "https://external-host.com/some-path",
			expectedURL: ts.API.config.API.ExternalURL,
		},

		{
			desc:          "defined external hosts, unauthorized Host",
			externalHosts: []string{"authorized-host.com"},
			requestURL:    "https://external-host.com/some-path",
			expectedURL:   ts.API.config.API.ExternalURL,
		},

		{
			desc:          "defined external hosts, authorized X-Forwarded-Host",
			externalHosts: []string{"authorized-host.com"},
			headers: http.Header{
				"X-Forwarded-Proto": []string{"http"}, // this should be ignored and default to HTTPS
				"X-Forwarded-Host": []string{
					"authorized-host.com",
				},
			},
			requestURL:  "https://X-Forwarded-Host-takes-precedence.com/some-path",
			expectedURL: "https://authorized-host.com",
		},

		{
			desc:          "defined external hosts, authorized Host",
			externalHosts: []string{"authorized-host.com"},
			requestURL:    "https://authorized-host.com/some-path",
			expectedURL:   "https://authorized-host.com",
		},

		{
			desc:          "defined external hosts, authorized X-Forwarded-Host",
			externalHosts: []string{"authorized-host.com"},
			headers: http.Header{
				"X-Forwarded-Proto": []string{"http"}, // this should be ignored and default to HTTPS
				"X-Forwarded-Host": []string{
					"authorized-host.com",
				},
			},
			requestURL:  "https://X-Forwarded-Host-takes-precedence.com/some-path",
			expectedURL: "https://authorized-host.com",
		},

		{
			desc:          "defined external hosts, authorized localhost in X-Forwarded-Host with HTTP",
			externalHosts: []string{"localhost"},
			headers: http.Header{
				"X-Forwarded-Proto": []string{"http"},
				"X-Forwarded-Host": []string{
					"localhost",
				},
			},
			requestURL:  "/some-path",
			expectedURL: "http://localhost",
		},

		{
			desc:          "defined external hosts, authorized localhost in Host with HTTP",
			externalHosts: []string{"localhost"},
			requestURL:    "http://localhost:3000/some-path",
			expectedURL:   "http://localhost",
		},
	}

	require.NotEmpty(ts.T(), ts.API.config.API.ExternalURL)

	for _, c := range cases {
		ts.Run(c.desc, func() {
			req := httptest.NewRequest(http.MethodPost, c.requestURL, nil)
			if c.headers != nil {
				req.Header = c.headers
			}

			originalHosts := ts.API.config.Mailer.ExternalHosts
			ts.API.config.Mailer.ExternalHosts = c.externalHosts

			w := httptest.NewRecorder()
			ctx, err := ts.API.isValidExternalHost(w, req)

			ts.API.config.Mailer.ExternalHosts = originalHosts

			require.NoError(ts.T(), err)

			externalURL := getExternalHost(ctx)
			require.Equal(ts.T(), c.expectedURL, externalURL.String())
		})
	}
}

func (ts *MiddlewareTestSuite) TestRequireSAMLEnabled() {
	cases := []struct {
		desc        string
		isEnabled   bool
		expectedErr error
	}{
		{
			desc:        "SAML not enabled",
			isEnabled:   false,
			expectedErr: apierrors.NewNotFoundError(apierrors.ErrorCodeSAMLProviderDisabled, "SAML 2.0 is disabled"),
		},
		{
			desc:        "SAML enabled",
			isEnabled:   true,
			expectedErr: nil,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			ts.Config.SAML.Enabled = c.isEnabled
			req := httptest.NewRequest("GET", "http://localhost", nil)
			w := httptest.NewRecorder()

			_, err := ts.API.requireSAMLEnabled(w, req)
			require.Equal(ts.T(), c.expectedErr, err)
		})
	}
}

func TestFunctionHooksUnmarshalJSON(t *testing.T) {
	tests := []struct {
		in string
		ok bool
	}{
		{`{ "signup" : "identity-signup" }`, true},
		{`{ "signup" : ["identity-signup"] }`, true},
		{`{ "signup" : {"foo" : "bar"} }`, false},
	}
	for _, tt := range tests {
		t.Run(tt.in, func(t *testing.T) {
			var f FunctionHooks
			err := json.Unmarshal([]byte(tt.in), &f)
			if tt.ok {
				assert.NoError(t, err)
				assert.Equal(t, FunctionHooks{"signup": {"identity-signup"}}, f)
			} else {
				assert.Error(t, err)
			}
		})
	}
}

func (ts *MiddlewareTestSuite) TestTimeoutMiddleware() {
	ts.Config.API.MaxRequestDuration = 5 * time.Microsecond
	req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
	w := httptest.NewRecorder()

	timeoutHandler := timeoutMiddleware(ts.Config.API.MaxRequestDuration)

	slowHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate a slow handler which should trigger the timeout.
		// Use context-aware wait so the goroutine exits when the timeout fires,
		// avoiding a data race with test cleanup.
		select {
		case <-time.After(1 * time.Second):
			ts.API.handler.ServeHTTP(w, r)
		case <-r.Context().Done():
			return
		}
	})
	timeoutHandler(slowHandler).ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusGatewayTimeout, w.Code)

	var data map[string]interface{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	require.Equal(ts.T(), apierrors.ErrorCodeRequestTimeout, data["error_code"])
	require.Equal(ts.T(), float64(504), data["code"])
	require.NotNil(ts.T(), data["msg"])
}

func TestTimeoutResponseWriter(t *testing.T) {
	// timeoutResponseWriter should exhitbit a similar behavior as http.ResponseWriter
	req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
	w1 := httptest.NewRecorder()
	w2 := httptest.NewRecorder()

	timeoutHandler := timeoutMiddleware(time.Second * 10)

	redirectHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// tries to redirect twice
		http.Redirect(w, r, "http://localhost:3001/#message=first_message", http.StatusSeeOther)

		// overwrites the first
		http.Redirect(w, r, "http://localhost:3001/second", http.StatusSeeOther)
	})
	timeoutHandler(redirectHandler).ServeHTTP(w1, req)
	redirectHandler.ServeHTTP(w2, req)

	require.Equal(t, w1.Result(), w2.Result())
}

func (ts *MiddlewareTestSuite) TestPerformRateLimitingWithSBFF() {
	origRateLimitHeader := ts.Config.RateLimitHeader
	origSBFFEnabled := ts.Config.Security.SbForwardedForEnabled

	defer func() {
		ts.Config.RateLimitHeader = origRateLimitHeader
		ts.Config.Security.SbForwardedForEnabled = origSBFFEnabled
	}()

	ts.Config.RateLimitHeader = "X-Test-Perform-Rate-Limiting"
	ts.Config.Security.SbForwardedForEnabled = true

	type headerSet struct {
		rateLimiting   string
		sbForwardedFor string
	}

	testCases := []struct {
		name         string
		headerValues []headerSet
		expErr       error
	}{
		{
			name: "multiple SBFF values, single rate limiting value",
			headerValues: []headerSet{
				{
					sbForwardedFor: "192.168.1.100",
					rateLimiting:   "60.60.60.60",
				},
				{
					sbForwardedFor: "192.168.1.200",
					rateLimiting:   "60.60.60.60",
				},
			},
			expErr: nil,
		},
		{
			name: "single SBFF value, multiple rate limiting values",
			headerValues: []headerSet{
				{
					sbForwardedFor: "192.168.1.100",
					rateLimiting:   "60.60.60.60",
				},
				{
					sbForwardedFor: "192.168.1.100",
					rateLimiting:   "70.70.70.70",
				},
			},
			expErr: apierrors.NewTooManyRequestsError(
				apierrors.ErrorCodeOverRequestRateLimit,
				"Request rate limit reached",
			),
		},
		{
			name: "no SBFF value, multiple rate limiting values",
			headerValues: []headerSet{
				{
					sbForwardedFor: "",
					rateLimiting:   "60.60.60.60",
				},
				{
					sbForwardedFor: "",
					rateLimiting:   "70.70.70.70",
				},
			},
			expErr: nil,
		},
		{
			name: "no SBFF value, single rate limiting value",
			headerValues: []headerSet{
				{
					sbForwardedFor: "",
					rateLimiting:   "60.60.60.60",
				},
				{
					sbForwardedFor: "",
					rateLimiting:   "60.60.60.60",
				},
			},
			expErr: apierrors.NewTooManyRequestsError(
				apierrors.ErrorCodeOverRequestRateLimit,
				"Request rate limit reached",
			),
		},
		{
			name: "invalid SBFF value, multiple rate limiting values",
			headerValues: []headerSet{
				{
					sbForwardedFor: "invalid",
					rateLimiting:   "60.60.60.60",
				},
				{
					sbForwardedFor: "invalid",
					rateLimiting:   "70.70.70.70",
				},
			},
			expErr: nil,
		},
		{
			name: "invalid SBFF value, single rate limiting value",
			headerValues: []headerSet{
				{
					sbForwardedFor: "invalid",
					rateLimiting:   "60.60.60.60",
				},
				{
					sbForwardedFor: "invalid",
					rateLimiting:   "60.60.60.60",
				},
			},
			expErr: apierrors.NewTooManyRequestsError(
				apierrors.ErrorCodeOverRequestRateLimit,
				"Request rate limit reached",
			),
		},
	}

	// This test uses the SBFF middleware to inject the Sb-Forwarded-For IP address value, then
	// wraps a handler that calls performRateLimiting and stores the error value.
	for _, tc := range testCases {
		lmt := tollbooth.NewLimiter(
			1,
			&limiter.ExpirableOptions{
				DefaultExpirationTTL: time.Hour,
			},
		)

		var obsErr error

		var handler http.HandlerFunc = func(rw http.ResponseWriter, r *http.Request) {
			obsErr = ts.API.performRateLimiting(lmt, r)
		}

		errCallback := func(r *http.Request, err error) {
		}

		middleware := sbff.Middleware(&ts.Config.Security, errCallback)

		wrappedHandler := middleware(handler)

		for _, h := range tc.headerValues {
			r := httptest.NewRequest(http.MethodGet, "http://localhost/", nil)

			if h.rateLimiting != "" {
				r.Header.Set(ts.Config.RateLimitHeader, h.rateLimiting)
			}

			if h.sbForwardedFor != "" {
				r.Header.Set(sbff.HeaderName, h.sbForwardedFor)
			}

			wrappedHandler.ServeHTTP(nil, r)
		}

		require.ErrorIs(ts.T(), obsErr, tc.expErr)
	}

}

func (ts *MiddlewareTestSuite) TestPerformRateLimitingWithHeader() {
	ts.Config.RateLimitHeader = "X-Test-Perform-Rate-Limiting"

	tests := []struct {
		name         string
		headerValues []string
		expError     error
	}{
		{
			name: "no value",
			headerValues: []string{
				"",
				"",
			},
			expError: nil,
		},
		{
			name: "single end user value",
			headerValues: []string{
				"192.168.1.100",
				"192.168.1.100",
			},
			expError: apierrors.NewTooManyRequestsError(
				apierrors.ErrorCodeOverRequestRateLimit,
				"Request rate limit reached",
			),
		},
		{
			name: "same end user value, multiple proxies",
			headerValues: []string{
				"2600:cafe:beef::1,192.168.1.100",
				"2600:cafe:beef::1,192.168.1.200",
			},
			expError: apierrors.NewTooManyRequestsError(
				apierrors.ErrorCodeOverRequestRateLimit,
				"Request rate limit reached",
			),
		},
		{
			name: "multiple end user values, single proxy",
			headerValues: []string{
				"2600:cafe:beef::1,192.168.1.100",
				"3700:dead:abcd::2,192.168.1.100",
			},
			expError: nil,
		},
		{
			name: "same end user value, multiple proxies, with whitespace",
			headerValues: []string{
				"2600:cafe:beef::1     ,192.168.1.100",
				"2600:cafe:beef::1 ,     192.168.1.200",
			},
			expError: apierrors.NewTooManyRequestsError(
				apierrors.ErrorCodeOverRequestRateLimit,
				"Request rate limit reached",
			),
		},
		{
			name: "empty header, all whitespace",
			headerValues: []string{
				" ",
			},
			expError: nil,
		},
		{
			name: "empty first key, no whitespace",
			headerValues: []string{
				",192.168.1.100",
			},
			expError: nil,
		},
		{
			name: "empty first key, with whitespace",
			headerValues: []string{
				"     ,192.168.1.100",
			},
			expError: nil,
		},
	}

	for _, tt := range tests {
		// Trigger a rate limiting error if we see the same end-user key twice in the same
		// test case
		lmt := tollbooth.NewLimiter(
			1,
			&limiter.ExpirableOptions{
				DefaultExpirationTTL: time.Hour,
			},
		)

		var obsError error

		for _, h := range tt.headerValues {
			req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
			req.Header.Add(ts.Config.RateLimitHeader, h)
			obsError = ts.API.performRateLimiting(lmt, req)
		}

		require.ErrorIs(ts.T(), obsError, tt.expError, "error for test '%s'", tt.name)
	}
}

func (ts *MiddlewareTestSuite) TestLimitHandler() {
	ts.Config.RateLimitHeader = "X-Rate-Limit"
	lmt := tollbooth.NewLimiter(5, &limiter.ExpirableOptions{
		DefaultExpirationTTL: time.Hour,
	})

	okHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		b, _ := json.Marshal(map[string]interface{}{"message": "ok"})
		w.Write([]byte(b))
	})

	for i := 0; i < 5; i++ {
		req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
		req.Header.Add(ts.Config.RateLimitHeader, "0.0.0.0")
		w := httptest.NewRecorder()
		ts.API.limitHandler(lmt).handler(okHandler).ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)

		var data map[string]interface{}
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
		require.Equal(ts.T(), "ok", data["message"])
	}

	// 6th request should fail and return a rate limit exceeded error
	req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
	req.Header.Add(ts.Config.RateLimitHeader, "0.0.0.0")
	w := httptest.NewRecorder()
	ts.API.limitHandler(lmt).handler(okHandler).ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusTooManyRequests, w.Code)
}

func (ts *MiddlewareTestSuite) TestLimitRequestBodyMiddleware() {
	const maxBytes = 1 << 10 // 1KB for testing

	bodyReadHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := io.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(http.StatusRequestEntityTooLarge)
			w.Write([]byte(err.Error()))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	handler := limitRequestBody(maxBytes)(bodyReadHandler)

	ts.Run("allows request within limit", func() {
		body := bytes.NewReader(make([]byte, maxBytes-1))
		req := httptest.NewRequest(http.MethodPost, "http://localhost", body)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)
		require.Equal(ts.T(), "ok", w.Body.String())
	})

	ts.Run("rejects request exceeding limit", func() {
		body := bytes.NewReader(make([]byte, maxBytes+1))
		req := httptest.NewRequest(http.MethodPost, "http://localhost", body)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusRequestEntityTooLarge, w.Code)
	})

	ts.Run("allows nil body", func() {
		req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)
	})

	ts.Run("allows empty body", func() {
		req := httptest.NewRequest(http.MethodPost, "http://localhost", http.NoBody)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)
	})

	ts.Run("allows request at exact limit", func() {
		body := bytes.NewReader(make([]byte, maxBytes))
		req := httptest.NewRequest(http.MethodPost, "http://localhost", body)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)
	})
}

type MockCleanup struct {
	mock.Mock
}

func (m *MockCleanup) Clean(db *storage.Connection) (int, error) {
	m.Called(db)
	return 0, nil
}

func (ts *MiddlewareTestSuite) TestDatabaseCleanup() {
	testHandler := func(statusCode int) http.HandlerFunc {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(statusCode)
			b, _ := json.Marshal(map[string]interface{}{"message": "ok"})
			w.Write([]byte(b))
		})
	}

	cases := []struct {
		desc       string
		statusCode int
		method     string
	}{
		{
			desc:       "Run cleanup successfully",
			statusCode: http.StatusOK,
			method:     http.MethodPost,
		},
		{
			desc:       "Skip cleanup if GET",
			statusCode: http.StatusOK,
			method:     http.MethodGet,
		},
		{
			desc:       "Skip cleanup if 3xx",
			statusCode: http.StatusSeeOther,
			method:     http.MethodPost,
		},
		{
			desc:       "Skip cleanup if 4xx",
			statusCode: http.StatusBadRequest,
			method:     http.MethodPost,
		},
		{
			desc:       "Skip cleanup if 5xx",
			statusCode: http.StatusInternalServerError,
			method:     http.MethodPost,
		},
	}

	mockCleanup := new(MockCleanup)
	mockCleanup.On("Clean", mock.Anything).Return(0, nil)
	for _, c := range cases {
		ts.Run("DatabaseCleanup", func() {
			req := httptest.NewRequest(c.method, "http://localhost", nil)
			w := httptest.NewRecorder()
			ts.API.databaseCleanup(mockCleanup)(testHandler(c.statusCode)).ServeHTTP(w, req)
			require.Equal(ts.T(), c.statusCode, w.Code)
		})
	}
	mockCleanup.AssertNumberOfCalls(ts.T(), "Clean", 1)
}

func (ts *MiddlewareTestSuite) TestRequireAdminCredentialsSessionCheck() {
	models.TruncateAll(ts.API.db)

	user, err := models.NewUser("", "admin-session@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(user))

	session, err := models.NewSession(user.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(session))

	signClaims := func(claims *AccessTokenClaims) string {
		signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
		require.NoError(ts.T(), err)
		return signed
	}

	newRequest := func(token string) *http.Request {
		req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		return req
	}

	ts.Run("admin token with valid session is accepted", func() {
		token := signClaims(&AccessTokenClaims{
			Role:      "supabase_admin",
			SessionId: session.ID.String(),
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   user.ID.String(),
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			},
		})

		_, err := ts.API.requireAdminCredentials(httptest.NewRecorder(), newRequest(token))
		require.NoError(ts.T(), err)
	})

	ts.Run("admin token whose session was revoked is rejected", func() {
		token := signClaims(&AccessTokenClaims{
			Role:      "supabase_admin",
			SessionId: session.ID.String(),
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   user.ID.String(),
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			},
		})
		require.NoError(ts.T(), models.LogoutSession(ts.API.db, session.ID))

		_, err := ts.API.requireAdminCredentials(httptest.NewRecorder(), newRequest(token))
		require.Error(ts.T(), err)
		httpErr, ok := err.(*HTTPError)
		require.True(ts.T(), ok, "expected HTTPError, got %T", err)
		require.Equal(ts.T(), apierrors.ErrorCodeSessionNotFound, httpErr.ErrorCode)
	})

	ts.Run("admin token past session timebox is rejected", func() {
		freshSession, err := models.NewSession(user.ID, nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.API.db.Create(freshSession))

		// Backdate the session past the timebox — pop manages created_at
		// automatically on Update, so go through raw SQL.
		require.NoError(ts.T(), ts.API.db.RawQuery(
			"UPDATE auth.sessions SET created_at = ? WHERE id = ?",
			time.Now().Add(-48*time.Hour), freshSession.ID,
		).Exec())

		timebox := time.Hour
		original := ts.Config.Sessions.Timebox
		ts.Config.Sessions.Timebox = &timebox
		defer func() { ts.Config.Sessions.Timebox = original }()

		token := signClaims(&AccessTokenClaims{
			Role:      "supabase_admin",
			SessionId: freshSession.ID.String(),
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   user.ID.String(),
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			},
		})

		_, err = ts.API.requireAdminCredentials(httptest.NewRecorder(), newRequest(token))
		require.Error(ts.T(), err)
		httpErr, ok := err.(*HTTPError)
		require.True(ts.T(), ok, "expected HTTPError, got %T", err)
		require.Equal(ts.T(), apierrors.ErrorCodeSessionExpired, httpErr.ErrorCode)
	})

	ts.Run("sessionless service_role token still passes", func() {
		token := signClaims(&AccessTokenClaims{
			Role: "service_role",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			},
		})

		_, err := ts.API.requireAdminCredentials(httptest.NewRecorder(), newRequest(token))
		require.NoError(ts.T(), err)
	})

	ts.Run("admin token with nil-uuid session_id passes (treated as sessionless)", func() {
		token := signClaims(&AccessTokenClaims{
			Role:      "supabase_admin",
			SessionId: uuid.Nil.String(),
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   user.ID.String(),
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			},
		})

		_, err := ts.API.requireAdminCredentials(httptest.NewRecorder(), newRequest(token))
		require.NoError(ts.T(), err)
	})

	ts.Run("admin token for a banned user is rejected", func() {
		// Separate user so banning doesn't affect the other subtests.
		bannedUser, err := models.NewUser("", "banned-admin@example.com", "password", ts.Config.JWT.Aud, nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.API.db.Create(bannedUser))
		require.NoError(ts.T(), bannedUser.Ban(ts.API.db, time.Hour))

		bannedSession, err := models.NewSession(bannedUser.ID, nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.API.db.Create(bannedSession))

		token := signClaims(&AccessTokenClaims{
			Role:      "supabase_admin",
			SessionId: bannedSession.ID.String(),
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   bannedUser.ID.String(),
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			},
		})

		_, err = ts.API.requireAdminCredentials(httptest.NewRecorder(), newRequest(token))
		require.Error(ts.T(), err)
		httpErr, ok := err.(*HTTPError)
		require.True(ts.T(), ok, "expected HTTPError, got %T", err)
		require.Equal(ts.T(), apierrors.ErrorCodeUserBanned, httpErr.ErrorCode)
	})
}
