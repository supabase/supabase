package oauthserver

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/supabase/auth/internal/models"
)

// ClientCredentials represents the extracted client credentials and authentication method used
type ClientCredentials struct {
	ClientID     string
	ClientSecret string
	AuthMethod   string
}

// ExtractClientCredentials extracts OAuth client credentials from the request
// Supports Basic auth header, form body parameters, and JSON body parameters
func ExtractClientCredentials(r *http.Request) (*ClientCredentials, error) {
	creds := &ClientCredentials{}

	// First, try Basic auth header: Authorization: Basic base64(client_id:client_secret)
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Basic ") {
		encoded := strings.TrimPrefix(authHeader, "Basic ")
		decoded, err := base64.StdEncoding.DecodeString(encoded)
		if err != nil {
			return nil, errors.New("invalid basic auth encoding")
		}

		credentials := string(decoded)
		parts := strings.SplitN(credentials, ":", 2)
		if len(parts) != 2 {
			return nil, errors.New("invalid basic auth format")
		}

		creds.ClientID = parts[0]
		creds.ClientSecret = parts[1]
		creds.AuthMethod = models.TokenEndpointAuthMethodClientSecretBasic
		return creds, nil
	}

	// Check Content-Type to determine how to parse body parameters
	contentType := r.Header.Get("Content-Type")
	if strings.Contains(contentType, "application/json") {
		// Parse JSON body
		body, err := io.ReadAll(r.Body)
		if err != nil {
			return nil, errors.New("failed to read request body")
		}
		// Restore the body so other handlers can read it
		r.Body = io.NopCloser(bytes.NewBuffer(body))

		var jsonData struct {
			ClientID     string `json:"client_id"`
			ClientSecret string `json:"client_secret"`
		}
		if err := json.Unmarshal(body, &jsonData); err != nil {
			return nil, errors.New("failed to parse JSON body")
		}

		creds.ClientID = jsonData.ClientID
		creds.ClientSecret = jsonData.ClientSecret
	} else {
		// Fall back to form parameters
		if err := r.ParseForm(); err != nil {
			return nil, errors.New("failed to parse form")
		}

		creds.ClientID = r.FormValue("client_id")
		creds.ClientSecret = r.FormValue("client_secret")
	}

	// return error if client_id is not provided
	if creds.ClientID == "" {
		return nil, errors.New("client_id is required")
	}

	// Determine auth method based on presence of client_secret in body
	if creds.ClientSecret != "" {
		creds.AuthMethod = models.TokenEndpointAuthMethodClientSecretPost
	} else {
		creds.AuthMethod = models.TokenEndpointAuthMethodNone
	}

	return creds, nil
}
