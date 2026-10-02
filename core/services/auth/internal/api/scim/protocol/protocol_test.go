package protocol

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSend(t *testing.T) {
	t.Run("writes a JSON response with a SCIM media type", func(t *testing.T) {
		w := httptest.NewRecorder()

		err := Send(w, http.StatusTeapot, map[string]string{"key": "value"})
		require.NoError(t, err)

		assert.Equal(t, http.StatusTeapot, w.Code)
		assert.Equal(t, "application/scim+json", w.Header().Get("Content-Type"))
		assert.JSONEq(t, `{"key":"value"}`, w.Body.String())
	})
}
