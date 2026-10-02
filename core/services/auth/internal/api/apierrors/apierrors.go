package apierrors

import (
	"fmt"
	"net/http"
)

// OAuthError is the JSON handler for OAuth2 error responses
type OAuthError struct {
	Err             string `json:"error"`
	Description     string `json:"error_description,omitempty"`
	InternalError   error  `json:"-"`
	InternalMessage string `json:"-"`
}

func NewOAuthError(err string, description string) *OAuthError {
	return &OAuthError{Err: err, Description: description}
}

func (e *OAuthError) Error() string {
	if e.InternalMessage != "" {
		return e.InternalMessage
	}
	return fmt.Sprintf("%s: %s", e.Err, e.Description)
}

// WithInternalError adds internal error information to the error
func (e *OAuthError) WithInternalError(err error) *OAuthError {
	e.InternalError = err
	return e
}

// WithInternalMessage adds internal message information to the error
func (e *OAuthError) WithInternalMessage(fmtString string, args ...any) *OAuthError {
	e.InternalMessage = fmt.Sprintf(fmtString, args...)
	return e
}

// Cause returns the root cause error
func (e *OAuthError) Cause() error {
	if e.InternalError != nil {
		return e.InternalError
	}
	return e
}

// HTTPError is an error with a message and an HTTP status code.
type HTTPError struct {
	HTTPStatus      int    `json:"code"`                 // do not rename the JSON tags!
	ErrorCode       string `json:"error_code,omitempty"` // do not rename the JSON tags!
	Message         string `json:"msg"`                  // do not rename the JSON tags!
	InternalError   error  `json:"-"`
	InternalMessage string `json:"-"`
	ErrorID         string `json:"error_id,omitempty"`
}

func NewHTTPError(httpStatus int, errorCode ErrorCode, fmtString string, args ...any) *HTTPError {
	return &HTTPError{
		HTTPStatus: httpStatus,
		ErrorCode:  errorCode,
		Message:    fmt.Sprintf(fmtString, args...),
	}
}

func NewBadRequestError(errorCode ErrorCode, fmtString string, args ...any) *HTTPError {
	return NewHTTPError(http.StatusBadRequest, errorCode, fmtString, args...)
}

func NewNotFoundError(errorCode ErrorCode, fmtString string, args ...any) *HTTPError {
	return NewHTTPError(http.StatusNotFound, errorCode, fmtString, args...)
}

func NewForbiddenError(errorCode ErrorCode, fmtString string, args ...any) *HTTPError {
	return NewHTTPError(http.StatusForbidden, errorCode, fmtString, args...)
}

func NewUnprocessableEntityError(errorCode ErrorCode, fmtString string, args ...any) *HTTPError {
	return NewHTTPError(http.StatusUnprocessableEntity, errorCode, fmtString, args...)
}

func NewTooManyRequestsError(errorCode ErrorCode, fmtString string, args ...any) *HTTPError {
	return NewHTTPError(http.StatusTooManyRequests, errorCode, fmtString, args...)
}

func NewInternalServerError(fmtString string, args ...any) *HTTPError {
	return NewHTTPError(http.StatusInternalServerError, ErrorCodeUnexpectedFailure, fmtString, args...)
}

func NewConflictError(fmtString string, args ...any) *HTTPError {
	return NewHTTPError(http.StatusConflict, ErrorCodeConflict, fmtString, args...)
}

func (e *HTTPError) Error() string {
	if e.InternalMessage != "" {
		return e.InternalMessage
	}
	return fmt.Sprintf("%d: %s", e.HTTPStatus, e.Message)
}

func (e *HTTPError) Is(target error) bool {
	return e.Error() == target.Error()
}

// Cause returns the root cause error
func (e *HTTPError) Cause() error {
	if e.InternalError != nil {
		return e.InternalError
	}
	return e
}

// WithInternalError adds internal error information to the error
func (e *HTTPError) WithInternalError(err error) *HTTPError {
	e.InternalError = err
	return e
}

// WithInternalMessage adds internal message information to the error
func (e *HTTPError) WithInternalMessage(fmtString string, args ...any) *HTTPError {
	e.InternalMessage = fmt.Sprintf(fmtString, args...)
	return e
}
