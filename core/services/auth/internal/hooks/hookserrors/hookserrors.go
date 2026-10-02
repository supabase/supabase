// Package hookserrors holds the Error type and some functions to Check
// responses for errors.
package hookserrors

import (
	"encoding/json"
	"net/http"

	"github.com/supabase/auth/internal/api/apierrors"
)

// Error is the type propagated by hook endpoints to communicate failure.
type Error struct {
	HTTPCode int    `json:"http_code,omitempty"`
	Message  string `json:"message,omitempty"`
}

// Error implements the error interface by returning e.Message.
func (e *Error) Error() string { return e.Message }

// As implements the errors.As interface to allow unwrapping as either an
// Error or apierrors.HTTPError, depending on the needs of the caller.
func (e *Error) As(target any) bool {
	switch T := target.(type) {
	case **Error:
		v := (*T)
		if v == nil {
			return false
		}
		v.HTTPCode = e.HTTPCode
		v.Message = e.Message
		return true
	case *Error:
		T.HTTPCode = e.HTTPCode
		T.Message = e.Message
		return true
	case **apierrors.HTTPError:
		v := (*T)
		if v == nil {
			return false
		}
		v.HTTPStatus = e.HTTPCode
		v.Message = e.Message
		return true
	case *apierrors.HTTPError:
		T.HTTPStatus = e.HTTPCode
		T.Message = e.Message
		return true
	default:
		return false
	}
}

// Check will attempt to extract a hook Error from a byte slice and return a
// non-nil error, otherwise Check returns nil if no error was found.
func Check(b []byte) error {
	e, ok := fromBytes(b)
	if !ok {
		return nil
	}
	return check(e)
}

func check(e *Error) error {
	if e == nil {
		return nil
	}

	// TODO(cstockton): Changing this would be a BC break, but it also
	// doesn't seem to be the best API. For example returning an error object
	// with an http_code field set to 500 would not count as an error.
	if e.Message == "" {
		return nil
	}

	httpCode := e.HTTPCode
	if httpCode == 0 {
		// TODO(cstockton): this really should be a BadRequest as default and
		// the returned code should be bounded to 4XX codes, ideally specific
		// 4xx codes.
		// if httpCode/100 == 4 { httpCode = http.StatusBadRequest }
		httpCode = http.StatusInternalServerError
	}

	httpError := &apierrors.HTTPError{
		HTTPStatus: httpCode,
		Message:    e.Message,
	}
	return httpError.WithInternalError(e)
}

func fromBytes(b []byte) (*Error, bool) {
	var dst struct {
		Error *struct {
			HTTPCode int    `json:"http_code,omitempty"`
			Message  string `json:"message,omitempty"`
		} `json:"error,omitempty"`
	}
	if err := json.Unmarshal(b, &dst); err != nil {
		return nil, false
	}
	if dst.Error == nil {
		return nil, false
	}
	e := &Error{
		HTTPCode: dst.Error.HTTPCode,
		Message:  dst.Error.Message,
	}
	return e, true
}
