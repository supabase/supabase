---
id: 'auth-spotify'
title: 'Login with Spotify'
description: 'Add Spotify OAuth to your Supabase project'
---

To enable Spotify Auth for your project, you need to set up a Spotify OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

Setting up Spotify logins for your application consists of 3 parts:

- Create and configure a Spotify Project and App on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
- Add your Spotify `API Key` and `API Secret Key` to your [Supabase Project](/dashboard).
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js).

## Access your Spotify Developer account

- Log into [Spotify](https://spotify.com)
- Access the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

![Spotify Developer Portal.](/docs/img/guides/auth-spotify/spotify-portal.png)

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "Spotify" }} />

## Create a Spotify OAuth app

- Log into [Spotify](https://spotify.com).
- Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Click `Create an App`
- Type your `App name`
- Type your `App description`
- Check the box to agree with the `Developer TOS and Branding Guidelines`
- Click `Create`
- Save your `Client ID`
- Save your `Client Secret`
- Click `Edit Settings`

Under `Redirect URIs`:

- Paste your Supabase Callback URL in the box
- Click `Add`
- Click `Save` at the bottom

## Enter your Spotify credentials into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "Spotify" }} />

You can also configure the Spotify auth provider using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Configure Spotify auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_spotify_enabled": true,
    "external_spotify_client_id": "your-spotify-client-id",
    "external_spotify_secret": "your-spotify-client-secret"
  }'
```

## Add login code to your client app

The following outlines the steps to sign in using Spotify with Supabase Auth.

1. Call the signin method from the client library.
1. The user is redirected to the Spotify login page.
1. After completing the sign-in process, the user will be redirected to your app with an error that says the email address needs to be confirmed. Simultaneously the user receives a confirmation email from Supabase Auth.
1. The user clicks the confirmation link in the email.
1. The user is brought back to the app and is now signed in.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

<$Partial path="create_client_snippet.mdx" />

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `spotify` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('<your-project-url>', '<sb_publishable_... or anon key>')

// ---cut---
async function signInWithSpotify() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'spotify',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `spotify` as the `provider`:

```dart
Future<void> signInWithSpotify() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.spotify,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Spotify` as the `Provider`:

```kotlin
suspend fun signInWithSpotify() {
	supabase.auth.signInWith(Spotify)
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
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
