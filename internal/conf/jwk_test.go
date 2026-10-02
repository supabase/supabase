package conf

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/stretchr/testify/require"
)

func TestJwtKeys(t *testing.T) {

	// JwtKeysDecoder - Decode - unmarshal error
	{
		dec := make(JwtKeysDecoder)
		jwt := "{"
		err := dec.Decode(jwt)
		require.Error(t, err)
	}

	// JwtKeysDecoder - Decode - error calling decodeKey on index 0
	{
		dec := make(JwtKeysDecoder)
		jwt := "[{}]"
		err := dec.Decode(jwt)
		require.Error(t, err)
	}

	// JwtKeysDecoder - Decode - ParseKey error
	{
		dec := make(JwtKeysDecoder)
		dst := make(JwtKeysDecoder)
		jwt := "{}"
		err := dec.decodeKey(dst, []byte(jwt))
		require.Error(t, err)
	}

	// JwtKeysDecoder - Decode - PublicKeyOf error
	{
		dec := make(JwtKeysDecoder)
		dst := make(JwtKeysDecoder)
		err := dec.decodePrivateKey(dst, nil)
		require.Error(t, err)
	}

	// JwtKeysDecoder - Decode - Set jwt.KeyUsageKey error
	{
		sentinel := errors.New("sentinel")
		key := helpToMockKey(t, sentinel)
		key.n = 0

		dec := make(JwtKeysDecoder)
		dst := make(JwtKeysDecoder)
		err := dec.decodePublicKey(dst, key, key)
		require.Error(t, err)
	}

	// JwtKeysDecoder - Decode - Set jwt.KeyOpsKey error
	{
		sentinel := errors.New("sentinel")
		key := helpToMockKey(t, sentinel)
		key.n = -1

		dec := make(JwtKeysDecoder)
		dst := make(JwtKeysDecoder)
		err := dec.decodePublicKey(dst, key, key)
		require.Error(t, err)
	}

	// JwtKeysDecoder - Validate - signing keys == 0
	{
		dec := make(JwtKeysDecoder)
		err := dec.Validate()
		require.Error(t, err)
	}

	// JwtKeysDecoder - Validate - signing keys > 1
	{
		dec := make(JwtKeysDecoder)
		m := helpToMap(t, testJwtKey)
		jwt, err := json.Marshal(m["3"])
		require.NoError(t, err)

		sigKey1, err := jwk.ParseKey(jwt)
		require.NoError(t, err)

		pubJwk, err := jwk.PublicKeyOf(sigKey1)
		require.NoError(t, err)

		dec["sig1"] = JwkInfo{
			PublicKey:  pubJwk,
			PrivateKey: sigKey1,
		}
		dec["sig2"] = JwkInfo{
			PublicKey:  pubJwk,
			PrivateKey: sigKey1,
		}

		err = dec.Validate()
		require.Error(t, err)
	}

	// JwtKeysDecoder - Validate - PrivateKey.Validate() error
	{
		dec := make(JwtKeysDecoder)
		m := helpToMap(t, testJwtKey)
		jwt, err := json.Marshal(m["3"])
		require.NoError(t, err)

		privKey, err := jwk.ParseKey(jwt)
		require.NoError(t, err)

		sentinel := errors.New("sentinel")
		key := &mockKey{Key: privKey, err: sentinel, n: 0}

		dec["sig1"] = JwkInfo{
			PublicKey:  key,
			PrivateKey: key,
		}

		err = dec.Validate()
		require.Error(t, err)
	}

	// JwtKeysDecoder - Validate - PublicKey.Validate() error
	{
		dec := make(JwtKeysDecoder)
		m := helpToMap(t, testJwtKey)
		jwt, err := json.Marshal(m["3"])
		require.NoError(t, err)

		privKey, err := jwk.ParseKey(jwt)
		require.NoError(t, err)

		sentinel := errors.New("sentinel")
		key := &mockKey{Key: privKey, err: sentinel, n: -1}

		dec["sig1"] = JwkInfo{
			PublicKey:  key,
			PrivateKey: key,
		}

		err = dec.Validate()
		require.Error(t, err)
	}

	// GetSigningJwk - valid
	{
		dec := make(JwtKeysDecoder)
		m := helpToMap(t, testJwtKey)
		jwt, err := json.Marshal(m["3"])
		require.NoError(t, err)

		sigKey1, err := jwk.ParseKey(jwt)
		require.NoError(t, err)

		pubJwk, err := jwk.PublicKeyOf(sigKey1)
		require.NoError(t, err)

		info := JwkInfo{
			PublicKey:  pubJwk,
			PrivateKey: sigKey1,
		}
		dec["sig1"] = info

		jwtConfig := &JWTConfiguration{
			Keys: dec,
		}
		got, err := GetSigningJwk(jwtConfig)
		require.NoError(t, err)
		require.Equal(t, sigKey1, got)
	}

	// GetSigningJwk - not found
	{
		dec := make(JwtKeysDecoder)
		jwtConfig := &JWTConfiguration{
			Keys: dec,
		}
		got, err := GetSigningJwk(jwtConfig)
		require.Nil(t, got)
		require.Error(t, err)
		require.Equal(t, "no signing key found", err.Error())
	}

	// FindPublicKeyByKid - valid
	{
		dec := make(JwtKeysDecoder)
		jwtConfig := &JWTConfiguration{
			Keys:   dec,
			KeyID:  "abc",
			Secret: "sentinel",
		}
		got, err := FindPublicKeyByKid(context.Background(), "abc", jwtConfig)
		require.NoError(t, err)
		require.Equal(t, []byte("sentinel"), got)
	}

	// FindPublicKeyByKid - not found
	{
		dec := make(JwtKeysDecoder)
		jwtConfig := &JWTConfiguration{
			Keys: dec,
		}
		got, err := FindPublicKeyByKid(context.Background(), "abc", jwtConfig)
		require.Nil(t, got)
		require.Nil(t, err)
	}

	// FindPublicKeyByKid - GetSigningKey success
	{
		m := helpToMap(t, testJwtKey)
		jwt, err := json.Marshal(m["3"])
		require.NoError(t, err)

		sigKey1, err := jwk.ParseKey(jwt)
		require.NoError(t, err)

		dec := make(JwtKeysDecoder)
		dec["abc"] = JwkInfo{
			PublicKey:  sigKey1,
			PrivateKey: sigKey1,
		}

		jwtConfig := &JWTConfiguration{
			Keys: dec,
		}

		got, err := FindPublicKeyByKid(context.Background(), "abc", jwtConfig)
		require.NoError(t, err)
		require.NotNil(t, got)
		require.Equal(t, fmt.Sprintf("%T", got), "*ecdsa.PrivateKey")
	}

	// FindPublicKeyByKid - GetSigningKey fails
	{
		m := helpToMap(t, testJwtKey)
		jwt, err := json.Marshal(m["4"])
		require.NoError(t, err)

		privKey, err := jwk.ParseKey(jwt)
		require.NoError(t, err)

		sentinel := errors.New("sentinel")
		key := &mockKey{Key: privKey, err: sentinel, n: 0}

		dec := make(JwtKeysDecoder)
		dec["abc"] = JwkInfo{
			PublicKey:  key,
			PrivateKey: key,
		}

		jwtConfig := &JWTConfiguration{
			Keys: dec,
		}

		got, err := FindPublicKeyByKid(context.Background(), "abc", jwtConfig)
		require.Nil(t, got)
		require.Error(t, err)
		require.Equal(t, sentinel, err)
	}

	// GetSigningAlg - nil key
	{
		alg := GetSigningAlg(nil)
		require.Equal(t, alg, jwt.SigningMethodHS256)
	}

	// GetSigningAlg - nil key
	{
		algs := []jwa.KeyAlgorithm{
			jwa.RS256,
			jwa.RS512,
			jwa.ES256,
			jwa.ES512,
			jwa.EdDSA,
			jwa.HS256,
		}
		for _, alg := range algs {
			key := &mockKey{alg: alg}
			got := GetSigningAlg(key)
			require.Equal(t, alg.String(), got.Alg())
		}
	}
}

