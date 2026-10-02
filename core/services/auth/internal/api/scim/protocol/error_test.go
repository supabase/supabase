package protocol

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewError(t *testing.T) {
	t.Run("serializes to JSON correctly", func(t *testing.T) {
		body, err := json.Marshal(NewError(http.StatusNotFound, "", "Endpoint or resource does not exist"))

		require.NoError(t, err)
		assert.JSONEq(t, `{
			"schemas": [
				"urn:ietf:params:scim:api:messages:2.0:Error"
			],
			"status": "404",
			"detail": "Endpoint or resource does not exist"
		}`, string(body))
	})

	t.Run("includes the scimType when one is given", func(t *testing.T) {
		body, err := json.Marshal(NewError(http.StatusBadRequest, "invalidValue", "A required value was missing"))

		require.NoError(t, err)
		assert.JSONEq(t, `{
			"schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
			"scimType": "invalidValue",
			"detail": "A required value was missing",
			"status": "400"
		}`, string(body))
	})

	t.Run("omits the optional attributes when they are empty", func(t *testing.T) {
		body, err := json.Marshal(NewError(http.StatusBadRequest, "", ""))

		require.NoError(t, err)
		assert.JSONEq(t, `{
			"schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
			"status": "400"
		}`, string(body))
	})
}
