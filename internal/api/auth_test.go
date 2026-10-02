package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	jwt "github.com/golang-jwt/jwt/v5"
	jwk "github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

type AuthTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestAuth(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &AuthTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()
	suite.Run(t, ts)
}

func (ts *AuthTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	// Create user
	u, err := models.NewUser("", "test@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")
}

func (ts *AuthTestSuite) TestExtractBearerToken() {
	userClaims := &AccessTokenClaims{
		Role: "authenticated",
	}
	userJwt, err := jwt.NewWithClaims(jwt.SigningMethodHS256, userClaims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err)
	req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
	req.Header.Set("Authorization", "Bearer "+userJwt)

	token, err := ts.API.extractBearerToken(req)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), userJwt, token)
}

// TestExtractBearerTokenCaseInsensitive verifies that the Bearer scheme
// is matched case-insensitively per RFC 7235 §2.1.
func TestExtractBearerTokenCaseInsensitive(t *testing.T) {
	a := &API{}
	token := "TEST_JWT_REDACTED"

	cases := []struct {
		scheme string
	}{
		{"Bearer"},
		{"bearer"},
		{"BEARER"},
		{"bEaReR"},
		{"BeArEr"},
	}

	for _, c := range cases {
		t.Run(c.scheme, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
			req.Header.Set("Authorization", c.scheme+" "+token)

			got, err := a.extractBearerToken(req)
			require.NoError(t, err, "scheme %q should be accepted per RFC 7235 §2.1", c.scheme)
			require.Equal(t, token, got)
		})
	}
}

