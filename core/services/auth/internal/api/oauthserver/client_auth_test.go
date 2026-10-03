package oauthserver

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/models"
)

func TestInferClientTypeFromAuthMethod(t *testing.T) {
	tests := []struct {
		name       string
		authMethod string
		expected   string
	}{
		{
			name:       "none method should return public",
			authMethod: models.TokenEndpointAuthMethodNone,
			expected:   models.OAuthServerClientTypePublic,
		},
		{
			name:       "client_secret_basic should return confidential",
			authMethod: models.TokenEndpointAuthMethodClientSecretBasic,
			expected:   models.OAuthServerClientTypeConfidential,
		},
		{
			name:       "client_secret_post should return confidential",
			authMethod: models.TokenEndpointAuthMethodClientSecretPost,
			expected:   models.OAuthServerClientTypeConfidential,
		},
		{
			name:       "unknown method should default to confidential",
			authMethod: "unknown_method",
			expected:   models.OAuthServerClientTypeConfidential,
		},
		{
			name:       "empty method should default to confidential",
			authMethod: "",
			expected:   models.OAuthServerClientTypeConfidential,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := InferClientTypeFromAuthMethod(tt.authMethod)
			if result != tt.expected {
				t.Errorf("InferClientTypeFromAuthMethod() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestGetValidAuthMethodsForClientType(t *testing.T) {

	tests := []struct {
		name       string
		clientType string
		expected   []string
	}{
		{
			name:       "public client should only support none",
			clientType: models.OAuthServerClientTypePublic,
			expected:   []string{models.TokenEndpointAuthMethodNone},
		},
		{
			name:       "confidential client should support secret methods",
			clientType: models.OAuthServerClientTypeConfidential,
			expected: []string{
				models.TokenEndpointAuthMethodClientSecretBasic,
				models.TokenEndpointAuthMethodClientSecretPost,
			},
		},
		{
			name:       "unknown client type should return empty",
			clientType: "unknown_type",
			expected:   []string{},
		},
		{
			name:       "empty client type should return empty",
			clientType: "",
			expected:   []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetValidAuthMethodsForClientType(tt.clientType)
			if len(result) != len(tt.expected) {
				t.Errorf("GetValidAuthMethodsForClientType() returned %d methods, expected %d", len(result), len(tt.expected))
				return
			}
			for i, method := range result {
				if method != tt.expected[i] {
					t.Errorf("GetValidAuthMethodsForClientType()[%d] = %v, expected %v", i, method, tt.expected[i])
				}
			}
		})
	}
}

func TestValidateClientTypeConsistency(t *testing.T) {

	tests := []struct {
		name        string
		clientType  string
		authMethod  string
		expectError bool
	}{
		{
			name:        "consistent public client",
			clientType:  models.OAuthServerClientTypePublic,
			authMethod:  models.TokenEndpointAuthMethodNone,
			expectError: false,
		},
		{
			name:        "consistent confidential client with basic auth",
			clientType:  models.OAuthServerClientTypeConfidential,
			authMethod:  models.TokenEndpointAuthMethodClientSecretBasic,
			expectError: false,
		},
		{
			name:        "consistent confidential client with post auth",
			clientType:  models.OAuthServerClientTypeConfidential,
			authMethod:  models.TokenEndpointAuthMethodClientSecretPost,
			expectError: false,
		},
		{
			name:        "inconsistent public client with secret auth",
			clientType:  models.OAuthServerClientTypePublic,
			authMethod:  models.TokenEndpointAuthMethodClientSecretBasic,
			expectError: true,
		},
		{
			name:        "inconsistent confidential client with none auth",
			clientType:  models.OAuthServerClientTypeConfidential,
			authMethod:  models.TokenEndpointAuthMethodNone,
			expectError: true,
		},
		{
			name:        "empty client type should not error",
			clientType:  "",
			authMethod:  models.TokenEndpointAuthMethodNone,
			expectError: false,
		},
		{
			name:        "empty auth method should not error",
			clientType:  models.OAuthServerClientTypePublic,
			authMethod:  "",
			expectError: false,
		},
		{
			name:        "both empty should not error",
			clientType:  "",
			authMethod:  "",
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateClientTypeConsistency(tt.clientType, tt.authMethod)
			if tt.expectError && err == nil {
				t.Errorf("ValidateClientTypeConsistency() expected error but got nil")
			}
			if !tt.expectError && err != nil {
				t.Errorf("ValidateClientTypeConsistency() expected no error but got: %v", err)
			}
		})
	}
}

func TestDetermineClientType(t *testing.T) {

	tests := []struct {
		name               string
		explicitClientType string
		authMethod         string
		expected           string
	}{
		{
			name:               "explicit public overrides auth method",
			explicitClientType: models.OAuthServerClientTypePublic,
			authMethod:         models.TokenEndpointAuthMethodClientSecretBasic,
			expected:           models.OAuthServerClientTypePublic,
		},
		{
			name:               "explicit confidential overrides auth method",
			explicitClientType: models.OAuthServerClientTypeConfidential,
			authMethod:         models.TokenEndpointAuthMethodNone,
			expected:           models.OAuthServerClientTypeConfidential,
		},
		{
			name:               "infer public from none auth method",
			explicitClientType: "",
			authMethod:         models.TokenEndpointAuthMethodNone,
			expected:           models.OAuthServerClientTypePublic,
		},
		{
			name:               "infer confidential from basic auth method",
			explicitClientType: "",
			authMethod:         models.TokenEndpointAuthMethodClientSecretBasic,
			expected:           models.OAuthServerClientTypeConfidential,
		},
		{
			name:               "infer confidential from post auth method",
			explicitClientType: "",
			authMethod:         models.TokenEndpointAuthMethodClientSecretPost,
			expected:           models.OAuthServerClientTypeConfidential,
		},
		{
			name:               "default to confidential when both empty",
			explicitClientType: "",
			authMethod:         "",
			expected:           models.OAuthServerClientTypeConfidential,
		},
		{
			name:               "default to confidential with unknown auth method",
			explicitClientType: "",
			authMethod:         "unknown_method",
			expected:           models.OAuthServerClientTypeConfidential,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := DetermineClientType(tt.explicitClientType, tt.authMethod)
			if result != tt.expected {
				t.Errorf("DetermineClientType() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestIsValidAuthMethodForClientType(t *testing.T) {

	tests := []struct {
		name       string
		clientType string
		authMethod string
		expected   bool
	}{
		{
			name:       "none is valid for public",
			clientType: models.OAuthServerClientTypePublic,
			authMethod: models.TokenEndpointAuthMethodNone,
			expected:   true,
		},
		{
			name:       "basic is invalid for public",
			clientType: models.OAuthServerClientTypePublic,
			authMethod: models.TokenEndpointAuthMethodClientSecretBasic,
			expected:   false,
		},
		{
			name:       "post is invalid for public",
			clientType: models.OAuthServerClientTypePublic,
			authMethod: models.TokenEndpointAuthMethodClientSecretPost,
			expected:   false,
		},
		{
			name:       "none is invalid for confidential",
			clientType: models.OAuthServerClientTypeConfidential,
			authMethod: models.TokenEndpointAuthMethodNone,
			expected:   false,
		},
		{
			name:       "basic is valid for confidential",
			clientType: models.OAuthServerClientTypeConfidential,
			authMethod: models.TokenEndpointAuthMethodClientSecretBasic,
			expected:   true,
		},
		{
			name:       "post is valid for confidential",
			clientType: models.OAuthServerClientTypeConfidential,
			authMethod: models.TokenEndpointAuthMethodClientSecretPost,
			expected:   true,
		},
		{
			name:       "unknown method is invalid for any type",
			clientType: models.OAuthServerClientTypePublic,
			authMethod: "unknown_method",
			expected:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidAuthMethodForClientType(tt.clientType, tt.authMethod)
			if result != tt.expected {
				t.Errorf("IsValidAuthMethodForClientType() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

func TestValidateClientAuthentication(t *testing.T) {

	// Create test clients
	publicClient := &models.OAuthServerClient{
		ID:         uuid.Must(uuid.NewV4()),
		ClientType: models.OAuthServerClientTypePublic,
		// No client secret hash for public clients
	}

	// Create a hashed secret for confidential client
	secretHash, _ := hashClientSecret("test_secret")
	confidentialClient := &models.OAuthServerClient{
		ID:               uuid.Must(uuid.NewV4()),
		ClientType:       models.OAuthServerClientTypeConfidential,
		ClientSecretHash: secretHash,
	}

	tests := []struct {
		name           string
		client         *models.OAuthServerClient
		providedSecret string
		expectError    bool
		errorContains  string
	}{
		{
			name:           "public client with no secret should pass",
			client:         publicClient,
			providedSecret: "",
			expectError:    false,
		},
		{
			name:           "public client with secret should fail",
			client:         publicClient,
			providedSecret: "some_secret",
			expectError:    true,
			errorContains:  "public clients must not provide client_secret",
		},
		{
			name:           "confidential client with correct secret should pass",
			client:         confidentialClient,
			providedSecret: "test_secret",
			expectError:    false,
		},
		{
			name:           "confidential client with no secret should fail",
			client:         confidentialClient,
			providedSecret: "",
			expectError:    true,
			errorContains:  "confidential clients must provide client_secret",
		},
		{
			name:           "confidential client with wrong secret should fail",
			client:         confidentialClient,
			providedSecret: "wrong_secret",
			expectError:    true,
			errorContains:  "invalid client credentials",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateClientAuthentication(tt.client, tt.providedSecret)

			if tt.expectError {
				if err == nil {
					t.Errorf("ValidateClientAuthentication() expected error but got nil")
					return
				}
				if tt.errorContains != "" && !containsString(err.Error(), tt.errorContains) {
					t.Errorf("ValidateClientAuthentication() error = %v, expected to contain %v", err, tt.errorContains)
				}
			} else {
				if err != nil {
					t.Errorf("ValidateClientAuthentication() expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestGetAllValidAuthMethods(t *testing.T) {

	expected := []string{
		models.TokenEndpointAuthMethodNone,
		models.TokenEndpointAuthMethodClientSecretBasic,
		models.TokenEndpointAuthMethodClientSecretPost,
	}

	result := GetAllValidAuthMethods()

	if len(result) != len(expected) {
		t.Errorf("GetAllValidAuthMethods() returned %d methods, expected %d", len(result), len(expected))
		return
	}

	for i, method := range result {
		if method != expected[i] {
			t.Errorf("GetAllValidAuthMethods()[%d] = %v, expected %v", i, method, expected[i])
		}
	}
}

func TestValidateClientAuthMethod(t *testing.T) {
	tests := []struct {
		name          string
		client        *models.OAuthServerClient
		usedMethod    string
		expectError   bool
		errorContains string
	}{
		{
			name: "client registered for basic should accept basic",
			client: &models.OAuthServerClient{
				ID:                      uuid.Must(uuid.NewV4()),
				ClientType:              models.OAuthServerClientTypeConfidential,
				TokenEndpointAuthMethod: models.TokenEndpointAuthMethodClientSecretBasic,
			},
			usedMethod:  models.TokenEndpointAuthMethodClientSecretBasic,
			expectError: false,
		},
		{
			name: "client registered for post should accept post",
			client: &models.OAuthServerClient{
				ID:                      uuid.Must(uuid.NewV4()),
				ClientType:              models.OAuthServerClientTypeConfidential,
				TokenEndpointAuthMethod: models.TokenEndpointAuthMethodClientSecretPost,
			},
			usedMethod:  models.TokenEndpointAuthMethodClientSecretPost,
			expectError: false,
		},
		{
			name: "client registered for basic should reject post",
			client: &models.OAuthServerClient{
				ID:                      uuid.Must(uuid.NewV4()),
				ClientType:              models.OAuthServerClientTypeConfidential,
				TokenEndpointAuthMethod: models.TokenEndpointAuthMethodClientSecretBasic,
			},
			usedMethod:    models.TokenEndpointAuthMethodClientSecretPost,
			expectError:   true,
			errorContains: "invalid authentication method",
		},
		{
			name: "client registered for post should reject basic",
			client: &models.OAuthServerClient{
				ID:                      uuid.Must(uuid.NewV4()),
				ClientType:              models.OAuthServerClientTypeConfidential,
				TokenEndpointAuthMethod: models.TokenEndpointAuthMethodClientSecretPost,
			},
			usedMethod:    models.TokenEndpointAuthMethodClientSecretBasic,
			expectError:   true,
			errorContains: "invalid authentication method",
		},
		{
			name: "public client registered for none should accept none",
			client: &models.OAuthServerClient{
				ID:                      uuid.Must(uuid.NewV4()),
				ClientType:              models.OAuthServerClientTypePublic,
				TokenEndpointAuthMethod: models.TokenEndpointAuthMethodNone,
			},
			usedMethod:  models.TokenEndpointAuthMethodNone,
			expectError: false,
		},
		{
			name: "public client registered for none should reject basic",
			client: &models.OAuthServerClient{
				ID:                      uuid.Must(uuid.NewV4()),
				ClientType:              models.OAuthServerClientTypePublic,
				TokenEndpointAuthMethod: models.TokenEndpointAuthMethodNone,
			},
			usedMethod:    models.TokenEndpointAuthMethodClientSecretBasic,
			expectError:   true,
			errorContains: "invalid authentication method",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateClientAuthMethod(tt.client, tt.usedMethod)

			if tt.expectError {
				if err == nil {
					t.Errorf("ValidateClientAuthMethod() expected error but got nil")
					return
				}
				if tt.errorContains != "" && !containsString(err.Error(), tt.errorContains) {
					t.Errorf("ValidateClientAuthMethod() error = %v, expected to contain %v", err, tt.errorContains)
				}
			} else {
				if err != nil {
					t.Errorf("ValidateClientAuthMethod() expected no error but got: %v", err)
				}
			}
		})
	}
}

// Helper function to check if a string contains a substring
func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || (len(s) > len(substr) &&
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
			func() bool {
				for i := 0; i <= len(s)-len(substr); i++ {
					if s[i:i+len(substr)] == substr {
						return true
					}
				}
				return false
			}())))
}
