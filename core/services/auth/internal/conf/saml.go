package conf

import (
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"errors"
	"fmt"
	"math/big"
	"net"
	"net/url"
	"time"
)

// SAMLConfiguration holds configuration for native SAML support.
type SAMLConfiguration struct {
	Enabled                  bool          `json:"enabled"`
	PrivateKey               string        `json:"-" split_words:"true"`
	PrivateKeyNext           string        `json:"-" split_words:"true"`
	AllowEncryptedAssertions bool          `json:"allow_encrypted_assertions" split_words:"true"`
	RelayStateValidityPeriod time.Duration `json:"relay_state_validity_period" split_words:"true"`

	RSAPrivateKey *rsa.PrivateKey   `json:"-"`
	RSAPublicKey  *rsa.PublicKey    `json:"-"`
	Certificate   *x509.Certificate `json:"-"`

	RSAPrivateKeyNext *rsa.PrivateKey   `json:"-"`
	RSAPublicKeyNext  *rsa.PublicKey    `json:"-"`
	CertificateNext   *x509.Certificate `json:"-"`

	ExternalURL string `json:"external_url,omitempty" split_words:"true"`

	RateLimitAssertion float64 `default:"15" split_words:"true"`
}

func (c *SAMLConfiguration) GoString() string { return c.String() }
func (c *SAMLConfiguration) String() string {
	if c == nil {
		return "(*SAMLConfiguration)(nil)"
	}
	return fmt.Sprintf("SAMLConfiguration(Enabled: %v)", c.Enabled)
}

func (c *SAMLConfiguration) Validate() error {
	if c.Enabled {
		bytes, err := base64.StdEncoding.DecodeString(c.PrivateKey)
		if err != nil {
			return errors.New("SAML private key not in standard Base64 format")
		}

		privateKey, err := x509.ParsePKCS1PrivateKey(bytes)
		if err != nil {
			return errors.New("SAML private key not in PKCS#1 format")
		}

		if privateKey.E != 0x10001 {
			return errors.New("SAML private key should use the 65537 (0x10001) RSA public exponent")
		}

		if privateKey.N.BitLen() < 2048 {
			return errors.New("SAML private key must be at least RSA 2048")
		}

		if c.PrivateKeyNext != "" {
			nextBytes, err := base64.StdEncoding.DecodeString(c.PrivateKeyNext)
			if err != nil {
				return errors.New("SAML next private key not in standard Base64 format")
			}

			nextKey, err := x509.ParsePKCS1PrivateKey(nextBytes)
			if err != nil {
				return errors.New("SAML next private key not in PKCS#1 format")
			}

			if nextKey.E != 0x10001 {
				return errors.New("SAML next private key should use the 65537 (0x10001) RSA public exponent")
			}

			if nextKey.N.BitLen() < 2048 {
				return errors.New("SAML next private key must be at least RSA 2048")
			}
		}

		if c.RelayStateValidityPeriod < 0 {
			return errors.New("SAML RelayState validity period should be a positive duration")
		}

		if c.ExternalURL != "" {
			_, err := url.ParseRequestURI(c.ExternalURL)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// PopulateFields fills the configuration details based off the provided
// parameters.
func (c *SAMLConfiguration) PopulateFields(externalURL string) error {
	certTemplate, err := c.populateFields(externalURL)
	if err != nil {
		return err
	}
	if err := c.createCertificate(certTemplate); err != nil {
		return err
	}
	if c.PrivateKeyNext != "" {
		if err := c.populateNextKey(certTemplate); err != nil {
			return err
		}
	} else {
		// envconfig allocates zero-value structs for nil pointer fields; reset
		// them explicitly so CertificateNext == nil when no next key is set.
		c.RSAPrivateKeyNext = nil
		c.RSAPublicKeyNext = nil
		c.CertificateNext = nil
	}
	return nil
}

// PopulateFields fills the configuration details based off the provided
// parameters.
func (c *SAMLConfiguration) populateFields(externalURL string) (*x509.Certificate, error) {
	// errors are intentionally ignored since they should have been handled
	// within #Validate()
	bytes, err := base64.StdEncoding.DecodeString(c.PrivateKey)
	if err != nil {
		return nil, fmt.Errorf("saml: PopulateFields: invalid base64: %w", err)
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(bytes)
	if err != nil {
		return nil, fmt.Errorf("saml: PopulateFields: invalid private key: %w", err)
	}

	c.RSAPrivateKey = privateKey
	c.RSAPublicKey = privateKey.Public().(*rsa.PublicKey)

	parsedURL, err := url.ParseRequestURI(externalURL)
	if err != nil {
		return nil, fmt.Errorf("saml: unable to parse external URL for SAML, check API_EXTERNAL_URL: %w", err)
	}

	host := ""
	host, _, err = net.SplitHostPort(parsedURL.Host)
	if err != nil {
		host = parsedURL.Host
	}

	// SAML does not care much about the contents of the certificate, it
	// only uses it as a vessel for the public key; therefore we set these
	// fixed values.
	// Please avoid modifying or adding new values to this template as they
	// will change the exposed SAML certificate, requiring users of
	// GoTrue to re-establish a connection between their Identity Provider
	// and their running GoTrue instances.
	certTemplate := &x509.Certificate{
		SerialNumber: big.NewInt(0),
		IsCA:         false,
		DNSNames: []string{
			"_samlsp." + host,
		},
		KeyUsage:  x509.KeyUsageDigitalSignature,
		NotBefore: time.UnixMilli(0).UTC(),
		NotAfter:  time.UnixMilli(0).UTC().AddDate(200, 0, 0),
		Subject: pkix.Name{
			CommonName: "SAML 2.0 Certificate for " + host,
		},
	}

	if c.AllowEncryptedAssertions {
		certTemplate.KeyUsage = certTemplate.KeyUsage | x509.KeyUsageDataEncipherment
	}
	return certTemplate, nil
}

func (c *SAMLConfiguration) createCertificate(certTemplate *x509.Certificate) error {
	certDer, err := x509.CreateCertificate(nil, certTemplate, certTemplate, c.RSAPublicKey, c.RSAPrivateKey)
	if err != nil {
		return err
	}
	return c.parseCertificateDer(certDer)
}

func (c *SAMLConfiguration) parseCertificateDer(certDer []byte) error {
	cert, err := x509.ParseCertificate(certDer)
	if err != nil {
		return err
	}

	c.Certificate = cert

	if c.RelayStateValidityPeriod == 0 {
		c.RelayStateValidityPeriod = 2 * time.Minute
	}
	return nil
}

func (c *SAMLConfiguration) populateNextKey(certTemplate *x509.Certificate) error {
	bytes, err := base64.StdEncoding.DecodeString(c.PrivateKeyNext)
	if err != nil {
		return fmt.Errorf("saml: PopulateFields: next key invalid base64: %w", err)
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(bytes)
	if err != nil {
		return fmt.Errorf("saml: PopulateFields: next key not in PKCS#1 format: %w", err)
	}

	c.RSAPrivateKeyNext = privateKey
	c.RSAPublicKeyNext = privateKey.Public().(*rsa.PublicKey)

	certDer, err := x509.CreateCertificate(nil, certTemplate, certTemplate, c.RSAPublicKeyNext, c.RSAPrivateKeyNext)
	if err != nil {
		return err
	}

	cert, err := x509.ParseCertificate(certDer)
	if err != nil {
		return err
	}

	c.CertificateNext = cert
	return nil
}
