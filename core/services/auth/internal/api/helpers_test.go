package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
)

func TestIsValidCodeChallenge(t *testing.T) {
	cases := []struct {
		challenge     string
		isValid       bool
		expectedError error
	}{
		{
			challenge:     "invalid",
			isValid:       false,
			expectedError: apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "code challenge has to be between %v and %v characters", MinCodeChallengeLength, MaxCodeChallengeLength),
		},
		{
			challenge:     "codechallengecontainsinvalidcharacterslike@$^&*",
			isValid:       false,
			expectedError: apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "code challenge can only contain alphanumeric characters, hyphens, periods, underscores and tildes"),
		},
		{
			challenge:     "validchallengevalidchallengevalidchallengevalidchallenge",
			isValid:       true,
			expectedError: nil,
		},
	}

	for _, c := range cases {
		valid, err := isValidCodeChallenge(c.challenge)
		require.Equal(t, c.isValid, valid)
		require.Equal(t, c.expectedError, err)
	}
}

func TestIsValidPKCEParams(t *testing.T) {
	cases := []struct {
		challengeMethod string
		challenge       string
		expected        error
	}{
		{
			challengeMethod: "",
			challenge:       "",
			expected:        nil,
		},
		{
			challengeMethod: "test",
			challenge:       "testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttest",
			expected:        nil,
		},
		{
			challengeMethod: "test",
			challenge:       "",
			expected:        apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, InvalidPKCEParamsErrorMessage),
		},
		{
			challengeMethod: "",
			challenge:       "test",
			expected:        apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, InvalidPKCEParamsErrorMessage),
		},
	}

	for i, c := range cases {
		t.Run(strconv.Itoa(i), func(t *testing.T) {
			err := validatePKCEParams(c.challengeMethod, c.challenge)
			require.Equal(t, c.expected, err)
		})
	}
}

func TestRequestAud(ts *testing.T) {
	mockAPI := API{
		config: &conf.GlobalConfiguration{
			JWT: conf.JWTConfiguration{
				Aud:    "authenticated",
				Secret: "test-secret",
			},
		},
	}

	cases := []struct {
		desc        string
		headers     map[string]string
		payload     map[string]interface{}
		expectedAud string
	}{
		{
			desc: "Valid audience slice",
			headers: map[string]string{
				audHeaderName: "my_custom_aud",
			},
			payload: map[string]interface{}{
				"aud": "authenticated",
			},
			expectedAud: "my_custom_aud",
		},
		{
			desc: "Valid custom audience",
			payload: map[string]interface{}{
				"aud": "my_custom_aud",
			},
			expectedAud: "my_custom_aud",
		},
		{
			desc: "Invalid audience",
			payload: map[string]interface{}{
				"aud": "",
			},
			expectedAud: mockAPI.config.JWT.Aud,
		},
		{
			desc: "Missing audience",
			payload: map[string]interface{}{
				"sub": "d6044b6e-b0ec-4efe-a055-0d2d6ff1dbd8",
			},
			expectedAud: mockAPI.config.JWT.Aud,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func(t *testing.T) {
			claims := jwt.MapClaims(c.payload)
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
			signed, err := token.SignedString([]byte(mockAPI.config.JWT.Secret))
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer: %s", signed))
			for k, v := range c.headers {
				req.Header.Set(k, v)
			}

			// set the token in the request context for requestAud
			ctx, err := mockAPI.parseJWTClaims(signed, req)
			require.NoError(t, err)
			aud := mockAPI.requestAud(ctx, req)
			require.Equal(t, c.expectedAud, aud)
		})
	}

}
