package shared

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJSON(t *testing.T) {
	t.Run("Defaults to JSON", func(t *testing.T) {
		w := httptest.NewRecorder()

		json := JSON(w)
		require.NotNil(t, json)
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
	})

	t.Run("Adds a Header", func(t *testing.T) {
		w := httptest.NewRecorder()

		json := JSON(w).Header("X-Request-ID", "1")
		require.NotNil(t, json)
		assert.Equal(t, "1", w.Header().Get("X-Request-ID"))
	})

	t.Run("Uses a custom Content-Type", func(t *testing.T) {
		w := httptest.NewRecorder()

		json := JSON(w).ContentType("application/scim+json")
		require.NotNil(t, json)
		assert.Equal(t, "application/scim+json", w.Header().Get("Content-Type"))
	})

	t.Run("Writes data to the response body", func(t *testing.T) {
		w := httptest.NewRecorder()
		b := []byte("hello, world")

		err := JSON(w).Write(b)
		require.NoError(t, err)
		assert.Equal(t, "hello, world", w.Body.String())
	})

	t.Run("Serializes a type to JSON", func(t *testing.T) {
		w := httptest.NewRecorder()
		type person struct {
			Name string `json:"name"`
		}

		err := JSON(w).Send(&person{Name: "gilfoyle"})
		require.NoError(t, err)
		assert.Equal(t, `{"name":"gilfoyle"}`, w.Body.String())
	})
}
