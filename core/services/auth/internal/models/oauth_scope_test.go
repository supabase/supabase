package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseScopeString(t *testing.T) {
	tests := []struct {
		name     string
		scope    string
		expected []string
	}{
		{
			name:     "single scope",
			scope:    "openid",
			expected: []string{"openid"},
		},
		{
			name:     "multiple scopes",
			scope:    "openid profile email",
			expected: []string{"openid", "profile", "email"},
		},
		{
			name:     "empty scope",
			scope:    "",
			expected: []string{},
		},
		{
			name:     "scope with extra spaces",
			scope:    "  openid   profile  ",
			expected: []string{"openid", "profile"},
		},
		{
			name:     "scope with empty segments",
			scope:    "openid  profile   email",
			expected: []string{"openid", "profile", "email"},
		},
		{
			name:     "only spaces",
			scope:    "   ",
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ParseScopeString(tt.scope)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestHasScope(t *testing.T) {
	scopes := []string{"openid", "profile", "email"}

	tests := []struct {
		name     string
		scopes   []string
		scope    string
		expected bool
	}{
		{
			name:     "scope exists",
			scopes:   scopes,
			scope:    "openid",
			expected: true,
		},
		{
			name:     "scope exists middle",
			scopes:   scopes,
			scope:    "profile",
			expected: true,
		},
		{
			name:     "scope exists last",
			scopes:   scopes,
			scope:    "email",
			expected: true,
		},
		{
			name:     "scope does not exist",
			scopes:   scopes,
			scope:    "phone",
			expected: false,
		},
		{
			name:     "empty scope",
			scopes:   scopes,
			scope:    "",
			expected: false,
		},
		{
			name:     "empty scopes list",
			scopes:   []string{},
			scope:    "openid",
			expected: false,
		},
		{
			name:     "nil scopes list",
			scopes:   nil,
			scope:    "openid",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := HasScope(tt.scopes, tt.scope)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestHasAllScopes(t *testing.T) {
	grantedScopes := []string{"openid", "profile", "email"}

	tests := []struct {
		name            string
		grantedScopes   []string
		requestedScopes []string
		expected        bool
	}{
		{
			name:            "requested scopes are a subset of granted scopes",
			grantedScopes:   grantedScopes,
			requestedScopes: []string{"openid", "profile"},
			expected:        true,
		},
		{
			name:            "requested scopes are an exact match of granted scopes",
			grantedScopes:   grantedScopes,
			requestedScopes: []string{"openid", "profile", "email"},
			expected:        true,
		},
		{
			name:            "requested scopes are a single scope granted",
			grantedScopes:   grantedScopes,
			requestedScopes: []string{"openid"},
			expected:        true,
		},
		{
			name:            "granted scopes are missing a scope",
			grantedScopes:   grantedScopes,
			requestedScopes: []string{"openid", "phone"},
			expected:        false,
		},
		{
			name:            "granted scopes are missing multiple scopes",
			grantedScopes:   grantedScopes,
			requestedScopes: []string{"phone", "address"},
			expected:        false,
		},
		{
			name:            "requested scopes are empty",
			grantedScopes:   grantedScopes,
			requestedScopes: []string{},
			expected:        true,
		},
		{
			name:            "requested scopes are nil",
			grantedScopes:   grantedScopes,
			requestedScopes: nil,
			expected:        true,
		},
		{
			name:            "granted scopes are empty with requested scopes",
			grantedScopes:   []string{},
			requestedScopes: []string{"openid"},
			expected:        false,
		},
		{
			name:            "granted scopes are empty with requested scopes",
			grantedScopes:   []string{},
			requestedScopes: []string{},
			expected:        true,
		},
		{
			name:            "granted scopes are nil with requested scopes",
			grantedScopes:   nil,
			requestedScopes: []string{"openid"},
			expected:        false,
		},
		{
			name:            "granted scopes are nil with requested scopes",
			grantedScopes:   nil,
			requestedScopes: []string{},
			expected:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := HasAllScopes(tt.grantedScopes, tt.requestedScopes)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsSupportedScope(t *testing.T) {
	tests := []struct {
		name     string
		scope    string
		expected bool
	}{
		{
			name:     "openid scope is supported",
			scope:    ScopeOpenID,
			expected: true,
		},
		{
			name:     "email scope is supported",
			scope:    ScopeEmail,
			expected: true,
		},
		{
			name:     "profile scope is supported",
			scope:    ScopeProfile,
			expected: true,
		},
		{
			name:     "phone scope is supported",
			scope:    ScopePhone,
			expected: true,
		},
		{
			name:     "offline_access scope is supported",
			scope:    ScopeOfflineAccess,
			expected: true,
		},
		{
			name:     "unsupported scope address",
			scope:    "address",
			expected: false,
		},
		{
			name:     "empty scope is not supported",
			scope:    "",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsSupportedScope(tt.scope)
			assert.Equal(t, tt.expected, result)
		})
	}
}
