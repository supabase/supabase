---
id: 'auth-slack'
title: 'Login with Slack'
description: 'Add Slack OAuth to your Supabase project'
---

To enable Slack Auth for your project, you need to set up a Slack OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

<Admonition type="caution">

We will be replacing the existing Slack provider with a new Slack (OIDC) provider. Developers with Slack OAuth Applications created prior to 24th June 2024 should create a new application and migrate their credentials from the Slack provider to the Slack (OIDC) provider. Existing OAuth Applications built with the old Slack provider will continue to work up till 10th October. You can refer to the [**list of supported scopes**](https://api.slack.com/scopes?filter=user) for the new Slack (OIDC) User.

</Admonition>

Setting up Slack logins for your application consists of 3 parts:

- Create and configure a Slack Project and App on the [Slack Developer Dashboard](https://api.slack.com/apps).
- Add your Slack `API Key` and `API Secret Key` to your [Supabase Project](/dashboard).
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js).

## Access your Slack Developer account

- Go to [api.slack.com](https://api.slack.com/apps).
- Click on `Your Apps` at the top right to log in.

![Slack Developer Portal.](/docs/img/guides/auth-slack/slack-portal.png)

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "Slack" }} />

## Create a Slack OAuth app

- Go to [api.slack.com](https://api.slack.com/apps).
- Click on `Create New App`

Under `Create an app...`:

- Click `From scratch`
- Type the name of your app
- Select your `Slack Workspace`
- Click `Create App`

Under `App Credentials`:

- Copy and save your newly-generated `Client ID`
- Copy and save your newly-generated `Client Secret`

Under the sidebar, select `OAuth & Permissions` and look for `Redirect URLs`:

- Click `Add New Redirect URL`
- Paste your `Callback URL` then click `Add`
- Click `Save URLs`

Under `Scopes`:

- Add the following scopes under the `User Token Scopes`: `profile`, `email`, `openid`. These scopes are the default scopes that Supabase Auth uses to request for user information. Do not add other scopes as [Sign In With Slack only supports `profile`, `email`, `openid`](https://api.slack.com/authentication/sign-in-with-slack#request).

## Enter your Slack credentials into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "Slack" }} />

You can also configure the Slack (OIDC) auth provider using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Configure Slack (OIDC) auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_slack_oidc_enabled": true,
    "external_slack_oidc_client_id": "your-slack-client-id",
    "external_slack_oidc_secret": "your-slack-client-secret"
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

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `slack_oidc` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('<your-project-url>', '<sb_publishable_... or anon key>')

// ---cut---
async function signInWithSlack() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'slack_oidc',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `slack` as the `provider`:

```dart
Future<void> signInWithSlack() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.slack,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `SlackOIDC` as the `Provider`:

```kotlin
suspend fun signInWithSlack() {
	supabase.auth.signInWith(SlackOIDC)
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
- [Slack Developer Dashboard](https://api.slack.com/apps)
