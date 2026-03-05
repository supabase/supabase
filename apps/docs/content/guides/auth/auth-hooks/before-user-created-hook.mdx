---
id: 'before-user-created-hook'
title: 'Before User Created Hook'
subtitle: 'Prevent unwanted signups by inspecting and rejecting user creation requests'
---

This hook runs before a new user is created. It allows developers to inspect the incoming user object and optionally reject the request. Use this to enforce custom signup policies that Supabase Auth does not handle natively - such as blocking disposable email domains, restricting access by region or IP, or requiring that users belong to a specific email domain.

You can implement this hook using an HTTP endpoint or a Postgres function. If the hook returns an error object, the signup is denied and the user is not created. If the hook responds successfully (HTTP 200 or 204 with no error), the request proceeds as usual. This gives you full control over which users are allowed to register — and the flexibility to apply that logic server-side.

## Inputs

Supabase Auth will send a payload containing these fields to your hook:

| Field      | Type     | Description                                                                               |
| ---------- | -------- | ----------------------------------------------------------------------------------------- |
| `metadata` | `object` | Metadata about the request. Includes IP address, request ID, and hook type.               |
| `user`     | `object` | The user record that is about to be created. Matches the shape of the `auth.users` table. |

<Admonition type="note">

Because the hook is ran just before the insertion into the database, this user will not be found in Postgres at the time the hook is called.

</Admonition>

<Tabs
  scrollable
  size="small"
  type="underlined"
>
<TabPanel id="before-user-created-json" label="JSON">

```json
{
  "metadata": {
    "uuid": "8b34dcdd-9df1-4c10-850a-b3277c653040",
    "time": "2025-04-29T13:13:24.755552-07:00",
    "name": "before-user-created",
    "ip_address": "127.0.0.1"
  },
  "user": {
    "id": "ff7fc9ae-3b1b-4642-9241-64adb9848a03",
    "aud": "authenticated",
    "role": "",
    "email": "valid.email@supabase.com",
    "phone": "",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {},
    "identities": [],
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z",
    "is_anonymous": false
  }
}
```

</TabPanel>
<TabPanel id="before-user-created-json-schema" label="JSON Schema">

```json
{
  "type": "object",
  "properties": {
    "metadata": {
      "type": "object",
      "properties": {
        "uuid": {
          "type": "string",
          "format": "uuid"
        },
        "time": {
          "type": "string",
          "format": "date-time"
        },
        "ip_address": {
          "type": "string",
          "format": "ipv4"
        },
        "name": {
          "type": "string",
          "enum": ["before-user-created"]
        }
      },
      "required": ["uuid", "time", "ip_address", "name"]
    },
    "user": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "aud": { "type": "string" },
        "role": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "app_metadata": {
          "type": "object",
          "properties": {
            "provider": { "type": "string" },
            "providers": {
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["provider", "providers"]
        },
        "user_metadata": { "type": "object" },
        "identities": {
          "type": "array",
          "items": { "type": "object" }
        },
        "created_at": { "type": "string", "format": "date-time" },
        "updated_at": { "type": "string", "format": "date-time" },
        "is_anonymous": { "type": "boolean" }
      },
      "required": [
        "id",
        "aud",
        "role",
        "email",
        "phone",
        "app_metadata",
        "user_metadata",
        "identities",
        "created_at",
        "updated_at",
        "is_anonymous"
      ]
    }
  },
  "required": ["metadata", "user"]
}
```

</TabPanel>
</Tabs>

## Outputs

Your hook must return a response that either allows or blocks the signup request.

| Field   | Type     | Description                                                                                           |
| ------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `error` | `object` | (Optional) Return this to reject the signup. Includes a code, message, and optional HTTP status code. |

