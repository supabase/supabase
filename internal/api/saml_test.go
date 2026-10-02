package api

import (
	tst "testing"
	"time"

	"encoding/xml"
	"net/http"
	"net/http/httptest"

	"github.com/crewjam/saml"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf/confload"
)

// samlTestPrimaryKey is an RSA 2048 key used as the primary SAML signing key in tests.
const samlTestPrimaryKey = "MIIEowIBAAKCAQEAszrVveMQcSsa0Y+zN1ZFb19cRS0jn4UgIHTprW2tVBmO2PABzjY3XFCfx6vPirMAPWBYpsKmXrvm1tr0A6DZYmA8YmJd937VUQ67fa6DMyppBYTjNgGEkEhmKuszvF3MARsIKCGtZqUrmS7UG4404wYxVppnr2EYm3RGtHlkYsXu20MBqSDXP47bQP+PkJqC3BuNGk3xt5UHl2FSFpTHelkI6lBynw16B+lUT1F96SERNDaMqi/TRsZdGe5mB/29ngC/QBMpEbRBLNRir5iUevKS7Pn4aph9Qjaxx/97siktK210FJT23KjHpgcUfjoQ6BgPBTLtEeQdRyDuc/CgfwIDAQABAoIBAGYDWOEpupQPSsZ4mjMnAYJwrp4ZISuMpEqVAORbhspVeb70bLKonT4IDcmiexCg7cQBcLQKGpPVM4CbQ0RFazXZPMVq470ZDeWDEyhoCfk3bGtdxc1Zc9CDxNMs6FeQs6r1beEZug6weG5J/yRn/qYxQife3qEuDMl+lzfl2EN3HYVOSnBmdt50dxRuX26iW3nqqbMRqYn9OHuJ1LvRRfYeyVKqgC5vgt/6Tf7DAJwGe0dD7q08byHV8DBZ0pnMVU0bYpf1GTgMibgjnLjK//EVWafFHtN+RXcjzGmyJrk3+7ZyPUpzpDjO21kpzUQLrpEkkBRnmg6bwHnSrBr8avECgYEA3pq1PTCAOuLQoIm1CWR9/dhkbJQiKTJevlWV8slXQLR50P0WvI2RdFuSxlWmA4xZej8s4e7iD3MYye6SBsQHygOVGc4efvvEZV8/XTlDdyj7iLVGhnEmu2r7AFKzy8cOvXx0QcLg+zNd7vxZv/8D3Qj9Jje2LjLHKM5n/dZ3RzUCgYEAzh5Lo2anc4WN8faLGt7rPkGQF+7/18ImQE11joHWa3LzAEy7FbeOGpE/vhOv5umq5M/KlWFIRahMEQv4RusieHWI19ZLIP+JwQFxWxS+cPp3xOiGcquSAZnlyVSxZ//dlVgaZq2o2MfrxECcovRlaknl2csyf+HjFFwKlNxHm2MCgYAr//R3BdEy0oZeVRndo2lr9YvUEmu2LOihQpWDCd0fQw0ZDA2kc28eysL2RROte95r1XTvq6IvX5a0w11FzRWlDpQ4J4/LlcQ6LVt+98SoFwew+/PWuyLmxLycUbyMOOpm9eSc4wJJZNvaUzMCSkvfMtmm5jgyZYMMQ9A2Ul/9SQKBgB9mfh9mhBwVPIqgBJETZMMXOdxrjI5SBYHGSyJqpT+5Q0vIZLfqPrvNZOiQFzwWXPJ+tV4Mc/YorW3rZOdo6tdvEGnRO6DLTTEaByrY/io3/gcBZXoSqSuVRmxleqFdWWRnB56c1hwwWLqNHU+1671FhL6pNghFYVK4suP6qu4BAoGBAMk+VipXcIlD67mfGrET/xDqiWWBZtgTzTMjTpODhDY1GZck1eb4CQMP5j5V3gFJ4cSgWDJvnWg8rcz0unz/q4aeMGl1rah5WNDWj1QKWMS6vJhMHM/rqN1WHWR0ZnV83svYgtg0zDnQKlLujqW4JmGXLMU7ur6a+e6lpa1fvLsP"

