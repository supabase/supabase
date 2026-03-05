---
id: 'oauth-server-flows'
title: 'OAuth 2.1 Flows'
description: 'Understanding the authorization code and refresh token flows with OpenID Connect'
---

Supabase Auth implements OAuth 2.1 with OpenID Connect (OIDC), supporting the authorization code flow with PKCE and refresh token flow. This guide explains how these flows work in detail.

<Admonition type="note">

This guide explains the OAuth 2.1 flows for **third-party client applications** that authenticate with your Supabase project. These flows require custom implementation and are not available in the `@supabase/supabase-js` library. The `supabase-js` library is for authenticating **with** Supabase Auth as an identity provider, not for building your own OAuth server.

</Admonition>

## Supported grant types

Supabase Auth supports two OAuth 2.1 grant types:

1. **Authorization Code with PKCE** (`authorization_code`) - For obtaining initial access tokens
2. **Refresh Token** (`refresh_token`) - For obtaining new access tokens without re-authentication

<Admonition type="note">

Other grant types like `client_credentials` or `password` are not supported.

</Admonition>

## Authorization code flow with PKCE

The authorization code flow with PKCE (Proof Key for Code Exchange) is the recommended flow for all OAuth clients, including single-page applications, mobile apps, and server-side applications.

### How it works

The flow consists of several steps:

1. **Client initiates authorization** - Third-party app redirects user to Supabase Auth's authorize endpoint
2. **Supabase validates and redirects** - Supabase Auth validates OAuth parameters and redirects user to your configured authorization URL
3. **User authenticates and authorizes** - Your frontend checks if user is logged in, shows consent screen, and handles approval/denial
4. **Authorization code issued** - Supabase Auth generates a short-lived authorization code and redirects back to client
5. **Code exchange** - Client exchanges the code for tokens
6. **Access granted** - Client receives access token, refresh token, and ID token

### Flow diagram

Here's a visual representation of the complete authorization code flow:

```
┌─────────────┐              ┌──────────────────┐              ┌──────────────────┐
│             │              │                  │              │                  │
│   Client    │              │   Your Auth UI   │              │  Supabase Auth   │
│     App     │              │   (Frontend)     │              │                  │
│             │              │                  │              │                  │
└──────┬──────┘              └────────┬─────────┘              └────────┬─────────┘
       │                              │                                 │
       │  1. Generate PKCE params                                       │
       │     (code_verifier, code_challenge)                            │
       │                              │                                 │
       │  2. Redirect to /oauth/authorize with code_challenge           │
       ├────────────────────────────────────────────────────────────────>│
       │                              │                                 │
       │                              │  3. Validate params & redirect  │
       │                              │     to authorization_path       │
       │                              │<────────────────────────────────┤
       │                              │                                 │
       │                              │  4. getAuthorizationDetails()   │
       │                              ├────────────────────────────────>│
       │                              │  Return client info             │
       │                              │<────────────────────────────────┤
       │                              │                                 │
       │                              │  5. User login & consent        │
       │                              │                                 │
       │                              │  6. approveAuthorization()      │
       │                              ├────────────────────────────────>│
       │                              │  Return redirect_to with code   │
       │                              │<────────────────────────────────┤
       │                              │                                 │
       │  7. Redirect to client callback with code                      │
       │<───────────────────────────────────────────────────────────────┤
       │                              │                                 │
       │  8. Exchange code for tokens (POST /oauth/token)               │
       │     with code_verifier                                         │
       ├────────────────────────────────────────────────────────────────>│
       │                              │                                 │
       │  9. Return tokens (access, refresh, ID)                        │
       │<────────────────────────────────────────────────────────────────┤
       │                              │                                 │
       │  10. Access resources with access_token                        │
       │                              │                                 │
       │  11. Refresh tokens (POST /oauth/token with refresh_token)     │
       ├────────────────────────────────────────────────────────────────>│
       │                              │                                 │
       │  12. Return new tokens                                         │
       │<────────────────────────────────────────────────────────────────┤
       │                              │                                 │
```

**Key points:**

- Third-party client redirects user to **Supabase Auth's authorize endpoint** (not directly to your UI)
- Supabase Auth validates OAuth parameters and redirects to **your authorization path**
- Your frontend UI handles authentication and consent using `supabase-js` OAuth methods
- Supabase Auth handles all backend OAuth logic (code generation, token issuance)

### Step 1: Generate PKCE parameters

Before initiating the flow, the client must generate PKCE parameters:

