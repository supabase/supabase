---
id: 'auth-facebook'
title: 'Login with Facebook'
description: 'Add Facebook OAuth to your Supabase project'
---

To enable Facebook Auth for your project, you need to set up a Facebook OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

Setting up Facebook logins for your application consists of 4 parts:

- Create and configure a Facebook Application on the [Facebook Developers Site](https://developers.facebook.com)
- **Configure email permissions** in your Facebook app (required for Supabase Auth)
- Add your Facebook keys to your [Supabase Project](/dashboard)
- Add the login code to your [Supabase JS Client App](https://github.com/supabase/supabase-js)

## Access your Facebook Developer account

- Go to [developers.facebook.com](https://developers.facebook.com).
- Click on `Log In` at the top right to log in.

![Facebook Developer Portal.](/docs/img/guides/auth-facebook/facebook-portal.png)

## Create a Facebook app

- Click on `My Apps` at the top right.
- Click `Create App` near the top right.
- Select your app type and click `Continue`.
- Fill in your app information, then click `Create App`.
- This should bring you to the screen: `Add Products to Your App`. (Alternatively you can click on `Add Product` in the left sidebar to get to this screen.)

<$Partial path="social_provider_setup.mdx" variables={{ "provider": "Facebook" }} />

## Set up Facebook login for your Facebook app

From the `Add Products to your App` screen:

- Click **Setup** under **Facebook Login**
- Skip the Quickstart screen. Instead, in the left sidebar, click **Settings** under **Facebook Login**
- Enter your callback URI under **Valid OAuth Redirect URIs** on the **Facebook Login Settings** page
- Click **Save Changes** at the bottom right

<Admonition type="tip">

Your callback URI follows this pattern: `https://<project-ref>.supabase.co/auth/v1/callback`

You can find your project's callback URI in the [Supabase Dashboard](/dashboard/project/_/auth/providers) under **Authentication > Providers > Facebook**.

</Admonition>

## Configure email permissions (required)

<Admonition type="caution">

This step is **required** for Supabase Auth to work correctly. Without email permissions, Facebook will not return the user's email address, which may cause authentication failures or incomplete user profiles.

</Admonition>

You must configure the email permission in your Facebook app's Use Cases:

1. In your Facebook app dashboard, click **Use Cases** under `Build Your App`
2. Find **Authentication and Account Creation** and click the **Edit** button on the right
3. Verify that both `public_profile` and `email` show status **Ready for testing**
4. If `email` is not listed, click the **Add** button next to it

<Admonition type="tip">

You can verify the permissions are set correctly by checking that both `public_profile` and `email` appear with a green check mark or "Ready for testing" status.

</Admonition>

## Copy your Facebook app ID and secret

- Click `Settings / Basic` in the left sidebar
- Copy your App ID from the top of the `Basic Settings` page
- Under `App Secret` click `Show` then copy your secret
- Make sure all required fields are completed on this screen.

## Enter your Facebook app ID and secret into your Supabase project

<$Partial path="social_provider_settings_supabase.mdx" variables={{ "provider": "Facebook" }} />

You can also configure the Facebook auth provider using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Configure Facebook auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_facebook_enabled": true,
    "external_facebook_client_id": "your-facebook-app-id",
    "external_facebook_secret": "your-facebook-app-secret"
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

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `facebook` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://your-project.supabase.co', 'sb_publishable_... or anon key')

// ---cut---
async function signInWithFacebook() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
  })

  if (error) {
    console.error('Error signing in with Facebook:', error.message)
    return
  }

  // The user will be redirected to Facebook for authentication
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `facebook` as the `provider`:

```dart
Future<void> signInWithFacebook() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.facebook,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

### Alternative: Using Facebook SDK with signInWithIdToken

For more control over the Facebook authentication flow, you can use the Facebook SDK directly and then authenticate with Supabase using [`signInWithIdToken()`](/docs/reference/dart/auth-signinwithidtoken):

First, add the Facebook SDK dependency to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_facebook_auth: ^7.0.0
```

<Admonition type="tip">

Check [pub.dev](https://pub.dev/packages/flutter_facebook_auth) for the latest version of `flutter_facebook_auth`.

</Admonition>

Then implement the Facebook authentication:

```dart
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> signInWithFacebook() async {
  try {
    final LoginResult result = await FacebookAuth.instance.login(
      permissions: ['public_profile', 'email'],
    );

    if (result.status == LoginStatus.success) {
      final accessToken = result.accessToken!.tokenString;

      await Supabase.instance.client.auth.signInWithIdToken(
        provider: OAuthProvider.facebook,
        idToken: accessToken,
      );

      // Authentication successful
    } else {
      // Handle login cancellation or failure
      throw Exception('Facebook login failed: ${result.status}');
    }
  } catch (e) {
    // Handle errors
    throw Exception('Facebook authentication error: ${e.toString()}');
  }
}
```

<Admonition type="note">

Make sure to configure your Facebook app properly and add the required permissions in the Facebook Developer Console. The `signInWithIdToken` method requires the Facebook access token to be valid and properly scoped.

</Admonition>

</TabPanel>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/swift/auth-signinwithoauth) with `facebook` as the `provider`:

```swift
import SwiftUI

struct SignInWithFacebook: View {
  @Environment(\.webAuthenticationSession) var webAuthenticationSession

  var body: some View {
    Button("Sign in with Facebook") {
      Task {
        do {
          try await supabase.auth.signInWithOAuth(
            provider: .facebook,
            redirectTo: URL(string: "my.scheme://my-host")!,
            launchFlow: { @MainActor url in
              try await webAuthenticationSession.authenticate(
                using: url,
                callbackURLScheme: "my.scheme"
              )
            }
          )
        } catch {
          print("Failed to sign in with Facebook: \(error)")
        }
      }
    }
  }
}
```

<Admonition type="note">

Make sure to configure your app's URL scheme in Xcode under **Target > Info > URL Types**. The callback URL scheme should match the scheme used in `redirectTo` (e.g., `my.scheme`).

</Admonition>

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Facebook` as the `Provider`:

```kotlin
suspend fun signInWithFacebook() {
	supabase.auth.signInWith(Facebook)
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
const supabase = createClient('https://your-project.supabase.co', 'sb_publishable_... or anon key')

// ---cut---
async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error.message)
    return
  }

  // User has been signed out
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

