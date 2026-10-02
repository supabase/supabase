package scim

import (
	"embed"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/scim/protocol"
	"github.com/supabase/auth/internal/conf"
)

//go:embed testdata/*
var fixtures embed.FS

func testFixture(t *testing.T, file string) string {
	data, err := fixtures.ReadFile("testdata/" + file)
	require.NoError(t, err)
	return string(data)
}

func newServerFor(externalURL string) *Server {
	return NewServer(&conf.GlobalConfiguration{
		API: conf.APIConfiguration{ExternalURL: externalURL},
	})
}

func TestServer(t *testing.T) {
	srv := newServerFor("http://localhost:9999")
	require.NotNil(t, srv)

	t.Run("NewServer trims a trailing slash from the external URL", func(t *testing.T) {
		location := newServerFor("https://auth.example.com/").serviceProviderConfig.Meta.Location

		require.Equal(t, "https://auth.example.com"+BasePath+"/ServiceProviderConfig", location)
	})

	t.Run("ServiceProviderConfig", func(t *testing.T) {
		r := httptest.NewRequest(http.MethodGet, BasePath+"/ServiceProviderConfig", nil)
		w := httptest.NewRecorder()

		require.NoError(t, srv.ServiceProviderConfig(w, r))

		require.Equal(t, http.StatusOK, w.Code)
		require.Equal(t, protocol.MediaType, w.Header().Get("Content-Type"))
		require.JSONEq(t, testFixture(t, "service_provider_config.json"), w.Body.String())
	})

	for _, tc := range []struct {
		path    string
		handler func(http.ResponseWriter, *http.Request) error
	}{
		{"ResourceTypes", srv.ResourceTypes},
		{"Schemas", srv.Schemas},
	} {
		t.Run(tc.path, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, BasePath+"/"+tc.path, nil)
			w := httptest.NewRecorder()

			require.NoError(t, tc.handler(w, r))

			require.Equal(t, http.StatusOK, w.Code)
			require.Equal(t, protocol.MediaType, w.Header().Get("Content-Type"))
			require.JSONEq(t, testFixture(t, "empty_list_response.json"), w.Body.String())
		})

		t.Run(tc.path+" rejects filter query parameter", func(t *testing.T) {
			filter := url.Values{"filter": {`name eq "User"`}}.Encode()
			r := httptest.NewRequest(http.MethodGet, BasePath+"/"+tc.path+"?"+filter, nil)
			w := httptest.NewRecorder()

			require.NoError(t, tc.handler(w, r))

			require.Equal(t, http.StatusForbidden, w.Code)
			require.JSONEq(t, testFixture(t, "filter_forbidden.json"), w.Body.String())
		})
	}

	t.Run("NotFound", func(t *testing.T) {
		r := httptest.NewRequest(http.MethodGet, BasePath+"/Unknown", nil)
		w := httptest.NewRecorder()

		require.NoError(t, srv.NotFound(w, r))

		require.Equal(t, http.StatusNotFound, w.Code)
		require.Equal(t, "application/scim+json", w.Header().Get("Content-Type"))
		require.JSONEq(t, testFixture(t, "not_found.json"), w.Body.String())
	})
}
