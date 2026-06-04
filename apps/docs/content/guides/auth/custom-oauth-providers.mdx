---
id: 'custom-oauth-providers'
title: 'Custom OAuth/OIDC Providers'
description: 'Add any OAuth2 or OIDC-compatible identity provider to your Supabase project'
---

Custom OAuth/OIDC providers let you integrate any standards-compliant identity provider with Supabase Auth, beyond the ones Supabase supports out of the box.

Each custom provider uses a `custom:` prefix in its identifier (for example, `custom:my-idp` or `custom:github-enterprise`). This prefix distinguishes custom providers from built-in providers.

There are two provider types:

- **OAuth2**: for generic OAuth2 providers where you supply the authorization, token, and userinfo endpoints manually.
- **OIDC**: for providers that support [OpenID Connect](https://openid.net/connect/) discovery. You supply only the issuer URL and endpoints are resolved automatically.

<Admonition type="note">

Free plan projects can add up to 3 custom providers. Pro plan and above have unlimited custom providers.

</Admonition>

## Creating a provider

The create form displays a read-only **Callback URL**. Copy this URL and configure it as the redirect/callback URI in your external identity provider before completing setup.

### OAuth2 provider

Use an OAuth2 provider when your identity provider does not support OpenID Connect discovery. You must supply the authorization, token, and userinfo endpoint URLs explicitly.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="setup-method"
>
<TabPanel id="dashboard" label="Dashboard">

1. Go to [Auth Providers](/dashboard/project/_/auth/providers) in the Dashboard.
2. Click **New Provider**. Select **Manual configuration** as the configuration method.
3. Enter a unique identifier (must start with `custom:`, for example `custom:my-oauth-provider`).
4. Enter the provider's **Client ID** and **Client Secret**.
5. Enter the **Authorization URL**, **Token URL**, and **UserInfo URL**.
6. Click **Create and enable provider**.

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.auth.admin.customProviders.createProvider({
  provider_type: 'oauth2',
  identifier: 'custom:my-oauth-provider',
  name: 'My OAuth Provider',
  client_id: 'your-client-id',
  client_secret: 'your-client-secret',
  authorization_url: 'https://provider.example.com/oauth/authorize',
  token_url: 'https://provider.example.com/oauth/token',
  userinfo_url: 'https://provider.example.com/oauth/userinfo',
  scopes: ['profile', 'email'],
})
```

</TabPanel>
</Tabs>

### OIDC provider

Use an OIDC provider when your identity provider supports OpenID Connect. Supply the `issuer` URL and the discovery document, JWKS, and endpoints are resolved automatically.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="setup-method"
>
<TabPanel id="dashboard" label="Dashboard">

1. Go to [Auth Providers](/dashboard/project/_/auth/providers) in the Dashboard.
2. Click **New Provider**. Select **Auto-discovery (OIDC)** as the configuration method.
3. Enter a unique identifier (must start with `custom:`, for example `custom:my-regional-provider`).
4. Enter the provider's **Client ID** and **Client Secret**.
5. Enter the **Issuer URL**. The discovery document and endpoints are resolved automatically.
6. Click **Create and enable provider**.

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.auth.admin.customProviders.createProvider({
  provider_type: 'oidc',
  identifier: 'custom:my-regional-provider',
  name: 'Regional Provider',
  client_id: 'your-client-id',
  client_secret: 'your-client-secret',
  issuer: 'https://auth.example.com',
  scopes: ['openid', 'profile', 'email'],
})
```

</TabPanel>
</Tabs>

OIDC providers have the following automatic behavior:

- The discovery document is fetched from `{issuer}/.well-known/openid-configuration` (or from `discovery_url` if set).
- The `openid` scope is always included. It is automatically added if missing from the `scopes` array.
- ID tokens are verified against the provider's JWKS (fetched from the discovery document's `jwks_uri`).

## Provider identifiers

Every custom provider identifier must start with the `custom:` prefix. Identifiers are 2–50 characters, lowercase alphanumeric with hyphens and colons allowed. Examples:

- `custom:my-provider`
- `custom:github-enterprise`

## User sign-in

Once a custom provider is created and enabled, users sign in via the standard OAuth authorize endpoint:

```
GET https://your-project.supabase.co/auth/v1/authorize?provider=custom:my-provider
```

Or using the Supabase client libraries:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'custom:my-provider',
})
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

```dart
await supabase.auth.signInWithOAuth(
  OAuthProvider('custom:my-provider'),
);
```

</TabPanel>
<TabPanel id="swift" label="Swift">

```swift
try await supabase.auth.signInWithOAuth(
  provider: "custom:my-provider",
  redirectTo: URL(string: "my-custom-scheme://my-app-host")
)
```

