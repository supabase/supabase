package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

const dateInPast = "2001-02-03T04:05:06.789"
const dateInFarFuture = "2999-02-03T04:05:06.789"
const oneHour = "PT1H"

type SSOTestSuite struct {
	suite.Suite
	API      *API
	Config   *conf.GlobalConfiguration
	AdminJWT string
}

func TestSSO(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &SSOTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	if config.SAML.Enabled {
		suite.Run(t, ts)
	}
}

func (ts *SSOTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	claims := &AccessTokenClaims{
		Role: "supabase_admin",
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err, "Error generating admin jwt")

	ts.AdminJWT = token
}

func (ts *SSOTestSuite) TestNonAdminJWT() {
	// TODO
}

func (ts *SSOTestSuite) TestAdminListEmptySSOProviders() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/admin/sso/providers", nil)
	req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
	w := httptest.NewRecorder()

	ts.API.handler.ServeHTTP(w, req)

	require.Equal(ts.T(), http.StatusOK, w.Code)

	body, err := io.ReadAll(w.Body)
	require.NoError(ts.T(), err)

	var result struct {
		Items     []interface{} `json:"items"`
		NextToken string        `json:"next_token"`
	}

	require.NoError(ts.T(), json.Unmarshal(body, &result))
	require.Equal(ts.T(), len(result.Items), 0)
	require.Equal(ts.T(), result.NextToken, "")
}

func (ts *SSOTestSuite) TestAdminGetSSOProviderNotExist() {
	examples := []struct {
		URL string
	}{
		{
			URL: "http://localhost/admin/sso/providers/not-a-uuid",
		},
		{
			URL: "http://localhost/admin/sso/providers/677477db-3f51-4038-bc05-c6bb9bdc3c32",
		},
	}

	for _, example := range examples {
		req := httptest.NewRequest(http.MethodGet, example.URL, nil)
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		require.Equal(ts.T(), http.StatusNotFound, w.Code)
	}
}

