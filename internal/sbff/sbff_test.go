package sbff

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
)

func TestParseHeader(t *testing.T) {
	testCases := []struct {
		name      string
		headerVal string
		expAddr   string
		expErr    error
	}{
		{
			name:      "SingleAddressIPv4",
			headerVal: "192.168.1.100",
			expAddr:   "192.168.1.100",
			expErr:    nil,
		},

		{
			name:      "SingleAddressIPv6",
			headerVal: "2600:1000:cafe:bead::1",
			expAddr:   "2600:1000:cafe:bead::1",
			expErr:    nil,
		},
		{
			name:      "MultipleAddressIPv4",
			headerVal: "192.168.1.100,60.60.60.60",
			expAddr:   "192.168.1.100",
			expErr:    nil,
		},
		{
			name:      "MultipleAddressIPv4WithWhitespace",
			headerVal: "192.168.1.100    ,60.60.60.60",
			expAddr:   "192.168.1.100",
			expErr:    nil,
		},
		{
			name:      "HeaderInvalid",
			headerVal: "invalid, 60.60.60.60",
			expAddr:   "",
			expErr:    ErrHeaderInvalid,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			obsAddr, obsErr := parseSBFFHeader(tc.headerVal)
			require.Equal(t, tc.expAddr, obsAddr)
			require.ErrorIs(t, obsErr, tc.expErr)
		})
	}
}

func TestWithIPAddress(t *testing.T) {
	testCases := []struct {
		name      string
		headerVal string
		expAddr   string
		expErr    error
	}{
		{
			name:      "WithHeader",
			headerVal: "2600:cafe:bead::1",
			expAddr:   "2600:cafe:bead::1",
			expErr:    nil,
		},
		{
			name:      "HeaderNotFound",
			headerVal: "",
			expAddr:   "",
			expErr:    ErrHeaderNotFound,
		},
		{
			name:      "HeaderInvalid",
			headerVal: "invalid",
			expAddr:   "",
			expErr:    ErrHeaderInvalid,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "http://localhost/", nil)

			if tc.headerVal != "" {
				r.Header.Set(HeaderName, tc.headerVal)
			}

			obsReq, obsErr := withIPAddress(r)

			if tc.expErr == nil {
				require.NotNil(t, obsReq)

				obsAddr, ok := GetIPAddress(obsReq)
				require.Equal(t, tc.expAddr, obsAddr)
				require.Equal(t, true, ok)
			}

			require.ErrorIs(t, obsErr, tc.expErr)
		})
	}
}

func TestGetIPAddress(t *testing.T) {
	testCases := []struct {
		name string
		// ctxVal is any here because context.WithValue accepts any
		ctxVal   any
		expAddr  string
		expFound bool
	}{
		{
			name:     "WithAddress",
			ctxVal:   "2600:cafe:bead::1",
			expAddr:  "2600:cafe:bead::1",
			expFound: true,
		},
		{
			name:     "EmptyContext",
			ctxVal:   nil,
			expAddr:  "",
			expFound: false,
		},
		{
			name:     "NonStringValue",
			ctxVal:   1,
			expAddr:  "",
			expFound: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			originalReq := httptest.NewRequest(http.MethodGet, "http://localhost/", nil)

			var ctx context.Context

			if tc.ctxVal == nil {
				ctx = originalReq.Context()
			} else {
				ctx = context.WithValue(originalReq.Context(), ctxKeySBFF, tc.ctxVal)
			}

			r := originalReq.WithContext(ctx)

			obsAddr, obsFound := GetIPAddress(r)

			require.Equal(t, tc.expAddr, obsAddr)
			require.Equal(t, tc.expFound, obsFound)
		})
	}
}

func TestMiddleware(t *testing.T) {
	testCases := []struct {
		name        string
		sbffEnabled bool
		headerVal   string
		expAddr     string
		expFound    bool
		expErr      error
	}{
		{
			name:        "FlagDisabledHeaderEmpty",
			sbffEnabled: false,
			headerVal:   "",
			expAddr:     "",
			expFound:    false,
			expErr:      nil,
		},
		{
			name:        "FlagDisabledHeaderValid",
			sbffEnabled: false,
			headerVal:   "192.168.1.100",
			expAddr:     "",
			expFound:    false,
			expErr:      nil,
		},
		{
			name:        "FlagDisabledHeaderInvalid",
			sbffEnabled: false,
			headerVal:   "invalid",
			expAddr:     "",
			expFound:    false,
			expErr:      nil,
		},
		{
			name:        "FlagEnabledHeaderEmpty",
			sbffEnabled: true,
			headerVal:   "",
			expAddr:     "",
			expFound:    false,
			expErr:      nil,
		},
		{
			name:        "FlagEnabledHeaderValid",
			sbffEnabled: true,
			headerVal:   "192.168.1.100",
			expAddr:     "192.168.1.100",
			expFound:    true,
			expErr:      nil,
		},
		{
			name:        "FlagEnabledHeaderInvalid",
			sbffEnabled: true,
			headerVal:   "invalid",
			expAddr:     "",
			expFound:    false,
			expErr:      ErrHeaderInvalid,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "http://localhost/", nil)

			if tc.headerVal != "" {
				r.Header.Set(HeaderName, tc.headerVal)
			}

			var cfg conf.SecurityConfiguration

			var handler http.HandlerFunc = func(rw http.ResponseWriter, r *http.Request) {
				obsAddr, obsFound := GetIPAddress(r)
				require.Equal(t, tc.expAddr, obsAddr)
				require.Equal(t, tc.expFound, obsFound)
			}

			errCallback := func(r *http.Request, err error) {
				if tc.expErr == nil {
					t.Fatal("error callback called when expected error is nil")
				}

				require.ErrorIs(t, err, tc.expErr)
			}

			cfg.SbForwardedForEnabled = tc.sbffEnabled

			middlewareFn := Middleware(&cfg, errCallback)

			wrappedHandler := middlewareFn(handler)

			wrappedHandler.ServeHTTP(nil, r)
		})
	}
}