func TestDecode(t *testing.T) {
	// array of JWKs containing 4 keys
	gotrueJwtKeys := testJwtKey
	var decoder JwtKeysDecoder
	require.NoError(t, decoder.Decode(gotrueJwtKeys))
	require.Len(t, decoder, 4)

	for kid, key := range decoder {
		require.NotEmpty(t, kid)
		require.NotNil(t, key.PrivateKey)
		require.NotNil(t, key.PublicKey)
		require.NotEmpty(t, key.PublicKey.KeyOps(), "missing key_ops claim")
	}
}

func TestJWTConfiguration(t *testing.T) {
	// array of JWKs containing 4 keys
	gotrueJwtKeys := testJwtKey
	var decoder JwtKeysDecoder
	require.NoError(t, decoder.Decode(gotrueJwtKeys))
	require.Len(t, decoder, 4)

	cases := []struct {
		desc           string
		config         JWTConfiguration
		expectedLength int
	}{
		{
			desc: "GOTRUE_JWT_KEYS is nil",
			config: JWTConfiguration{
				Secret: "testsecret",
				KeyID:  "testkeyid",
			},
			expectedLength: 1,
		},
		{
			desc: "GOTRUE_JWT_KEYS is an empty map",
			config: JWTConfiguration{
				Secret: "testsecret",
				KeyID:  "testkeyid",
				Keys:   JwtKeysDecoder{},
			},
			expectedLength: 1,
		},
		{
			desc: "Prefer GOTRUE_JWT_KEYS over GOTRUE_JWT_SECRET",
			config: JWTConfiguration{
				Secret: "testsecret",
				KeyID:  "testkeyid",
				Keys:   decoder,
			},
			expectedLength: 4,
		},
	}

	for _, c := range cases {
		t.Run(c.desc, func(t *testing.T) {
			globalConfig := GlobalConfiguration{
				JWT: c.config,
			}
			require.NoError(t, globalConfig.ApplyDefaults())
			require.NotEmpty(t, globalConfig.JWT.Keys)
			require.Len(t, globalConfig.JWT.Keys, c.expectedLength)
			for _, key := range globalConfig.JWT.Keys {
				// public keys should contain these require claims
				require.NotNil(t, key.PublicKey.Algorithm())
				require.NotNil(t, key.PublicKey.KeyID())
				require.NotNil(t, key.PublicKey.KeyOps())
				require.Equal(t, "sig", key.PublicKey.KeyUsage())
			}
		})
	}
}