```javascript
// Generate a random code verifier (43-128 characters)
function generateCodeVerifier() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

// Create code challenge from verifier
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(hash))
}

function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Generate and store verifier (you'll need it later)
const codeVerifier = generateCodeVerifier()
sessionStorage.setItem('code_verifier', codeVerifier)

// Generate challenge to send in authorization request
const codeChallenge = await generateCodeChallenge(codeVerifier)
```

### Step 2: Authorization request

The client redirects the user to your authorization endpoint with the following parameters:

```
https://<project-ref>.supabase.co/auth/v1/oauth/authorize?
  response_type=code
  &client_id=<client-id>
  &redirect_uri=<configured-redirect-uri>
  &state=<random-state>
  &code_challenge=<code-challenge>
  &code_challenge_method=S256
```

#### Required parameters

| Parameter               | Description                                  |
| ----------------------- | -------------------------------------------- |
| `response_type`         | Must be `code` for authorization code flow   |
| `client_id`             | The client ID from registration              |
| `redirect_uri`          | Must exactly match a registered redirect URI |
| `code_challenge`        | The generated code challenge                 |
| `code_challenge_method` | Must be `S256` (SHA-256)                     |

#### Optional parameters

| Parameter | Description                                                                                                                                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state`   | Random string to prevent CSRF attacks (highly recommended)                                                                                                                                                                                                                                                                   |
| `scope`   | Space-separated list of scopes (e.g., `openid email profile phone`). Requested scopes will be included in the access token and control what information is returned by the UserInfo endpoint. Default scope when none provided is `email`. If the `openid` scope is requested, an ID token will be included in the response. |
| `nonce`   | Random string for replay attack protection. If provided, will be included in the ID token.                                                                                                                                                                                                                                   |

<Admonition type="caution">

Always include a `state` parameter to protect against CSRF attacks. Generate a random string, store it in session storage, and verify it matches when the user returns.

</Admonition>

### Step 3: User authentication and consent

After receiving the authorization request, Supabase Auth validates the OAuth parameters (client_id, redirect_uri, PKCE, etc.) and then redirects the user to your configured **authorization path** (e.g., `https://example.com/oauth/consent?authorization_id=<id>`).

The URL will contain an `authorization_id` query parameter that identifies this authorization request.

Your frontend application at the authorization path should:

1. **Extract authorization_id** - Get the `authorization_id` from the URL query parameters
2. **Fetch authorization details** - Call `supabase.auth.oauth.getAuthorizationDetails(authorization_id)` to retrieve information about the OAuth client and request parameters
3. **Check user authentication** - Verify if the user is logged in; if not, redirect to your login page (preserving the full authorization path including the `authorization_id`). After successful login, redirect the user back to the authorization path with the same `authorization_id` query parameter
4. **Display consent screen** - Show the user information about the requesting client (name, redirect URI, scopes)
5. **Handle user decision** - When the user approves or denies:
   - Call `supabase.auth.oauth.approveAuthorization(authorization_id)` to approve
   - Call `supabase.auth.oauth.denyAuthorization(authorization_id)` to deny
   - Redirect user to the returned `redirect_to` URL

This is a **frontend implementation** using `supabase-js`. Supabase Auth handles all the backend OAuth logic (generating authorization codes, validating requests, etc.) after you call the approve/deny methods.

