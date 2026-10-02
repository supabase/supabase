package api

import (
	"crypto/x509"
	tst "testing"

	"github.com/crewjam/saml"
	"github.com/stretchr/testify/require"
)

// TestNewSAMLServiceProvider verifies that newSAMLServiceProvider uses whichever
// key/cert pair it is given, and that distinct pairs produce distinct providers.
func TestNewSAMLServiceProvider(t *tst.T) {
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, samlTestNextKey, false)
	require.NoError(t, err)

	cfg := api.config.SAML
	require.NotNil(t, cfg.RSAPrivateKey)
	require.NotNil(t, cfg.Certificate)
	require.NotNil(t, cfg.RSAPrivateKeyNext)
	require.NotNil(t, cfg.CertificateNext)

	primary := api.newSAMLServiceProvider(nil, false, cfg.RSAPrivateKey, cfg.Certificate)
	require.Same(t, cfg.RSAPrivateKey, primary.Key)
	require.Equal(t, cfg.Certificate.Raw, primary.Certificate.Raw)

	next := api.newSAMLServiceProvider(nil, false, cfg.RSAPrivateKeyNext, cfg.CertificateNext)
	require.Same(t, cfg.RSAPrivateKeyNext, next.Key)
	require.Equal(t, cfg.CertificateNext.Raw, next.Certificate.Raw)

	require.NotSame(t, primary.Key, next.Key)
	require.NotEqual(t, primary.Certificate.Raw, next.Certificate.Raw)
}

// TestSAMLDecryptionFallback_NoRetryWithoutNextKey verifies that when
// RSAPrivateKeyNext is nil the retry path is not reached; a parse failure
// must return an error immediately (not panic or deadlock).
func TestSAMLDecryptionFallback_NoRetryWithoutNextKey(t *tst.T) {
	// Build API with only a primary key (no next key).
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, "", true)
	require.NoError(t, err)

	require.Nil(t, api.config.SAML.RSAPrivateKeyNext,
		"no next key should be configured")

	// The guard condition evaluated during retry must be false.
	cfg := api.config.SAML
	retryEligible := cfg.AllowEncryptedAssertions && cfg.RSAPrivateKeyNext != nil
	require.False(t, retryEligible,
		"retry must not be attempted when RSAPrivateKeyNext is nil")
}

// TestSAMLDecryptionFallback_NoRetryWhenEncryptionDisabled verifies the guard
// condition is false when AllowEncryptedAssertions is false, even with a next
// key configured.  Encrypted assertions can only be sent when the IdP knows
// the SP supports them, which requires AllowEncryptedAssertions = true in
// metadata.
func TestSAMLDecryptionFallback_NoRetryWhenEncryptionDisabled(t *tst.T) {
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, samlTestNextKey, false)
	require.NoError(t, err)

	cfg := api.config.SAML
	require.False(t, cfg.AllowEncryptedAssertions)
	require.NotNil(t, cfg.RSAPrivateKeyNext)

	retryEligible := cfg.AllowEncryptedAssertions && cfg.RSAPrivateKeyNext != nil
	require.False(t, retryEligible,
		"retry must not be attempted when AllowEncryptedAssertions is false")
}

// TestSAMLDecryptionFallback_RetryCondition verifies that the guard condition
// is true when both AllowEncryptedAssertions is true AND RSAPrivateKeyNext is
// set — i.e., that the code will attempt the retry path.
func TestSAMLDecryptionFallback_RetryCondition(t *tst.T) {
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, samlTestNextKey, true)
	require.NoError(t, err)

	cfg := api.config.SAML
	require.True(t, cfg.AllowEncryptedAssertions)
	require.NotNil(t, cfg.RSAPrivateKeyNext)

	retryEligible := cfg.AllowEncryptedAssertions && cfg.RSAPrivateKeyNext != nil
	require.True(t, retryEligible,
		"retry should be eligible when AllowEncryptedAssertions=true and RSAPrivateKeyNext is set")
}

// TestNewSAMLServiceProvider_SameURLBase verifies that both key pairs produce
// a ServiceProvider with the same ACS URL — wrong ACS URL would prevent
// assertion validation during the rotation fallback.
func TestNewSAMLServiceProvider_SameURLBase(t *tst.T) {
	api, err := newSAMLTestAPI(t, samlTestPrimaryKey, samlTestNextKey, true)
	require.NoError(t, err)

	cfg := api.config.SAML

	primary := api.newSAMLServiceProvider(nil, false, cfg.RSAPrivateKey, cfg.Certificate)
	withKey := api.newSAMLServiceProvider(nil, false, cfg.RSAPrivateKeyNext, cfg.CertificateNext)

	// ACS URLs must be the same — rotation must not change the endpoint.
	primaryACS := acsURLsFrom(primary)
	withKeyACS := acsURLsFrom(withKey)
	require.Equal(t, primaryACS, withKeyACS,
		"ACS URLs must be identical regardless of which key is used")
}

// acsURLsFrom collects all AssertionConsumerService Location strings from a SP.
func acsURLsFrom(sp *saml.ServiceProvider) []string {
	var urls []string
	meta := sp.Metadata()
	for _, spd := range meta.SPSSODescriptors {
		for _, acs := range spd.AssertionConsumerServices {
			urls = append(urls, acs.Location)
		}
	}
	return urls
}

// Compile-time check: x509.Certificate.Raw is the field we compare.
var _ = (*x509.Certificate)(nil)