func helpToMap(t *testing.T, str string) map[string]map[string]interface{} {
	out := make(map[string]map[string]interface{})

	var dst []map[string]interface{}
	err := json.Unmarshal([]byte(str), &dst)
	require.NoError(t, err)
	for _, v := range dst {
		out[v["kid"].(string)] = v
	}
	return out
}

func helpToMockKey(t *testing.T, mockErr error) *mockKey {
	m := helpToMap(t, testJwtKey)
	jwt, err := json.Marshal(m["2"])
	require.NoError(t, err)

	privJwk, err := jwk.ParseKey(jwt)
	require.NoError(t, err)
	return &mockKey{Key: privJwk, err: mockErr}
}

type mockKey struct {
	jwk.Key
	n   int
	err error
	alg jwa.KeyAlgorithm
	ops jwk.KeyOperationList
}

func (o *mockKey) maybeErr() error {
	if o.n == 0 {
		return o.err
	}
	o.n++
	return nil
}

func (o *mockKey) KeyOps() jwk.KeyOperationList { return o.ops }
func (o *mockKey) Algorithm() jwa.KeyAlgorithm  { return o.alg }
func (o *mockKey) Validate() error              { return o.maybeErr() }
func (o *mockKey) Raw(v any) error              { return o.maybeErr() }
func (o *mockKey) Get(v string) (interface{}, bool) {
	if o.Key == nil {
		return "", false
	}
	return o.Key.Get(v)
}

func (o *mockKey) Set(string, interface{}) error { return o.maybeErr() }
func (o *mockKey) PublicKey() (jwk.Key, error) {
	if err := o.maybeErr(); err != nil {
		return nil, err
	}
	return o.Key.PublicKey()
}

