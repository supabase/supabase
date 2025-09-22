---
id: 'auth-zoom'
title: 'Login with Zoom'
description: 'Add Zoom OAuth to your Supabase project'
---

To enable Zoom Auth for your project, you need to set up a Zoom OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

Setting up Zoom logins for your application consists of 3 parts:

- Create and configure a Zoom OAuth App on [Zoom App Marketplace](https://marketplace.zoom.us/)
- Add your Zoom OAuth keys to your [Supabase Project](/dashboard)
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js)

## Access your Zoom Developer account

- Go to [marketplace.zoom.us](https://marketplace.zoom.us/).
- Click on `Sign In` at the top right to log in.

![Zoom Developer Portal.](/docs/img/guides/auth-zoom/zoom-portal.png)

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "Zoom" }} />

## Create a Zoom OAuth app

- Go to [marketplace.zoom.us](https://marketplace.zoom.us/).
- Click on `Sign In` at the top right to log in.
- Click `Build App` (from the dropdown Develop)
- In the OAuth card, click `Create`
- Type the name of your app
- Choose app type
- Click `Create`

Under `App credentials`

- Copy and save your `Client ID`.
- Copy and save your `Client secret`.
- Add your `Callback URL` in the OAuth allow list.

Under `Redirect URL for OAuth`

- Paste your `Callback URL`

Under `Scopes`

- Click on `Add scopes`
- Click on `User`
- Choose `user:read`
- Click `Done`
- Click `Continue`

## Enter your Zoom credentials into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "Zoom" }} />

You can also configure the Zoom auth provider using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Configure Zoom auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_zoom_enabled": true,
    "external_zoom_client_id": "your-zoom-client-id",
    "external_zoom_secret": "your-zoom-client-secret"
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

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `zoom` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('<your-project-url>', '<sb_publishable_... or anon key>')

// ---cut---
async function signInWithZoom() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'zoom',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `zoom` as the `provider`:

```dart
Future<void> signInWithZoom() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.zoom,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Zoom` as the `Provider`:

```kotlin
suspend fun signInWithZoom() {
	supabase.auth.signInWith(Zoom)
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
const supabase = createClient('<your-project-url>', '<sb_publishable_... or anon key>')

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
- [Zoom App Marketplace](https://marketplace.zoom.us/)
