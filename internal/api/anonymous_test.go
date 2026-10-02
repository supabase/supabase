package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofrs/uuid"
	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	mail "github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
)

type AnonymousTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestAnonymous(t *testing.T) {
	cb := func(cfg *conf.GlobalConfiguration, _ *storage.Connection) {
		if cfg != nil {
			cfg.RateLimitAnonymousUsers = 5
		}
	}

	api, config, err := setupAPIForTestWithCallback(cb)
	require.NoError(t, err)
	ts := &AnonymousTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *AnonymousTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	// Create anonymous user
	params := &SignupParams{
		Aud:      ts.Config.JWT.Aud,
		Provider: "anonymous",
	}
	u, err := params.ToUserModel(false)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new anonymous test user")
}

func (ts *AnonymousTestSuite) TestAnonymousLogins() {
	ts.Config.External.AnonymousUsers.Enabled = true
	// Request body
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"data": map[string]interface{}{
			"field": "foo",
		},
	}))

	req := httptest.NewRequest(http.MethodPost, "/signup", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	assert.NotEmpty(ts.T(), data.User.ID)
	assert.Equal(ts.T(), ts.Config.JWT.Aud, data.User.Aud)
	assert.Empty(ts.T(), data.User.GetEmail())
	assert.Empty(ts.T(), data.User.GetPhone())
	assert.True(ts.T(), data.User.IsAnonymous)
	assert.Equal(ts.T(), models.JSONMap(models.JSONMap{"field": "foo"}), data.User.UserMetaData)
}

func (ts *AnonymousTestSuite) TestConvertAnonymousUserToPermanent() {
	ts.Config.External.AnonymousUsers.Enabled = true
	ts.Config.Sms.TestOTP = map[string]string{"1234567890": "000000", "1234560000": "000000"}
	// test OTPs still require setting up an sms provider
	ts.Config.Sms.Provider = "twilio"
	ts.Config.Sms.Twilio.AccountSid = "fake-sid"
	ts.Config.Sms.Twilio.AuthToken = "fake-token"
	ts.Config.Sms.Twilio.MessageServiceSid = "fake-message-service-sid"

	cases := []struct {
		desc             string
		body             map[string]interface{}
		verificationType string
	}{
		{
			desc: "convert anonymous user to permanent user with email",
			body: map[string]interface{}{
				"email": "test@example.com",
			},
			verificationType: "email_change",
		},
		{
			desc: "convert anonymous user to permanent user with phone",
			body: map[string]interface{}{
				"phone": "1234567890",
			},
			verificationType: "phone_change",
		},
		{
			desc: "convert anonymous user to permanent user with email & password",
			body: map[string]interface{}{
				"email":    "test2@example.com",
				"password": "test-password",
			},
			verificationType: "email_change",
		},
		{
			desc: "convert anonymous user to permanent user with phone & password",
			body: map[string]interface{}{
				"phone":    "1234560000",
				"password": "test-password",
			},
			verificationType: "phone_change",
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			// Request body
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{}))

			req := httptest.NewRequest(http.MethodPost, "/signup", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()

			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			signupResponse := &AccessTokenResponse{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&signupResponse))

			// Add email to anonymous user
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.body))

			req = httptest.NewRequest(http.MethodPut, "/user", &buffer)
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", signupResponse.Token))

			w = httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			// Check if anonymous user is still anonymous
			user, err := models.FindUserByID(ts.API.db, signupResponse.User.ID)
			require.NoError(ts.T(), err)
			require.NotEmpty(ts.T(), user)
			require.True(ts.T(), user.IsAnonymous)

			// Check if user has a password set
			if c.body["password"] != nil {
				require.True(ts.T(), user.HasPassword())
			}

			switch c.verificationType {
			case mail.EmailChangeVerification:
				require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
					"token_hash": user.EmailChangeTokenNew,
					"type":       c.verificationType,
				}))
			case phoneChangeVerification:
				require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
					"phone": user.PhoneChange,
					"token": "000000",
					"type":  c.verificationType,
				}))
			}

			req = httptest.NewRequest(http.MethodPost, "/verify", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w = httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			data := &AccessTokenResponse{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

			// User is a permanent user and not anonymous anymore
			assert.Equal(ts.T(), signupResponse.User.ID, data.User.ID)
			assert.Equal(ts.T(), ts.Config.JWT.Aud, data.User.Aud)
			assert.False(ts.T(), data.User.IsAnonymous)

			// User should have an identity
			assert.Len(ts.T(), data.User.Identities, 1)

			switch c.verificationType {
			case mail.EmailChangeVerification:
				assert.Equal(ts.T(), c.body["email"], data.User.GetEmail())
				assert.Equal(ts.T(), models.JSONMap(models.JSONMap{"provider": "email", "providers": []interface{}{"email"}}), data.User.AppMetaData)
				assert.NotEmpty(ts.T(), data.User.EmailConfirmedAt)
			case phoneChangeVerification:
				assert.Equal(ts.T(), c.body["phone"], data.User.GetPhone())
				assert.Equal(ts.T(), models.JSONMap(models.JSONMap{"provider": "phone", "providers": []interface{}{"phone"}}), data.User.AppMetaData)
				assert.NotEmpty(ts.T(), data.User.PhoneConfirmedAt)
			}
		})
	}
}