// samlTestNextKey is a second RSA 2048 key used to test next-key rotation in tests.
const samlTestNextKey = "MIIEowIBAAKCAQEAt7dS8iM5MsQ+1mVkNpoaUnL8BCdxSrSx8jsSnvqN/GIJ4ipqbdrTgLpFVklVTqfaa5CykGVEV577l6AWkpkm2p7SvSkCQglmyAMMjY9glmztytAnfBpm+cQ6ZVTHC4XKlUG1aJigEuXPcZUU3FiBHWEuV2huYy2bLOtIY1v9N0i2v61QCdG+SM/Yb5t86KzApRl7VyHqquge6vvRuchfF0msv/2LW32hwxg3Gt4zkAF0SJqCCcfAPZ9pQwmbdUhoX16dRFU98nyIvuR8LH/wONZe/YyywFFHDEwkFa4XEzjCEm+AD+xvK7eEu55w21xB8JKMLEBy8uRuI3bIEG4pawIDAQABAoIBADw4IT4xgYw8e4R3U7P6K2qfOjB6ZU5hkHqgFmh6JJR35ll2IdDEi9OEOzofa5EOwC/GDGH8b7xw5nM7DGsdPHko2lca3BydTE1/glvchYKJTiDOvkKVvO9d/O4+Lch/IHpwQXB5pu7K2YaXoXDgqeHhevk3yAdGabj9norDGmtGIeU/x1hialKbw6L080CdbxpjeAsM/w+G/VtwvyOKYFBYxBflRW+sS8UeclVqKRAvaXKd1JGleWzH3hFZyFI54x5LyyjPI1JyVXRjNbf8xcS6eRaN849grL1+wBxEs/lQFn4JLhAcNi912iJ3lhxvkNleXZw7B7JAM8x4wUbK7zECgYEA6SYmu3YH8XuLUfT8MMCp+ETjPkNMOJGQmTXOkW6zuXP3J8iCPIxtuz09cGIro+yJU23yPUzOVCDZMmnMWBmkoTKAFoFL9TX0Eyqn/t1MD77i3NdkMp16yI5fwOO6yX1bZgLiG00W2E5/IGgNfTtEafU/mre95JBnTgxS3sAvz8UCgYEAybjfBVt+1X0vSVAGKYHI9wtzoSx3dIGE8G5LIchPTdNDZ0ke0QCRffhyCGKy6bPos0P2z5nLgWSePBPZQowpwZiQVXdWE05ID641E2zGULdYL1yVHDt6tVTpSzTAy89BiS1G8HvgpQyaBTmvmF11Fyd/YbrDxEIHN+qQdDkM928CgYEA4lJ4ksz21QF6sqpADQtZc3lbplspqFgVp8RFq4Nsz3+00lefpSskcff2phuGBXBdtjEqTzs5pwzkCj4NcRAjcZ9WG4KTu4sOTXTA83TamwZPrtUfnMqmH/2lEdd+wI0BpjryRlJE9ODuIwUe4wwfU0QQ5B2tJizPO0JXR4gEYYkCgYBzqidm4QGm1DLq7JG79wkObmiMv/x2t1VMr1ExO7QNQdfiP1EGMjc6bdyk5kMEMf5527yHaP4BYXpBpHfs6oV+1kXcW6LlSvuS0iboznQgECDmd0WgfJJtqxRh5QuvUVWYnHeSqNU0jjc6S8tdqCjdb+5gUUCzJdERxNOzcIr4zQKBgAqcBQwlWy0PdlZ06JhJUYlwX1pOU8mWPz9LIF0wrSm9LEtAl37zZJaD3uscvk/fCixAGHOktkDGVO7aUYIAlX9iD49huGkeRTn9tz7Wanw6am04Xj0y7H1oPPV7k5nJ4s9AOWq/gkZEhrRIis2anAczsx1YHSjq/M05+AbuRzvs"

func TestSAMLMetadataWithAPI(t *tst.T) {
	config, err := confload.LoadGlobal(apiTestConfig)
	require.NoError(t, err)
	config.API.ExternalURL = "https://projectref.supabase.co/auth/v1/"
	config.SAML.Enabled = true
	config.SAML.PrivateKey = samlTestPrimaryKey
	config.API.MaxRequestDuration = 5 * time.Second

	require.NoError(t, config.ApplyDefaults())
	require.NoError(t, config.SAML.PopulateFields(config.API.ExternalURL))

	require.NotNil(t, config.SAML.Certificate)

	api := NewAPI(config, nil)

	// Setup request
	req := httptest.NewRequest(http.MethodGet, "http://localhost/sso/saml/metadata", nil)

	w := httptest.NewRecorder()
	api.handler.ServeHTTP(w, req)
	require.Equal(t, w.Code, http.StatusOK)

	metadata := saml.EntityDescriptor{}
	require.NoError(t, xml.Unmarshal(w.Body.Bytes(), &metadata))

	require.Equal(t, metadata.EntityID, "https://projectref.supabase.co/auth/v1/sso/saml/metadata")
	require.Equal(t, len(metadata.SPSSODescriptors), 1)

	require.Nil(t, metadata.SPSSODescriptors[0].AuthnRequestsSigned)
	require.True(t, *(metadata.SPSSODescriptors[0].WantAssertionsSigned))

	require.Equal(t, len(metadata.SPSSODescriptors[0].AssertionConsumerServices), 2)
	require.Equal(t, metadata.SPSSODescriptors[0].AssertionConsumerServices[0].Location, "https://projectref.supabase.co/auth/v1/sso/saml/acs")
	require.Equal(t, metadata.SPSSODescriptors[0].AssertionConsumerServices[1].Location, "https://projectref.supabase.co/auth/v1/sso/saml/acs")
	require.Equal(t, len(metadata.SPSSODescriptors[0].SingleLogoutServices), 1)
	require.Equal(t, metadata.SPSSODescriptors[0].SingleLogoutServices[0].Location, "https://projectref.supabase.co/auth/v1/sso/saml/slo")

	require.Equal(t, len(metadata.SPSSODescriptors[0].KeyDescriptors), 1)
	require.Equal(t, metadata.SPSSODescriptors[0].KeyDescriptors[0].Use, "signing")

	require.Equal(t, len(metadata.SPSSODescriptors[0].NameIDFormats), 2)
	require.Equal(t, metadata.SPSSODescriptors[0].NameIDFormats[0], saml.EmailAddressNameIDFormat)
	require.Equal(t, metadata.SPSSODescriptors[0].NameIDFormats[1], saml.PersistentNameIDFormat)
}

