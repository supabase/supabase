package e2eapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/iotest"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api"
	"github.com/supabase/auth/internal/e2e"
	"github.com/supabase/auth/internal/models"
)

func TestInstance(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*4)
	defer cancel()

	t.Run("New", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			globalCfg := e2e.Must(e2e.Config())
			inst, err := New(globalCfg)
			require.NoError(t, err)
			defer inst.Close()

			email := "e2eapitest_" + uuid.Must(uuid.NewV4()).String() + "@localhost"
			req := &api.SignupParams{
				Email:    email,
				Password: "password",
			}
			res := new(models.User)
			err = Do(ctx, http.MethodPost, inst.APIServer.URL+"/signup", req, res)
			require.NoError(t, err)
			require.Equal(t, email, res.Email.String())
		})

		t.Run("DoAdmin", func(t *testing.T) {
			globalCfg := e2e.Must(e2e.Config())
			inst, err := New(globalCfg)
			require.NoError(t, err)
			defer inst.Close()

			email := "e2eapitest_" + uuid.Must(uuid.NewV4()).String() + "@localhost"
			req := &api.InviteParams{
				Email: email,
			}
			res := new(models.User)

			body := new(bytes.Buffer)
			err = json.NewEncoder(body).Encode(req)
			require.NoError(t, err)

			httpReq, err := http.NewRequestWithContext(
				ctx, "POST", "/invite", body)
			require.NoError(t, err)

			httpRes, err := inst.DoAdmin(httpReq)
			require.NoError(t, err)

			err = json.NewDecoder(httpRes.Body).Decode(res)
			require.NoError(t, err)
			require.Equal(t, email, res.Email.String())
		})

		t.Run("DoAdminFailure", func(t *testing.T) {
			globalCfg := e2e.Must(e2e.Config())
			inst, err := New(globalCfg)
			require.NoError(t, err)
			defer inst.Close()

			httpReq, err := http.NewRequestWithContext(
				ctx, "POST", "/invite", nil)
			require.NoError(t, err)

			httpRes, err := inst.doAdmin(httpReq, new(int))
			require.Error(t, err)
			require.Nil(t, httpRes)

		})

		t.Run("Failure", func(t *testing.T) {
			globalCfg := e2e.Must(e2e.Config())
			globalCfg.DB.Driver = ""
			globalCfg.DB.URL = "invalid"

			inst, err := New(globalCfg)
			require.Error(t, err)
			require.Nil(t, inst)
		})

		t.Run("InitURLFailure", func(t *testing.T) {
			globalCfg := e2e.Must(e2e.Config())
			inst, err := New(globalCfg)
			require.NoError(t, err)
			defer inst.Close()

			inst.APIServer.URL = "\x01"
			err = inst.initURL()
			require.Error(t, err)
		})
	})
}

func TestDo(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	globalCfg := e2e.Must(e2e.Config())
	inst, err := New(globalCfg)
	require.NoError(t, err)
	defer inst.Close()

	// Covers calls to Do with a `req` param type which can't marshaled
	t.Run("InvalidRequestType", func(t *testing.T) {
		req := make(chan string)
		err := Do(ctx, http.MethodPost, "http://localhost", &req, nil)
		require.Error(t, err)
		require.ErrorContains(t, err, "json: unsupported type: chan string")
	})

	// Covers calls to Do with a `res` param type which can't marshaled
	t.Run("InvalidResponseType", func(t *testing.T) {
		res := make(chan string)
		err := Do(ctx, http.MethodGet, inst.APIServer.URL+"/settings", nil, &res)
		require.Error(t, err)
		require.ErrorContains(t, err, "json: cannot unmarshal object into Go value of type chan string")
	})

	// Covers status code >= 400 error handling switch statement
	t.Run("api.HTTPErrorResponse_to_apierrors.HTTPError", func(t *testing.T) {
		res := make(chan string)
		err := Do(ctx, http.MethodGet, inst.APIServer.URL+"/user", nil, &res)
		require.Error(t, err)
		require.ErrorContains(t, err, "401: This endpoint requires a valid Bearer token")
	})

	// Covers http.NewRequestWithContext
	t.Run("InvalidHTTPMethod", func(t *testing.T) {
		err := Do(ctx, "\x01", "http://localhost", nil, nil)
		require.Error(t, err)
		require.ErrorContains(t, err, "net/http: invalid method")
	})

	// Covers status code >= 400 error handling switch statement json.Unmarshal
	// by hitting the default error handler that returns html
	t.Run("InvalidResponse", func(t *testing.T) {
		err := Do(ctx, http.MethodGet, inst.APIServer.URL+"/404", nil, nil)
		require.Error(t, err)
		require.ErrorContains(t, err, "invalid character")
	})

	// Covers defaultClient.Do failure
	t.Run("InvalidURL", func(t *testing.T) {
		err := Do(ctx, http.MethodPost, "invalid", nil, nil)
		require.Error(t, err)
		require.ErrorContains(t, err, "unsupported protocol")
	})

	// Covers http.StatusNoContent handling
	t.Run("InvalidRequestType", func(t *testing.T) {
		hr := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		})

		ts := httptest.NewServer(hr)
		defer ts.Close()

		err := Do(ctx, http.MethodPost, ts.URL, nil, nil)
		require.NoError(t, err)
	})

	// Covers IO errors
	t.Run("IOError", func(t *testing.T) {

		for _, statusCode := range []int{http.StatusBadRequest, http.StatusOK} {

			// Covers IO errors for the sc >= 400 and default status code
			// handling in the switch statement within do.
			testName := fmt.Sprintf("Status=%v", http.StatusText(statusCode))
			t.Run(testName, func(t *testing.T) {

				// We assign a sentinel error to ensure propagation.
				sentinel := errors.New("sentinel")

				// This implementation of the http.RoundTripper is a way to
				// cover the io.ReadAll(io.LimitReader(...)) lines in the switch
				// statements inside do().
				rtFn := roundTripperFunc(func(req *http.Request) (*http.Response, error) {

					// Call the default http.RoundTripper implementation provided
					// by the http.Default client to build a valid http.Response.
					res, err := http.DefaultClient.Do(req)
					if err != nil {
						return nil, err
					}

					// Wrap the res.Body in an io.ErrReader using our sentinel
					// error. This causes the first call to read the response
					// body to return our sentinel error.
					res.Body = io.NopCloser(iotest.ErrReader(sentinel))
					return res, nil
				})

				// We need to swap the defaultClient with a new client which has
				// the (*Client).Transport set to our http.RoundTripper above.
				prev := defaultClient
				defer func() {
					defaultClient = prev
				}()
				defaultClient = new(http.Client)
				defaultClient.Transport = rtFn

				hr := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(statusCode)
				})

				ts := httptest.NewServer(hr)
				defer ts.Close()

				// We send the request and expect back our sentinel error.
				err := Do(ctx, http.MethodPost, ts.URL, nil, nil)
				require.Error(t, err)
				require.Equal(t, sentinel, err)
			})
		}
	})
}

// roundTripperFunc is like http.HandlerFunc for a http.RoundTripper
type roundTripperFunc func(*http.Request) (*http.Response, error)

// RoundTrip implements http.RoundTripper by calling itself.
func (f roundTripperFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}
