---
id: 'auth-gitlab'
title: 'Login with GitLab'
description: 'Add GitLab OAuth to your Supabase project'
---

To enable GitLab Auth for your project, you need to set up a GitLab OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

Setting up GitLab logins for your application consists of 3 parts:

- Create and configure a GitLab Application on [GitLab](https://gitlab.com)
- Add your GitLab Application keys to your [Supabase Project](/dashboard)
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js)

## Access your GitLab account

- Go to [gitlab.com](https://gitlab.com).
- Click on `Login` at the top right to log in.

![GitLab Developer Portal.](/docs/img/guides/auth-gitlab/gitlab-portal.png)

## Find your callback URL

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "GitLab" }} />

## Create your GitLab application

- Click on your `profile logo` (avatar) in the top-right corner.
- Select `Edit profile`.
- In the left sidebar, select Applications.
- Enter the name of the application.
- In the `Redirect URI` box, type the callback URL of your app.
- Check the box next to `Confidential` (make sure it is checked).
- Check the scope named `read_user` (this is the only required scope).
- Click `Save Application` at the bottom.
- Copy and save your `Application ID` (`client_id`) and `Secret` (`client_secret`) which you'll need later.

## Add your GitLab credentials into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "GitLab" }} />

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

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `gitlab` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://your-project-id.supabase.co',
  'sb_publishable_... or anon key'
)

// ---cut---
async function signInWithGitLab() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'gitlab',
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `gitlab` as the `provider`:

```dart
Future<void> signInWithGitLab() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.gitlab,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Gitlab` as the `Provider`:

```kotlin
suspend fun signInWithGitLab() {
	supabase.auth.signInWith(Gitlab)
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
- [GitLab Account](https://gitlab.com)
