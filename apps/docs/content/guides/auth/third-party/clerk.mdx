---
id: 'auth-third-party-clerk'
title: 'Clerk'
subtitle: 'Use Clerk with your Supabase project'
---

Clerk can be used as a third-party authentication provider alongside Supabase Auth, or standalone, with your Supabase project.

## Getting started

Getting started is incredibly easy. Start off by visiting [Clerk's Connect with Supabase page](https://dashboard.clerk.com/setup/supabase) to configure your Clerk instance for Supabase compatibility.

Finally add a [new Third-Party Auth integration with Clerk](/dashboard/project/_/auth/third-party) in the Supabase dashboard.

### Configure for local development or self-hosting

When developing locally or self-hosting with the Supabase CLI, add the following config to your `supabase/config.toml` file:

```toml
[auth.third_party.clerk]
enabled = true
domain = "example.clerk.accounts.dev"
```

You will still need to configure your Clerk instance for Supabase compatibility.

### Manually configuring your Clerk instance

If you are not able to use [Clerk's Connect with Supabase page](https://dashboard.clerk.com/setup/supabase) to configure your Clerk instance for working with Supabase, follow these steps.

1. Add the `role` claim to [Clerk session tokens](https://clerk.com/docs/backend-requests/resources/session-tokens) by [customizing them](https://clerk.com/docs/backend-requests/custom-session-token). End-users who are authenticated should have the `authenticated` value for the claim. If you have an advanced Postgres setup where authenticated end-users use different Postgres roles to access the database, adjust the value to use the correct role name.
2. Once all Clerk session tokens for your instance contain the `role` claim, add a [new Third-Party Auth integration with Clerk](/dashboard/project/_/auth/third-party) in the Supabase dashboard or register it in the CLI as instructed above.

## Setup the Supabase client library

<Tabs type="underlined" queryGroup="language">

<TabPanel id="ts" label="TypeScript">

<$CodeSample
path="/clerk/hooks/useSupabaseClient.ts"
lines={[[6, 14]]}
hideElidedLines={true}
/>

</TabPanel>

<$Show if="sdk:dart">

<TabPanel id="dart" label="Flutter">

```dart
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
...

await Supabase.initialize(
  url: 'SUPABASE_URL',
  anonKey: 'SUPABASE_PUBLISHABLE_KEY',
  accessToken: () async {
    final token = await ClerkAuth.of(context).sessionToken();
    return token.jwt;
  },
);
```

</TabPanel>
</$Show>

<$Show if="sdk:swift">

<TabPanel id="swift" label="Swift (iOS)">

```swift
import Clerk
import Supabase

let supabase = SupabaseClient(
  supabaseURL: URL(string: "https://project-ref.supabase.io")!,
  supabaseKey: "supabase.anon.key",
  options: SupabaseClientOptions(
    auth: SupabaseClientOptions.AuthOptions(
      accessToken: {
        try await Clerk.shared.session?.getToken()?.jwt
      }
    )
  )
)
```

</TabPanel>
</$Show>

</Tabs>

## Using RLS policies

Once you've configured the Supabase client library to use Clerk session tokens, you can use RLS policies to secure access to your project's database, Storage objects and Realtime channels.

The recommended way to design RLS policies with Clerk is to use claims present in your Clerk session token to allow or reject access to your project's data. Check [Clerk's docs](https://clerk.com/docs/backend-requests/resources/session-tokens) on the available JWT claims and their values.

### Example: Check user organization role

<$CodeSample
path="/clerk/supabase/migrations/20250501155648_setup_database.sql"
lines={[[10, 18]]}
hideElidedLines={true}
/>

This RLS policy checks that the newly inserted row in the table has the user's declared organization ID in the `organization_id` column. Additionally it ensures that they're an `org:admin`.

This way only organization admins can add rows to the table, for organizations they're a member of.

### Example: Check user has passed second factor verification

<$CodeSample
path="/clerk/supabase/migrations/20250501155648_setup_database.sql"
lines={[[28, 35]]}
hideElidedLines={true}
/>

This example uses a restrictive RLS policy checks that the [second factor verification](https://clerk.com/docs/guides/reverification) age element in the `fva` claim is not `'-1'` indicating the user has passed through second factor verification.

## Deprecated integration with JWT templates

As of 1st April 2025 the previously available [Clerk Integration with Supabase](/partners/integrations/clerk) is considered deprecated and is no longer recommended for use. All projects using the deprecated integration will be excluded from Third-Party Monthly Active User (TP-MAU) charges until at least 1st January 2026.

This integration used low-level primitives that are still available in Supabase and Clerk, such as a [configurable JWT secret](/dashboard/project/_/settings/api) and [JWT templates from Clerk](https://clerk.com/docs/backend-requests/jwt-templates). This enables you to keep using it in an unofficial manner, though only limited support will be provided from Supabase.

Deprecation is done for the following reasons:

- Sharing your project's JWT secret with a third-party is a problematic security practice
- Rotating the project's JWT secret in this case almost always results in significant downtime for your application
- Additional latency to [generate a new JWT](https://clerk.com/docs/backend-requests/jwt-templates#generate-a-jwt) for use with Supabase, instead of using the Clerk [session tokens](https://clerk.com/docs/backend-requests/resources/session-tokens)