Returning an empty object with a `200` or `204` status code allows the request to proceed. Returning a JSON response with an `error` object and a `4xx` status code blocks the request and propagates the error message to the client. See the [error handling documentation](/docs/guides/auth/auth-hooks#error-handling) for more details.

### Allow the signup

```json
{}
```

or with a `204 No Content` response:

```http
HTTP/1.1 204 No Content
```

### Reject the signup with an error

```json
{
  "error": {
    "http_code": 400,
    "message": "Only company emails are allowed to sign up."
  }
}
```

This response will block the user creation and return the error message to the client that attempted signup.

## Examples

Each of the following examples shows how to use the `before-user-created` hook to control signup behavior. Each use case includes both an HTTP implementation (e.g. using an Edge Function) and a SQL implementation (Postgres function).

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>

<TabPanel id="sql" label="SQL">
<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql-allow-by-domain"
>

<TabPanel id="sql-allow-by-domain" label="Allow by Domain">

Allow signups only from specific domains like supabase.com or example.test. Reject all others. This is useful for private/internal apps, enterprise gating, or invite-only beta access.

The `before-user-created` hook solves this by:

- Detecting that a user is about to be created
- Providing the email address in the `user.email` field

Run the following snippet in your project's [SQL Editor](/dashboard/project/_/sql/new). This will create a `signup_email_domains` table with some sample data and a `hook_restrict_signup_by_email_domain` function to be called by the `before-user-created` auth hook.

```sql
-- Create ENUM type for domain rule classification
do $$ begin
  create type signup_email_domain_type as enum ('allow', 'deny');
exception
  when duplicate_object then null;
end $$;

-- Create the signup_email_domains table
create table if not exists public.signup_email_domains (
  id serial primary key,
  domain text not null,
  type signup_email_domain_type not null,
  reason text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a trigger to maintain updated_at
create or replace function update_signup_email_domains_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_signup_email_domains_set_updated_at on public.signup_email_domains;

create trigger trg_signup_email_domains_set_updated_at
before update on public.signup_email_domains
for each row
execute procedure update_signup_email_domains_updated_at();

-- Seed example data
insert into public.signup_email_domains (domain, type, reason) values
  ('supabase.com', 'allow', 'Internal signups'),
  ('gmail.com', 'deny', 'Public email provider'),
  ('yahoo.com', 'deny', 'Public email provider');

-- Create the function
create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text;
  domain text;
  is_allowed int;
  is_denied int;
begin
  email := event->'user'->>'email';
  domain := split_part(email, '@', 2);

  -- Check for allow match
  select count(*) into is_allowed
  from public.signup_email_domains
  where type = 'allow' and lower(domain) = lower($1);

  if is_allowed > 0 then
    return '{}'::jsonb;
  end if;

  -- Check for deny match
  select count(*) into is_denied
  from public.signup_email_domains
  where type = 'deny' and lower(domain) = lower($1);

  if is_denied > 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Signups from this email domain are not allowed.',
        'http_code', 403
      )
    );
  end if;

  -- No match, allow by default
  return '{}'::jsonb;
end;
$$;

-- Permissions
grant execute
  on function public.hook_restrict_signup_by_email_domain
  to supabase_auth_admin;

revoke execute
  on function public.hook_restrict_signup_by_email_domain
  from authenticated, anon, public;
```

</TabPanel>

<TabPanel id="sql-block-by-oauth-provider" label="Block by OAuth Provider">
Some applications want to **allow sign-ins with a provider like Discord only for users who already exist**, while blocking new account creation via that provider. This prevents unwanted signups through OAuth flows and enables tighter control over who can join the app.

The `before-user-created` hook solves this by:

- Detecting that a user is about to be created
- Allowing you to inspect the `app_metadata.provider`
- Knowing the request came from an OAuth flow

Run the following snippet in your project's [SQL Editor](/dashboard/project/_/sql/new). This will create a `hook_reject_discord_signups` function to be called by the `before-user-created` auth hook.

```sql
-- Create the function
create or replace function public.hook_reject_discord_signups(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  provider text;
begin
  provider := event->'user'->'app_metadata'->>'provider';

  if provider = 'discord' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Signups with Discord are not allowed.',
        'http_code', 403
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- Permissions
grant execute
  on function public.hook_reject_discord_signups
  to supabase_auth_admin;

revoke execute
  on function public.hook_reject_discord_signups
  from authenticated, anon, public;
```

</TabPanel>

<TabPanel id="sql-allow-deny-by-cidr" label="Allow/Deny by IP or CIDR">
This example shows how you might restrict sign up from a single IP address or a range of them using [PostgreSQL’s built-in](https://www.postgresql.org/docs/current/datatype-net-types.html) `inet` and `<<` operators for [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) -- a method of representing IP address ranges.
For instance: `123.123.123.123/32` represents only a single IP address, while `123.123.123.0/24` means all IP addresses starting with `123.123.123.`.

The `before-user-created` hook solves this by:

- Detecting that a user is about to be created
- Providing the IP address in the `metadata.ip_address` field

Run the following snippet in your project's [SQL Editor](/dashboard/project/_/sql/new). This will create a `signup_networks` table with some sample data and a `hook_restrict_signup_by_network` function to be called by the `before-user-created` auth hook.

```sql SQL_EDITOR
-- Create ENUM type for network rule classification
create type signup_network_type as enum ('allow', 'deny');

-- Create the signup_networks table for controlling sign-up access by CIDR
create table if not exists public.signup_networks (
  id serial primary key,
  cidr cidr not null,
  type public.signup_network_type not null,
  reason text default null,
  note text default null,
  created_at timestamp with time zone not null default now(),
  constraint signup_networks_cidr_key unique (cidr)
);

-- Assign appropriate permissions
grant all
  on table public.signup_networks
  to supabase_auth_admin;

revoke all
  on table public.signup_networks
  from authenticated, anon, public;

-- Insert some sample data into the table
insert into public.signup_networks (cidr, type, reason, note)
values
  ('192.0.2.0/24', 'allow', '', 'Corporate VPN'),
  ('198.51.100.158/32', 'deny',
    'Your IP Address has been blocked for abuse.',
    'blocked by abuse: (Ticket: ABUSE-185)'),
  ('203.0.113.0/24', 'deny',
    'Your network has been blocked for abuse.',
    'blocked by abuse: (Ticket: ABUSE-212)');

-- Create the hook function to be called by the auth server
create or replace function public.hook_restrict_signup_by_network(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  ip inet;
  allow_count int;
  deny_count int;
begin
  ip := event->'metadata'->>'ip_address';

  -- Step 1: Check for explicit allow
  select count(*) into allow_count
  from public.signup_networks
  where type = 'allow' and ip::inet << cidr;

  if allow_count > 0 then
    -- If explicitly allowed, allow signup
    return '{}'::jsonb;
  end if;

  -- Step 2: Check for explicit deny
  select count(*) into deny_count
  from public.signup_networks
  where type = 'deny' and ip::inet << cidr;

  if deny_count > 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Signups are not allowed from your network.',
        'http_code', 403
      )
    );
  end if;

  -- Step 3: No match: allow by default
  return '{}'::jsonb;
end;
$$;

-- Assign permissions
grant execute
  on function public.hook_restrict_signup_by_network
  to supabase_auth_admin;

revoke execute
  on function public.hook_restrict_signup_by_network
  from authenticated, anon, public;
```

</TabPanel>

</Tabs>
</TabPanel>

<TabPanel id="http" label="HTTP">
<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="http-allow-by-domain"
>

<TabPanel id="http-allow-by-domain" label="Allow by Domain">
Allow signups only from specific domains like supabase.com or example.test. Reject all others. This is useful for private/internal apps, enterprise gating, or invite-only beta access.

The `before-user-created` hook solves this by:

- Detecting that a user is about to be created
- Providing the email address in the `user.email` field

Create a `.env` file with the following environment variables:

```ini
BEFORE_USER_CREATED_HOOK_SECRET="v1,whsec_<base64_secret>"
```

<Admonition type="note">

You can generate the secret in the [Auth Hooks](/dashboard/project/_/auth/hooks) section of the Supabase dashboard.

</Admonition>

Set the secrets in your Supabase project:

```bash
supabase secrets set --env-file .env
```

Create a new edge function:

```bash
supabase functions new before-user-created-hook
```

Add the following code to your edge function:

```ts
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const allowedDomains = ['supabase.com', 'example.test']

Deno.serve(async (req) => {
  const payload = await req.text()
  const secret = Deno.env.get('BEFORE_USER_CREATED_HOOK_SECRET')?.replace('v1,whsec_', '')
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(secret)

  try {
    const { user } = wh.verify(payload, headers)
    const email = user.email || ''
    const domain = email.split('@')[1] || ''

    if (!allowedDomains.includes(domain)) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Please sign up with a company email address.',
            http_code: 400,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: { message: 'Invalid request format' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

</TabPanel>

<TabPanel id="http-block-by-oauth-provider" label="Block by OAuth Provider">
Some applications want to **allow sign-ins with a provider like Discord only for users who already exist**, while blocking new account creation via that provider. This prevents unwanted signups through OAuth flows and enables tighter control over who can join the app.

The `before-user-created` hook solves this by:

- Allowing you to inspect the `app_metadata.provider`
- Detecting that a user is about to be created
- Knowing the request came from an OAuth flow

Create a `.env` file with the following environment variables:

```ini
BEFORE_USER_CREATED_HOOK_SECRET="v1,whsec_<base64_secret>"
```

<Admonition type="note">

You can generate the secret in the [Auth Hooks](/dashboard/project/_/auth/hooks) section of the Supabase dashboard.

</Admonition>

Set the secrets in your Supabase project:

```bash
supabase secrets set --env-file .env
```

Create a new edge function:

```bash
supabase functions new before-user-created-hook
```

Add the following code to your edge function:

```ts
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const blockedProviders = ['discord']

Deno.serve(async (req) => {
  const payload = await req.text()
  const secret = Deno.env.get('BEFORE_USER_CREATED_HOOK_SECRET')?.replace('v1,whsec_', '')
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(secret)

  try {
    const { user } = wh.verify(payload, headers)
    const provider = user.app_metadata?.provider

    if (blockedProviders.includes(provider)) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Signups with ${provider} are not allowed.`,
            http_code: 403,
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response('{}', { status: 400 })
  }
})
```

</TabPanel>

<TabPanel id="http-allow-deny-by-cidr" label="Allow/Deny by IP or CIDR">
This example shows how you might restrict sign up from a single IP address or a range of them using [PostgreSQL’s built-in](https://www.postgresql.org/docs/current/datatype-net-types.html) `inet` and `<<` operators for [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) -- a method of representing IP address ranges.
For instance: `123.123.123.123/32` represents only a single IP address, while `123.123.123.0/24` means all IP addresses starting with `123.123.123.`.

The `before-user-created` hook solves this by:

- Detecting that a user is about to be created
- Providing the IP address in the `metadata.ip_address` field

Before creating the edge function run the following snippet in your project's [SQL Editor](/dashboard/project/_/sql/new). This will create a `signup_networks` table with some sample data and a `hook_restrict_signup_by_network` function to be called by the `before-user-created` auth hook.

```sql SQL_EDITOR
-- Create ENUM type for network rule classification
create type signup_network_type as enum ('allow', 'deny');

-- Create the signup_networks table for controlling sign-up access by CIDR
create table if not exists public.signup_networks (
  id serial primary key,
  cidr cidr not null,
  type public.signup_network_type not null,
  reason text default null,
  note text default null,
  created_at timestamp with time zone not null default now(),
  constraint signup_networks_cidr_key unique (cidr)
);

-- Assign appropriate permissions
grant all
  on table public.signup_networks
  to supabase_auth_admin;

revoke all
  on table public.signup_networks
  from authenticated, anon, public;

-- Insert some sample data into the table
insert into public.signup_networks (cidr, type, reason, note)
values
  ('192.0.2.0/24', 'allow', '', 'Corporate VPN'),
  ('198.51.100.158/32', 'deny',
    'Your IP Address has been blocked for abuse.',
    'blocked by abuse: (Ticket: ABUSE-185)'),
  ('203.0.113.0/24', 'deny',
    'Your network has been blocked for abuse.',
    'blocked by abuse: (Ticket: ABUSE-212)');

-- Create the hook function to be called by the auth server
create or replace function public.hook_restrict_signup_by_network(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  ip inet;
  allow_count int;
  deny_count int;
begin
  ip := event->'metadata'->>'ip_address';

  -- Step 1: Check for explicit allow
  select count(*) into allow_count
  from public.signup_networks
  where type = 'allow' and ip::inet << cidr;

  if allow_count > 0 then
    -- If explicitly allowed, allow signup
    return '{}'::jsonb;
  end if;

  -- Step 2: Check for explicit deny
  select count(*) into deny_count
  from public.signup_networks
  where type = 'deny' and ip::inet << cidr;

  if deny_count > 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Signups are not allowed from your network.',
        'http_code', 403
      )
    );
  end if;

  -- Step 3: No match: allow by default
  return '{}'::jsonb;
end;
$$;

-- Assign permissions
grant execute
  on function public.hook_restrict_signup_by_network
  to supabase_auth_admin;

revoke execute
  on function public.hook_restrict_signup_by_network
  from authenticated, anon, public;
```

Create a `.env` file with the following environment variables:

```ini
BEFORE_USER_CREATED_HOOK_SECRET="v1,whsec_<base64_secret>"
```

<Admonition type="note">

You can generate the secret in the [Auth Hooks](/dashboard/project/_/auth/hooks) section of the Supabase dashboard.

</Admonition>

Set the secrets in your Supabase project:

```bash
supabase secrets set --env-file .env
```

Create a new edge function:

```bash
supabase functions new before-user-created-hook
```

Add the following code to your edge function:

```ts
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const whSecret = Deno.env.get('BEFORE_USER_CREATED_HOOK_SECRET')?.replace('v1,whsec_', '')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const wh = new Webhook(whSecret)
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  try {
    const event = wh.verify(payload, headers)

    // Call the same Postgres function as in the SQL example.
    const { data, error } = await supabase.rpc('hook_restrict_signup_by_network', {
      event: JSON.parse(payload),
    })
    if (error) {
      console.error('RPC call failed:', error)
      return new Response(
        JSON.stringify({
          error: {
            message: 'Internal error processing signup restriction',
            http_code: 500,
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    return new Response(JSON.stringify(data ?? {}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response(
      JSON.stringify({
        error: {
          message: 'Invalid request format or signature',
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
```

</TabPanel>

</Tabs>

</TabPanel>
</Tabs>
