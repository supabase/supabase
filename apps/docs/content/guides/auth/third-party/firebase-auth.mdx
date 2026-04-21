---
id: 'auth-third-party-firebase-auth'
title: 'Firebase Auth'
subtitle: 'Use Firebase Auth with your Supabase project'
---

Firebase Auth can be used as a third-party authentication provider alongside Supabase Auth, or standalone, with your Supabase project.

## Getting started

1. First you need to add an integration to connect your Supabase project with your Firebase project. You will need to get the Project ID in the [Firebase Console](https://console.firebase.google.com/u/0/project/_/settings/general).
2. Add a new Third-party Auth integration in your project's [Authentication settings](/dashboard/project/_/auth/third-party).
3. If you are using Third Party Auth when self hosting, create and attach restrictive RLS policies to all tables in your public schema, Storage and Realtime to **prevent unauthorized access from unrelated Firebase projects**.
4. Assign the `role: 'authenticated'` [custom user claim](https://firebase.google.com/docs/auth/admin/custom-claims) to all your users.
5. Finally set up the Supabase client in your application.

## Setup the Supabase client library

<Tabs type="underlined" queryGroup="firebase-create-client">

<TabPanel id="ts" label="TypeScript">

Creating a client for the Web is as easy as passing the `accessToken` async function. This function should [return the Firebase Auth JWT of the current user](https://firebase.google.com/docs/auth/admin/verify-id-tokens#web) (or null if no such user) is found.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://<supabase-project>.supabase.co',
  'SUPABASE_PUBLISHABLE_KEY',
  {
    accessToken: async () => {
      return (await firebase.auth().currentUser?.getIdToken(/* forceRefresh */ false)) ?? null
    },
  }
)
```

Make sure all users in your application have the `role: 'authenticated'` [custom claim](https://firebase.google.com/docs/auth/admin/custom-claims) set. If you're using the `onCreate` Cloud Function to add this custom claim to newly signed up users, you will need to call `getIdToken(/* forceRefresh */ true)` immediately after sign up as the `onCreate` function does not run synchronously.

</TabPanel>

<$Show if="sdk:dart">

<TabPanel id="dart" label="Flutter">

Creating a client for the Web is as easy as passing the `accessToken` async function. This function should [return the Firebase Auth JWT of the current user](https://firebase.google.com/docs/auth/admin/verify-id-tokens) (or null if no such user) is found.

```dart
await Supabase.initialize(
  url: supabaseUrl,
  anonKey: supabaseKey,
  debug: false,
  accessToken: () async {
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();
    return token;
  },
);
```

Make sure all users in your application have the `role: 'authenticated'` [custom claim](https://firebase.google.com/docs/auth/admin/custom-claims) set. If you're using the `onCreate` Cloud Function to add this custom claim to newly signed up users, you will need to call `getIdToken(/* forceRefresh */ true)` immediately after sign up as the `onCreate` function does not run synchronously.

</TabPanel>
</$Show>

<$Show if="sdk:swift">

<TabPanel id="swift" label="Swift (iOS)">

```swift
import Supabase
import FirebaseAuth

struct MissingFirebaseTokenError: Error {}

let supabase = SupabaseClient(
  supabaseURL: URL(string: "https://<supabase-project>.supabase.co")!,
  supabaseKey: "SUPABASE_PUBLISHABLE_KEY",
  options: SupabaseClientOptions(
    auth: SupabaseClientOptions.AuthOptions(
      accessToken: {
        guard let token = await Auth.auth().currentUser?.getIDToken() else {
          throw MissingFirebaseTokenError()
        }

        return token
      }
    )
  )
)
```

</TabPanel>
</$Show>

<$Show if="sdk:kotlin">

<TabPanel id="kotlin" label="Kotlin (Android)">

Create a Supabase client with the `accessToken` function that returns the Firebase Auth JWT of the current user. This code uses the [official Firebase SDK](https://firebase.google.com/docs/auth/android/start) for Android.

```kotlin
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase

val supabase = createSupabaseClient(
    "https://<supabase-project>.supabase.co",
    "SUPABASE_PUBLISHABLE_KEY"
) {
    accessToken = {
        Firebase.auth.currentUser?.getIdToken(false)?.await()?.token
    }
}
```

</TabPanel>
</$Show>

<$Show if="sdk:kotlin">

<TabPanel id="kotlinmp" label="Kotlin (Multiplatform)">

Create a Supabase client with the `accessToken` function that returns the Firebase Auth JWT of the current user. This code uses a [community Firebase SDK](https://github.com/GitLiveApp/firebase-kotlin-sdk) which supports Kotlin Multiplatform.

```kotlin
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth

val supabase = createSupabaseClient(
    "https://<supabase-project>.supabase.co",
    "SUPABASE_PUBLISHABLE_KEY"
) {
    accessToken = {
        Firebase.auth.currentUser?.getIdToken(false)
    }
}
```

</TabPanel>
</$Show>

</Tabs>

## Add a new Third-Party Auth integration to your project

In the dashboard navigate to your project's [Authentication settings](/dashboard/project/_/auth/third-party) and find the Third-Party Auth section to add a new integration.

In the CLI add the following config to your `supabase/config.toml` file:

```toml
[auth.third_party.firebase]
enabled = true
project_id = "<id>"
```

## Adding an extra layer of security to your project's RLS policies (self-hosting only)

<Admonition type="caution">

**Follow this section carefully to prevent unauthorized access to your project's data when self-hosting.**

When using the Supabase hosted platform, following this step is optional.

</Admonition>

Firebase Auth uses a single set of JWT signing keys for all projects. This means that JWTs issued from an unrelated Firebase project to yours could access data in your Supabase project.

When using the Supabase hosted platform, JWTs coming from Firebase project IDs you have not registered will be rejected before they reach your database. When self-hosting implementing this mechanism is your responsibility. An easy way to guard against this is to create and maintain the following RLS policies for **all of your tables in the `public` schema**. You should also attach this policy to [Storage](/docs/guides/storage/security/access-control) buckets or [Realtime](/docs/guides/realtime/authorization) channels.

It's recommended you use a [restrictive Postgres Row-Level Security policy](https://www.postgresql.org/docs/current/sql-createpolicy.html).

Restrictive RLS policies differ from regular (or permissive) policies in that they use the `as restrictive` clause when being defined. They do not grant permissions, but rather restrict any existing or future permissions. They're great for cases like this where the technical limitations of Firebase Auth remain separate from your app's logic.

<Admonition type="danger">

Postgres has two types of policies: permissive and restrictive. This example uses restrictive policies so make sure you don't omit the `as restrictive` clause.

</Admonition>

This is an example of such an RLS policy that will restrict access to only your project's (denoted with `<firebase-project-id>`) users, and not any other Firebase project.

```sql
create policy "Restrict access to Supabase Auth and Firebase Auth for project ID <firebase-project-id>"
  on table_name
  as restrictive
  to authenticated
  using (
    (auth.jwt()->>'iss' = 'https://<project-ref>.supabase.co/auth/v1')
    or
    (
        auth.jwt()->>'iss' = 'https://securetoken.google.com/<firebase-project-id>'
        and
        auth.jwt()->>'aud' = '<firebase-project-id>'
     )
  );
```

If you have a lot of tables in your app, or need to manage complex RLS policies for [Storage](/docs/guides/storage) or [Realtime](/docs/guides/realtime) it can be useful to define a [stable Postgres function](https://www.postgresql.org/docs/current/xfunc-volatility.html) that performs the check to cut down on duplicate code. For example:

```sql
create function public.is_supabase_or_firebase_project_jwt()
  returns bool
  language sql
  stable
  returns null on null input
  return (
    (auth.jwt()->>'iss' = 'https://<project-ref>.supabase.co/auth/v1')
    or
    (
        auth.jwt()->>'iss' = concat('https://securetoken.google.com/<firebase-project-id>')
        and
        auth.jwt()->>'aud' = '<firebase-project-id>'
     )
  );
```

Make sure you substitute `<project-ref>` with your Supabase project's ID and the `<firebase-project-id>` to your Firebase Project ID. Then the restrictive policies on all your tables, buckets and channels can be simplified to be:

```sql
create policy "Restrict access to correct Supabase and Firebase projects"
  on table_name
  as restrictive
  to authenticated
  using ((select public.is_supabase_or_firebase_project_jwt()) is true);
```

## Assign the "role" custom claim

Your Supabase project inspects the `role` claim present in all JWTs sent to it, to assign the correct Postgres role when using the Data API, Storage or Realtime authorization.

By default, Firebase JWTs do not contain a `role` claim in them. If you were to send such a JWT to your Supabase project, the `anon` role would be assigned when executing the Postgres query. Most of your app's logic will be accessible by the `authenticated` role.

### Use Firebase Authentication functions to assign the authenticated role

You have two choices to set up a Firebase Authentication function depending on your Firebase project's configuration:

1. Easiest: Use a [blocking Firebase Authentication function](https://firebase.google.com/docs/auth/extend-with-blocking-functions) but this is only available if your project uses [Firebase Authentication with Identity Platform](https://cloud.google.com/security/products/identity-platform).
2. Manually assign the custom claims to all users with the [admin SDK](https://firebase.google.com/docs/auth/admin/custom-claims#set_and_validate_custom_user_claims_via_the_admin_sdk) and define an [`onCreate` Firebase Authentication Cloud Function](https://firebase.google.com/docs/auth/extend-with-functions) to persist the role to all newly created users.

<Tabs type="underlined" queryGroup="firebase-functions">

<TabPanel id="blocking-nodejs" label="Node.js (Blocking Functions Gen 2)">

```typescript
import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity'

export const beforecreated = beforeUserCreated((event) => {
  return {
    customClaims: {
      // The Supabase project will use this role to assign the `authenticated`
      // Postgres role.
      role: 'authenticated',
    },
  }
})

export const beforesignedin = beforeUserSignedIn((event) => {
  return {
    customClaims: {
      // The Supabase project will use this role to assign the `authenticated`
      // Postgres role.
      role: 'authenticated',
    },
  }
})
```

Note that instead of using `customClaims` you can instead use `sessionClaims`. The difference is that `session_claims` are not saved in the Firebase user profile, but remain valid for as long as the user is signed in.

</TabPanel>

<TabPanel id="blocking-python" label="Python (Blocking Functions Gen 2)">

```python
@identity_fn.before_user_created()
def set_supabase_role_sign_up(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeCreateResponse | None:
  return identity_fn.BeforeCreateResponse(
    # The Supabase project will use this role to assign the `authenticated`
    # Postgres role.
    custom_claims={'role': 'authenticated'})

@identity_fn.before_user_signed_in()
def set_supabase_role_sign_in(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeSignInResponse | None:
  return identity_fn.BeforeSignInResponse(
    # The Supabase project will use this role to assign the `authenticated`
    # Postgres role.
    custom_claims={'role': 'authenticated'})
```

Note that instead of using `custom_claims` you can instead use `session_claims`. The difference is that `session_claims` are not saved in the Firebase user profile, but remain valid for as long as the user is signed in.

</TabPanel>

<TabPanel id="oncreate-nodejs" label="onCreate Cloud Function in Node.js">

```javascript
const functions = require('firebase-functions')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getDatabase } = require('firebase-admin/database')

initializeApp()

// On sign up.
exports.processSignUp = functions.auth.user().onCreate(async (user) => {
  try {
    // Set custom user claims on this newly created user.
    await getAuth().setCustomUserClaims(user.uid, {
      role: 'authenticated',
    })
  } catch (error) {
    console.log(error)
  }
})
```

Note that the `onCreate` Firebase Cloud Function is not _synchronous_ (unlike the Blocking Functions), so the very first ID token received by the Firebase client library in your app _will not contain_ the `role: 'authenticated'` claim. Force-refresh the ID token immediately after sign-up to fetch an ID token with the applied role.

</TabPanel>

</Tabs>

Finally deploy your functions for the changes to take effect:

```
firebase deploy --only functions
```

Note that these functions are only called on new sign-ups and sign-ins. Existing users will not have these claims in their ID tokens. You will need to use the admin SDK to assign the role custom claim to all users. Make sure you do this after the blocking Firebase Authentication functions as described above are deployed.

### Use the admin SDK to assign the role custom claim to all users

You need to run a script that will assign the `role: 'authenticated'` custom claim to all of your existing Firebase Authentication users. You can do this by combining the [list users](https://firebase.google.com/docs/auth/admin/manage-users#list_all_users) and [set custom user claims](https://firebase.google.com/docs/auth/admin/create-custom-tokens) admin APIs. An example script is provided below:

```javascript
'use strict';
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
initializeApp();

async function setRoleCustomClaim() => {
  let nextPageToken = undefined

  do {
    const listUsersResult = await getAuth().listUsers(1000, nextPageToken)

    nextPageToken = listUsersResult.pageToken

    await Promise.all(listUsersResult.users.map(async (userRecord) => {
      try {
        await getAuth().setCustomUserClaims(userRecord.id, {
          role: 'authenticated'
        })
      } catch (error) {
        console.error('Failed to set custom role for user', userRecord.id)
      }
    })
  } while (nextPageToken);
};

setRoleCustomClaim().then(() => process.exit(0))
```

After all users have received the `role: 'authenticated'` claim, it will appear in all newly issued ID tokens for the user.
