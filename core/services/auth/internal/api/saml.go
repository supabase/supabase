package api

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/xml"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
)

// newSAMLServiceProvider constructs a ServiceProvider for the given IdP
// metadata, using the provided key/cert pair.  Callers are responsible for
// passing the correct pair (primary or rotation fallback).
func (a *API) newSAMLServiceProvider(identityProvider *saml.EntityDescriptor, idpInitiated bool, key *rsa.PrivateKey, cert *x509.Certificate) *saml.ServiceProvider {
	raw := a.config.SAML.ExternalURL
	if raw == "" {
		raw = a.config.API.ExternalURL
	}
	u, err := url.ParseRequestURI(raw)
	if err != nil {
		panic(err)
	}
	if !strings.HasSuffix(u.Path, "/") {
		u.Path += "/"
	}
	u.Path += "sso/"

	provider := samlsp.DefaultServiceProvider(samlsp.Options{
		URL:               *u,
		Key:               key,
		Certificate:       cert,
		SignRequest:       true,
		AllowIDPInitiated: idpInitiated,
		IDPMetadata:       identityProvider,
	})

	provider.AuthnNameIDFormat = saml.PersistentNameIDFormat

	return &provider
}

// SAMLMetadata serves GoTrue's SAML Service Provider metadata file.
func (a *API) SAMLMetadata(w http.ResponseWriter, r *http.Request) error {
	serviceProvider := a.newSAMLServiceProvider(nil, true, a.config.SAML.RSAPrivateKey, a.config.SAML.Certificate)

	metadata := serviceProvider.Metadata()

	if r.FormValue("download") == "true" {
		// 5 year expiration, comparable to what GSuite does
		metadata.ValidUntil = time.Now().UTC().AddDate(5, 0, 0)
	}

	for i := range metadata.SPSSODescriptors {
		// we set this to false since the IdP initiated flow can only
		// sign the Assertion, and not the full Request
		// unfortunately this is hardcoded in the crewjam library if
		// signatures (instead of encryption) are supported
		// https://github.com/crewjam/saml/blob/v0.4.8/service_provider.go#L217
		metadata.SPSSODescriptors[i].AuthnRequestsSigned = nil

		// advertize the requested NameID formats (either persistent or email address)
		metadata.SPSSODescriptors[i].NameIDFormats = []saml.NameIDFormat{
			saml.EmailAddressNameIDFormat,
			saml.PersistentNameIDFormat,
		}
	}

	for i := range metadata.SPSSODescriptors {
		spd := &metadata.SPSSODescriptors[i]

		var keyDescriptors []saml.KeyDescriptor

		for _, kd := range spd.KeyDescriptors {
			// only advertize key as usable for encryption if allowed
			if kd.Use == "signing" || (a.config.SAML.AllowEncryptedAssertions && kd.Use == "encryption") {
				keyDescriptors = append(keyDescriptors, kd)
			}
		}

		// During key rotation, advertise the next certificate so IdPs can
		// cache it before we promote it to primary.
		if a.config.SAML.CertificateNext != nil {
			nextCertData := base64.StdEncoding.EncodeToString(a.config.SAML.CertificateNext.Raw)
			nextKD := saml.KeyDescriptor{
				Use: "signing",
				KeyInfo: saml.KeyInfo{
					X509Data: saml.X509Data{
						X509Certificates: []saml.X509Certificate{
							{Data: nextCertData},
						},
					},
				},
			}
			keyDescriptors = append(keyDescriptors, nextKD)
			if a.config.SAML.AllowEncryptedAssertions {
				encKD := nextKD
				encKD.Use = "encryption"
				keyDescriptors = append(keyDescriptors, encKD)
			}
		}

		spd.KeyDescriptors = keyDescriptors
	}

	// Reduce cache aggressiveness during key rotation so IdPs and CDNs pick
	// up the updated metadata before we promote the next key.
	cacheControl := "public, max-age=600"
	if a.config.SAML.CertificateNext != nil {
		metadata.CacheDuration = time.Hour
		cacheControl = "public, max-age=60"
	}

	metadataXML, err := xml.Marshal(metadata)
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", "application/xml")
	w.Header().Set("Cache-Control", cacheControl)

	if r.FormValue("download") == "true" {
		w.Header().Set("Content-Disposition", "attachment; filename=\"metadata.xml\"")
	}

	_, err = w.Write(metadataXML) // #nosec G705

	return err
}