const testJwtKey = `[{"kty":"oct","k":"9Sj51i2YvfY85NJZFD6rAl9fKDxSKjFgW6W6ZXOJLnU","kid":"1","key_ops":["verify"],"alg":"HS256"},{"kty":"RSA","n":"4slQjr-XoU6I1KXFWOeeJi387RIUxjhyzXX3GUVNb75a0SPKoGShlJEbpvuXqkDLGDweLcIZy-01nqgjSzMY_tUO3L78MxVfIVn7MByJ4_zbrVf5rjKeAk9EEMl6pb8nKJGArph9sOwL68LLioNySt_WNo_hMfuxUuVkRagh5gLjYoQ4odkULQrgwlMcXxXNnvg0aYURUr2SDmncHNuZQ3adebRlI164mUZPPWui2fg72R7c9qhVaAEzbdG-JAuC3zn5iL4zZk-8pOwZkM7Qb_2lrcXwdTl_Qz6fMdAHz_3rggac5oeKkdvO2x7_XiUwGxIBYSghxg5BBxcyqd6WrQ","e":"AQAB","d":"FjJo7uH4aUoktO8kHhbHbY_KSdQpHDjKyc7yTS_0DWYgUfdozzubJfRDF42vI-KsXssF-NoB0wJf0uP0L8ip6G326XPuoMQRTMgcaF8j6swTwsapSOEagr7BzcECx1zpc2-ojhwbLHSvRutWDzPJkbrUccF8vRC6BsiAUG4Hapiumbot7JtJGwU8ZUhxico7_OEJ_MtkRrHByXgrOMnzNLrmViI9rzvtWOhVc8sNDzLogDDi01AP0j6WeBhbOpaZ_1BMLQ9IeeN5Iiy-7Qj-q4-8kBXIPXpYaKMFnDTmhB0GAVUFimF6ojhZNAJvV81VMHPjrEmmps0_qBfIlKAB","p":"9G7wBpiSJHAl-w47AWvW60v_hye50lte4Ep2P3KeRyinzgxtEMivzldoqirwdoyPCJWwU7nNsv7AjdXVoHFy3fJvJeV5mhArxb2zA36OS_Tr3CQXtB3OO-RFwVcG7AGO7XvA54PK28siXY2VvkG2Xn_ZrbVebJnHQprn7ddUIIE","q":"7YSaG2E_M9XpgUJ0izwKdfGew6Hz5utPUdwMWjqr81BjtLkUtQ3tGYWs2tdaRYUTK4mNFyR2MjLYnMK-F37rue4LSKitmEu2N6RD9TwzcqwiEL_vuQTC985iJ0hzUC58LcbhYtTLU3KqZXXUqaeBXEwQAWxK1NRf6rQRhOGk4C0","dp":"fOV-sfAdpI7FaW3RCp3euGYh0B6lXW4goXyKxUq8w2FrtOY2iH_zDP0u1tyP-BNENr-91Fo5V__BxfeAa7XsWqo4zuVdaDJhG24d3Wg6L2ebaOXsUrV0Hrg6SFs-hzMYpBI69FEsQ3idO65P2GJdXBX51T-6WsWMwmTCo44GR4E","dq":"O2DrJe0p38ualLYIbMaV1uaQyleyoggxzEU20VfZpPpz8rpScvEIVVkV3Z_48WhTYo8AtshmxCXyAT6uRzFzvQfFymRhAbHr2_01ABoMwp5F5eoWBCsskscFwsxaB7GXWdpefla0figscTED-WXm8SwS1Eg-bParBAIAXzgKAAE","qi":"Cezqw8ECfMmwnRXJuiG2A93lzhixHxXISvGC-qbWaRmCfetheSviZlM0_KxF6dsvrw_aNfIPa8rv1TbN-5F04v_RU1CD79QuluzXWLkZVhPXorkK5e8sUi_odzAJXOwHKQzal5ndInl4XYctDHQr8jXcFW5Un65FhPwdAC6-aek","kid":"2","key_ops":["verify"],"alg":"RS256"},{"kty":"EC","x":"GwbnH57MUhgL14dJfayyzuI6o2_mB_Pm8xIuauHXtQs","y":"cYqN0VAcv0BC9wrg3vNgHlKhGP8ZEedUC2A8jXpaGwA","crv":"P-256","d":"4STEXq7W4UY0piCGPueMaQqAAZ5jVRjjA_b1Hq7YgmM","kid":"3","key_ops":["sign","verify"],"alg":"ES256"},{"crv":"Ed25519","d":"T179kXSOJHE8CNbqaI2HNdG8r3YbSoKYxNRSzTkpEcY","x":"iDYagELzmD4z6uaW7eAZLuQ9fiUlnLqtrh7AfNbiNiI","kty":"OKP","kid":"4","key_ops":["verify"],"alg":"EdDSA"}]`
