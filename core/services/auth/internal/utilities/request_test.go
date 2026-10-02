package utilities

import (
	"net/http"
	"net/http/httptest"
	tst "testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/sbff"
)

func TestIsRedirectURLValidSameOrigin(t *tst.T) {
	cases := []struct {
		desc        string
		siteURL     string
		redirectURL string
		want        bool
	}{
		{
			desc:        "exact match",
			siteURL:     "https://example.com",
			redirectURL: "https://example.com/path",
			want:        true,
		},
		{
			desc:        "scheme downgrade https→http rejected",
			siteURL:     "https://example.com",
			redirectURL: "http://example.com/path",
			want:        false,
		},
		{
			desc:        "scheme upgrade http→https rejected",
			siteURL:     "http://example.com",
			redirectURL: "https://example.com/path",
			want:        false,
		},
		{
			desc:        "different port rejected",
			siteURL:     "https://example.com",
			redirectURL: "https://example.com:8443/path",
			want:        false,
		},
		{
			desc:        "explicit port matches SiteURL explicit port",
			siteURL:     "https://example.com:9000",
			redirectURL: "https://example.com:9000/path",
			want:        true,
		},
		{
			desc:        "no port vs explicit port rejected",
			siteURL:     "https://example.com:9000",
			redirectURL: "https://example.com/path",
			want:        false,
		},
		{
			desc:        "different explicit ports rejected",
			siteURL:     "https://example.com:9000",
			redirectURL: "https://example.com:9001/path",
			want:        false,
		},
		// RFC 8252 Section 7.3: variable ports must be allowed for localhost
		{
			desc:        "localhost with different port allowed (RFC 8252 Section 7.3)",
			siteURL:     "http://localhost:3000",
			redirectURL: "http://localhost:8080/callback",
			want:        true,
		},
		{
			desc:        "127.0.0.1 with different port allowed (RFC 8252 Section 7.3)",
			siteURL:     "http://127.0.0.1:3000",
			redirectURL: "http://127.0.0.1:8080/callback",
			want:        true,
		},
		{
			desc:        "localhost without port in redirect allowed (RFC 8252 Section 7.3)",
			siteURL:     "http://localhost:3000",
			redirectURL: "http://localhost/callback",
			want:        true,
		},
		{
			desc:        "localhost scheme downgrade still rejected despite RFC 8252",
			siteURL:     "https://localhost:3000",
			redirectURL: "http://localhost:8080/callback",
			want:        false,
		},
		{
			desc:        "non-localhost variable port still rejected",
			siteURL:     "https://example.com:9000",
			redirectURL: "https://example.com:9001/path",
			want:        false,
		},
	}

	for _, c := range cases {
		t.Run(c.desc, func(t *tst.T) {
			config := conf.GlobalConfiguration{
				SiteURL: c.siteURL,
				JWT:     conf.JWTConfiguration{Secret: "testsecret"},
			}
			require.NoError(t, config.ApplyDefaults())
			require.Equal(t, c.want, IsRedirectURLValid(&config, c.redirectURL))
		})
	}
}

func TestGetIPAddressWithSBFF(t *tst.T) {
	testCases := []struct {
		name       string
		remoteAddr string
		headerVal  string
		expAddr    string
	}{
		{
			name:       "ValidSBFF",
			remoteAddr: "60.60.60.60",
			headerVal:  "192.168.1.100",
			expAddr:    "192.168.1.100",
		},
		{
			name:       "MissingSBFF",
			remoteAddr: "60.60.60.60",
			headerVal:  "",
			expAddr:    "60.60.60.60",
		},
		{
			name:       "InvalidSBFF",
			remoteAddr: "60.60.60.60",
			headerVal:  "invalid",
			expAddr:    "60.60.60.60",
		},
	}

	config := conf.SecurityConfiguration{
		SbForwardedForEnabled: true,
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *tst.T) {
			var handler http.HandlerFunc = func(rw http.ResponseWriter, r *http.Request) {
				obsAddr := GetIPAddress(r)
				require.Equal(t, tc.expAddr, obsAddr)
			}

			errCallback := func(r *http.Request, err error) {
			}

			middleware := sbff.Middleware(&config, errCallback)

			wrappedHandler := middleware(handler)

			r := httptest.NewRequest(http.MethodGet, "http://localhost/", nil)

			r.RemoteAddr = tc.remoteAddr

			if tc.headerVal != "" {
				r.Header.Set(sbff.HeaderName, tc.headerVal)
			}

			wrappedHandler.ServeHTTP(nil, r)
		})

	}
}

