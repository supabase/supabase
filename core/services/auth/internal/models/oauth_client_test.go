package models

import (
	"crypto/sha256"
	"encoding/base64"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type OAuthServerClientTestSuite struct {
	suite.Suite
	db *storage.Connection
}

// testHashClientSecret is a test helper that hashes a client secret using the same method as the service
func testHashClientSecret(secret string) (string, error) {
	sum := sha256.Sum256([]byte(secret))
	return base64.RawURLEncoding.EncodeToString(sum[:]), nil
}

func (ts *OAuthServerClientTestSuite) SetupTest() {
	_ = TruncateAll(ts.db)
}

func TestOAuthServerClient(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	ts := &OAuthServerClientTestSuite{
		db: conn,
	}
	defer ts.db.Close()

	suite.Run(t, ts)
}

func (ts *OAuthServerClientTestSuite) TestOAuthServerClientValidation() {
	testClientName := "Test Client"
	testSecretHash, _ := testHashClientSecret("test_secret")
	validClient := &OAuthServerClient{
		ID:               uuid.Must(uuid.NewV4()),
		ClientName:       &testClientName,
		RegistrationType: "dynamic",
		ClientType:       OAuthServerClientTypeConfidential,
		ClientSecretHash: testSecretHash,
		RedirectURIs:     "https://example.com/callback",
		GrantTypes:       "authorization_code,refresh_token",
	}

	// Test valid client
	err := validClient.Validate()
	assert.NoError(ts.T(), err)

	// Test missing id
	invalidClient := *validClient
	invalidClient.ID = uuid.Nil
	err = invalidClient.Validate()
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "id is required")

	// Test invalid registration type
	invalidClient = *validClient
	invalidClient.RegistrationType = "invalid"
	err = invalidClient.Validate()
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "registration_type must be 'dynamic' or 'manual'")

	// Test missing redirect URIs
	invalidClient = *validClient
	invalidClient.RedirectURIs = ""
	err = invalidClient.Validate()
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "at least one redirect_uri is required")
}

func (ts *OAuthServerClientTestSuite) TestRedirectURIValidation() {
	validURIs := []string{
		"https://example.com/callback",
		"https://app.example.com/auth/callback",
		"http://localhost:3000/callback",
		"http://127.0.0.1:8080/auth",
	}

	invalidURIs := []string{
		"",                                  // empty
		"not-a-url",                         // not a URL
		"example.com/callback",              // missing scheme
		"ftp://example.com/callback",        // invalid scheme
		"https://example.com/callback#hash", // has fragment
		"http://example.com/callback",       // HTTP for non-localhost
	}

	// Test valid URIs
	for _, uri := range validURIs {
		err := validateRedirectURI(uri)
		assert.NoError(ts.T(), err, "URI should be valid: %s", uri)
	}

	// Test invalid URIs
	for _, uri := range invalidURIs {
		err := validateRedirectURI(uri)
		assert.Error(ts.T(), err, "URI should be invalid: %s", uri)
	}
}

func (ts *OAuthServerClientTestSuite) TestRedirectURIHelpers() {
	client := &OAuthServerClient{}

	// Test setting and getting redirect URIs
	uris := []string{
		"https://example.com/callback",
		"https://app.example.com/auth",
		"http://localhost:3000/callback",
	}

	client.SetRedirectURIs(uris)
	assert.Equal(ts.T(), "https://example.com/callback,https://app.example.com/auth,http://localhost:3000/callback", client.RedirectURIs)

	retrievedURIs := client.GetRedirectURIs()
	assert.Equal(ts.T(), uris, retrievedURIs)

	// Test empty URIs
	client.SetRedirectURIs([]string{})
	assert.Equal(ts.T(), "", client.RedirectURIs)

	retrievedURIs = client.GetRedirectURIs()
	assert.Equal(ts.T(), []string{}, retrievedURIs)

	// Test getting URIs from empty string
	client.RedirectURIs = ""
	retrievedURIs = client.GetRedirectURIs()
	assert.Equal(ts.T(), []string{}, retrievedURIs)
}

func (ts *OAuthServerClientTestSuite) TestCreateOAuthServerClient() {
	testAppName := "Test Application"
	testSecretHash, _ := testHashClientSecret("test_secret")
	client := &OAuthServerClient{
		ID:               uuid.Must(uuid.NewV4()),
		ClientName:       &testAppName,
		GrantTypes:       "authorization_code,refresh_token",
		RegistrationType: "dynamic",
		ClientType:       OAuthServerClientTypeConfidential,
		ClientSecretHash: testSecretHash,
		RedirectURIs:     "https://example.com/callback",
	}

	err := CreateOAuthServerClient(ts.db, client)
	require.NoError(ts.T(), err)

	// Verify client was created with generated ID and timestamps
	assert.NotEqual(ts.T(), uuid.Nil, client.ID)
	assert.NotZero(ts.T(), client.CreatedAt)
	assert.NotZero(ts.T(), client.UpdatedAt)
}

func (ts *OAuthServerClientTestSuite) TestCreateOAuthServerClientValidation() {
	invalidClient := &OAuthServerClient{
		ID: uuid.Must(uuid.NewV4()), // Provide ID so validation gets to other fields
		// Missing required fields like RegistrationType
	}

	err := CreateOAuthServerClient(ts.db, invalidClient)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "registration_type must be 'dynamic' or 'manual'")
}