When your user signs out, call [signOut()](/docs/reference/swift/auth-signout) to remove them from the browser session and any objects from localStorage:

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

## Testing your integration

Facebook apps start in **Development** mode, which has the following limitations:

- Only users with a role on the app (administrators, developers, testers) can authenticate
- Other users will see an "App Not Setup" error when trying to log in

To add test users:

1. Go to [developers.facebook.com](https://developers.facebook.com) and select your app
2. Navigate to **App Roles > Roles**
3. Add users as Testers, Developers, or Administrators
4. Users must accept the invitation from their Facebook notification settings

<Admonition type="tip">

Development mode is sufficient for local development and testing. You only need to submit for App Review when you're ready to allow any Facebook user to authenticate with your app.

</Admonition>

## Going live with app review

Before your app can be used by the general public, you need to complete Facebook's App Review process:

1. **Complete App Settings**: In your Facebook app's **Settings > Basic**, fill in all required fields including:

   - App Icon
   - Privacy Policy URL
   - Terms of Service URL (if applicable)
   - App Domain

2. **Request Permissions**: Navigate to **App Review > Permissions and Features** and request the permissions you need:

   - `public_profile` - Usually pre-approved
   - `email` - Requires verification that your app needs email access

3. **Submit for Review**: Click **Submit for Review** and provide:

   - Detailed instructions for how Facebook reviewers should test your login flow
   - A screencast video demonstrating the Facebook Login feature
   - Explanation of how user data will be used

4. **Wait for Approval**: Facebook typically reviews apps within 1-5 business days

<Admonition type="note">

If you only need basic authentication (name and profile picture), you may not need full App Review. Apps requesting only `public_profile` and `email` with the "Authenticate and request data from users with Facebook Login" use case can often go live without a detailed review.

</Admonition>

For more details, see the [Facebook App Review documentation](https://developers.facebook.com/docs/app-review/).

## Troubleshooting

### "App not setup" error

This error occurs when a user without a role on your app tries to log in while the app is in Development mode.

**Solution**: Either add the user as a tester in your Facebook app settings, or complete the App Review process to make your app available to all users.

### User's email not returned

Facebook only returns the email address if:

- The user has a confirmed email on their Facebook account
- Your app has been granted the `email` permission
- The `email` permission is marked as "Ready for testing" in **Use Cases > Authentication and Account Creation**

**Solution**: Check that the `email` permission is properly configured in your Facebook app's Use Cases settings.

### "Redirect URI mismatch" error

This error indicates the callback URL configured in Facebook doesn't match the one used during authentication.

**Solution**: Verify that the **Valid OAuth Redirect URIs** in your Facebook app settings exactly matches `https://<project-ref>.supabase.co/auth/v1/callback`. Make sure there are no trailing slashes or typos.

### Login works in development but not production

If login works locally but fails in production, check:

- Your production URL is added to **Valid OAuth Redirect URIs** in Facebook
- The App ID and Secret in your Supabase dashboard match your Facebook app
- Your Facebook app is in **Live** mode (not Development mode)

## Resources

- [Supabase - Get started for free](https://supabase.com)
- [Supabase JS Client](https://github.com/supabase/supabase-js)
- [Facebook Developers Dashboard](https://developers.facebook.com/)