func TestGetIPAddressWithXFF(t *tst.T) {
	examples := []func(r *http.Request) string{
		func(r *http.Request) string {
			r.Header = nil
			r.RemoteAddr = "127.0.0.1:8080"

			return "127.0.0.1"
		},

		func(r *http.Request) string {
			r.Header = nil
			r.RemoteAddr = "incorrect"

			return "incorrect"
		},

		func(r *http.Request) string {
			r.Header = make(http.Header)
			r.RemoteAddr = "127.0.0.1:8080"

			return "127.0.0.1"
		},

		func(r *http.Request) string {
			r.Header = make(http.Header)
			r.RemoteAddr = "[::1]:8080"

			return "::1"
		},

		func(r *http.Request) string {
			r.Header = make(http.Header)
			r.RemoteAddr = "127.0.0.1:8080"
			r.Header.Add("X-Forwarded-For", "127.0.0.2")

			return "127.0.0.2"
		},

		func(r *http.Request) string {
			r.Header = make(http.Header)
			r.RemoteAddr = "127.0.0.1:8080"
			r.Header.Add("X-Forwarded-For", "127.0.0.2")

			return "127.0.0.2"
		},

		func(r *http.Request) string {
			r.Header = make(http.Header)
			r.RemoteAddr = "127.0.0.1:8080"
			r.Header.Add("X-Forwarded-For", "127.0.0.2,")

			return "127.0.0.2"
		},

		func(r *http.Request) string {
			r.Header = make(http.Header)
			r.RemoteAddr = "127.0.0.1:8080"
			r.Header.Add("X-Forwarded-For", "127.0.0.2,127.0.0.3")

			return "127.0.0.2"
		},

		func(r *http.Request) string {
			r.Header = make(http.Header)
			r.RemoteAddr = "127.0.0.1:8080"
			r.Header.Add("X-Forwarded-For", "::1,127.0.0.2")

			return "::1"
		},
	}

	for _, example := range examples {
		req := &http.Request{}
		expected := example(req)

		require.Equal(t, GetIPAddress(req), expected)
	}
}

func TestGetReferrer(t *tst.T) {
	config := conf.GlobalConfiguration{
		SiteURL:      "https://example.com",
		URIAllowList: []string{"http://localhost:8000/*", "http://*.localhost:8000/*", "http://*:12345/*", "http://**:12345/*"},
		JWT: conf.JWTConfiguration{
			Secret: "testsecret",
		},
	}
	require.NoError(t, config.ApplyDefaults())
	cases := []struct {
		desc        string
		redirectURL string
		expected    string
	}{
		{
			desc:        "valid redirect url",
			redirectURL: "http://localhost:8000/path",
			expected:    "http://localhost:8000/path",
		},
		{
			desc:        "invalid redirect url",
			redirectURL: "http://localhost:3000",
			expected:    config.SiteURL,
		},
		{
			desc:        "no / separator",
			redirectURL: "http://localhost:8000",
			expected:    config.SiteURL,
		},
		{
			desc:        "* respects separator",
			redirectURL: "http://localhost:8000/path/to/page",
			expected:    config.SiteURL,
		},
		{
			desc:        "* respects parameters",
			redirectURL: "http://localhost:8000/path?param=1",
			expected:    "http://localhost:8000/path?param=1",
		},
		{
			desc:        "invalid redirect url due to decimal IP address",
			redirectURL: "http://123?.localhost:8000/path",
			expected:    config.SiteURL,
		},
		{
			desc:        "invalid redirect url due to IPv4 address",
			redirectURL: "http://123.123.123.123?localhost:8000/path",
			expected:    config.SiteURL,
		},
		{
			desc:        "invalid redirect url due to IPv6 address",
			redirectURL: "http://[65e7:9410:d8b6:e227:58cd:e55b:8fc0:206d]?localhost:8000/path",
			expected:    config.SiteURL,
		},
		{
			desc:        "invalid redirect url due to bad URL",
			redirectURL: "http://65e7:9410:d8b6:e227:58cd:e55b:8fc0:206d?localhost:8000/path",
			expected:    config.SiteURL,
		},
		{
			desc:        "valid loopback IPv4 address",
			redirectURL: "http://127.0.0.1:12345/path",
			expected:    "http://127.0.0.1:12345/path",
		},
		{
			desc:        "valid loopback IPv6 address",
			redirectURL: "http://[0:0:0:0:0:0:0:1]:12345/path",
			expected:    "http://[0:0:0:0:0:0:0:1]:12345/path",
		},
		{
			desc:        "same origin allowed",
			redirectURL: "https://example.com/dashboard",
			expected:    "https://example.com/dashboard",
		},
		{
			desc:        "same hostname but http scheme rejected (scheme downgrade)",
			redirectURL: "http://example.com/dashboard",
			expected:    config.SiteURL,
		},
		{
			desc:        "same hostname and scheme but explicit non-default port rejected",
			redirectURL: "https://example.com:8443/dashboard",
			expected:    config.SiteURL,
		},
	}

	for _, c := range cases {
		t.Run(c.desc, func(t *tst.T) {
			r := httptest.NewRequest("GET", "http://localhost?redirect_to="+c.redirectURL, nil)
			referrer := GetReferrer(r, &config)
			require.Equal(t, c.expected, referrer)
		})
	}
}
