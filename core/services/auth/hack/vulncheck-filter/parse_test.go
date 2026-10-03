package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParse(t *testing.T) {
	join := func(s ...string) string {
		return strings.Join(s, "\n")
	}

	type test struct {
		name   string
		from   string
		exp    *Result
		errStr string
	}
	tests := []*test{
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: vuln01",
				"    details vuln01 line one",
				"    details vuln01 line two",
				"",
				"  details vuln01 continue after linebreak",
				"    vuln01 more01",
				"    vuln01 more02",
				"",
				"summary",
			),
			exp: &Result{
				Msg: "summary\n",
				Vulns: []*Vulnerability{
					{
						ID: "vuln01",
						Text: join(
							"    details vuln01 line one",
							"    details vuln01 line two",
							"",
							"  details vuln01 continue after linebreak",
							"    vuln01 more01",
							"    vuln01 more02",
							"",
						),
					},
				},
			},
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: vuln01",
				"    details vuln01 line one",
				"    details vuln01 line two",
				"",
				"  details vuln01 continue after linebreak",
				"    vuln01 more01",
				"    vuln01 more02",
				"",
				"Vulnerability #2: vuln02",
				"    details vuln02 line one",
				"    details vuln02 line two",
				"",
				"  details vuln02 continue after linebreak",
				"    vuln02 more01",
				"    vuln02 more02",
				"",
				"summary",
			),
			exp: &Result{
				Msg: "summary\n",
				Vulns: []*Vulnerability{
					{
						ID: "vuln01",
						Text: join(
							"    details vuln01 line one",
							"    details vuln01 line two",
							"",
							"  details vuln01 continue after linebreak",
							"    vuln01 more01",
							"    vuln01 more02",
							"",
						),
					},
					{
						ID: "vuln02",
						Text: join(
							"    details vuln02 line one",
							"    details vuln02 line two",
							"",
							"  details vuln02 continue after linebreak",
							"    vuln02 more01",
							"    vuln02 more02",
							"",
						),
					},
				},
			},
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: vuln01",
				"    details vuln01 line one",
				"    details vuln01 line two",
				"",
				"  details vuln01 continue after linebreak",
				"    vuln01 more01",
				"    vuln01 more02",
				"",
				"Vulnerability #2: vuln02",
				"    details vuln02 line one",
				"    details vuln02 line two",
				"  details vuln02 continue after linebreak",
				"    vuln02 more01",
				"    vuln02 more02",
				"",
				"summary",
			),
			exp: &Result{
				Msg: "summary\n",
				Vulns: []*Vulnerability{
					{
						ID: "vuln01",
						Text: join(
							"    details vuln01 line one",
							"    details vuln01 line two",
							"",
							"  details vuln01 continue after linebreak",
							"    vuln01 more01",
							"    vuln01 more02",
							"",
						),
					},
					{
						ID: "vuln02",
						Text: join(
							"    details vuln02 line one",
							"    details vuln02 line two",
							"  details vuln02 continue after linebreak",
							"    vuln02 more01",
							"    vuln02 more02",
							"",
						),
					},
				},
			},
		},

		{
			name: "basic success case",
			from: "No vulnerabilities found.\n",
			exp: &Result{
				Msg: "No vulnerabilities found.\n",
			},
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: summary01",
				"  details",
				"",
				"summary",
			),
			exp: &Result{
				Msg: "summary\n",
				Vulns: []*Vulnerability{
					{
						ID:   "summary01",
						Text: "  details\n",
					},
				},
			},
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: summary02",
				"  details",
				"",
				"summary\n\n",
			),
			exp: &Result{
				Msg: "summary\n\n",
				Vulns: []*Vulnerability{
					{
						ID:   "summary02",
						Text: "  details\n",
					},
				},
			},
		},

		{
			from: join(
				"No vulnerabilities found.",
				"",
				"",
			),
			errStr: "success followed by unexpected output",
		},
		{
			from: join(
				"No vulnerabilities found.",
				"",
				"unexpected output",
			),
			errStr: "success followed by unexpected output",
		},
		{
			name:   "empty",
			from:   "",
			errStr: `empty output`,
		},
		{
			name:   "space",
			from:   " ",
			errStr: `unexpected line`,
		},
		{
			name:   "space and newlines",
			from:   join(" ", " "),
			errStr: `unexpected line`,
		},
		{
			from:   "=== Symbol Results ===",
			errStr: `section was not followed by blank line`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
			),
			errStr: `section was not followed by blank line`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"",
			),
			errStr: `section contains no vulns`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: ",
			),
			errStr: `vuln header invalid`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 01",
			),
			errStr: `vuln "01" is malformed`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 02",
				"",
			),
			errStr: `vuln "02" is malformed`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 03",
				"",
				"\n",
			),
			errStr: `vuln "03" has empty details`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 04",
				"",
				"",
			),
			errStr: `vuln "04" has empty details`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 05",
				"",
				" ",
			),
			errStr: `vuln "05" has empty details`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 06",
				" ",
			),
			errStr: `vuln "06" has unexpected details: " "`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 07",
				"  ",
			),
			errStr: `vuln "07" is malformed`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 08",
				"  ",
			),
			errStr: `vuln "08" is malformed`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 09",
				"  a",
				"",
			),
			errStr: `vuln "09" is malformed`,
		},
		{
			from: join(
				"=== Symbol Results ===",
				"",
				"Vulnerability #1: 10",
				" aaa",
			),
			errStr: `vuln "10" has unexpected details`,
		},
		{
			name: "pass with vulns",
			from: loadTestdata(t, "fail-basic.txt"),
			exp: &Result{
				Msg: "Your code is affected by 2 vulnerabilities from 1 module and the Go standard library.\nThis scan also found 4 vulnerabilities in packages you import and 1\nvulnerability in modules you require, but your code doesn't appear to call these\nvulnerabilities.\nUse '-show verbose' for more details.\n",
				Vulns: []*Vulnerability{
					{
						ID:   "GO-2026-4986",
						Text: "    Quadratic string concatentation in consumeComment in net/mail\n  More info: https://pkg.go.dev/vuln/GO-2026-4986\n  Standard library\n    Found in: net/mail@go1.25.8\n    Fixed in: net/mail@go1.25.10\n    Example traces found:\n      #1: internal/mailer/validateclient/validateclient.go:259:30: validateclient.emailValidator.validateStatic calls mail.ParseAddress\n",
					},
					{
						ID:   "GO-2026-4982",
						Text: "    Bypass of meta content URL escaping causes XSS in html/template\n  More info: https://pkg.go.dev/vuln/GO-2026-4982\n  Standard library\n    Found in: html/template@go1.25.8\n    Fixed in: html/template@go1.25.10\n    Example traces found:\n      #1: internal/mailer/templatemailer/template.go:139:30: templatemailer.tplCacheEntry.execute calls template.Template.Execute\n      #2: internal/api/api.go:480:21: api.API.ServeHTTP calls http.HandlerFunc.ServeHTTP, which eventually calls template.Template.ExecuteTemplate\n",
					},
				},
			},
		},
		{
			name: "pass with 11 vulns",
			from: loadTestdata(t, "fail-11-vulns.txt"),
			exp: &Result{
				Msg: "Your code is affected by 11 vulnerabilities from 1 module and the Go standard library.\nThis scan also found 4 vulnerabilities in packages you import and 1\nvulnerability in modules you require, but your code doesn't appear to call these\nvulnerabilities.\nUse '-show verbose' for more details.\n",
				Vulns: []*Vulnerability{
					{
						ID:   "GO-2026-4986",
						Text: "    Quadratic string concatentation in consumeComment in net/mail\n  More info: https://pkg.go.dev/vuln/GO-2026-4986\n  Standard library\n    Found in: net/mail@go1.25.8\n    Fixed in: net/mail@go1.25.10\n    Example traces found:\n      #1: internal/mailer/validateclient/validateclient.go:259:30: validateclient.emailValidator.validateStatic calls mail.ParseAddress\n",
					},
					{
						ID:   "GO-2026-4982",
						Text: "    Bypass of meta content URL escaping causes XSS in html/template\n  More info: https://pkg.go.dev/vuln/GO-2026-4982\n  Standard library\n    Found in: html/template@go1.25.8\n    Fixed in: html/template@go1.25.10\n    Example traces found:\n      #1: internal/mailer/templatemailer/template.go:139:30: templatemailer.tplCacheEntry.execute calls template.Template.Execute\n      #2: internal/api/api.go:480:21: api.API.ServeHTTP calls http.HandlerFunc.ServeHTTP, which eventually calls template.Template.ExecuteTemplate\n",
					},
					{
						ID:   "GO-2026-4980",
						Text: "    Escaper bypass leads to XSS in html/template\n  More info: https://pkg.go.dev/vuln/GO-2026-4980\n  Standard library\n    Found in: html/template@go1.25.8\n    Fixed in: html/template@go1.25.10\n    Example traces found:\n      #1: internal/mailer/templatemailer/template.go:139:30: templatemailer.tplCacheEntry.execute calls template.Template.Execute\n      #2: internal/api/api.go:480:21: api.API.ServeHTTP calls http.HandlerFunc.ServeHTTP, which eventually calls template.Template.ExecuteTemplate\n",
					},
					{
						ID:   "GO-2026-4977",
						Text: "    Quadratic string concatenation in consumePhrase in net/mail\n  More info: https://pkg.go.dev/vuln/GO-2026-4977\n  Standard library\n    Found in: net/mail@go1.25.8\n    Fixed in: net/mail@go1.25.10\n    Example traces found:\n      #1: internal/mailer/validateclient/validateclient.go:259:30: validateclient.emailValidator.validateStatic calls mail.ParseAddress\n",
					},
					{
						ID:   "GO-2026-4971",
						Text: "    Panic in Dial and LookupPort when handling NUL byte on Windows in net\n  More info: https://pkg.go.dev/vuln/GO-2026-4971\n  Standard library\n    Found in: net@go1.25.8\n    Fixed in: net@go1.25.10\n    Example traces found:\n      #1: internal/mailer/mailmeclient/mailmeclient.go:83:28: mailmeclient.Client.Mail calls gomail.Dialer.DialAndSend, which eventually calls net.DialTimeout\n      #2: internal/storage/dial.go:214:23: storage.Connection.ApplyConfig calls sql.DB.SetMaxIdleConns, which eventually calls net.Dialer.Dial\n      #3: internal/indexworker/indexworker.go:62:19: indexworker.CreateIndexes calls pop.Connection.Open, which eventually calls net.Dialer.DialContext\n      #4: internal/observability/profiler.go:48:34: observability.ConfigureProfiler calls http.Server.ListenAndServe, which calls net.Listen\n      #5: cmd/serve_cmd.go:201:28: cmd.serve calls net.ListenConfig.Listen\n      #6: internal/utilities/url_validator.go:53:26: utilities.ValidateOAuthURL calls net.LookupIP\n      #7: internal/mailer/validateclient/validateclient.go:399:48: validateclient.emailValidator.validateHost calls net.Resolver.LookupHost\n      #8: internal/mailer/validateclient/validateclient.go:394:44: validateclient.emailValidator.validateHost calls net.Resolver.LookupMX\n",
					},
					{
						ID:   "GO-2026-4947",
						Text: "    Unexpected work during chain building in crypto/x509\n  More info: https://pkg.go.dev/vuln/GO-2026-4947\n  Standard library\n    Found in: crypto/x509@go1.25.8\n    Fixed in: crypto/x509@go1.25.9\n    Example traces found:\n      #1: internal/api/passkey_authentication.go:143:64: api.API.PasskeyAuthenticationVerify calls webauthn.WebAuthn.ValidatePasskeyLogin, which eventually calls x509.Certificate.Verify\n",
					},
					{
						ID:   "GO-2026-4946",
						Text: "    Inefficient policy validation in crypto/x509\n  More info: https://pkg.go.dev/vuln/GO-2026-4946\n  Standard library\n    Found in: crypto/x509@go1.25.8\n    Fixed in: crypto/x509@go1.25.9\n    Example traces found:\n      #1: internal/api/passkey_authentication.go:143:64: api.API.PasskeyAuthenticationVerify calls webauthn.WebAuthn.ValidatePasskeyLogin, which eventually calls x509.Certificate.Verify\n",
					},
					{
						ID:   "GO-2026-4918",
						Text: "    Infinite loop in HTTP/2 transport when given bad SETTINGS_MAX_FRAME_SIZE in\n    net/http/internal/http2 in golang.org/x/net\n  More info: https://pkg.go.dev/vuln/GO-2026-4918\n  Module: golang.org/x/net\n    Found in: golang.org/x/net@v0.52.0\n    Fixed in: golang.org/x/net@v0.53.0\n\n  Standard library\n    Found in: net/http@go1.25.8\n    Fixed in: net/http@go1.25.10\n    Example traces found:\n      #1: internal/utilities/url_validator.go:181:24: utilities.FetchURLWithTimeout calls http.Client.Do\n      #2: internal/api/provider/provider.go:167:24: provider.makeRequest calls http.Client.Get\n      #3: internal/tokens/service.go:976:38: tokens.validateTokenClaims calls gojsonschema.Validate, which eventually calls http.Get\n      #4: internal/e2e/e2ehooks/e2ehooks.go:39:3: e2ehooks.New calls httptest.Server.Close, which calls http.Transport.CloseIdleConnections\n      #5: internal/utilities/url_validator.go:204:25: utilities.ssrfProtectedTransport.RoundTrip calls http.Transport.RoundTrip\n",
					},
					{
						ID:   "GO-2026-4870",
						Text: "    Unauthenticated TLS 1.3 KeyUpdate record can cause persistent connection\n    retention and DoS in crypto/tls\n  More info: https://pkg.go.dev/vuln/GO-2026-4870\n  Standard library\n    Found in: crypto/tls@go1.25.8\n    Fixed in: crypto/tls@go1.25.9\n    Example traces found:\n      #1: internal/indexworker/indexworker.go:62:19: indexworker.CreateIndexes calls pop.Connection.Open, which eventually calls tls.Conn.Handshake\n      #2: internal/observability/profiler.go:48:34: observability.ConfigureProfiler calls http.Server.ListenAndServe, which eventually calls tls.Conn.HandshakeContext\n      #3: internal/godotenv/godotenv.go:32:19: godotenv.Parse calls io.Copy, which eventually calls tls.Conn.Read\n      #4: hack/vulncheck-filter/main.go:19:14: vulncheck.main calls fmt.Fprintf, which calls tls.Conn.Write\n      #5: internal/utilities/url_validator.go:204:25: utilities.ssrfProtectedTransport.RoundTrip calls http.Transport.RoundTrip, which eventually calls tls.Dialer.DialContext\n",
					},
					{
						ID:   "GO-2026-4865",
						Text: "    JsBraceDepth Context Tracking Bugs (XSS) in html/template\n  More info: https://pkg.go.dev/vuln/GO-2026-4865\n  Standard library\n    Found in: html/template@go1.25.8\n    Fixed in: html/template@go1.25.9\n    Example traces found:\n      #1: internal/tokens/service.go:212:64: tokens.Service.RefreshTokenGrant calls template.Error.Error\n      #2: client/admin/client.go:1192:50: admin.NewPutAdminUsersUserIdFactorsFactorIdRequestWithBody calls runtime.StyleParamWithLocation, which eventually calls template.HTMLEscaper\n      #3: internal/mailer/templatemailer/template.go:139:30: templatemailer.tplCacheEntry.execute calls template.Template.Execute\n      #4: internal/api/api.go:480:21: api.API.ServeHTTP calls http.HandlerFunc.ServeHTTP, which eventually calls template.Template.ExecuteTemplate\n      #5: internal/observability/metrics.go:164:16: observability.ConfigureMetrics calls sync.Once.Do, which eventually calls template.Template.Funcs\n      #6: internal/mailer/templatemailer/template.go:591:39: templatemailer.checkDefaults calls template.Template.Parse\n      #7: client/admin/client.go:1192:50: admin.NewPutAdminUsersUserIdFactorsFactorIdRequestWithBody calls runtime.StyleParamWithLocation, which eventually calls template.context.String\n",
					},
					{
						ID:   "GO-2026-4518",
						Text: "    Denial of service in github.com/jackc/pgproto3/v2\n  More info: https://pkg.go.dev/vuln/GO-2026-4518\n  Module: github.com/jackc/pgproto3/v2\n    Found in: github.com/jackc/pgproto3/v2@v2.3.3\n    Fixed in: N/A\n    Example traces found:\n      #1: internal/e2e/e2eapi/e2eapi.go:82:3: e2eapi.Instance.Close calls sql.noteUnusedDriverStatement, which eventually calls pgproto3.Frontend.Receive\n",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		name := tt.name
		if name == "" {
			name = tt.errStr
		}
		t.Run(name, func(t *testing.T) {
			rdr := strings.NewReader(tt.from)
			res, err := Parse(rdr)
			if tt.errStr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), tt.errStr)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, res)

			if tt.exp != nil {
				require.Equal(t, tt.exp, res)
			}
		})
	}
}

func loadTestdata(t testing.TB, name string) string {
	t.Helper()
	// Not a vulnerability, tests are _ALREADY_ rooted and this value
	// comes from a const.
	data, err := os.ReadFile(filepath.Join("testdata", name)) //#nosec G304
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}
