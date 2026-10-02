package core

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewServiceProviderConfig(t *testing.T) {
	t.Run("advertises the schemes the caller declares", func(t *testing.T) {
		scheme := NewOAuthBearerToken().AsPrimary()

		config := NewServiceProviderConfig("", scheme)

		require.Equal(t, []SchemaURI{SchemaServiceProviderConfig}, config.Schemas)
		require.Equal(t, []*AuthenticationScheme{scheme}, config.AuthenticationSchemes)
	})

	t.Run("identifies itself with resource metadata", func(t *testing.T) {
		baseURL := "http://localhost:9999/scim/v2"

		config := NewServiceProviderConfig(baseURL)

		require.Equal(t, ResourceTypeServiceProviderConfig, config.Meta.ResourceType)
		require.Equal(t, baseURL+EndpointServiceProviderConfig, config.Meta.Location)
	})

	t.Run("supports none of the optional protocol features", func(t *testing.T) {
		config := NewServiceProviderConfig("")

		assert.False(t, config.Patch.Supported)
		assert.False(t, config.Bulk.Supported)
		assert.False(t, config.Filter.Supported)
		assert.False(t, config.ChangePassword.Supported)
		assert.False(t, config.Sort.Supported)
		assert.False(t, config.ETag.Supported)
	})

	t.Run("serializes authenticationSchemes as an array", func(t *testing.T) {
		body, err := json.Marshal(NewServiceProviderConfig(""))

		require.NoError(t, err)
		require.Contains(t, string(body), `"authenticationSchemes":[]`)
	})
}

func TestAuthenticationScheme(t *testing.T) {
	t.Run("NewOAuthBearerToken", func(t *testing.T) {
		scheme := NewOAuthBearerToken()

		assert.Equal(t, AuthenticationSchemeOAuthBearerToken, scheme.Type)
		assert.Equal(t, "OAuth Bearer Token", scheme.Name)
		assert.Equal(t, "Authentication scheme using the OAuth Bearer Token Standard", scheme.Description)
		assert.Equal(t, "http://www.rfc-editor.org/info/rfc6750", scheme.SpecURI)
		assert.False(t, scheme.Primary)
	})

	t.Run("AsPrimary marks the scheme primary", func(t *testing.T) {
		scheme := NewOAuthBearerToken()

		require.Same(t, scheme, scheme.AsPrimary())
		assert.True(t, scheme.Primary)
	})
}