func configurableSAMLIDPMetadata(entityID, validUntil, cacheDuration string) string {
	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="%s" validUntil='%s' cacheDuration='%s'>
  <md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>MIIDdDCCAlygAwIBAgIGAYKSjRZiMA0GCSqGSIb3DQEBCwUAMHsxFDASBgNVBAoTC0dvb2dsZSBJ
bmMuMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MQ8wDQYDVQQDEwZHb29nbGUxGDAWBgNVBAsTD0dv
b2dsZSBGb3IgV29yazELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWEwHhcNMjIwODEy
MTQ1NDU1WhcNMjcwODExMTQ1NDU1WjB7MRQwEgYDVQQKEwtHb29nbGUgSW5jLjEWMBQGA1UEBxMN
TW91bnRhaW4gVmlldzEPMA0GA1UEAxMGR29vZ2xlMRgwFgYDVQQLEw9Hb29nbGUgRm9yIFdvcmsx
CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAlncFzErcnZm7ZWO71NZStnCIAoYNKf6Uw3LPLzcvk0YrA/eBC3PVDHSfahi+apGO
Ytdq7IQUvBdto3rJTvP49fjyO0WLbAbiPC+dILt2Gx9kttxpSp99Bf+8ObL/fTy5Y2oHbJBfBX1V
qfDQIY0fcej3AndFYUOE0gZXyeSbnROB8W1PzHxOc7rq1mlas0rvyja7AK4gwXjIwyIGsFDmHnve
buqWOYMzOT9oD+iQq9BWYVHkXGZn0BXzKtnw9w8I3IxQdndUoCl95pYRIvdl1b0dWdO9cXtSsTkL
kAa8B/mCQcF4W2M3t/yKtrcLcRTALg3/Hc+Xz+3BpY/fSDk1SwIDAQABMA0GCSqGSIb3DQEBCwUA
A4IBAQCER02WLf6bKwTGVD/3VTntetIiETuPs46Dum8blbsg+2BYdAHIQcB9cLuMRosIw0nYj54m
SfiyfoWGcx3CkMup1MtKyWu+SqDHl9Bpf+GFLG0ngKD/zB6xwpv/TCi+g/FBYe2TvzD6B1V0z7Vs
Xf+Gc2TWBKmCuKf/g2AUt7IQLpOaqxuJVoZjp4sEMov6d3FnaoHQEd0lg+XmnYfLNtwe3QRSU0BD
x6lVV4kXi0x0n198/gkjnA85rPZoZ6dmqHtkcM0Gabgg6KEE5ubSDlWDsdv27uANceCZAoxd1+in
4/KqqkhynnbJs7Op5ZX8cckiHGGTGHNb35kys/XukuCo</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="%s"/>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="%s"/>
  </md:IDPSSODescriptor>
</md:EntityDescriptor>`, entityID, validUntil, cacheDuration, entityID, entityID)

}

func (ts *SSOTestSuite) TestIsStaleSAMLMetadata() {

	// https://en.wikipedia.org/wiki/ISO_8601
	currentTime := time.Now()
	currentTimeAsISO8601 := currentTime.UTC().Format("2006-01-02T15:04:05Z07:00")
	examples := []struct {
		Description           string
		Metadata              []byte
		IsStale               bool
		CacheDurationExceeded bool
	}{
		{
			Description:           "Metadata is valid and within cache duration",
			Metadata:              []byte(configurableSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-B", dateInFarFuture, oneHour)),
			IsStale:               false,
			CacheDurationExceeded: false,
		},
		{

			Description:           "Metadata is valid but is a minute past cache duration",
			Metadata:              []byte(configurableSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-B", currentTimeAsISO8601, oneHour)),
			IsStale:               true,
			CacheDurationExceeded: true,
		},

		{
			Description:           "Metadata is invalid but within cache duration",
			Metadata:              []byte(configurableSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-B", dateInPast, oneHour)),
			IsStale:               true,
			CacheDurationExceeded: false,
		},
	}

	for _, example := range examples {
		metadata, err := parseSAMLMetadata(example.Metadata)
		require.NoError(ts.T(), err)
		provider := models.SAMLProvider{
			EntityID:    metadata.EntityID,
			MetadataXML: string(example.Metadata),
			UpdatedAt:   currentTime,
		}
		if example.CacheDurationExceeded {
			provider.UpdatedAt = currentTime.Add(-time.Minute * 59)
		}

		require.Equal(ts.T(), example.IsStale, IsSAMLMetadataStale(metadata, provider))
	}

}

func validSAMLIDPMetadata(entityID string) string {
	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="%s">
  <md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>MIIDdDCCAlygAwIBAgIGAYKSjRZiMA0GCSqGSIb3DQEBCwUAMHsxFDASBgNVBAoTC0dvb2dsZSBJ
bmMuMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MQ8wDQYDVQQDEwZHb29nbGUxGDAWBgNVBAsTD0dv
b2dsZSBGb3IgV29yazELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWEwHhcNMjIwODEy
MTQ1NDU1WhcNMjcwODExMTQ1NDU1WjB7MRQwEgYDVQQKEwtHb29nbGUgSW5jLjEWMBQGA1UEBxMN
TW91bnRhaW4gVmlldzEPMA0GA1UEAxMGR29vZ2xlMRgwFgYDVQQLEw9Hb29nbGUgRm9yIFdvcmsx
CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAlncFzErcnZm7ZWO71NZStnCIAoYNKf6Uw3LPLzcvk0YrA/eBC3PVDHSfahi+apGO
Ytdq7IQUvBdto3rJTvP49fjyO0WLbAbiPC+dILt2Gx9kttxpSp99Bf+8ObL/fTy5Y2oHbJBfBX1V
qfDQIY0fcej3AndFYUOE0gZXyeSbnROB8W1PzHxOc7rq1mlas0rvyja7AK4gwXjIwyIGsFDmHnve
buqWOYMzOT9oD+iQq9BWYVHkXGZn0BXzKtnw9w8I3IxQdndUoCl95pYRIvdl1b0dWdO9cXtSsTkL
kAa8B/mCQcF4W2M3t/yKtrcLcRTALg3/Hc+Xz+3BpY/fSDk1SwIDAQABMA0GCSqGSIb3DQEBCwUA
A4IBAQCER02WLf6bKwTGVD/3VTntetIiETuPs46Dum8blbsg+2BYdAHIQcB9cLuMRosIw0nYj54m
SfiyfoWGcx3CkMup1MtKyWu+SqDHl9Bpf+GFLG0ngKD/zB6xwpv/TCi+g/FBYe2TvzD6B1V0z7Vs
Xf+Gc2TWBKmCuKf/g2AUt7IQLpOaqxuJVoZjp4sEMov6d3FnaoHQEd0lg+XmnYfLNtwe3QRSU0BD
x6lVV4kXi0x0n198/gkjnA85rPZoZ6dmqHtkcM0Gabgg6KEE5ubSDlWDsdv27uANceCZAoxd1+in
4/KqqkhynnbJs7Op5ZX8cckiHGGTGHNb35kys/XukuCo</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="%s"/>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="%s"/>
  </md:IDPSSODescriptor>
</md:EntityDescriptor>`, entityID, entityID, entityID)
}