See the [Getting Started guide](/docs/guides/auth/oauth-server/getting-started#example-authorization-ui) for complete implementation examples.

### Step 4: Authorization code issued

If the user approves access, Supabase Auth redirects back to the client's redirect URI with an authorization code:

```
https://client-app.com/callback?
  code=<authorization-code>
  &state=<state-from-request>
```

The authorization code is:

- **Short-lived** - Valid for 10 minutes
- **Single-use** - Can only be exchanged once
- **Bound to PKCE** - Can only be exchanged with the correct code verifier

If the user denies access, Supabase Auth redirects with error information in query parameters:

```
https://client-app.com/callback?
  error=access_denied
  &error_description=The+user+denied+the+authorization+request
  &state=<state-from-request>
```

The error parameters allow clients to display relevant error messages to users:

| Parameter           | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `error`             | Error code (e.g., `access_denied`, `invalid_request`, `server_error`) |
| `error_description` | Human-readable error description explaining what went wrong           |
| `state`             | The state parameter from the original request (for CSRF protection)   |

### Step 5: Token exchange

The client exchanges the authorization code for tokens by making a POST request to the token endpoint. How the client authenticates depends on its `token_endpoint_auth_method` (set during [client registration](/docs/guides/auth/oauth-server/getting-started#token-endpoint-authentication-method)).

#### Public clients (`token_endpoint_auth_method: none`)

Public clients send only the `client_id` in the request body with no secret:

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code=<authorization-code>' \
  -d 'client_id=<client-id>' \
  -d 'redirect_uri=<redirect-uri>' \
  -d 'code_verifier=<code-verifier>'
```

#### Confidential clients (`token_endpoint_auth_method: client_secret_basic`)

This is the **default** for confidential clients. Credentials are sent via the `Authorization` header using HTTP Basic authentication (base64-encoded `client_id:client_secret`):

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u '<client-id>:<client-secret>' \
  -d 'grant_type=authorization_code' \
  -d 'code=<authorization-code>' \
  -d 'redirect_uri=<redirect-uri>' \
  -d 'code_verifier=<code-verifier>'
```

<Admonition type="note">

The `-u` flag in cURL automatically encodes the credentials and sets the `Authorization: Basic <base64(client_id:client_secret)>` header. If you're not using cURL, you must base64-encode the `client_id:client_secret` string yourself.

</Admonition>

#### Confidential clients (`token_endpoint_auth_method: client_secret_post`)

Credentials are sent as form parameters in the request body:

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code=<authorization-code>' \
  -d 'client_id=<client-id>' \
  -d 'client_secret=<client-secret>' \
  -d 'redirect_uri=<redirect-uri>' \
  -d 'code_verifier=<code-verifier>'
```

#### Example in JavaScript

```javascript
// Retrieve the code verifier from storage
const codeVerifier = sessionStorage.getItem('code_verifier')

// --- Public clients (token_endpoint_auth_method: none) ---
const response = await fetch(`https://<project-ref>.supabase.co/auth/v1/oauth/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: '<client-id>',
    redirect_uri: '<redirect-uri>',
    code_verifier: codeVerifier,
  }),
})

// --- Confidential clients (token_endpoint_auth_method: client_secret_basic) ---
const response = await fetch(`https://<project-ref>.supabase.co/auth/v1/oauth/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: 'Basic ' + btoa('<client-id>:<client-secret>'),
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: '<redirect-uri>',
    code_verifier: codeVerifier,
  }),
})

// --- Confidential clients (token_endpoint_auth_method: client_secret_post) ---
const response = await fetch(`https://<project-ref>.supabase.co/auth/v1/oauth/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: '<client-id>',
    client_secret: '<client-secret>',
    redirect_uri: '<redirect-uri>',
    code_verifier: codeVerifier,
  }),
})

const tokens = await response.json()
```

### Step 6: Token response

On success, Supabase Auth returns a JSON response with tokens:

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "MXff...",
  "scope": "openid email profile",
  "id_token": "eyJhbGc..."
}
```

| Field           | Description                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `access_token`  | JWT access token for accessing resources                                                             |
| `token_type`    | Always `bearer`                                                                                      |
| `expires_in`    | Token lifetime in seconds (default: 3600)                                                            |
| `refresh_token` | Token for obtaining new access tokens                                                                |
| `scope`         | Granted scopes from the authorization request                                                        |
| `id_token`      | OpenID Connect ID token (included only if `openid` scope was requested in the authorization request) |

## Access token structure

Access tokens are JWTs containing standard Supabase claims plus OAuth-specific claims:

```json
{
  "aud": "authenticated",
  "exp": 1735819200,
  "iat": 1735815600,
  "iss": "https://<project-ref>.supabase.co/auth/v1",
  "sub": "user-uuid",
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {},
  "role": "authenticated",
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1735815600
    }
  ],
  "session_id": "session-uuid",
  "client_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d"
}
```

### OAuth-specific claims

| Claim       | Description                                  |
| ----------- | -------------------------------------------- |
| `client_id` | The OAuth client ID that obtained this token |

All other claims follow the standard [Supabase JWT structure](/docs/guides/auth/jwts).

### Available scopes

The following scopes are currently supported:

| Scope     | Description                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| `openid`  | Enables OpenID Connect. When requested, an ID token will be included in the response. |
| `email`   | Grants access to email and email_verified claims                                      |
| `profile` | Grants access to profile information (name, picture, etc.)                            |
| `phone`   | Grants access to phone_number and phone_number_verified claims                        |

**Default scope:** When no scope is specified in the authorization request, the default scope is `email`.

Scopes affect what information is included in ID tokens and returned by the UserInfo endpoint. All OAuth access tokens have full access to user data (same as regular session tokens), with the addition of the `client_id` claim. Use Row Level Security policies with the `client_id` claim to control which data each OAuth client can access.

<Admonition type="note">

**Custom scopes are not currently supported.** Only the standard scopes listed above are available. Support for custom scopes is planned for a future release, which will allow you to define application-specific permissions and fine-grained access control.

</Admonition>

## Refresh token flow

Refresh tokens allow clients to obtain new access tokens without requiring the user to re-authenticate.

### When to refresh

Clients should refresh access tokens when:

- The access token is expired (check the `exp` claim)
- The access token is about to expire (proactive refresh)
- An API call returns a 401 Unauthorized error

### Refresh request

Make a POST request to the token endpoint with the refresh token. The client authenticates the same way as during the [token exchange](#step-5-token-exchange), based on its `token_endpoint_auth_method`.

#### Public clients (`token_endpoint_auth_method: none`)

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=refresh_token' \
  -d 'refresh_token=<refresh-token>' \
  -d 'client_id=<client-id>'
```

