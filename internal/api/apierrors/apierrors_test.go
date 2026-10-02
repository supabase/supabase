package apierrors

import (
	"errors"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestHTTPErrors(t *testing.T) {
	sentinel := errors.New("sentinel")

	tests := []struct {
		from error
		exp  *HTTPError
	}{

		// Status, ErrorCode, fmtStr, args
		{
			from: NewHTTPError(
				http.StatusBadRequest,
				ErrorCodeBadJSON,
				"Unable to parse JSON: %v",
				errors.New("bad syntax"),
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusBadRequest,
				ErrorCode:  ErrorCodeBadJSON,
				Message:    "Unable to parse JSON: bad syntax",
			},
		},

		// ErrorCode, fmtStr, args
		{
			from: NewBadRequestError(
				ErrorCodeBadJSON,
				"Unable to parse JSON: %v",
				errors.New("bad syntax"),
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusBadRequest,
				ErrorCode:  ErrorCodeBadJSON,
				Message:    "Unable to parse JSON: bad syntax",
			},
		},
		{
			from: NewNotFoundError(
				ErrorCodeUnknown,
				"error: %v",
				sentinel,
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusNotFound,
				ErrorCode:  ErrorCodeUnknown,
				Message:    "error: " + sentinel.Error(),
			},
		},
		{
			from: NewForbiddenError(
				ErrorCodeUnknown,
				"error: %v",
				sentinel,
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusForbidden,
				ErrorCode:  ErrorCodeUnknown,
				Message:    "error: " + sentinel.Error(),
			},
		},
		{
			from: NewUnprocessableEntityError(
				ErrorCodeUnknown,
				"error: %v",
				sentinel,
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusUnprocessableEntity,
				ErrorCode:  ErrorCodeUnknown,
				Message:    "error: " + sentinel.Error(),
			},
		},
		{
			from: NewTooManyRequestsError(
				ErrorCodeUnknown,
				"error: %v",
				sentinel,
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusTooManyRequests,
				ErrorCode:  ErrorCodeUnknown,
				Message:    "error: " + sentinel.Error(),
			},
		},

		// fmtStr, args
		{
			from: NewInternalServerError(
				"error: %v",
				sentinel,
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusInternalServerError,
				ErrorCode:  ErrorCodeUnexpectedFailure,
				Message:    "error: " + sentinel.Error(),
			},
		},
		{
			from: NewConflictError(
				"error: %v",
				sentinel,
			),
			exp: &HTTPError{
				HTTPStatus: http.StatusConflict,
				ErrorCode:  ErrorCodeConflict,
				Message:    "error: " + sentinel.Error(),
			},
		},
	}

	for idx, test := range tests {
		t.Logf("tests #%v - from %v exp %#v", idx, test.from, test.exp)

		require.Error(t, test.exp)
		require.Error(t, test.from)

		exp := test.exp
		got, ok := test.from.(*HTTPError)
		if !ok {
			t.Fatalf("exp type %T, got %v", got, test.from)
		}

		require.Equal(t, exp.HTTPStatus, got.HTTPStatus)
		require.Equal(t, exp.ErrorCode, got.ErrorCode)
		require.Equal(t, exp.Message, got.Message)
		require.Equal(t, exp.Error(), got.Error())
		require.Equal(t, exp.Cause(), got.Cause())
	}

	// test Error() with internal message
	{
		err := NewHTTPError(
			http.StatusBadRequest,
			ErrorCodeBadJSON,
			"Unable to parse JSON: %v",
			errors.New("bad syntax"),
		).WithInternalError(sentinel).WithInternalMessage("%s", sentinel.Error())

		require.Equal(t, err.Error(), sentinel.Error())
		require.Equal(t, err.Cause(), sentinel)
		require.Equal(t, err.Is(sentinel), true)
	}
}

func TestOAuthErrors(t *testing.T) {
	sentinel := errors.New("sentinel")

	{
		err := NewOAuthError(
			"oauth error",
			"oauth desc",
		)

		require.Error(t, err)
		require.Equal(t, err.Error(), "oauth error: oauth desc")
		require.Equal(t, err.Cause(), err)
	}

	// test Error() with internal message
	{
		err := NewOAuthError(
			"oauth error",
			"oauth desc",
		).WithInternalError(sentinel).WithInternalMessage("%s", sentinel.Error())

		require.Error(t, err)
		require.Equal(t, err.Error(), sentinel.Error())
		require.Equal(t, err.Cause(), sentinel)
	}
}
