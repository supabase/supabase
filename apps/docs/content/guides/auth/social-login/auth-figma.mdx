---
id: 'auth-figma'
title: 'Login with Figma'
description: 'Add Figma OAuth to your Supabase project'
---

To enable Figma Auth for your project, you need to set up a Figma OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

Setting up Figma logins for your application consists of 3 parts:

- Create and configure a Figma App on the [Figma Developers page](https://www.figma.com/developers/app).
- Add your Figma `client_id` and `client_secret` to your [Supabase Project](https://app.supabase.com).
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js).

## Access the Figma Developers page

- Go to the [Figma Developers page](https://www.figma.com/developers/app)
- Log in (if necessary)

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "Figma" }} />

## Create a Figma OAuth app

1. Enter your `App name`, select the owner for the app and click `Create app` button

   ![Create Figma app](/docs/img/guides/auth-figma/figma_app_credentials.png)

2. Copy and save your newly-generated `Client ID`
3. Copy and save your newly-generated `Client Secret`
4. Then, go to `OAuth credentials` and click on `Add a redirect URL` button

   ![Add redirect URL](/docs/img/guides/auth-figma/figma_app_redirect_uri.png)

5. Add your URL from the previous step (callback URL on Supabase) and click on `Add` button
6. Go to `OAuth scopes` and select `current_user:read` under `Users`.

![Select OAuth scopes](/docs/img/guides/auth-figma/figma_app_scopes.png)

## Enter your Figma credentials into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "Figma" }} />

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

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `figma` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('<your-project-url>', '<sb_publishable_... or anon key>')

// ---cut---
async function signInWithFigma() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'figma',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `figma` as the `provider`:

```dart
Future<void> signInWithFigma() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.figma,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Figma` as the `Provider`:

```kotlin
suspend fun signInWithFigma() {
	supabase.auth.signInWith(Figma)
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
- [Figma Developers page](https://www.figma.com/developers)