func (ts *AnonymousTestSuite) TestRateLimitAnonymousSignups() {
	var buffer bytes.Buffer
	ts.Config.External.AnonymousUsers.Enabled = true

	// It rate limits after 30 requests
	for i := 0; i < int(ts.Config.RateLimitAnonymousUsers); i++ {
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{}))
		req := httptest.NewRequest(http.MethodPost, "http://localhost/signup", &buffer)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("My-Custom-Header", "1.2.3.4")
		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)
		assert.Equal(ts.T(), http.StatusOK, w.Code)
	}

	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{}))
	req := httptest.NewRequest(http.MethodPost, "http://localhost/signup", &buffer)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("My-Custom-Header", "1.2.3.4")
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusTooManyRequests, w.Code)

	// It ignores X-Forwarded-For by default
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{}))
	req.Header.Set("X-Forwarded-For", "1.1.1.1")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusTooManyRequests, w.Code)

	// It doesn't rate limit a new value for the limited header
	req.Header.Set("My-Custom-Header", "5.6.7.8")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
}

func (ts *AnonymousTestSuite) TestAdminUpdateAnonymousUser() {
	claims := &AccessTokenClaims{
		Role: "supabase_admin",
	}
	adminJwt, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err)

	u1, err := models.NewUser("", "", "", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	u1.IsAnonymous = true
	require.NoError(ts.T(), ts.API.db.Create(u1))

	u2, err := models.NewUser("", "", "", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	u2.IsAnonymous = true
	require.NoError(ts.T(), ts.API.db.Create(u2))

	cases := []struct {
		desc               string
		userId             uuid.UUID
		body               map[string]interface{}
		expected           map[string]interface{}
		expectedIdentities int
	}{
		{
			desc:   "update anonymous user with email and email confirm true",
			userId: u1.ID,
			body: map[string]interface{}{
				"email":         "foo@example.com",
				"email_confirm": true,
			},
			expected: map[string]interface{}{
				"email":        "foo@example.com",
				"is_anonymous": false,
			},
			expectedIdentities: 1,
		},
		{
			desc:   "update anonymous user with email and email confirm false",
			userId: u2.ID,
			body: map[string]interface{}{
				"email":         "bar@example.com",
				"email_confirm": false,
			},
			expected: map[string]interface{}{
				"email":        "bar@example.com",
				"is_anonymous": true,
			},
			expectedIdentities: 1,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			// Request body
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.body))

			req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/admin/users/%s", c.userId), &buffer)
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", adminJwt))

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			var data models.User
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

			require.NotNil(ts.T(), data)
			require.Len(ts.T(), data.Identities, c.expectedIdentities)

			actual := map[string]interface{}{
				"email":        data.GetEmail(),
				"is_anonymous": data.IsAnonymous,
			}

			require.Equal(ts.T(), c.expected, actual)
		})
	}
}
