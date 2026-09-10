---
id: 'jwt-fields'
title: 'JWT Claims Reference'
subtitle: 'Complete reference for claims appearing in JWTs created by Supabase Auth'
---

This page provides a comprehensive reference for all JWT claims used in Supabase authentication tokens. This information is essential for server-side JWT validation and serialization, especially when implementing authentication in languages like Rust where field names like `ref` are reserved keywords.

## JWT structure overview

Supabase JWTs follow the standard JWT structure with three parts:

- **Header**: Contains algorithm and key information
- **Payload**: Contains the claims (user data and metadata)
- **Signature**: Cryptographic signature for verification

The payload contains various claims that provide user identity, authentication level, and authorization information.

## Required claims

These claims are always present in Supabase JWTs and cannot be removed:

| Field          | Type                 | Description                                                 | Example                                       |
| -------------- | -------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| `iss`          | `string`             | **Issuer** - The entity that issued the JWT                 | `"https://project-ref.supabase.co/auth/v1"`   |
| `aud`          | `string \| string[]` | **Audience** - The intended recipient of the JWT            | `"authenticated"` or `"anon"`                 |
| `exp`          | `number`             | **Expiration Time** - Unix timestamp when the token expires | `1640995200`                                  |
| `iat`          | `number`             | **Issued At** - Unix timestamp when the token was issued    | `1640991600`                                  |
| `sub`          | `string`             | **Subject** - The user ID (UUID)                            | `"123e4567-e89b-12d3-a456-426614174000"`      |
| `role`         | `string`             | **Role** - User's role in the system                        | `"authenticated"`, `"anon"`, `"service_role"` |
| `aal`          | `string`             | **Authenticator Assurance Level** - Authentication strength | `"aal1"`, `"aal2"`                            |
| `session_id`   | `string`             | **Session ID** - Unique session identifier                  | `"session-uuid"`                              |
| `email`        | `string`             | **Email** - User's email address                            | `"user@example.com"`                          |
| `phone`        | `string`             | **Phone** - User's phone number                             | `"+1234567890"`                               |
| `is_anonymous` | `boolean`            | **Anonymous Flag** - Whether the user is anonymous          | `false`                                       |

## Optional claims

These claims may be present depending on the authentication context:

| Field           | Type     | Description                                                                | Example                                             |
| --------------- | -------- | -------------------------------------------------------------------------- | --------------------------------------------------- |
| `jti`           | `string` | **JWT ID** - Unique identifier for the JWT                                 | `"jwt-uuid"`                                        |
| `nbf`           | `number` | **Not Before** - Unix timestamp before which the token is invalid          | `1640991600`                                        |
| `app_metadata`  | `object` | **App Metadata** - Application-specific user data                          | `{"provider": "email"}`                             |
| `user_metadata` | `object` | **User Metadata** - User-specific data                                     | `{"name": "John Doe"}`                              |
| `amr`           | `array`  | **Authentication Methods Reference** - List of authentication methods used | `[{"method": "password", "timestamp": 1640991600}]` |

## Special claims

| Field | Type     | Description                                         | Example                  | Context                       |
| ----- | -------- | --------------------------------------------------- | ------------------------ | ----------------------------- |
| `ref` | `string` | **Project Reference** - Supabase project identifier | `"abcdefghijklmnopqrst"` | Anon/Service role tokens only |

## Field value constraints

### Authenticator assurance level (`aal`)

| Value    | Description                                          |
| -------- | ---------------------------------------------------- |
| `"aal1"` | Single-factor authentication (password, OAuth, etc.) |
| `"aal2"` | Multi-factor authentication (password + TOTP, etc.)  |

### Role values (`role`)

| Value             | Description        | Use Case                            |
| ----------------- | ------------------ | ----------------------------------- |
| `"anon"`          | Anonymous user     | Public access with RLS policies     |
| `"authenticated"` | Authenticated user | Standard user access                |
| `"service_role"`  | Service role       | Admin privileges (server-side only) |

### Audience values (`aud`)

| Value             | Description                   |
| ----------------- | ----------------------------- |
| `"authenticated"` | For authenticated user tokens |
| `"anon"`          | For anonymous user tokens     |

### Authentication methods (`amr.method`)

| Value             | Description                   |
| ----------------- | ----------------------------- |
| `"oauth"`         | OAuth provider authentication |
| `"password"`      | Email/password authentication |
| `"otp"`           | One-time password             |
| `"totp"`          | Time-based one-time password  |
| `"recovery"`      | Account recovery              |
| `"invite"`        | Invitation-based signup       |
| `"sso/saml"`      | SAML single sign-on           |
| `"magiclink"`     | Magic link authentication     |
| `"email/signup"`  | Email signup                  |
| `"email_change"`  | Email change                  |
| `"token_refresh"` | Token refresh                 |
| `"anonymous"`     | Anonymous authentication      |