func (ts *OAuthServerClientTestSuite) TestFindOAuthServerClientByID() {
	// Create a test client
	testName := "Find By ID Test"
	testSecretHash, _ := testHashClientSecret("test_secret")
	client := &OAuthServerClient{
		ID:               uuid.Must(uuid.NewV4()),
		ClientName:       &testName,
		GrantTypes:       "authorization_code,refresh_token",
		RegistrationType: "dynamic",
		ClientType:       OAuthServerClientTypeConfidential,
		ClientSecretHash: testSecretHash,
		RedirectURIs:     "https://example.com/callback",
	}

	err := CreateOAuthServerClient(ts.db, client)
	require.NoError(ts.T(), err)

	// Find by ID
	foundClient, err := FindOAuthServerClientByID(ts.db, client.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), client.ID, foundClient.ID)
	assert.Equal(ts.T(), *client.ClientName, *foundClient.ClientName)

	// Test not found
	_, err = FindOAuthServerClientByID(ts.db, uuid.Must(uuid.NewV4()))
	assert.Error(ts.T(), err)
	assert.True(ts.T(), IsNotFoundError(err))
}

func (ts *OAuthServerClientTestSuite) TestFindOAuthServerClientByClientID() {
	// Create a test client
	testName := "Find By Client ID Test"
	testSecretHash, _ := testHashClientSecret("test_secret")
	client := &OAuthServerClient{
		ID:               uuid.Must(uuid.NewV4()),
		ClientName:       &testName,
		GrantTypes:       "authorization_code,refresh_token",
		RegistrationType: "manual",
		ClientType:       OAuthServerClientTypeConfidential,
		ClientSecretHash: testSecretHash,
		RedirectURIs:     "https://example.com/callback",
	}

	err := CreateOAuthServerClient(ts.db, client)
	require.NoError(ts.T(), err)

	// Find by ID (which is now the client_id)
	foundClient, err := FindOAuthServerClientByID(ts.db, client.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), client.ID, foundClient.ID)
	assert.Equal(ts.T(), *client.ClientName, *foundClient.ClientName)

	// Test not found
	_, err = FindOAuthServerClientByID(ts.db, uuid.Must(uuid.NewV4()))
	assert.Error(ts.T(), err)
	assert.True(ts.T(), IsNotFoundError(err))
}

func (ts *OAuthServerClientTestSuite) TestUpdateOAuthServerClient() {
	// Create a test client
	originalName := "Original Name"
	testSecretHash, _ := testHashClientSecret("test_secret")
	client := &OAuthServerClient{
		ID:               uuid.Must(uuid.NewV4()),
		ClientName:       &originalName,
		GrantTypes:       "authorization_code,refresh_token",
		RegistrationType: "dynamic",
		ClientType:       OAuthServerClientTypeConfidential,
		ClientSecretHash: testSecretHash,
		RedirectURIs:     "https://example.com/callback",
	}

	err := CreateOAuthServerClient(ts.db, client)
	require.NoError(ts.T(), err)
	originalUpdatedAt := client.UpdatedAt

	// Update the client
	updatedName := "Updated Name"
	client.ClientName = &updatedName
	// client.Description removed - no longer exists
	client.SetRedirectURIs([]string{"https://updated.example.com/callback"})

	err = UpdateOAuthServerClient(ts.db, client)
	require.NoError(ts.T(), err)

	// Verify updates
	updatedClient, err := FindOAuthServerClientByID(ts.db, client.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), "Updated Name", *updatedClient.ClientName)
	// assert.Equal(ts.T(), "Updated description", updatedClient.Description.String()) // Description field removed
	assert.Equal(ts.T(), []string{"https://updated.example.com/callback"}, updatedClient.GetRedirectURIs())
	assert.True(ts.T(), updatedClient.UpdatedAt.After(originalUpdatedAt))
}

func (ts *OAuthServerClientTestSuite) TestClientSecretHashing() {
	// Test that secrets can be properly hashed and validated
	secret := "super_secret_client_secret"

	hash, err := testHashClientSecret(secret)
	require.NoError(ts.T(), err)

	// Test correct secret validates - hash the provided secret and compare
	calc := sha256.Sum256([]byte(secret))
	stored, err := base64.RawURLEncoding.DecodeString(hash)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), calc[:], stored)

	// Test incorrect secret fails
	wrongCalc := sha256.Sum256([]byte("wrong_secret"))
	assert.NotEqual(ts.T(), wrongCalc[:], stored)
}

func (ts *OAuthServerClientTestSuite) TestSoftDelete() {
	// Create a test client
	testName := "Soft Delete Test"
	testSecretHash, _ := testHashClientSecret("test_secret")
	client := &OAuthServerClient{
		ID:               uuid.Must(uuid.NewV4()),
		ClientName:       &testName,
		GrantTypes:       "authorization_code,refresh_token",
		RegistrationType: "dynamic",
		ClientType:       OAuthServerClientTypeConfidential,
		ClientSecretHash: testSecretHash,
		RedirectURIs:     "https://example.com/callback",
	}

	err := CreateOAuthServerClient(ts.db, client)
	require.NoError(ts.T(), err)

	// Soft delete by setting deleted_at
	now := time.Now()
	client.DeletedAt = &now

	err = UpdateOAuthServerClient(ts.db, client)
	require.NoError(ts.T(), err)

	// Verify client is not found in normal queries (which filter out deleted)
	_, err = FindOAuthServerClientByID(ts.db, client.ID)
	assert.Error(ts.T(), err)
	assert.True(ts.T(), IsNotFoundError(err))
}
