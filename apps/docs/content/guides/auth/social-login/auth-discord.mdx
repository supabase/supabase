---
id: 'auth-discord'
title: 'Login with Discord'
description: 'Add Discord OAuth to your Supabase project'
---

To enable Discord Auth for your project, you need to set up a Discord Application and add the Application OAuth credentials to your Supabase Dashboard.

## Overview

Setting up Discord logins for your application consists of 3 parts:

- Create and configure a Discord Application [Discord Developer Portal](https://discord.com/developers)
- Add your Discord OAuth Consumer keys to your [Supabase Project](/dashboard)
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js)

## Access your Discord account

- Go to [discord.com](https://discord.com/).
- Click on `Login` at the top right to log in.

![Discord Portal.](/docs/img/guides/auth-discord/discord-portal.png)

- Once logged in, go to [discord.com/developers](https://discord.com/developers).

![Discord Portal.](/docs/img/guides/auth-discord/discord-developer-portal.png)

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "Discord" }} />

## Create a Discord application

- Click on `New Application` at the top right.
- Enter the name of your application and click `Create`.
- Click on `OAuth2` under `Settings` in the left side panel.
- Click `Add Redirect` under `Redirects`.
- Type or paste your `callback URL` into the `Redirects` box.
- Click `Save Changes` at the bottom.
- Copy your `Client ID` and `Client Secret` under `Client information`.

## Add your Discord credentials into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "Discord" }} />

You can also configure the Discord auth provider using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Configure Discord auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_discord_enabled": true,
    "external_discord_client_id": "your-discord-client-id",
    "external_discord_secret": "your-discord-client-secret"
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

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `discord` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://your-project-id.supabase.co',
  'sb_publishable_... or anon key'
)

// ---cut---
async function signInWithDiscord() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `discord` as the `provider`:

```dart
Future<void> signInWithDiscord() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.discord,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Discord` as the `Provider`:

```kotlin
suspend fun signInWithDiscord() {
	supabase.auth.signInWith(Discord)
}
```

</TabPanel>
</$Show>
</Tabs>

<$Partial path="oauth_pkce_flow.mdx" />

If your user is already signed in, Discord prompts the user again for authorization.

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
- [Discord Account](https://discord.com)
- [Discord Developer Portal](https://discord.com/developers)
