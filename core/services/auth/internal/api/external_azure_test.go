package api

import (
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/supabase/auth/internal/api/provider"
)

const (
	azureUser        string = `{"name":"Azure Test","email":"azure@example.com","sub":"azuretestid"}`
	azureUserNoEmail string = `{"name":"Azure Test","sub":"azuretestid"}`
)

func idTokenPrivateKey() *rsa.PrivateKey {
	// #nosec
	der, err := base64.StdEncoding.DecodeString("MIIEpAIBAAKCAQEAvklrFDsVgbhs3DOQICMqm4xdFoi/MHj/T6XH8S7wXWd0roqdWVarwCLV4y3DILkLre4PzNK+hEY5NAnoAKrsCMyyCb4Wdl8HCdJk4ojDqAig+DJw67imqZoxJMFJyIhfMJhwVK1V8GRUPATn855rygLo7wThahMJeEHNiJr3TtV6Rf35KSs7DuyoWIUSjISYabQozKqIvpdUpTpSqjlOQvjdAxggRyycBZSgLzjWhsA8metnAMO48bX4bgiHLR6Kzu/dfPyEVPfgeYpA2ebIY6GzIUxVS0yX8+ExA6jeLCkuepjLHuz5XCJtd6zzGDXr1eX7nA6ZIeUNdFbWRDnPawIDAQABAoIBABH4Qvl1HvHSJc2hvPGcAJER71SKc2uzcYDnCfu30BEyDO3Sv0tJiQyq/YHnt26mqviw66MPH9jD/PDyIou1mHa4RfPvlJV3IeYGjWprOfbrYbAuq0VHec24dv2el0YtwreHHcyRVfVOtDm6yODTzCAWqEKyNktbIuDNbgiBgetayaJecDRoFMF9TOCeMCL92iZytzAr7fi+JWtLkRS/GZRIBjbr8LJ/ueYoCRmIx3MIw0WdPp7v2ZfeRTxP7LxJZ+MAsrq2pstmZYP7K0305e0bCJX1HexfXLs2Ul7u8zaxrXL8zw4/9+/GMsAeU3ffCVnGz/RKL5+T6iuz2RotjFECgYEA+Xk7DGwRXfDg9xba1GVFGeiC4nybqZw/RfZKcz/RRJWSHRJV/ps1avtbca3B19rjI6rewZMO1NWNv/tI2BdXP8vAKUnI9OHJZ+J/eZzmqDE6qu0v0ddRFUDzCMWE0j8BjrUdy44n4NQgopcv14u0iyr9tuhGO6YXn2SuuvEkZokCgYEAw0PNnT55kpkEhXSp7An2hdBJEub9ST7hS6Kcd8let62/qUZ/t5jWigSkWC1A2bMtH55+LgudIFjiehwVzRs7jym2j4jkKZGonyAX1l9IWgXwKl7Pn49lEQH5Yk6MhnXdyLGoFTzXiUyk/fKvgXX7jow1bD3j6sAc8P495I7TyVMCgYAHg6VJrH+har37805IE3zPWPeIRuSRaUlmnBKGAigVfsPV6FV6w8YKIOQSOn+aNtecnWr0Pa+2rXAFllYNXDaej06Mb9KDvcFJRcM9MIKqEkGIIHjOQ0QH9drcKsbjZk5vs/jfxrpgxULuYstoHKclgff+aGSlK02O2YOB0f2csQKBgQCEC/MdNiWCpKXxFg7fB3HF1i/Eb56zjKlQu7uyKeQ6tG3bLEisQNg8Z5034Apt7gRC0KyluMbeHB2z1BBOLu9dBill8X3SOqVcTpiwKKlF76QVEx622YLQOJSMDXBscYK0+KchDY74U3N0JEzZcI7YPCrYcxYRJy+rLVNvn8LK7wKBgQDE8THsZ589e10F0zDBvPK56o8PJnPeH71sgdM2Co4oLzBJ6g0rpJOKfcc03fLHsoJVOAya9WZeIy6K8+WVdcPTadR07S4p8/tcK1eguu5qlmCUOzswrTKAaJoIHO7cddQp3nySIqgYtkGdHKuvlQDMQkEKJS0meOm+vdeAG2rkaA==")
	if err != nil {
		panic(err)
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(der)
	if err != nil {
		panic(err)
	}

	privateKey.E = 65537

	return privateKey
}

func setupAzureOverrideVerifiers() {
	provider.OverrideVerifiers["https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/authorize"] = func(ctx context.Context, config *oidc.Config) *oidc.IDTokenVerifier {
		pk := idTokenPrivateKey()

		return oidc.NewVerifier(
			provider.IssuerAzureMicrosoft,
			&oidc.StaticKeySet{
				PublicKeys: []crypto.PublicKey{
					&pk.PublicKey,
				},
			},
			config,
		)
	}
}

func mintIDToken(user string) string {
	var idToken struct {
		Issuer    string `json:"iss"`
		IssuedAt  int    `json:"iat"`
		ExpiresAt int    `json:"exp"`
		Audience  string `json:"aud"`

		Sub     string `json:"sub,omitempty"`
		Name    string `json:"name,omitempty"`
		Email   string `json:"email,omitempty"`
		XmsEdov any    `json:"xms_edov,omitempty"`
	}

	if err := json.Unmarshal([]byte(user), &idToken); err != nil {
		panic(err)
	}

	now := time.Now()

	idToken.Issuer = provider.IssuerAzureMicrosoft
	idToken.IssuedAt = int(now.Unix())
	idToken.ExpiresAt = int(now.Unix() + 60*60)
	idToken.Audience = "testclientid"

	header := base64.RawURLEncoding.EncodeToString([]byte(`{"typ":"JWT","alg":"RS256"}`))

	data, err := json.Marshal(idToken)
	if err != nil {
		panic(err)
	}

	payload := base64.RawURLEncoding.EncodeToString(data)
	sum := sha256.Sum256([]byte(header + "." + payload))

	pk := idTokenPrivateKey()
	sig, err := rsa.SignPKCS1v15(nil, pk, crypto.SHA256, sum[:])
	if err != nil {
		panic(err)
	}

	token := header + "." + payload + "." + base64.RawURLEncoding.EncodeToString(sig)

	return token
}

func (ts *ExternalTestSuite) TestSignupExternalAzure() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=azure", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Azure.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Azure.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("openid", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "azure")
}

func AzureTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, code string, user string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth2/v2.0/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Azure.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprintf(w, `{"access_token":"azure_token","expires_in":100000,"id_token":%q}`, mintIDToken(user))
		default:
			w.WriteHeader(500)
			ts.Fail("unknown azure oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Azure.URL = server.URL
	ts.Config.External.Azure.ApiURL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalAzure_AuthorizationCode() {
	setupAzureOverrideVerifiers()

	ts.Config.DisableSignup = false
	tokenCount := 0
	code := "authcode"
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUser)
	defer server.Close()

	u := performAuthorization(ts, "azure", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, -1, "azure@example.com", "Azure Test", "azuretestid", "")
}

func (ts *ExternalTestSuite) TestSignupExternalAzureDisableSignupErrorWhenNoUser() {
	setupAzureOverrideVerifiers()

	ts.Config.DisableSignup = true
	tokenCount := 0
	code := "authcode"
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUser)
	defer server.Close()

	u := performAuthorization(ts, "azure", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "azure@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalAzureDisableSignupErrorWhenNoEmail() {
	setupAzureOverrideVerifiers()

	ts.Config.DisableSignup = true
	tokenCount := 0
	code := "authcode"
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUserNoEmail)
	defer server.Close()

	u := performAuthorization(ts, "azure", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "azure@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalAzureDisableSignupSuccessWithPrimaryEmail() {
	setupAzureOverrideVerifiers()

	ts.Config.DisableSignup = true

	ts.createUser("azuretestid", "azure@example.com", "Azure Test", "", "")

	tokenCount := 0
	code := "authcode"
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUser)
	defer server.Close()

	u := performAuthorization(ts, "azure", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, -1, "azure@example.com", "Azure Test", "azuretestid", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalAzureSuccessWhenMatchingToken() {
	setupAzureOverrideVerifiers()

	// name should be populated from Azure API
	ts.createUser("azuretestid", "azure@example.com", "", "", "invite_token")

	tokenCount := 0
	code := "authcode"
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUser)
	defer server.Close()

	u := performAuthorization(ts, "azure", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, -1, "azure@example.com", "Azure Test", "azuretestid", "")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalAzureErrorWhenNoMatchingToken() {
	setupAzureOverrideVerifiers()

	tokenCount := 0
	code := "authcode"
	azureUser := `{"name":"Azure Test","avatar":{"href":"http://example.com/avatar"}}`
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "azure", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalAzureErrorWhenWrongToken() {
	setupAzureOverrideVerifiers()

	ts.createUser("azuretestid", "azure@example.com", "", "", "invite_token")

	tokenCount := 0
	code := "authcode"
	azureUser := `{"name":"Azure Test","avatar":{"href":"http://example.com/avatar"}}`
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUser)
	defer server.Close()

	w := performAuthorizationRequest(ts, "azure", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalAzureErrorWhenEmailDoesntMatch() {
	setupAzureOverrideVerifiers()

	ts.createUser("azuretestid", "azure@example.com", "", "", "invite_token")

	tokenCount := 0
	code := "authcode"
	azureUser := `{"name":"Azure Test", "email":"other@example.com", "avatar":{"href":"http://example.com/avatar"}}`
	server := AzureTestSignupSetup(ts, &tokenCount, code, azureUser)
	defer server.Close()

	u := performAuthorization(ts, "azure", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}