func (ts *SSOTestSuite) TestAdminCreateSSOProvider() {
	examples := []struct {
		StatusCode int
		Request    map[string]interface{}
	}{
		{
			StatusCode: http.StatusBadRequest,
			Request:    map[string]interface{}{},
		},
		{
			StatusCode: http.StatusBadRequest,
			Request: map[string]interface{}{
				"type": "saml",
			},
		},
		{
			StatusCode: http.StatusBadRequest,
			Request: map[string]interface{}{
				"type": "oidc",
			},
		},
		{
			StatusCode: http.StatusCreated,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-A"),
			},
		},
		{
			StatusCode: http.StatusCreated,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-B"),
			},
		},
		{
			StatusCode: http.StatusCreated,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-DUPLICATE"),
			},
		},
		{
			StatusCode: http.StatusCreated,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-WITH-ATTRIBUTE-MAPPING"),
				"attribute_mapping": map[string]interface{}{
					"keys": map[string]interface{}{
						"username": map[string]interface{}{
							"name": "mail",
						},
					},
				},
			},
		},
		{
			StatusCode: http.StatusUnprocessableEntity,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-DUPLICATE"),
			},
		},
		{
			StatusCode: http.StatusCreated,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-WITH-DOMAIN-A"),
				"domains": []string{
					"example.com",
				},
			},
		},
		{
			StatusCode: http.StatusBadRequest,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-WITH-DOMAIN-B"),
				"domains": []string{
					"example.com",
				},
			},
		},
		{
			StatusCode: http.StatusBadRequest,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_url": "https://accounts.google.com/o/saml2?idpid=EXAMPLE-WITH-METADATA-URL-TOO",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-WITH-METADATA-URL-TOO"),
			},
		},
		{
			StatusCode: http.StatusBadRequest,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_url": "http://accounts.google.com/o/saml2?idpid=EXAMPLE-WITH-METADATA-OVER-HTTP",
			},
		},
		{
			StatusCode: http.StatusBadRequest,
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_url": "https://accounts.google.com\\o/saml2?idpid=EXAMPLE-WITH-INVALID-METADATA-URL",
			},
		},
		// TODO: add example with metadata_url
	}

	for i, example := range examples {
		body, err := json.Marshal(example.Request)
		require.NoError(ts.T(), err)

		req := httptest.NewRequest(http.MethodPost, "http://localhost/admin/sso/providers", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		response, err := io.ReadAll(w.Body)
		require.NoError(ts.T(), err)

		require.Equal(ts.T(), example.StatusCode, w.Code, "Example %d failed with body %q", i, response)

		if example.StatusCode != http.StatusCreated {
			continue
		}

		// now check if the provider can be queried (GET)
		var provider struct {
			ID string `json:"id"`
		}

		require.NoError(ts.T(), json.Unmarshal(response, &provider))

		req = httptest.NewRequest(http.MethodGet, "http://localhost/admin/sso/providers/"+provider.ID, nil)
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w = httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		response, err = io.ReadAll(w.Body)
		require.NoError(ts.T(), err)

		require.Equal(ts.T(), http.StatusOK, w.Code)

		originalProviderID := provider.ID
		provider.ID = ""

		require.NoError(ts.T(), json.Unmarshal(response, &provider))
		require.Equal(ts.T(), provider.ID, originalProviderID)

		// now check if the provider can be queried (List)
		var providers struct {
			Items []struct {
				ID string `json:"id"`
			} `json:"items"`
		}

		req = httptest.NewRequest(http.MethodGet, "http://localhost/admin/sso/providers", nil)
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w = httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		response, err = io.ReadAll(w.Body)
		require.NoError(ts.T(), err)

		require.NoError(ts.T(), json.Unmarshal(response, &providers))

		contained := false
		for _, listProvider := range providers.Items {
			if listProvider.ID == provider.ID {
				contained = true
				break
			}
		}

		require.True(ts.T(), contained)
	}
}

