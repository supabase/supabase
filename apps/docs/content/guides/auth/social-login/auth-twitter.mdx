---
id: 'auth-twitter'
title: 'Login with X / Twitter'
description: 'Add X / Twitter OAuth to your Supabase project'
---

To enable X / Twitter Auth for your project, you need to set up an X OAuth 2.0 application and add the application credentials in the Supabase Dashboard.

## Overview

<Admonition type="caution">

We recommend using the **X / Twitter (OAuth 2.0)** provider. The legacy **Twitter (OAuth 1.0a)**
provider will be deprecated in future releases.

</Admonition>

Setting up X / Twitter logins for your application consists of 3 parts:

- Create and configure an X Project and App on the [X Developer Dashboard](https://developer.x.com/en/portal/dashboard).
- Add your X OAuth 2.0 `Client ID` and `Client Secret` to your [Supabase Project](/dashboard).
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js).

## Access your X developer account

- Go to [developer.x.com](https://developer.x.com).
- Click on `Sign in` at the top right to log in.

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "X / Twitter (OAuth 2.0)" }} />

## Create an X OAuth app

- Click `+ Create Project`.
  - Enter your project name, click `Next`.
  - Select your use case, click `Next`.
  - Enter a description for your project, click `Next`.
  - Enter a name for your app, click `Next`.
  - Copy and save your **API Key** and **API Secret Key** (these are used for OAuth 1.0a, which is being deprecated).
  - Click on `App settings` to proceed to next steps.
- At the bottom, you will find `User authentication settings`. Click on `Set up`.
- Under `User authentication settings`, you can configure `App permissions`.
- Make sure you turn ON `Request email from users`.
- Select `Web App...` as the `Type of App`.
- Under `App info` configure the following.
  - Enter your `Callback URL`. Check the **Find your callback URL** section above to learn how to obtain your callback URL.
  - Enter your `Website URL` (tip: try `http://127.0.0.1:port` or `http://www.localhost:port` during development)
  - Enter your `Terms of service URL`.
  - Enter your `Privacy policy URL`.
- Click `Save`.
- After saving, navigate to `Keys and tokens` on your App page.
  - Scroll to the bottom of the page and copy your **Client ID**.
  - Click the `Regenerate` button next to **Client Secret**.
  - In the confirmation modal, click `Yes, regenerate`.
  - Copy and save your **Client Secret**.

## Enter your X credentials into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "X / Twitter (OAuth 2.0)" }} />

You can also configure the X / Twitter (OAuth 2.0) auth provider using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Configure X / Twitter (OAuth 2.0) auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_x_enabled": true,
    "external_x_client_id": "your-x-client-id",
    "external_x_secret": "your-x-client-secret"
  }'
```

## Add login code to your client app

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

<$Partial path="create_client_snippet.mdx" />

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `x` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://your-project-id.supabase.co',
  'sb_publishable_... or anon key'
)

// ---cut---
async function signInWithX() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'x',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `x` as the `provider`:

```dart
Future<void> signInWithX() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.x,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

When your user signs in, call [`signInWithOAuth(provider:)`](/docs/reference/swift/auth-signinwithoauth) with `.x` as the `provider`:

```swift
func signInWithX() async throws {
  try await supabase.auth.signInWithOAuth(provider: .x)
}
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `X` as the `Provider`:

```kotlin
suspend fun signInWithX() {
	supabase.auth.signInWith(X)
}
```

</TabPanel>
</$Show>
</Tabs>

<$Partial path="oauth_pkce_flow.mdx" />

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

When your user signs out, call [signOut()](/docs/reference/javascript/auth-signout) to remove them from the browser session and any objects from localStorage:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://your-project-id.supabase.co',
  'sb_publishable_... or anon key'
)

// ---cut---
async function signOut() {
  const { error } = await supabase.auth.signOut()
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs out, call [signOut()](/docs/reference/dart/auth-signout) to remove them from the browser session and any objects from localStorage:

```dart
Future<void> signOut() async {
  await supabase.auth.signOut();
}
```

</TabPanel>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

When your user signs out, call [signOut()](/docs/reference/swift/auth-signout) to remove them from the browser session:

```swift
func signOut() async throws {
  try await supabase.auth.signOut()
}
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs out, call [signOut()](/docs/reference/kotlin/auth-signout) to remove them from the browser session and any objects from localStorage:

```kotlin
suspend fun signOut() {
	supabase.auth.signOut()
}
```

</TabPanel>
</$Show>
</Tabs>

## Resources

- [Supabase - Get started for free](https://supabase.com)
- [Supabase JS Client](https://github.com/supabase/supabase-js)
- [X Developer Dashboard](https://developer.x.com/en/portal/dashboard)