func (ts *AuthTestSuite) TestParseJWTClaims() {
	originalJWT := ts.Config.JWT
	defer func() { ts.Config.JWT = originalJWT }()

	cases := []struct {
		desc string
		key  map[string]interface{}
	}{
		{
			desc: "HMAC key",
			key: map[string]interface{}{
				"kty":     "oct",
				"k":       "S1LgKUjeqXDEolv9WPtjUpADVMHU_KYu8uRDrM-pDGg",
				"kid":     "ac50c3cc-9cf7-4fd6-a11f-fe066fd39118",
				"key_ops": []string{"sign", "verify"},
				"alg":     "HS256",
			},
		},
		{
			desc: "RSA key",
			key: map[string]interface{}{
				"kty":     "RSA",
				"n":       "2g0B_hMIx5ZPuTUtLRpRr0k314XniYm3AUFgR5FmTZIjrn7vLwsWij-2egGZeHa-y9ypAgB9Q-lQ3AlT7RMPiCIyLQI6TTC8k10NEnj8c0QZwENx1Qr8aBbuZbOP9Cz30EMWZSbzMbz7r8-3rp5wBRBtIPnLlbfZh_p0iBaJfB77-r_mvhOIFM4xS7ef3nkE96dnvbEN5a-HfjzDJIAt-LniUvzMWW2gQcmHiM4oeijE3PHesapLMt2JpsMhSRo8L7tysags9VMoyZ1GnpCdjtRwb_KpY9QTjV6lL8G5nsKFH7bhABYcpjDOvqkfT5nPXj6C7oCo6MPRirPWUTbq2w",
				"e":       "AQAB",
				"d":       "OOTj_DNjOxCRRLYHT5lqbt4f3_BkdZKlWYKBaKsbkmnrPYCJUDEIdJIjPrpkHPZ-2hp9TrRp-upJ2t_kMhujFdY2WWAXbkSlL5475vICjODcBzqR3RC8wzwYgBjWGtQQ5RpcIZCELBovYbRFLR7SA8BBeTU0VaBe9gf3l_qpbOT9QIl268uFdWndTjpehGLQRmAtR1snhvTha0b9nsBZsM_K-EfnoF7Q_lPsjwWDvIGpFXao8Ifaa_sFtQkHjHVBMW2Qgx3ZSrEva_brk7w0MNSYI7Nsmr56xFOpFRwZy0v8ZtgQZ4hXmUInRHIoQ2APeds9YmemojvJKVflt9pLIQ",
				"p":       "-o2hdQ5Z35cIS5APTVULj_BMoPJpgkuX-PSYC1SeBeff9K04kG5zrFMWJy_-27-ys4q754lpNwJdX2CjN1nb6qyn-uKP8B2oLayKs9ebkiOqvm3S2Xblvi_F8x6sOLba3lTYHK8G7U9aMB9U0mhAzzMFdw15XXusVFDvk-zxL28",
				"q":       "3sp-7HzZE_elKRmebjivcDhkXO2GrcN3EIqYbbXssHZFXJwVE9oc2CErGWa7QetOCr9C--ZuTmX0X3L--CoYr-hMB0dN8lcAhapr3aau-4i7vE3DWSUdcFSyi0BBDg8pWQWbxNyTXBuWeh1cnRBsLjCxAOVTF0y3_BnVR7mbBVU",
				"dp":      "DuYHGMfOrk3zz1J0pnuNIXT_iX6AqZ_HHKWmuN3CO8Wq-oimWWhH9pJGOfRPqk9-19BDFiSEniHE3ZwIeI0eV5kGsBNyzatlybl90e3bMVhvmb08EXRRevqqQaesQ_8Tiq7u3t3Fgqz6RuxGBfDvEaMOCyNA-T8WYzkg1eH8AX8",
				"dq":      "opOCK3CvuDJvA57-TdBvtaRxGJ78OLD6oceBlA29useTthDwEJyJj-4kVVTyMRhUyuLnLoro06zytvRjuxR9D2CkmmseJkn2x5OlQwnvhv4wgSj99H9xDBfCcntg_bFyqtO859tObVh0ZogmnTbuuoYtpEm0aLxDRmRTjxOSXEE",
				"qi":      "8skVE7BDASHXytKSWYbkxD0B3WpXic2rtnLgiMgasdSxul8XwcB-vjVSZprVrxkcmm6ZhszoxOlq8yylBmMvAnG_gEzTls_xapeuEXGYiGaTcpkCt1r-tBKcQkka2SayaWwAljsX4xSw-zKP2koUkEET_tIcbBOW1R4OWfRGqOI",
				"kid":     "0d24b26c-b3ec-4c02-acfd-d5a54d50b3a4",
				"key_ops": []string{"sign", "verify"},
				"alg":     "RS256",
			},
		},
		{
			desc: "EC key",
			key: map[string]interface{}{
				"kty":     "EC",
				"x":       "5wsOh-DrNPpm9KkuydtgGs_cv3oNvtR9OdXywt12aS4",
				"y":       "0y01ZbuH_VQjMEd8fcYaLdiv25EVJ5GOrb79dJJsqrM",
				"crv":     "P-256",
				"d":       "EDP4ReMMpAUcf82EF3JYvkm8C5hVAh258Rj6f3HTx7c",
				"kid":     "10646a77-f470-44a8-8400-2f988d9c9c1a",
				"key_ops": []string{"sign", "verify"},
				"alg":     "ES256",
			},
		},
		{
			desc: "Ed25519 key",
			key: map[string]interface{}{
				"crv":     "Ed25519",
				"d":       "jVpCLvOxatVkKe1MW9nFRn6Q8VVZPq5yziKU_Z0Yu-c",
				"x":       "YDkGdufJBQEPO6ylvd9IKfZlzvm9tOG5VCDpkJSSkiA",
				"kty":     "OKP",
				"kid":     "ec5e7a96-ea66-456c-826c-d8d6cb928c0f",
				"key_ops": []string{"sign", "verify"},
				"alg":     "EdDSA",
			},
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			bytes, err := json.Marshal(c.key)
			require.NoError(ts.T(), err)
			privKey, err := jwk.ParseKey(bytes)
			require.NoError(ts.T(), err)
			pubKey, err := privKey.PublicKey()
			require.NoError(ts.T(), err)
			ts.Config.JWT.Keys = conf.JwtKeysDecoder{privKey.KeyID(): conf.JwkInfo{
				PublicKey:  pubKey,
				PrivateKey: privKey,
			}}
			ts.Config.JWT.ValidMethods = nil
			require.NoError(ts.T(), ts.Config.ApplyDefaults())

			userClaims := &AccessTokenClaims{
				Role: "authenticated",
			}

			// get signing key and method from config
			jwk, err := conf.GetSigningJwk(&ts.Config.JWT)
			require.NoError(ts.T(), err)
			signingMethod := conf.GetSigningAlg(jwk)
			signingKey, err := ts.Config.JWT.SigningKey(context.Background())
			require.NoError(ts.T(), err)

			userJwtToken := jwt.NewWithClaims(signingMethod, userClaims)
			require.NoError(ts.T(), err)
			userJwtToken.Header["kid"] = jwk.KeyID()
			userJwt, err := userJwtToken.SignedString(signingKey)
			require.NoError(ts.T(), err)

			req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
			req.Header.Set("Authorization", "Bearer "+userJwt)
			ctx, err := ts.API.parseJWTClaims(userJwt, req)
			require.NoError(ts.T(), err)

			// check if token is stored in context
			token := getToken(ctx)
			require.Equal(ts.T(), userJwt, token.Raw)
		})
	}
}