## JWT examples

### Authenticated user token

```json
{
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1640991600
    }
  ],
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "aud": "authenticated",
  "email": "user@example.com",
  "exp": 1640995200,
  "iat": 1640991600,
  "iss": "https://abcdefghijklmnopqrst.supabase.co/auth/v1",
  "phone": "",
  "role": "authenticated",
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "user_metadata": {
    "name": "John Doe"
  },
  "is_anonymous": false
}
```

### Anonymous user token

```json
{
  "iss": "supabase",
  "ref": "abcdefghijklmnopqrst",
  "role": "anon",
  "iat": 1640991600,
  "exp": 1640995200
}
```

### Service role token

```json
{
  "iss": "supabase",
  "ref": "abcdefghijklmnopqrst",
  "role": "service_role",
  "iat": 1640991600,
  "exp": 1640995200
}
```

## Language-Specific considerations

### Rust

In Rust, the `ref` field is a reserved keyword. When deserializing JWTs, you'll need to handle this:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
struct JwtClaims {
    iss: String,
    #[serde(rename = "ref")] // Handle reserved keyword
    project_ref: Option<String>,
    role: String,
    iat: i64,
    exp: i64,
    // ... other claims
}
```

### TypeScript/JavaScript

```typescript
interface JwtClaims {
  iss: string
  aud: string | string[]
  exp: number
  iat: number
  sub: string
  role: string
  aal: 'aal1' | 'aal2'
  session_id: string
  email: string
  phone: string
  is_anonymous: boolean
  jti?: string
  nbf?: number
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
  amr?: Array<{
    method: string
    timestamp: number
  }>
  ref?: string // Only in anon/service role tokens
}
```

### Python

```python
from typing import Optional, Union, List, Dict, Any
from dataclasses import dataclass

@dataclass
class AmrEntry:
    method: str
    timestamp: int

@dataclass
class JwtClaims:
    iss: str
    aud: Union[str, List[str]]
    exp: int
    iat: int
    sub: str
    role: str
    aal: str
    session_id: str
    email: str
    phone: str
    is_anonymous: bool
    jti: Optional[str] = None
    nbf: Optional[int] = None
    app_metadata: Optional[Dict[str, Any]] = None
    user_metadata: Optional[Dict[str, Any]] = None
    amr: Optional[List[AmrEntry]] = None
    ref: Optional[str] = None  # Only in anon/service role tokens
```

### Go

```go
type AmrEntry struct {
    Method    string `json:"method"`
    Timestamp int64  `json:"timestamp"`
}

type JwtClaims struct {
    Iss         string                 `json:"iss"`
    Aud         interface{}            `json:"aud"` // string or []string
    Exp         int64                  `json:"exp"`
    Iat         int64                  `json:"iat"`
    Sub         string                 `json:"sub"`
    Role        string                 `json:"role"`
    Aal         string                 `json:"aal"`
    SessionID   string                 `json:"session_id"`
    Email       string                 `json:"email"`
    Phone       string                 `json:"phone"`
    IsAnonymous bool                   `json:"is_anonymous"`
    Jti         *string                `json:"jti,omitempty"`
    Nbf         *int64                 `json:"nbf,omitempty"`
    AppMetadata map[string]interface{} `json:"app_metadata,omitempty"`
    UserMetadata map[string]interface{} `json:"user_metadata,omitempty"`
    Amr         []AmrEntry             `json:"amr,omitempty"`
    Ref         *string                `json:"ref,omitempty"` // Only in anon/service role tokens
}
```

## Validation guidelines

When implementing JWT validation on your server:

1. **Check Required Fields**: Ensure all required claims are present
2. **Validate Types**: Verify field types match expected types
3. **Check Expiration**: Validate `exp` timestamp is in the future
4. **Verify Issuer**: Ensure `iss` matches your Supabase project
5. **Check Audience**: Validate `aud` matches expected audience
6. **Handle Reserved Keywords**: Use field renaming for languages like Rust

## Security considerations

- **Always validate the JWT signature** before trusting any claims
- **Never expose service role tokens** to client-side code
- **Validate all claims** before trusting the JWT
- **Check token expiration** on every request
- **Use HTTPS** for all JWT transmission
- **Rotate JWT secrets** regularly
- **Implement proper error handling** for invalid tokens

## Related documentation

- [JWT Overview](/docs/guides/auth/jwts)
- [Custom Access Token Hooks](/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [Row Level Security](/docs/guides/database/postgres/row-level-security)
- [Server-Side Auth](/docs/guides/auth/server-side)
