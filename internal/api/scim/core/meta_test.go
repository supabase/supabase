package core

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewMeta(t *testing.T) {
	t.Run("locates the resource at its endpoint", func(t *testing.T) {
		meta := NewMeta("http://localhost:9999/scim/v2", ResourceTypeServiceProviderConfig, EndpointServiceProviderConfig)

		require.Equal(t, ResourceTypeServiceProviderConfig, meta.ResourceType)
		require.Equal(t, "http://localhost:9999/scim/v2/ServiceProviderConfig", meta.Location)
	})
}

func TestMeta(t *testing.T) {
	t.Run("serializes to JSON correctly", func(t *testing.T) {
		body, err := json.Marshal(Meta{
			ResourceType: ResourceTypeServiceProviderConfig,
			Location:     "http://localhost:9999/scim/v2/ServiceProviderConfig",
		})

		require.NoError(t, err)
		require.JSONEq(t, `{
			"resourceType": "ServiceProviderConfig",
			"location": "http://localhost:9999/scim/v2/ServiceProviderConfig"
		}`, string(body))
	})

	t.Run("omits the location when it is empty", func(t *testing.T) {
		body, err := json.Marshal(Meta{ResourceType: ResourceTypeServiceProviderConfig})

		require.NoError(t, err)
		require.JSONEq(t, `{"resourceType": "ServiceProviderConfig"}`, string(body))
	})
}