</TabPanel>
<TabPanel id="kotlin" label="Kotlin">

```kotlin
supabase.auth.signInWith(CustomProvider("custom:my-provider"))
```

</TabPanel>
</Tabs>

## Managing providers

### List providers

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="setup-method"
>
<TabPanel id="dashboard" label="Dashboard">

Go to [Auth Providers](/dashboard/project/_/auth/providers) in the Dashboard. All custom providers are listed under **Custom OAuth Providers**.

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
// List all custom providers
const { data, error } = await supabase.auth.admin.customProviders.listProviders()

// Filter by provider type
const { data, error } = await supabase.auth.admin.customProviders.listProviders({
  type: 'oidc',
})
```

</TabPanel>
</Tabs>

### Update a provider

Update any provider fields except `provider_type` and `identifier`. Only provided fields are changed (partial update). To rotate a client secret, update only the `client_secret` field.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="setup-method"
>
<TabPanel id="dashboard" label="Dashboard">

1. Go to [Auth Providers](/dashboard/project/_/auth/providers) in the Dashboard.
2. Click the three-dot menu (⋮) next to the provider and select **Update**.
3. Modify the fields you want to change.
4. Click **Update provider**.

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } = await supabase.auth.admin.customProviders.updateProvider(
  'custom:my-provider',
  {
    name: 'Updated Provider Name',
    scopes: ['profile', 'email', 'groups'],
    enabled: false,
  }
)
```

</TabPanel>
</Tabs>

### Delete a provider

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="setup-method"
>
<TabPanel id="dashboard" label="Dashboard">

1. Go to [Auth Providers](/dashboard/project/_/auth/providers) in the Dashboard.
2. Click the three-dot menu (⋮) next to the provider and select **Delete**.
3. Confirm the deletion.

</TabPanel>
<TabPanel id="js" label="JavaScript">

```js
const { data, error } =
  await supabase.auth.admin.customProviders.deleteProvider('custom:my-provider')
```

</TabPanel>
</Tabs>

## Advanced configuration

### PKCE

PKCE (Proof Key for Code Exchange) is enabled by default (`pkce_enabled: true`) for all custom providers. The auth server automatically generates a code challenge and verifier during the authorization flow, protecting against authorization code interception attacks. This is handled entirely server-side, no client-side PKCE logic is needed.

To disable PKCE for a specific provider, set `pkce_enabled: false` when creating or updating it. This is not recommended unless the identity provider does not support PKCE.

### Authorization params

Extra query parameters appended to the provider's authorization URL during the OAuth flow. All values must be strings.

```json
{
  "prompt": "consent",
  "access_type": "offline",
  "login_hint": "user@example.com"
}
```

The following reserved parameters are managed by the auth server and cannot be overridden: `client_id`, `client_secret`, `redirect_uri`, `response_type`, `state`, `code_challenge`, `code_challenge_method`, `code_verifier`, `nonce`.

### Multi-platform apps

If your app uses different client IDs for different platforms (for example, web vs mobile), use `acceptable_client_ids` to list additional client IDs that should be accepted for audience validation in OIDC ID tokens:

```js
const { data, error } = await supabase.auth.admin.customProviders.createProvider({
  provider_type: 'oidc',
  identifier: 'custom:multi-platform-app',
  name: 'Multi-Platform App',
  client_id: 'web-client-id',
  client_secret: 'your-client-secret',
  issuer: 'https://app.example.com',
  scopes: ['openid', 'profile', 'email'],
  acceptable_client_ids: ['ios-client-id', 'android-client-id'],
})
```

### Email-optional providers

By default, providers must return an email address. Set `email_optional` to `true` when creating or updating a provider to allow sign-in without an email. This applies to both OAuth2 and OIDC providers.

### OIDC-specific options

| Field              | Type     | Default | Description                                                                           |
| ------------------ | -------- | ------- | ------------------------------------------------------------------------------------- |
| `discovery_url`    | `string` | `null`  | Override the discovery document URL if the provider uses a non-standard location.     |
| `skip_nonce_check` | `bool`   | `false` | Skip nonce validation on ID tokens. Use only for providers that do not support nonce. |

## Error reference

| Error code                   | HTTP status | Description                                                                                |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `validation_failed`          | 400         | Invalid parameters: missing required fields, bad format, reserved params, or invalid URLs. |
| `conflict`                   | 400         | A provider with the same identifier already exists.                                        |
| `over_custom_provider_quota` | 400         | Maximum number of custom providers reached.                                                |
| `custom_provider_not_found`  | 404         | No provider exists with the given identifier.                                              |