#### Confidential clients (`token_endpoint_auth_method: client_secret_basic`)

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u '<client-id>:<client-secret>' \
  -d 'grant_type=refresh_token' \
  -d 'refresh_token=<refresh-token>'
```

#### Confidential clients (`token_endpoint_auth_method: client_secret_post`)

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=refresh_token' \
  -d 'refresh_token=<refresh-token>' \
  -d 'client_id=<client-id>' \
  -d 'client_secret=<client-secret>'
```

#### Example in JavaScript

```javascript
// Public clients (token_endpoint_auth_method: none)
async function refreshAccessToken(refreshToken) {
  const response = await fetch(`https://<project-ref>.supabase.co/auth/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '<client-id>',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  return await response.json()
}

// Confidential clients (token_endpoint_auth_method: client_secret_basic)
async function refreshAccessTokenConfidential(refreshToken) {
  const response = await fetch(`https://<project-ref>.supabase.co/auth/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa('<client-id>:<client-secret>'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  return await response.json()
}
```

### Refresh response

The response contains a new access token and optionally a new refresh token:

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MXff...",
  "scope": "openid email profile"
}
```

<Admonition type="note">

Refresh tokens may be rotated (a new refresh token is issued). Always update your stored refresh token when a new one is provided.

</Admonition>

## OpenID Connect (OIDC)

Supabase Auth supports OpenID Connect, an identity layer on top of OAuth 2.1.

<Admonition type="note">

**ID tokens are only included when the `openid` scope is requested.** To receive an ID token, include `openid` in the space-separated list of scopes in your authorization request. ID tokens are valid for 1 hour.

</Admonition>

### ID tokens

ID tokens are JWTs that contain user identity information. They are signed by Supabase Auth and can be verified by clients.

The claims included in the ID token depend on the scopes requested during authorization. For example, requesting `openid email profile` will include email and profile-related claims, while requesting only `openid email` will include only email-related claims.

#### Example ID token

```json
{
  "iss": "https://<project-ref>.supabase.co/auth/v1",
  "sub": "user-uuid",
  "aud": "client-id",
  "exp": 1735819200,
  "iat": 1735815600,
  "auth_time": 1735815600,
  "nonce": "random-nonce-from-request",
  "email": "user@example.com",
  "email_verified": true,
  "phone_number": "+1234567890",
  "phone_number_verified": false,
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg"
}
```

#### Standard OIDC claims

| Claim                   | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `sub`                   | Subject (user ID)                                            |
| `nonce`                 | The nonce value from the authorization request (if provided) |
| `email`                 | User's email address                                         |
| `email_verified`        | Whether the email is verified                                |
| `phone_number`          | User's phone number                                          |
| `phone_number_verified` | Whether the phone is verified                                |
| `name`                  | User's full name                                             |
| `picture`               | User's profile picture URL                                   |

### UserInfo endpoint

Clients can retrieve user information by calling the UserInfo endpoint with an access token:

```bash
curl 'https://<project-ref>.supabase.co/auth/v1/oauth/userinfo' \
  -H 'Authorization: Bearer <access-token>'
```

The information returned depends on the scopes granted in the access token. For example:

**With `email` scope:**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "email_verified": true
}
```

**With `email profile phone` scopes:**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "email_verified": true,
  "phone_number": "+1234567890",
  "phone_number_verified": false,
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg"
}
```

### OIDC discovery

Supabase Auth exposes OpenID Connect and OAuth 2.1 discovery endpoints that describe its capabilities:

```
https://<project-ref>.supabase.co/auth/v1/.well-known/openid-configuration
https://<project-ref>.supabase.co/auth/v1/.well-known/oauth-authorization-server
```

<Admonition type="note">

Both endpoints return the same metadata and can be used interchangeably. They are provided for compatibility with different OAuth and OIDC clients that may expect one or the other.

</Admonition>

These endpoints return metadata about:

- Available endpoints (authorization, token, userinfo, JWKS)
- Supported grant types and response types
- Supported scopes and claims
- Token signing algorithms

This enables automatic integration with OIDC-compliant libraries and tools.

## Token validation

Third-party clients should validate access tokens to ensure they're authentic and not tampered with.

<Admonition type="tip">

**Recommended: Use asymmetric JWT signing keys**

For OAuth implementations, we strongly recommend using asymmetric signing algorithms (RS256 or ES256) instead of the default HS256. With asymmetric keys, third-party clients can validate JWTs using the public key from your JWKS endpoint without needing access to your JWT secret. This is more secure, scalable, and follows OAuth best practices.

Learn how to [configure asymmetric JWT signing keys](/docs/guides/auth/signing-keys) in your project.

</Admonition>

<Admonition type="caution">

**ID tokens require asymmetric signing algorithms**

If you request the `openid` scope to receive ID tokens, your project must be configured to use asymmetric signing algorithms (RS256 or ES256). ID token generation will fail with an error if your project is still using the default HS256 symmetric algorithm. This is a security requirement of the OpenID Connect specification.

</Admonition>

### JWKS endpoint

Supabase Auth exposes a JSON Web Key Set (JWKS) endpoint containing public keys for token verification:

```
https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

