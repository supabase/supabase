---
id: 'auth-azure'
title: 'Login with Azure (Microsoft)'
description: 'Add Azure (Microsoft) OAuth to your Supabase project'
---

To enable Azure (Microsoft) Auth for your project, you need to set up an Azure OAuth application and add the application credentials to your Supabase Dashboard.

## Overview

Setting up OAuth with Azure consists of four broad steps:

- Create an OAuth application under Azure Entra ID.
- Add a secret to the application.
- Add the Supabase Auth callback URL to the allowlist in the OAuth application in Azure.
- Configure the client ID and secret of the OAuth application within the Supabase Auth dashboard.

## Access your Azure Developer account

- Go to [portal.azure.com](https://portal.azure.com/#home).
- Login and select Microsoft Entra ID under the list of Azure Services.

## Register an application

- Under Microsoft Entra ID, select _App registrations_ in the side panel and select _New registration._
- Choose a name and select your preferred option for the supported account types.
- Specify a _Web_ _Redirect URI_. It should look like this: `https://<project-ref>.supabase.co/auth/v1/callback`
- Finally, select _Register_ at the bottom of the screen.

![Register an application.](/docs/img/guides/auth-azure/azure-register-app.png)

## Obtain a client ID and secret

### Local development with Azure OAuth

Azure does not allow `127.0.0.1` as a redirect URI hostname and requires
the use of `localhost`.

To enable Azure OAuth during local Supabase development, configure the
Supabase API external URL in your `config.toml`:

```toml
[api]
external_url = "http://localhost:54321"
```

- Once your app has been registered, the client ID can be found under the [list of app registrations](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps) under the column titled _Application (client) ID_.
- You can also find it in the app overview screen.
- Place the Client ID in the Azure configuration screen in the Supabase Auth dashboard.

![Obtain the client ID](/docs/img/guides/auth-azure/azure-client-id.png)

- Select _Add a certificate or secret_ in the app overview screen and open the _Client secrets_ tab.
- Select _New client secret_ to create a new client secret.
- Choose a preferred expiry time of the secret. Make sure you record this in your calendar days in advance so you have enough time to create a new one without suffering from any downtime.
- Once the secret is generated place the _Value_ column (not _Secret ID_) in the Azure configuration screen in the Supabase Auth dashboard.

![Obtain the client secret](/docs/img/guides/auth-azure/azure-client-secret.png)

You can also configure the Azure auth provider using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Configure Azure auth provider
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_azure_enabled": true,
    "external_azure_client_id": "your-azure-client-id",
    "external_azure_secret": "your-azure-client-secret",
    "external_azure_url": "your-azure-url"
  }'
```

## Guarding against unverified email domains

Microsoft Entra ID can send out unverified email domains in certain cases. This may open up your project to a vulnerability where a malicious user can impersonate already existing accounts on your project.

This only applies in at least one of these cases:

- You have configured the `authenticationBehaviors` setting of your OAuth application to allow unverified email domains
- You are using an OAuth app configured as single-tenant in the supported account types
- Your OAuth app was created before June 20th 2023 after Microsoft announced this vulnerability, and the app had used unverified emails prior

This means that most OAuth apps _are not susceptible_ to this vulnerability.

Despite this, we recommend configuring the [optional `xms_edov` claim](https://learn.microsoft.com/en-us/azure/active-directory/develop/migrate-off-email-claim-authorization#using-the-xms_edov-optional-claim-to-determine-email-verification-status-and-migrate-users) on the OAuth app. This claim allows Supabase Auth to identify with certainty whether the email address sent over by Microsoft Entra ID is verified or not.

Configure this in the following way:

- Select the _App registrations_ menu in Microsoft Entra ID on the Azure portal.
- Select the OAuth app.
- Select the _Manifest_ menu in the sidebar.
- Make a backup of the JSON just in case.
- Identify the `optionalClaims` key.
- Edit it by specifying the following object:
  ```json
    "optionalClaims": {
        "idToken": [
            {
                "name": "xms_edov",
                "source": null,
                "essential": false,
                "additionalProperties": []
            },
            {
                "name": "email",
                "source": null,
                "essential": false,
                "additionalProperties": []
            }
        ],
        "accessToken": [
            {
                "name": "xms_edov",
                "source": null,
                "essential": false,
                "additionalProperties": []
            }
        ],
        "saml2Token": []
    },
  ```
- Select _Save_ to apply the new configuration.

## Configure a tenant URL (optional)

A Microsoft Entra tenant is the directory of users who are allowed to access your project. This section depends on what your OAuth registration uses for _Supported account types._

By default, Supabase Auth uses the _common_ Microsoft tenant (`https://login.microsoftonline.com/common`) which generally allows any Microsoft account to sign in to your project. Microsoft Entra further limits what accounts can access your project depending on the type of OAuth application you registered.