func (ts *SSOTestSuite) TestAdminUpdateSSOProvider() {
	providers := []struct {
		ID      string
		Request map[string]interface{}
	}{
		{
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-A"),
			},
		},
		{
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-C"),
				"domains": []string{
					"example.com",
				},
			},
		},
	}

	for i, example := range providers {
		body, err := json.Marshal(example.Request)
		require.NoError(ts.T(), err)

		req := httptest.NewRequest(http.MethodPost, "http://localhost/admin/sso/providers", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		response, err := io.ReadAll(w.Body)
		require.NoError(ts.T(), err)

		var payload struct {
			ID string `json:"id"`
		}

		require.NoError(ts.T(), json.Unmarshal(response, &payload))

		providers[i].ID = payload.ID
	}

	examples := []struct {
		ID      string
		Status  int
		Request map[string]interface{}
	}{
		{
			ID:     providers[0].ID,
			Status: http.StatusBadRequest, // changing entity ID
			Request: map[string]interface{}{
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-B"),
			},
		},
		{
			ID:     providers[0].ID,
			Status: http.StatusBadRequest, // domain already exists
			Request: map[string]interface{}{
				"domains": []string{
					"example.com",
				},
			},
		},
		{
			ID:     providers[1].ID,
			Status: http.StatusOK,
			Request: map[string]interface{}{
				"domains": []string{
					"example.com",
					"example.org",
				},
			},
		},
		{
			ID:     providers[1].ID,
			Status: http.StatusOK,
			Request: map[string]interface{}{
				"attribute_mapping": map[string]interface{}{
					"keys": map[string]interface{}{
						"username": map[string]interface{}{
							"name": "mail",
						},
					},
				},
			},
		},
	}

	for _, example := range examples {
		body, err := json.Marshal(example.Request)
		require.NoError(ts.T(), err)

		req := httptest.NewRequest(http.MethodPut, "http://localhost/admin/sso/providers/"+example.ID, bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		require.Equal(ts.T(), w.Code, example.Status)
	}
}

func (ts *SSOTestSuite) TestAdminDeleteSSOProvider() {
	providers := []struct {
		ID      string
		Request map[string]interface{}
	}{
		{
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-A"),
			},
		},
	}

	for i, example := range providers {
		body, err := json.Marshal(example.Request)
		require.NoError(ts.T(), err)

		req := httptest.NewRequest(http.MethodPost, "http://localhost/admin/sso/providers", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		response, err := io.ReadAll(w.Body)
		require.NoError(ts.T(), err)

		var payload struct {
			ID string `json:"id"`
		}

		require.NoError(ts.T(), json.Unmarshal(response, &payload))

		providers[i].ID = payload.ID
	}

	examples := []struct {
		ID     string
		Status int
	}{
		{
			ID:     providers[0].ID,
			Status: http.StatusOK,
		},
	}

	for _, example := range examples {
		req := httptest.NewRequest(http.MethodDelete, "http://localhost/admin/sso/providers/"+example.ID, nil)
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		require.Equal(ts.T(), w.Code, example.Status)
	}

	check := []struct {
		ID string
	}{
		{
			ID: providers[0].ID,
		},
	}

	for _, example := range check {
		req := httptest.NewRequest(http.MethodGet, "http://localhost/admin/sso/providers/"+example.ID, nil)
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		require.Equal(ts.T(), http.StatusNotFound, w.Code)
	}
}

func (ts *SSOTestSuite) TestSingleSignOn() {
	providers := []struct {
		ID      string
		Request map[string]interface{}
	}{
		{
			// creates a SAML provider (EXAMPLE-A)
			// does not have a domain mapping
			Request: map[string]interface{}{
				"type":         "saml",
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-A"),
			},
		},
		{
			// creates a SAML provider (EXAMPLE-B)
			// does have a domain mapping on example.com
			Request: map[string]interface{}{
				"type": "saml",
				"domains": []string{
					"example.com",
				},
				"metadata_xml": validSAMLIDPMetadata("https://accounts.google.com/o/saml2?idpid=EXAMPLE-B"),
			},
		},
	}

	for i, example := range providers {
		body, err := json.Marshal(example.Request)
		require.NoError(ts.T(), err)

		req := httptest.NewRequest(http.MethodPost, "http://localhost/admin/sso/providers", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+ts.AdminJWT)
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		response, err := io.ReadAll(w.Body)
		require.NoError(ts.T(), err)

		var payload struct {
			ID string `json:"id"`
		}

		require.NoError(ts.T(), json.Unmarshal(response, &payload))

		providers[i].ID = payload.ID
	}

	examples := []struct {
		Code    int
		Request map[string]interface{}
		URL     string
	}{
		{
			// call /sso with provider_id (EXAMPLE-A)
			// should be successful and redirect to the EXAMPLE-A SSO URL
			Request: map[string]interface{}{
				"provider_id": providers[0].ID,
			},
			Code: http.StatusSeeOther,
			URL:  "https://accounts.google.com/o/saml2?idpid=EXAMPLE-A",
		},
		{
			// call /sso with provider_id (EXAMPLE-A) and SSO PKCE
			// should be successful and redirect to the EXAMPLE-A SSO URL
			Request: map[string]interface{}{
				"provider_id":           providers[0].ID,
				"code_challenge":        "vby3iMQ4XUuycKkEyNsYHXshPql1Dod7Ebey2iXTXm4",
				"code_challenge_method": "s256",
			},
			Code: http.StatusSeeOther,
			URL:  "https://accounts.google.com/o/saml2?idpid=EXAMPLE-A",
		},
		{
			// call /sso with domain=example.com (provider=EXAMPLE-B)
			// should be successful and redirect to the EXAMPLE-B SSO URL
			Request: map[string]interface{}{
				"domain": "example.com",
			},
			Code: http.StatusSeeOther,
			URL:  "https://accounts.google.com/o/saml2?idpid=EXAMPLE-B",
		},
		{
			// call /sso with domain=example.com (provider=EXAMPLE-B)
			// should be successful and redirect to the EXAMPLE-B SSO URL
			Request: map[string]interface{}{
				"domain":             "example.com",
				"skip_http_redirect": true,
			},
			Code: http.StatusOK,
			URL:  "https://accounts.google.com/o/saml2?idpid=EXAMPLE-B",
		},
		{
			// call /sso with domain=example.org (no such provider)
			// should be unsuccessful with 404
			Request: map[string]interface{}{
				"domain": "example.org",
			},
			Code: http.StatusNotFound,
		},
		{
			// call /sso with a provider_id=<random-uuid> (no such provider)
			// should be unsuccessful with 404
			Request: map[string]interface{}{
				"provider_id": "14d906bf-9bd5-4734-b7d1-3904e240610e",
			},
			Code: http.StatusNotFound,
		},
	}

	for _, example := range examples {
		body, err := json.Marshal(example.Request)
		require.NoError(ts.T(), err)

		req := httptest.NewRequest(http.MethodPost, "http://localhost/sso", bytes.NewBuffer(body))
		// no authorization header intentional, this is a login endpoint
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)

		require.Equal(ts.T(), w.Code, example.Code)

		locationURLString := ""

		switch example.Code {
		case http.StatusSeeOther:
			locationURLString = w.Header().Get("Location")
		case http.StatusOK:
			var response struct {
				URL string `json:"url"`
			}

			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&response))

			require.NotEmpty(ts.T(), response.URL)

			locationURLString = response.URL
		default:
			continue
		}

		locationURL, err := url.ParseRequestURI(locationURLString)
		require.NoError(ts.T(), err)

		locationQuery, err := url.ParseQuery(locationURL.RawQuery)

		require.NoError(ts.T(), err)

		samlQueryParams := []string{
			"SAMLRequest",
			"RelayState",
			"SigAlg",
			"Signature",
		}

		for _, param := range samlQueryParams {
			require.True(ts.T(), locationQuery.Has(param))
		}

		for _, param := range samlQueryParams {
			locationQuery.Del(param)
		}

		locationURL.RawQuery = locationQuery.Encode()

		require.Equal(ts.T(), locationURL.String(), example.URL)
	}
}

func TestSSOCreateParamsValidation(t *testing.T) {
	// TODO
}