Example response:

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### Validating tokens

Use a JWT library to verify tokens:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="node"
  queryGroup="language"
>
<TabPanel id="node" label="Node.js">

```javascript
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json')
)

async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://<project-ref>.supabase.co/auth/v1',
      audience: 'authenticated',
    })
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
```

</TabPanel>
<TabPanel id="python" label="Python">

```python
from jose import jwt
from jose.backends import RSAKey
import requests

# Fetch JWKS
jwks = requests.get('https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json').json()

def verify_access_token(token):
    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=['RS256'],
            issuer='https://<project-ref>.supabase.co/auth/v1',
            audience='authenticated'
        )
        return payload
    except jwt.JWTError as e:
        print(f'Token verification failed: {e}')
        return None
```

</TabPanel>
<TabPanel id="go" label="Go">

```go
package main

import (
    "context"
    "github.com/coreos/go-oidc/v3/oidc"
)

func verifyAccessToken(ctx context.Context, token string) (*oidc.IDToken, error) {
    provider, err := oidc.NewProvider(
        ctx,
        "https://<project-ref>.supabase.co/auth/v1",
    )
    if err != nil {
        return nil, err
    }

    verifier := provider.Verifier(&oidc.Config{
        ClientID: "authenticated",
    })

    return verifier.Verify(ctx, token)
}
```

</TabPanel>
</Tabs>

### What to validate

Always verify:

1. **Signature** - Token is signed by Supabase Auth
2. **Issuer** (`iss`) - Matches your project URL
3. **Audience** (`aud`) - Is `authenticated`
4. **Expiration** (`exp`) - Token is not expired
5. **Client ID** (`client_id`) - Matches your client (if applicable)

## Managing user grants

Users can view and manage the OAuth applications they've authorized to access their account. This is important for transparency and security, allowing users to audit and revoke access when needed.

### Viewing authorized applications

Users can retrieve a list of all OAuth clients they've authorized:

```javascript
const { data: grants, error } = await supabase.auth.oauth.getUserGrants()

if (error) {
  console.error('Error fetching grants:', error)
} else {
  console.log('Authorized applications:', grants)
}
```

The response includes details about each authorized OAuth client:

```json
[
  {
    "id": "grant-uuid",
    "client_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
    "client_name": "My Third-Party App",
    "scopes": ["email", "profile"],
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
]
```

### Revoking access

Users can revoke access for a specific OAuth client at any time. When access is revoked, all active sessions and refresh tokens for that client are immediately invalidated:

```javascript
const { error } = await supabase.auth.oauth.revokeGrant(clientId)

if (error) {
  console.error('Error revoking access:', error)
} else {
  console.log('Access revoked successfully')
}
```

After revoking access:

- All refresh tokens for that client are deleted
- The user will need to re-authorize the application to grant access again

<Admonition type="tip">

**Build a settings page for your users**

It's a good practice to provide a settings page where users can view all authorized applications and revoke access to any they no longer trust or use. This increases transparency and gives users control over their data.

</Admonition>

For complete API reference, see the [OAuth methods in supabase-js](/docs/reference/javascript/auth-oauth).

## Next steps

- [Implement MCP authentication](/docs/guides/auth/oauth-server/mcp-authentication) - Enable AI agent authentication
- [Secure with RLS](/docs/guides/auth/oauth-server/token-security) - Control data access for OAuth clients
- [Learn about JWTs](/docs/guides/auth/jwts) - Understand Supabase token structure