func (ts *AuthTestSuite) TestMaybeLoadUserOrSession() {
	u, err := models.FindUserByEmailAndAudience(ts.API.db, "test@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)

	s, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))

	require.NoError(ts.T(), ts.API.db.Load(s))

	cases := []struct {
		Desc            string
		UserJwtClaims   *AccessTokenClaims
		ExpectedError   error
		ExpectedUser    *models.User
		ExpectedSession *models.Session
	}{
		{
			Desc: "Missing Subject Claim",
			UserJwtClaims: &AccessTokenClaims{
				RegisteredClaims: jwt.RegisteredClaims{
					Subject: "",
				},
				Role: "authenticated",
			},
			ExpectedError: apierrors.NewForbiddenError(apierrors.ErrorCodeBadJWT, "invalid claim: missing sub claim"),
			ExpectedUser:  nil,
		},
		{
			Desc: "Valid Subject Claim",
			UserJwtClaims: &AccessTokenClaims{
				RegisteredClaims: jwt.RegisteredClaims{
					Subject: u.ID.String(),
				},
				Role: "authenticated",
			},
			ExpectedError: nil,
			ExpectedUser:  u,
		},
		{
			Desc: "Invalid Subject Claim",
			UserJwtClaims: &AccessTokenClaims{
				RegisteredClaims: jwt.RegisteredClaims{
					Subject: "invalid-subject-claim",
				},
				Role: "authenticated",
			},
			ExpectedError: apierrors.NewBadRequestError(apierrors.ErrorCodeBadJWT, "invalid claim: sub claim must be a UUID"),
			ExpectedUser:  nil,
		},
		{
			Desc: "Empty Session ID Claim",
			UserJwtClaims: &AccessTokenClaims{
				RegisteredClaims: jwt.RegisteredClaims{
					Subject: u.ID.String(),
				},
				Role:      "authenticated",
				SessionId: "",
			},
			ExpectedError: nil,
			ExpectedUser:  u,
		},
		{
			Desc: "Invalid Session ID Claim",
			UserJwtClaims: &AccessTokenClaims{
				RegisteredClaims: jwt.RegisteredClaims{
					Subject: u.ID.String(),
				},
				Role:      "authenticated",
				SessionId: uuid.Nil.String(),
			},
			ExpectedError: nil,
			ExpectedUser:  u,
		},
		{
			Desc: "Valid Session ID Claim",
			UserJwtClaims: &AccessTokenClaims{
				RegisteredClaims: jwt.RegisteredClaims{
					Subject: u.ID.String(),
				},
				Role:      "authenticated",
				SessionId: s.ID.String(),
			},
			ExpectedError:   nil,
			ExpectedUser:    u,
			ExpectedSession: s,
		},
		{
			Desc: "Session ID doesn't exist",
			UserJwtClaims: &AccessTokenClaims{
				RegisteredClaims: jwt.RegisteredClaims{
					Subject: u.ID.String(),
				},
				Role:      "authenticated",
				SessionId: "73bf9ee0-9e8c-453b-b484-09cb93e2f341",
			},
			ExpectedError:   apierrors.NewForbiddenError(apierrors.ErrorCodeSessionNotFound, "Session from session_id claim in JWT does not exist").WithInternalError(models.SessionNotFoundError{}).WithInternalMessage("session id (73bf9ee0-9e8c-453b-b484-09cb93e2f341) doesn't exist"),
			ExpectedUser:    u,
			ExpectedSession: nil,
		},
	}

	for _, c := range cases {
		ts.Run(c.Desc, func() {
			userJwt, err := jwt.NewWithClaims(jwt.SigningMethodHS256, c.UserJwtClaims).SignedString([]byte(ts.Config.JWT.Secret))
			require.NoError(ts.T(), err)

			req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
			req.Header.Set("Authorization", "Bearer "+userJwt)

			ctx, err := ts.API.parseJWTClaims(userJwt, req)
			require.NoError(ts.T(), err)
			ctx, err = ts.API.maybeLoadUserOrSession(ctx)
			if c.ExpectedError != nil {
				require.Equal(ts.T(), c.ExpectedError.Error(), err.Error())
			} else {
				require.Equal(ts.T(), c.ExpectedError, err)
			}
			require.Equal(ts.T(), c.ExpectedUser, getUser(ctx))
			require.Equal(ts.T(), c.ExpectedSession, getSession(ctx))
		})
	}
}

