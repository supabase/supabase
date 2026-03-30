---
title: 'Supabase Realtime: Broadcast and Presence Authorization'
description: 'Secure Realtime Broadcast and Presence with Authorization'
author: filipe
imgSocial: 2024-08-13-supabase-realtime-broadcast-and-presence-authorization/OG.png
imgThumb: 2024-08-13-supabase-realtime-broadcast-and-presence-authorization/thumb.png
launchweek: '12'
categories:
  - launch-week
tags:
  - realtime
  - engineering
date: '2024-08-13'
toc_depth: 3
---

Today we're releasing Authorization for Realtime's Broadcast and Presence.

For context, Supabase includes three useful extensions for building real-time applications.

1. [Broadcast](https://supabase.com/docs/guides/realtime/broadcast): Send ephemeral, low-latency messages between users.
2. [Presence](https://supabase.com/docs/guides/realtime/presence): Show when users are online and share state between users.
3. [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes): Listen to Postgres database changes.

This release introduces authorization for Broadcast and Presence using Row Level Security policies:

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/IXRrU9MpA8Q"
    title="I leaked the data through Supabase Realtime - Broadcast and Presence Authorization"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

To facilitate this, Realtime creates and manages a `messages` table in your Database's `realtime` schema:

<Img
  src={{
    dark: '/images/blog/2024-08-13-supabase-realtime-broadcast-and-presence-authorization/schema--dark.png',
    light:
      '/images/blog/2024-08-13-supabase-realtime-broadcast-and-presence-authorization/schema--light.png',
  }}
  alt="The table that is used to check policies."
/>

You can then write RLS Policies for this table and Realtime will then allow or deny clients' access to your Broadcast and Presence Channels:

- `SELECT` Policies - Allow/Deny receiving messages
- `INSERT` Policies - Allow/Deny sending messages

## How Realtime works without Authorization

When you want to connect to a Realtime Channel, you can do the following:

{/* prettier-ignore */}
```tsx
import { createClient } from '@supabase/supabase-js'

// Prepare client with authenticated user
const client = createClient('<url>', '<anon_key>')
client.realtime.setAuth(token)

// Prepare the realtime channel
const channel = client.channel('topic')

channel
.subscribe((status: string, err: any) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected')
  }
})
```

Without Authorization, any authenticated client can subscribe to any _public_ Channel, to send and receive any messages.

## Adding Authorization to Realtime Channels

You can convert this into an _authorized_ Channel (one that verifies RLS policies) in two steps:

1. [Create RLS Policies](#create-rls-policies)
2. [Enabling Authorization on Channels](#enabling-authorization-on-channels)

### 1. Create RLS Policies

We'll keep it simple with this example. Let's allow authenticated users to:

- Broadcast: send and receive messages (full access)
- Presence: sync, track, and untrack (full access)

```sql
create policy "authenticated user listen to all"
on "realtime"."messages"
as permissive
for select -- receive
to authenticated
using ( true );

create policy "authenticated user write to all"
on "realtime"."messages"
as permissive
for insert -- send
to authenticated
with check ( true );
```

We also have a new database function called `realtime.topic()`. You can use this to access the name of the Channel inside your Policies:

```sql
create policy "authenticated users can only read from 'locked' topic"
on "realtime"."messages"
as permissive
for select   -- read only
to authenticated
using (
  realtime.topic() = 'locked'  -- access the topic name
);
```

You can use the `extension` column in the `messages` table to allow/deny specify the Realtime extension:

```sql
create policy "read access to broadcast and presence"
on "realtime"."messages"
as permissive
for select
to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence') -- specify the topic name
);
```

Reference our [GitHub Discussion](https://github.com/orgs/supabase/discussions/22484) for more complex use cases.

### 2. Enabling Authorization on Channels

We've introduced a new configuration parameter `private` to signal to Realtime servers that you want to check authorization on the channel.

If you try to subscribe with an unauthorized user you will get a new error message informing the user that they do not have permission to access the topic.

```tsx
// With anon user
supabase.realtime
  .channel('locked', { config: { private: true } })
  .subscribe((status: string, err: any) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected!')
    } else {
      console.error(err.message)
    }
  })

// Outputs the following code:
// "You do not have permissions to read from this Topic"
```

But if you connect with an authorized user you will be able to listen to all messages from the “locked” topic

```tsx
// With an authenticated user
supabase.realtime.setAuth(token)

supabase.realtime
  .channel('locked', { config: { private: true } })
  .subscribe((status: string, err: any) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected!')
    } else {
      console.error(err.message)
    }
  })

// Outputs the following code:
// "Connected!"
```

### Advanced examples

You can find a more complex example in the [Next.js Authorization Demo](https://github.com/supabase/supabase/tree/master/examples/realtime/nextjs-authorization-demo) where we are using this feature to build chat rooms with restricted access or you could check the [Flutter Figma Clone](https://github.com/supabase/supabase/tree/master/examples/realtime/flutter-figma-clone) to see how you can secure realtime communication between users.

## How does it work?

We decided on an approach that keeps your database and RLS policies at the heart of this new authorization strategy.

### Database as a source of security

To achieve Realtime authorization, we looked into our current solutions, namely how [Storage](https://supabase.com/docs/guides/storage/security/access-control) handles Access Control. Due to the nature of Realtime, our primitives are different as we have no assets stored in the database. So how did we achieve it?

On Channel subscription you are able to inform Realtime to use a private Channel and we will do the required checks.

The checks are done by running SELECT and INSERT queries on the new `realtime.messages` table which are then rolled backed so nothing is persisted. Then, based on the query result, we can determine the policies the user has for a given extension.

As a result, in the server, we create a map of policies per connected socket so we can keep them in memory associated with the user's connection.

```elixir
%Policies{
  broadcast: %BroadcastPolicies{read: false, write: false},
  presence: %PresencePolicies{read: false, write: false}
}
```

### One user, one context, one connection

Now that we have set up everything on the database side, let's understand how it works and how we can verify authorization via RLS policies.

Realtime uses the private flag client's define when creating channel, takes the headers used to upgrade to the WebSocket connection, claims from your verified JSON Web Token (JWT), loads them into a Postgres transaction using `set_config`, verifies them by querying the `realtime.messages` table, and stores the output as a group of policies within the context of the user's channel on the server.

<Img
  src={{
    dark: '/images/blog/2024-08-13-supabase-realtime-broadcast-and-presence-authorization/one-user-connection--dark.png',
    light:
      '/images/blog/2024-08-13-supabase-realtime-broadcast-and-presence-authorization/one-user-connection--light.png',
  }}
  alt="Flow of checks done against the database to determine the policies for a user connection."
/>

## How is this approach performant?

Realtime checks RLS policies against your database on Channel subscription, so expect a small latency increase initially, but will be cached on the server so all messages will pass from client to server to clients with minimal latency.

Latency between geographically close users is very important for a product like Realtime. To deliver messages as fast as possible between users on our global network, we cache the policies.

We can maintain high throughput and low latency on a Realtime Channel with Broadcast and Presence authorization because:

- the policy is only generated when a user connects to a Channel
- the policy cached in memory is close to your users
- the policy is cached for the duration of the connection, until the JWT expires, or when the user sends a new refresh token

If a user does not have access to a given Channel they won't be able to connect at all and their connections will be rejected.

### Refreshing your Policies

Realtime will check RLS policies against your database whenever the user connects or there's a new refresh token to make sure that it continues to be authorized despite any changes to its claims. Be aware of your token expiration time to ensure users policies are checked regularly.

### Postgres Changes Support

This method for Realtime Authorization currently only supports Broadcast and Presence. Postgres Changes already adheres to RLS policies on the tables you're listening to so you can continue using that authorization scheme for getting changes from your database.

## Availability

Broadcast and Presence Authorization is available in Public Beta. We are looking for feedback so please do share it in the [GitHub discussion](https://github.com/orgs/supabase/discussions/22484).

## Future Work

We're excited to make Realtime more secure, performant, and stable.

We'll take your feedback, expand this approach, and continue to improve the developer experience as you implement Realtime Authorization for your use cases.
