package hookshttp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/reloader"
)

type M = map[string]any

func TestDispatch(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	ah := reloader.NewAtomicHandler(nil)
	ts := httptest.NewServer(ah)
	defer ts.Close()

	type testCase struct {
		desc   string
		ctx    context.Context
		dr     *Dispatcher
		cfg    conf.ExtensibilityPointConfiguration
		hr     http.Handler
		req    any
		exp    any
		err    error
		errStr string
	}

	cases := []testCase{

		{
			desc: "pass - basic success",
			req: M{
				"user": M{
					"ID": uuid.Must(uuid.NewV4()),
				},
			},
			exp: M{"success": true},
			hr: &mockHandler{
				status: http.StatusOK,
				ctype:  "application/json",
				data:   M{"success": true},
			},
		},

		{
			desc: "pass - empty content type should not error 204 status",
			exp:  M{},
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", "")
				w.WriteHeader(http.StatusNoContent)
			}),
		},

		{
			desc:   "fail - invalid input",
			req:    make(chan int),
			errStr: "500: Error marshaling JSON input.",
		},

		{
			desc: "fail - invalid format in secret",
			cfg: conf.ExtensibilityPointConfiguration{
				HTTPHookSecrets: conf.HTTPHookSecrets{
					"invalid",
				},
			},
			errStr: "invalid signature format",
		},

		{
			desc: "fail - invalid base64 in secret",
			cfg: conf.ExtensibilityPointConfiguration{
				HTTPHookSecrets: conf.HTTPHookSecrets{
					"v1,aaaaaaaaaa",
				},
			},
			errStr: "unable to create webhook, err: illegal base64 dat",
		},

		{
			desc: "fail - unable to make request object",
			cfg: conf.ExtensibilityPointConfiguration{
				URI: string([]byte{0}),
			},
			errStr: "Hook failed to make request object",
		},

		{
			desc:   "fail - ctx timeout",
			dr:     New(WithTimeout(1)),
			errStr: "422: Failed to reach hook within maximum time",
		},

		{
			desc: "fail - net timeout",
			cfg: conf.ExtensibilityPointConfiguration{
				URI: "http://0.0.0.0:8000",
			},
			errStr: "422: Failed to reach hook after maximum retries",
		},

		{
			desc: "fail - net timeout > ctx timeout",
			dr: New(
				WithTimeout(time.Second/10),
				WithBackoff(time.Minute),
			),
			cfg: conf.ExtensibilityPointConfiguration{
				URI: "http://0.0.0.0:8000",
			},
			errStr: "422: Failed to reach hook within maximum time of 0.100000 seconds",
		},

		{
			desc:   "fail - retry after header pushes to fallback",
			errStr: "Service currently unavailable due to hook",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("retry-after", "not-read")
				w.WriteHeader(http.StatusTooManyRequests)
			}),
		},

		{
			desc:   "fail - empty content type",
			errStr: "Invalid Content-Type: Missing Content-Type header",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", "")
				w.WriteHeader(http.StatusOK)
			}),
		},

		{
			desc:   "fail - malformed content type",
			errStr: "400: Invalid Content-Type header: mime: no media type",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", ";/")
				w.WriteHeader(http.StatusOK)
			}),
		},

		{
			desc:   "fail - content type is not application/json",
			errStr: "400: Invalid JSON response. Received content-type: app/js",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", "app/js")
				w.WriteHeader(http.StatusOK)
			}),
		},

		{
			desc: "fail - limit reader exceeeded",
			dr: New(
				WithResponseLimit(1),
			),
			errStr: "422: Payload size exceeded size limit of 1 bytes",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write(bytes.Repeat([]byte("a"), 1024*64))
			}),
		},

		{
			desc:   "fail - unmarshal error",
			dr:     New(),
			errStr: "500: Error unmarshaling JSON output.",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				io.WriteString(w, "12345")
			}),
		},

		{
			desc:   "fail - returning error objects",
			errStr: "500: failed to verify ip addres",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)

				io.WriteString(w, `{"error": {"message": "failed to verify ip addres"}}`)
			}),
		},

		{
			desc:   "fail - returning error objects with status",
			errStr: "400: failed to verify ip addres",
			hr: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Add("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)

				io.WriteString(w, `{"error": {"message": "failed to verify ip addres", "http_code": 400}}`)
			}),
		},
	}

	// error status codes
	{
		addCase := func(statusIn, statusOut int, msg string) {
			cases = append(cases, testCase{
				desc: fmt.Sprintf("fail - invalid status code %d", statusIn),
				req:  M{"empty": true},
				err: &apierrors.HTTPError{
					HTTPStatus: statusOut,
					ErrorCode:  apierrors.ErrorCodeUnexpectedFailure,
					Message:    msg,
				},
				hr: &mockHandler{
					status: statusIn,
					ctype:  "application/json",
					data: M{
						"error": M{
							// This is not propagated in current implementation
							"http_code": 500,
							"message":   "sentinel error",
						},
					},
				},
			})
		}
		addCase(
			http.StatusServiceUnavailable,
			http.StatusInternalServerError,
			"Service currently unavailable due to hook",
		)
		addCase(
			http.StatusTooManyRequests,
			http.StatusInternalServerError,
			"Service currently unavailable due to hook",
		)
		addCase(
			http.StatusBadRequest,
			http.StatusInternalServerError,
			"Invalid payload sent to hook",
		)
		addCase(
			http.StatusUnauthorized,
			http.StatusInternalServerError,
			"Hook requires authorization token",
		)
		addCase(
			http.StatusTeapot,
			http.StatusInternalServerError,
			"Unexpected status code returned from hook: 418",
		)
	}

	for _, tc := range cases {
		t.Run(tc.desc, func(t *testing.T) {

			testCtx := tc.ctx
			if testCtx == nil {
				testCtx = ctx
			}

			dr := tc.dr
			if dr == nil {
				dr = New(
					WithTimeout(time.Second/10),
					WithRetries(3),
					WithBackoff(time.Second/50),
				)
			}

			hr := tc.hr
			if hr == nil {
				hr = &mockHandler{}
			}
			ah.Store(hr)

			cfg := tc.cfg
			if cfg.URI == "" {
				cfg.URI = ts.URL
			}

			res := M{}
			err := dr.Dispatch(testCtx, &cfg, tc.req, &res)
			if tc.err != nil {
				require.Error(t, err)
				require.Equal(t, tc.err, err)
				return
			}
			if tc.errStr != "" {
				require.Error(t, err)
				require.Contains(t, err.Error(), tc.errStr)
				return
			}
			require.NoError(t, err)
			require.Equal(t, tc.exp, res)
		})
	}
}

type mockHandler struct {
	status int
	ctype  string
	data   any
}

func (o *mockHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if o.ctype != "" {
		w.Header().Set("content-type", o.ctype)
	}
	if o.status > 0 {
		w.WriteHeader(o.status)
	}

	err := json.NewEncoder(w).Encode(o.data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
