package api

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
)

func TestPasswordStrengthChecks(t *testing.T) {
	examples := []struct {
		MinLength          int
		RequiredCharacters []string

		Password string
		Reasons  []string
	}{
		{
			MinLength: 6,
			Password:  "12345",
			Reasons: []string{
				"length",
			},
		},
		{
			MinLength: 6,
			RequiredCharacters: []string{
				"a",
				"b",
				"c",
			},
			Password: "123",
			Reasons: []string{
				"length",
				"characters",
			},
		},
		{
			MinLength: 6,
			RequiredCharacters: []string{
				"a",
				"b",
				"c",
			},
			Password: "a123",
			Reasons: []string{
				"length",
				"characters",
			},
		},
		{
			MinLength: 6,
			RequiredCharacters: []string{
				"a",
				"b",
				"c",
			},
			Password: "ab123",
			Reasons: []string{
				"length",
				"characters",
			},
		},
		{
			MinLength: 6,
			RequiredCharacters: []string{
				"a",
				"b",
				"c",
			},
			Password: "c123",
			Reasons: []string{
				"length",
				"characters",
			},
		},
		{
			MinLength: 6,
			RequiredCharacters: []string{
				"a",
				"b",
				"c",
			},
			Password: "abc123",
			Reasons:  nil,
		},
		{
			MinLength:          6,
			RequiredCharacters: []string{},
			Password:           "zZgXb5gzyCNrV36qwbOSbKVQsVJd28mC1TwRpeB0y6sFNICJyjD6bILKJMsjyKDzBdaY5tmi8zY9BWJYmt3vULLmyafjIDLYjy8qhETu0mS2jj1uQBgSAzJn9Zjm8EFa",
			Reasons:            nil,
		},
	}

	for i, example := range examples {
		api := &API{
			config: &conf.GlobalConfiguration{
				Password: conf.PasswordConfiguration{
					MinLength:          example.MinLength,
					RequiredCharacters: conf.PasswordRequiredCharacters(example.RequiredCharacters),
				},
			},
		}

		err := api.checkPasswordStrength(context.Background(), example.Password)

		switch e := err.(type) {
		case *WeakPasswordError:
			require.Equal(t, e.Reasons, example.Reasons, "Example %d failed with wrong reasons", i)
		case *HTTPError:
			require.Equal(t, e.ErrorCode, apierrors.ErrorCodeValidationFailed, "Example %d failed with wrong error code", i)
		default:
			require.NoError(t, err, "Example %d failed with error", i)
		}
	}
}
