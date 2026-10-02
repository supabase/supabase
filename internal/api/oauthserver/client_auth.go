package oauthserver

import (
	"fmt"

	"github.com/supabase/auth/internal/models"
)

// InferClientTypeFromAuthMethod infers client type from token_endpoint_auth_method
func InferClientTypeFromAuthMethod(authMethod string) string {
	switch authMethod {
	case models.TokenEndpointAuthMethodNone:
		return models.OAuthServerClientTypePublic
	case models.TokenEndpointAuthMethodClientSecretBasic, models.TokenEndpointAuthMethodClientSecretPost:
		return models.OAuthServerClientTypeConfidential
	default:
		return models.OAuthServerClientTypeConfidential // Default to confidential
	}
}

// GetValidAuthMethodsForClientType returns the valid authentication methods for a client type
func GetValidAuthMethodsForClientType(clientType string) []string {
	switch clientType {
	case models.OAuthServerClientTypePublic:
		return []string{models.TokenEndpointAuthMethodNone}
	case models.OAuthServerClientTypeConfidential:
		return []string{
			models.TokenEndpointAuthMethodClientSecretBasic,
			models.TokenEndpointAuthMethodClientSecretPost,
		}
	default:
		return []string{} // Unknown client type
	}
}

// ValidateClientTypeConsistency validates consistency between client_type and token_endpoint_auth_method
func ValidateClientTypeConsistency(clientType, authMethod string) error {
	if clientType == "" || authMethod == "" {
		return nil // Skip validation if either is not provided
	}

	expectedClientType := InferClientTypeFromAuthMethod(authMethod)
	if clientType != expectedClientType {
		return fmt.Errorf("client_type '%s' is inconsistent with token_endpoint_auth_method '%s' (expected client_type '%s')",
			clientType, authMethod, expectedClientType)
	}

	return nil
}

// IsValidAuthMethodForClientType checks if the auth method is valid for the given client type
func IsValidAuthMethodForClientType(clientType, authMethod string) bool {
	validMethods := GetValidAuthMethodsForClientType(clientType)
	for _, method := range validMethods {
		if method == authMethod {
			return true
		}
	}
	return false
}

// DetermineClientType determines the final client type using the priority:
// 1. Explicit client_type
// 2. Inferred from token_endpoint_auth_method
// 3. Default to confidential
func DetermineClientType(explicitClientType, authMethod string) string {
	// Priority 1: Explicit client_type
	if explicitClientType != "" {
		return explicitClientType
	}

	// Priority 2: Infer from token_endpoint_auth_method
	if authMethod != "" {
		return InferClientTypeFromAuthMethod(authMethod)
	}

	// Priority 3: Default to confidential
	return models.OAuthServerClientTypeConfidential
}

// ValidateClientAuthentication validates client authentication based on client type
func ValidateClientAuthentication(client *models.OAuthServerClient, providedSecret string) error {
	if client.IsPublic() {
		// Public clients should not provide client secrets
		if providedSecret != "" {
			return fmt.Errorf("public clients must not provide client_secret")
		}
		return nil
	}

	// Confidential clients must provide a valid client secret
	if providedSecret == "" {
		return fmt.Errorf("confidential clients must provide client_secret")
	}

	if !ValidateClientSecret(providedSecret, client.ClientSecretHash) {
		return fmt.Errorf("invalid client credentials")
	}

	return nil
}

// GetAllValidAuthMethods returns all supported authentication methods
func GetAllValidAuthMethods() []string {
	return []string{
		models.TokenEndpointAuthMethodNone,
		models.TokenEndpointAuthMethodClientSecretBasic,
		models.TokenEndpointAuthMethodClientSecretPost,
	}
}

// ValidateClientAuthMethod validates the authentication method used matches the registered method
func ValidateClientAuthMethod(client *models.OAuthServerClient, usedMethod string) error {
	registeredMethod := client.GetTokenEndpointAuthMethod()

	if usedMethod != registeredMethod {
		return fmt.Errorf("invalid authentication method: client is registered for '%s' but '%s' was used",
			registeredMethod, usedMethod)
	}

	return nil
}