// newSAMLTestAPI builds a minimal API with SAML enabled using the given key(s).
func newSAMLTestAPI(t *tst.T, primaryKey, nextKey string, allowEncrypted bool) (*API, error) {
	t.Helper()
	config, err := confload.LoadGlobal(apiTestConfig)
	if err != nil {
		return nil, err
	}
	config.API.ExternalURL = "https://projectref.supabase.co/auth/v1/"
	config.API.MaxRequestDuration = 5 * time.Second
	config.SAML.Enabled = true
	config.SAML.PrivateKey = primaryKey
	config.SAML.PrivateKeyNext = nextKey
	config.SAML.AllowEncryptedAssertions = allowEncrypted
	if err := config.ApplyDefaults(); err != nil {
		return nil, err
	}
	if err := config.SAML.PopulateFields(config.API.ExternalURL); err != nil {
		return nil, err
	}
	return NewAPI(config, nil), nil
}

// samlMetadataRequest issues a GET /sso/saml/metadata and parses the response.
func samlMetadataRequest(t *tst.T, api *API) (*saml.EntityDescriptor, http.Header) {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "http://localhost/sso/saml/metadata", nil)
	w := httptest.NewRecorder()
	api.handler.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	var metadata saml.EntityDescriptor
	require.NoError(t, xml.Unmarshal(w.Body.Bytes(), &metadata))
	return &metadata, w.Header()
}

func TestSAMLMetadata_SingleKey(t *tst.T) {
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, "", false)
	require.NoError(t, err)

	metadata, headers := samlMetadataRequest(t, api)

	require.Len(t, metadata.SPSSODescriptors, 1)
	kds := metadata.SPSSODescriptors[0].KeyDescriptors
	require.Len(t, kds, 1)
	require.Equal(t, "signing", kds[0].Use)

	// Cache TTL stays at 600s when no next key is set
	require.Equal(t, "public, max-age=600", headers.Get("Cache-Control"))
	require.Equal(t, time.Duration(0), metadata.CacheDuration)
}

func TestSAMLMetadata_DualKey(t *tst.T) {
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, samlTestNextKey, false)
	require.NoError(t, err)

	metadata, headers := samlMetadataRequest(t, api)

	require.Len(t, metadata.SPSSODescriptors, 1)
	kds := metadata.SPSSODescriptors[0].KeyDescriptors

	// Exactly two signing descriptors, primary cert first
	require.Len(t, kds, 2)
	require.Equal(t, "signing", kds[0].Use)
	require.Equal(t, "signing", kds[1].Use)

	// The two certificates must be distinct
	cert0 := kds[0].KeyInfo.X509Data.X509Certificates[0].Data
	cert1 := kds[1].KeyInfo.X509Data.X509Certificates[0].Data
	require.NotEqual(t, cert0, cert1)

	// Cache TTL is reduced to 60s during rotation
	require.Equal(t, "public, max-age=60", headers.Get("Cache-Control"))
	require.Equal(t, time.Hour, metadata.CacheDuration)
}

func TestSAMLMetadata_DualKey_Encryption(t *tst.T) {
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, samlTestNextKey, true)
	require.NoError(t, err)

	metadata, headers := samlMetadataRequest(t, api)

	require.Len(t, metadata.SPSSODescriptors, 1)
	kds := metadata.SPSSODescriptors[0].KeyDescriptors

	// Two signing + two encryption descriptors
	var signing, encryption []saml.KeyDescriptor
	for _, kd := range kds {
		switch kd.Use {
		case "signing":
			signing = append(signing, kd)
		case "encryption":
			encryption = append(encryption, kd)
		}
	}
	require.Len(t, signing, 2)
	require.Len(t, encryption, 2)

	require.Equal(t, "public, max-age=60", headers.Get("Cache-Control"))
	require.Equal(t, time.Hour, metadata.CacheDuration)
	_ = headers
}
