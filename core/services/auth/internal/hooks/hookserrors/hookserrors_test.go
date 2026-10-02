package hookserrors

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/apierrors"
)

func TestFromBytes(t *testing.T) {
	cases := []struct {
		from string
		ok   bool
		exp  *Error
	}{
		{from: `<b>text</b>`},
		{from: `null`},
		{from: `{}`},
		{from: `{"key": "val"}`},
		{from: `{"error": null}`},

		{
			from: `{"error": {"message": "failed"}}`,
			ok:   true, exp: &Error{HTTPCode: 0, Message: "failed"},
		},
		{
			from: `{"error": {"http_code": 400}}`,
			ok:   true, exp: &Error{HTTPCode: 400},
		},
		{
			from: `{"error": {"message": "failed", "http_code": 400}}`,
			ok:   true, exp: &Error{HTTPCode: 400, Message: "failed"},
		},
		{
			from: `{"error": {"message": "failed", "http_code": 403}}`,
			ok:   true, exp: &Error{HTTPCode: 403, Message: "failed"},
		},
	}
	for _, tc := range cases {
		t.Run(string(tc.from), func(t *testing.T) {
			e, ok := fromBytes([]byte(tc.from))
			require.Equal(t, tc.ok, ok)
			if !tc.ok {
				require.Nil(t, e)
				return
			}
			require.Equal(t, tc.exp.HTTPCode, e.HTTPCode)
			require.Equal(t, tc.exp.Message, e.Message)

			require.NotNil(t, e)
			err := (error)(e)
			require.Equal(t, tc.exp.Message, err.Error())
		})
	}
}

func TestCheck(t *testing.T) {
	require.NoError(t, Check([]byte(`invalidjson`)))
	require.NoError(t, Check([]byte(`{"error": nil}`)))
	require.Error(t, Check([]byte(`{"error": {"message": "failed"}}`)))
	require.NoError(t, check(nil))
	require.NoError(t, check(&Error{Message: ""}))
	require.Error(t, check(&Error{Message: "failed"}))

	data := `{"error": {"message": "failed", "http_code": 403}}`
	err := Check([]byte(data))
	require.Error(t, err)

	e, ok := err.(*apierrors.HTTPError)
	require.True(t, ok)
	require.Equal(t, 403, e.HTTPStatus)
	require.Equal(t, "failed", e.Message)
}

func TestAs(t *testing.T) {
	{
		err := &Error{
			Message:  "failed",
			HTTPCode: 403,
		}
		e := new(Error)
		require.True(t, err.As(&e))
		require.Equal(t, 403, e.HTTPCode)
		require.Equal(t, "failed", e.Message)
	}

	{
		err := &Error{
			Message:  "failed",
			HTTPCode: 403,
		}
		e := new(Error)
		require.True(t, err.As(e))
		require.Equal(t, 403, e.HTTPCode)
		require.Equal(t, "failed", e.Message)
	}

	{
		err := &Error{
			Message:  "failed",
			HTTPCode: 403,
		}
		e := new(apierrors.HTTPError)
		require.True(t, err.As(&e))
		require.Equal(t, 403, e.HTTPStatus)
		require.Equal(t, "failed", e.Message)
	}

	{
		err := &Error{
			Message:  "failed",
			HTTPCode: 403,
		}
		e := new(apierrors.HTTPError)
		require.True(t, err.As(e))
		require.Equal(t, 403, e.HTTPStatus)
		require.Equal(t, "failed", e.Message)
	}

	t.Run("Negative", func(t *testing.T) {
		{
			err := errors.New("sentinel")
			e := new(Error)
			require.False(t, errors.As(err, &e))
		}

		{
			err := &Error{
				Message:  "failed",
				HTTPCode: 403,
			}
			e := (*Error)(nil)
			require.False(t, err.As(&e))
		}

		{
			err := &Error{
				Message:  "failed",
				HTTPCode: 403,
			}
			e := (*apierrors.HTTPError)(nil)
			require.False(t, err.As(&e))
		}

		{
			err := &Error{
				Message:  "failed",
				HTTPCode: 403,
			}
			e := (*error)(nil)
			require.False(t, err.As(&e))
		}
	})
}
