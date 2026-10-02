package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/observability"
)

func TestHandleResponseErrorWithHTTPError(t *testing.T) {
	examples := []struct {
		HTTPError    *HTTPError
		APIVersion   string
		ExpectedBody string
	}{
		{
			HTTPError:    apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Unable to parse JSON"),
			APIVersion:   "",
			ExpectedBody: "{\"code\":400,\"error_code\":\"" + apierrors.ErrorCodeBadJSON + "\",\"msg\":\"Unable to parse JSON\"}",
		},
		{
			HTTPError:    apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Unable to parse JSON"),
			APIVersion:   "2023-12-31",
			ExpectedBody: "{\"code\":400,\"error_code\":\"" + apierrors.ErrorCodeBadJSON + "\",\"msg\":\"Unable to parse JSON\"}",
		},
		{
			HTTPError:    apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Unable to parse JSON"),
			APIVersion:   "2024-01-01",
			ExpectedBody: "{\"code\":\"" + apierrors.ErrorCodeBadJSON + "\",\"message\":\"Unable to parse JSON\"}",
		},
		{
			HTTPError: &HTTPError{
				HTTPStatus: http.StatusBadRequest,
				Message:    "Uncoded failure",
			},
			APIVersion:   "2024-01-01",
			ExpectedBody: "{\"code\":\"" + apierrors.ErrorCodeUnknown + "\",\"message\":\"Uncoded failure\"}",
		},
		{
			HTTPError: &HTTPError{
				HTTPStatus: http.StatusInternalServerError,
				Message:    "Unexpected failure",
			},
			APIVersion:   "2024-01-01",
			ExpectedBody: "{\"code\":\"" + apierrors.ErrorCodeUnexpectedFailure + "\",\"message\":\"Unexpected failure\"}",
		},
	}

	for _, example := range examples {
		rec := httptest.NewRecorder()
		req, err := http.NewRequest(http.MethodPost, "http://example.com", nil)
		require.NoError(t, err)

		if example.APIVersion != "" {
			req.Header.Set(APIVersionHeaderName, example.APIVersion)
		}

		HandleResponseError(example.HTTPError, rec, req)

		require.Equal(t, example.HTTPError.HTTPStatus, rec.Code)
		require.Equal(t, example.ExpectedBody, rec.Body.String())
	}
}

func TestRecoverer(t *testing.T) {
	var logBuffer bytes.Buffer
	config, err := confload.LoadGlobal(apiTestConfig)
	require.NoError(t, err)
	require.NoError(t, observability.ConfigureLogging(&config.Logging))

	// logrus should write to the buffer so we can check if the logs are output correctly
	logrus.SetOutput(&logBuffer)
	panicHandler := recoverer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("test panic")
	}))

	w := httptest.NewRecorder()
	req, err := http.NewRequest(http.MethodPost, "http://example.com", nil)
	require.NoError(t, err)

	panicHandler.ServeHTTP(w, req)

	require.Equal(t, http.StatusInternalServerError, w.Code)

	var data HTTPError

	// panic should return an internal server error
	require.NoError(t, json.NewDecoder(w.Body).Decode(&data))
	require.Equal(t, apierrors.ErrorCodeUnexpectedFailure, data.ErrorCode)
	require.Equal(t, http.StatusInternalServerError, data.HTTPStatus)
	require.Equal(t, "Internal Server Error", data.Message)

	// panic should log the error message internally
	var logs map[string]interface{}
	require.NoError(t, json.NewDecoder(&logBuffer).Decode(&logs))
	require.Equal(t, "request panicked", logs["msg"])
	require.Equal(t, "test panic", logs["panic"])
	require.NotEmpty(t, logs["stack"])
}

func TestHandleResponseErrorConsolidatesLogs(t *testing.T) {
	config, err := confload.LoadGlobal(apiTestConfig)
	require.NoError(t, err)
	require.NoError(t, observability.ConfigureLogging(&config.Logging))

	cases := []struct {
		name          string
		err           error
		expectedError string
		expectedCode  string
	}{
		{
			name:          "http error with internal error",
			err:           apierrors.NewInternalServerError("boom").WithInternalError(errors.New("connection reset")),
			expectedError: "connection reset",
			expectedCode:  string(apierrors.ErrorCodeUnexpectedFailure),
		},
		{
			name:          "http error without internal error",
			err:           apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Unable to parse JSON"),
			expectedError: "400: Unable to parse JSON",
			expectedCode:  string(apierrors.ErrorCodeBadJSON),
		},
		{
			name:          "oauth error",
			err:           apierrors.NewOAuthError("invalid_request", "missing code").WithInternalError(errors.New("code param missing")),
			expectedError: "code param missing",
		},
		{
			name:          "weak password error",
			err:           &WeakPasswordError{Message: "Password is too weak"},
			expectedError: "Password is too weak",
			expectedCode:  string(apierrors.ErrorCodeWeakPassword),
		},
		{
			name:          "unhandled error",
			err:           errors.New("unexpected failure"),
			expectedError: "Unhandled server error: unexpected failure",
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var logBuffer bytes.Buffer
			logrus.SetOutput(&logBuffer)

			logHandler := observability.NewStructuredLogger(logrus.StandardLogger(), config)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				HandleResponseError(c.err, w, r)
			}))

			req, err := http.NewRequest(http.MethodPost, "http://example.com", nil)
			require.NoError(t, err)

			rec := httptest.NewRecorder()
			logHandler.ServeHTTP(rec, req)

			decoder := json.NewDecoder(&logBuffer)

			var logs map[string]interface{}
			require.NoError(t, decoder.Decode(&logs))

			require.Equal(t, "request completed", logs["msg"])
			require.NotNil(t, logs["status"])
			require.Equal(t, c.expectedError, logs["error"])
			if c.expectedCode != "" {
				require.Equal(t, c.expectedCode, logs["error_code"])
			}

			require.False(t, decoder.More(), "expected exactly one log entry for the request, found a second")
		})
	}
}
