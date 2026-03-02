---
id: 'auth-kakao'
title: 'Login with Kakao'
description: 'Add Kakao OAuth to your Supabase project'
---

To enable Kakao Auth for your project, you need to set up a Kakao OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

Kakao OAuth consists of six broad steps:

- Create and configure your app in the [Kakao Developers Portal](https://developers.kakao.com/changeLang?lang=en).
- Obtain a `REST API key` - this serves as the `client_id`.
- Obtain a `Kakao Login Client Secret code` - this serves as the `client_secret`.
- Configure additional settings in the Kakao Developers Portal.
- Add your `client id` and `client secret` keys to your [Supabase Project](/dashboard).
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js).

## Access your Kakao Developer account

- Go to [Kakao Developers Portal](https://developers.kakao.com/changeLang?lang=en).
- Click on **Login** at the top right to log in.

![Kakao Developers Portal](/docs/img/guides/auth-kakao/kakao-developers-page.png)

## Create and configure your app

- Go to **App**.
- Click on **Create app** at the top.
- Fill out your app information:
  - App icon.
  - App name.
  - Company name.
  - Category.
  - App primary domain.
- Click **Save** at the bottom right.

## Obtain a REST API key

This serves as the `client_id` when you make API calls to authenticate the user.

- Go to **App**.
- Click on your app.
- Go to **App Settings** > **App** > **Platform Key**.
- In the **Platform Key** section is `REST API key`. This will become your `client_id` later.

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "Kakao" }} />

- To add a callback URL on Kakao, go to **App Settings** > **App** > **Platform Key**.
- Click on the REST API key you want to use.
- In the edit page, enter your callback URL in the **Kakao Login Redirect URI** field.
- Click **Save** in the bottom right.

## Obtain a client secret

- Go to **App Settings** > **App** > **Platform Key**.
- Click on the REST API key you want to use.
- Note the **Kakao Login Client Secret code**. This serves as a `client_secret` for your Supabase project.
- Make sure you activate **Kakao Login Client Secret**.

## Additional configurations on Kakao Developers portal

- Go to **Product Settings** > **Kakao Login** > **General**.
- Set **State** to "ON" in the **Usage settings** section to enable Kakao Login.
- Go to **Product Settings** > **Kakao Login** > **Consent Items**.
- Set the following scopes under the **Consent Items**:
  - account_email (optional)
  - profile_image
  - profile_nickname

If you don't need an email address (or `account_email` isn't available for your app), you can omit `account_email` and enable **Allow users without an email** in the Supabase Kakao provider settings.

![Kakao consent items configuration](/docs/img/guides/auth-kakao/kakao-developers-consent-items-set.png)

<Admonition type="tip">

In the Kakao Developers Portal, the "account_email" consent item is only available for apps that are registered as "Biz App". To convert your app to a "Biz App", go to **App Settings** > **App** > **General**, and complete the required fields in the **Business Information** section.

</Admonition>

## Add your OAuth credentials to Supabase

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "Kakao" }} />

If you did not request `account_email` in Kakao, enable **Allow users without an email** in the Kakao provider settings.

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

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `kakao` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('<your-project-url>', '<sb_publishable_... or anon key>')

// ---cut---
async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `kakao` as the `provider`:

```dart
Future<void> signInWithKakao() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.kakao,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Kakao` as the `Provider`:

```kotlin
suspend fun signInWithKakao() {
	supabase.auth.signInWith(Kakao)
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

## Using Kakao Login JS SDK

[Kakao Login JS SDK](https://developers.kakao.com/docs/latest/en/kakaologin/js) is an official Kakao SDK for authenticating Kakao users on websites.

Exchange the [authorization code returned by Kakao API](https://developers.kakao.com/docs/latest/en/kakaologin/rest-api#request-code) for an [ID Token](https://developers.kakao.com/docs/latest/en/kakaologin/common#login-with-oidc).

For example, this code shows a how to get ID Token:

```
const requestUrl = new URL(request.url);
const code = requestUrl.searchParams.get('code');

if (code) {
  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: '<CLIENT_ID>',
      redirect_uri: '<url>/api/auth/kakao/oidc',
      code,
      client_secret: '<CLIENT_SECRET>',
    }),
  });

  const {id_token} = await res.json();
}
```

Use the ID Token to sign in:

```
const res = await auth.signInWithIdToken({
  provider: 'kakao',
  token: id_token,
});
```

### Configuration

1. Set **State** to "ON" under [OpenID Connect Activation](https://developers.kakao.com/docs/latest/en/kakaologin/prerequisite#kakao-login-oidc) on the Kakao Developers portal.
2. Add `openid` to [scope](https://developers.kakao.com/docs/latest/en/kakaologin/prerequisite#scope) along with the scope values you wish to obtain consent for.

## Resources

- [Kakao Developers Portal](https://developers.kakao.com/changeLang?lang=en).