// TestRequireAuthenticationBannedUser verifies that a banned user holding a
// still-valid access token is rejected by requireAuthentication, while
// non-banned users and users whose ban has expired are allowed through.
func (ts *AuthTestSuite) TestRequireAuthenticationBannedUser() {
	u, err := models.FindUserByEmailAndAudience(ts.API.db, "test@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)

	newAuthedRequest := func() *http.Request {
		claims := &AccessTokenClaims{
			RegisteredClaims: jwt.RegisteredClaims{
				Subject: u.ID.String(),
			},
			Role: "authenticated",
		}
		userJwt, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
		require.NoError(ts.T(), err)

		req := httptest.NewRequest(http.MethodGet, "http://localhost", nil)
		req.Header.Set("Authorization", "Bearer "+userJwt)
		return req
	}

	ts.Run("Banned user is rejected", func() {
		require.NoError(ts.T(), u.Ban(ts.API.db, time.Hour))

		_, err := ts.API.requireAuthentication(httptest.NewRecorder(), newAuthedRequest())
		require.Error(ts.T(), err)
		require.Equal(ts.T(),
			apierrors.NewForbiddenError(apierrors.ErrorCodeUserBanned, "User is banned").Error(),
			err.Error())
	})

	ts.Run("Expired ban is allowed", func() {
		pastBan := time.Now().Add(-time.Hour)
		u.BannedUntil = &pastBan
		require.NoError(ts.T(), ts.API.db.UpdateOnly(u, "banned_until"))

		ctx, err := ts.API.requireAuthentication(httptest.NewRecorder(), newAuthedRequest())
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), getUser(ctx))
	})

	ts.Run("Non-banned user is allowed", func() {
		require.NoError(ts.T(), u.Ban(ts.API.db, 0))

		ctx, err := ts.API.requireAuthentication(httptest.NewRecorder(), newAuthedRequest())
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), getUser(ctx))
	})
}