If your app is registered as _Personal Microsoft accounts only_ for the _Supported account types_ set Microsoft tenant to _consumers_ (`https://login.microsoftonline.com/consumers`).

{/* supa-mdx-lint-disable-next-line Rule004ExcludeWords */}
If your app is registered as _My organization only_ for the _Supported account types_ you may want to configure Supabase Auth with the organization's tenant URL. This will use the tenant's authorization flows instead, and will limit access at the Supabase Auth level to Microsoft accounts arising from only the specified tenant.

Configure this by storing a value under _Azure Tenant URL_ in the Supabase Auth provider configuration page for Azure that has the following format `https://login.microsoftonline.com/<tenant-id>`.

## Add login code to your client app

<Admonition type="tip">

Supabase Auth requires that Azure returns a valid email address. Therefore you must request the `email` scope in the `signInWithOAuth` method.

</Admonition>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

<$Partial path="create_client_snippet.mdx" />

When your user signs in, call [`signInWithOAuth()`](/docs/reference/javascript/auth-signinwithoauth) with `azure` as the `provider`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://your-project.supabase.co', 'sb_publishable_... or anon key')

// ---cut---
async function signInWithAzure() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'email',
    },
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

When your user signs in, call [`signInWithOAuth()`](/docs/reference/dart/auth-signinwithoauth) with `azure` as the `provider`:

```dart
Future<void> signInWithAzure() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.azure,
    redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
    authScreenLaunchMode:
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

When your user signs in, call [signInWith(Provider)](/docs/reference/kotlin/auth-signinwithoauth) with `Azure` as the `Provider`:

```kotlin
suspend fun signInWithAzure() {
    supabase.auth.signInWith(Azure) {
        scopes.add("email")
    }
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

## Obtain the provider refresh token

Azure OAuth2.0 doesn't return the `provider_refresh_token` by default. If you need the `provider_refresh_token` returned, you will need to include the following scope:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://your-project.supabase.co', 'sb_publishable_... or anon key')

// ---cut---
async function signInWithAzure() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'offline_access',
    },
  })
}
```

</TabPanel>
<TabPanel id="flutter" label="Flutter">

```dart
Future<void> signInWithAzure() async {
  await supabase.auth.signInWithOAuth(
    OAuthProvider.azure,
    scopes: 'offline_access',
  );
}
```

</TabPanel>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
suspend fun signInWithAzure() {
    supabase.auth.signInWith(Azure) {
        scopes.add("offline_access")
    }
}
```

</TabPanel>
</$Show>
</Tabs>

## Resources

- [Azure Developer Account](https://portal.azure.com)
- [GitHub Discussion](https://github.com/supabase/gotrue/pull/54#issuecomment-757043573)
- [Potential Risk of Privilege Escalation in Azure AD Applications](https://msrc.microsoft.com/blog/2023/06/potential-risk-of-privilege-escalation-in-azure-ad-applications/)
