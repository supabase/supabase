---
id: 'securing-your-api'
title: 'Securing your API'
description: 'Secure your Data API with explicit grants and Postgres Row Level Security.'
---

This guide explains how to secure the Data API with Postgres grants, Row Level Security, dedicated schemas, and request checks.

Use the guide in two parts:

- [Understand Data API security](#understand-data-api-security) explains how the controls work and when to use them.
- [Configure Data API security](#configure-data-api-security) groups the procedures for applying those controls.

Read the first section when you need to choose a security approach. Go directly to the second section when you know which controls you need to configure.

## Understand Data API security

This section provides the context for the procedures later in the guide.

### Grants and RLS

The Data API works with two layers of Postgres access control:

1. **Grants** determine which Postgres roles can reach a table, view, or function over the Data API. These roles include `anon`, `authenticated`, and `service_role`.
2. **Row Level Security (RLS) policies** determine which rows those roles can read or modify.

Grants control whether a role can access an object. RLS controls which rows the role can access. Use both controls for every exposed object.

To apply these controls, see [Grant access explicitly](#grant-access-explicitly) and [Enable RLS policies](#enable-rls-policies).

### Default privileges

On existing projects, tables created in `public` receive `SELECT`, `INSERT`, `UPDATE`, and `DELETE` privileges for `anon`, `authenticated`, and `service_role` by default. Functions receive `EXECUTE`. These grants make new objects reachable through the Data API, even when you don't intend to expose them.

Supabase is changing the platform default to revoke these automatic grants so that exposure becomes opt-in. See [the platform defaults discussion](https://github.com/orgs/supabase/discussions/45329) in the Supabase GitHub discussions.

The default privileges are part of the standard Supabase permission model and don't bypass RLS. The internal `supabase_admin` role grants them to `anon`, `authenticated`, and `service_role`, but it can't authenticate through the Data API. See [`pg_default_acl`](https://www.postgresql.org/docs/current/catalog-pg-default-acl.html) in the Postgres documentation and [`supabase_admin`](/docs/guides/database/postgres/roles#supabaseadmin) in the Supabase documentation.

To prevent automatic grants on new objects, see [Revoke default privileges](#revoke-default-privileges).

### Dedicated API schemas

A dedicated schema adds another boundary around your Data API. Objects in a schema such as `api` define the API surface. Internal tables and helper functions remain in schemas that aren't exposed.

You can control access with grants in any schema. A dedicated schema makes the exposed surface easier to identify and audit. See [Using Custom Schemas](/docs/guides/api/using-custom-schemas) for setup steps.

### Pre-request checks

RLS policies don't cover every API security requirement. Add pre-request checks for requirements such as:

- Enforcing per-IP or per-user rate limits.
- Checking custom or additional API keys before allowing further access.
- Rejecting requests after exceeding a quota or requiring payment.
- Disallowing direct access to certain tables, views, or functions in exposed schemas.

A Postgres pre-request function reads request information and performs these checks before serving a response. For example, the function can count requests or verify an API key.

To add a check, see [Configure a pre-request function](#configure-a-pre-request-function).

<$Partial path="db_pre_request_warning.mdx" />

### Request information

Use the Postgres `current_setting()` function to access request information:

```sql
-- Get all headers sent in the request
select current_setting('request.headers', true)::json;

-- Get one header with a JSON arrow operator
select current_setting('request.headers', true)::json->>'user-agent';

-- Get cookies
select current_setting('request.cookies', true)::json;
```

| `current_setting()` | Example                                         | Description                          |
| ------------------- | ----------------------------------------------- | ------------------------------------ |
| `request.method`    | `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE` | Request's method                     |
| `request.path`      | `table`                                         | Table's path                         |
| `request.path`      | `view`                                          | View's path                          |
| `request.path`      | `rpc/function`                                  | Function's path                      |
| `request.headers`   | `{ "User-Agent": "...", ... }`                  | JSON object of the request's headers |
| `request.cookies`   | `{ "cookieA": "...", "cookieB": "..." }`        | JSON object of the request's cookies |
| `request.jwt`       | `{ "sub": "a7194ea3-...", ... }`                | JSON object of the JWT payload       |

To access the client's IP address, look up the `X-Forwarded-For` header in the `request.headers` setting:

```sql
select split_part(
  current_setting('request.headers', true)::json->>'x-forwarded-for',
  ',', 1); -- takes the client IP before the first comma
```

See [Pre-request](https://postgrest.org/en/stable/references/transactions.html#pre-request) in the PostgREST documentation and [X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) in the MDN documentation.

For complete implementations that use this request information, see [Pre-request examples](#pre-request-examples).

### Error responses

A pre-request function can raise an exception to stop a request. This example returns an HTTP 402 Payment Required response with a `hint` and an `X-Powered-By` header:

```sql
raise sqlstate 'PGRST' using
  message = json_build_object(
    'code',    '123',
    'message', 'Payment Required',
    'details', 'Quota exceeded',
    'hint',    'Upgrade your plan')::text,
  detail = json_build_object(
    'status',  402,
    'headers', json_build_object(
      'X-Powered-By', 'Nerd Rage'))::text;
```

The exception produces this HTTP response:

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json; charset=utf-8
X-Powered-By: Nerd Rage

{
  "message": "Payment Required",
  "details": "Quota exceeded",
  "hint": "Upgrade your plan",
  "code": "123"
}
```

Use JSON functions and operators to build dynamic responses from exceptions. Include the `status_text` key in the `detail` clause when you use a custom HTTP status code such as 419. See [JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html) in the Postgres documentation.

For PostgREST 11 or earlier, use the legacy syntax for raising errors. [Check your PostgREST version](/dashboard/project/_/settings/infrastructure) in the Dashboard. See [Raise errors with HTTP status codes](https://postgrest.org/en/stable/references/errors.html#raise-errors-with-http-status-codes) in the PostgREST documentation.

## Configure Data API security

This section groups the procedures for configuring each security control. Apply the procedures that match your architecture.

### Grant access explicitly

A table isn't reachable through the Data API unless you have granted a role privileges on it. Grant the minimum privileges each role needs. For example:

```sql
-- Read-only access for anonymous clients
grant select on table public.your_table to anon;

-- Full access for signed-in users; RLS still applies
grant select, insert, update, delete on table public.your_table to authenticated;

-- Full access for server-side code using the service role
grant select, insert, update, delete on table public.your_table to service_role;

-- For functions, grant EXECUTE to the roles that should call them
grant execute on function public.your_function() to anon, authenticated;
```

If a required grant is missing, PostgREST returns a `42501` error with a hint that names the exact `GRANT` statement you need:

```json
{
  "code": "42501",
  "message": "permission denied for table your_table",
  "hint": "Grant the required privileges to the current role with: GRANT SELECT ON public.your_table TO anon;"
}
```

See [Database API 42501 errors](/docs/guides/troubleshooting/database-api-42501-errors) for the full troubleshooting flow.

**Migration:** Bundle grants with your RLS setup in the same migration. The `grant` command controls role access. The `enable row level security` command and policies control row access.

### Revoke default privileges

Revoke automatic grants when you want new objects in `public` to remain inaccessible until you grant access:

1. Open the [SQL Editor](/dashboard/project/_/sql/new).
2. Run the following statements:

   ```sql
   alter default privileges for role postgres in schema public
     revoke select, insert, update, delete on tables from anon, authenticated, service_role;

   alter default privileges for role postgres in schema public
     revoke execute on functions from anon, authenticated, service_role;

   alter default privileges for role postgres in schema public
     revoke usage, select on sequences from anon, authenticated, service_role;

   alter default privileges for role postgres in schema public
     revoke execute on functions from public;
   ```

New tables, functions, and sequences now require explicit grants before Data API roles can access them.

### Disable the Data API

If your app never uses Supabase client libraries, REST, or GraphQL data endpoints, turn the Data API off:

1. Open the [Data API integration overview](/dashboard/project/_/integrations/data_api/overview) in the Dashboard.
2. Turn **Enable Data API** off.

With the Data API disabled, none of the auto-generated REST endpoints respond, regardless of grants or RLS.

### Enable RLS policies

<Admonition type="danger">

Tables and views exposed through the Data API without RLS can be accessed by any role with matching grants. Enable RLS or add equivalent controls to prevent unauthorized access. RLS doesn't apply to functions, so grant `EXECUTE` only to the roles that need to call them. Review every `SECURITY DEFINER` function carefully.

</Admonition>

Enable RLS on every table and view exposed through the Data API. You can then write policies that grant users access to specific rows based on their authentication token.

Tables created through the Supabase Dashboard have RLS enabled by default. Enable RLS explicitly for tables created in the SQL Editor or through another tool:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="database-method"
>
<TabPanel id="dashboard" label="Dashboard">

1. Go to the [Database > Policies](/dashboard/project/_/database/policies) page in the Dashboard.
2. Select **Enable RLS** to enable Row Level Security.

</TabPanel>
<TabPanel id="sql" label="SQL">

```sql
alter table
  your_table enable row level security;
```

</TabPanel>
</Tabs>

With RLS enabled, create policies that control which data users can access and update. See [Row Level Security](/docs/guides/database/postgres/row-level-security).

### Configure a pre-request function

Create and register a Postgres function to run checks before each Data API request:

Before adding the check logic, review [Request information](#request-information) and [Error responses](#error-responses).

1. Create a pre-request function:

   ```sql
   create function public.check_request()
     returns void
     language plpgsql
     security definer
     as $$
   begin
     -- your logic here
   end;
   $$;
   ```

2. Register the function to run on every Data API request:

   ```sql
   alter role authenticator
     set pgrst.db_pre_request = 'public.check_request';
   ```

3. Reload the PostgREST configuration:

   ```sql
   notify pgrst, 'reload config';
   ```

The function now runs before every Data API request. Add the checks that match your security requirements.

### Pre-request examples

Use these examples after you configure the pre-request function. Each example replaces the placeholder logic with a complete request check.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="rate-limit-per-ip"
  queryGroup="pre-request"
>
<TabPanel id="rate-limit-per-ip" label="Rate limit per IP">

You can only rate-limit `POST`, `PUT`, `PATCH`, and `DELETE` requests. `GET` and `HEAD` requests run in read-only mode. They can be served by [Read Replicas](/docs/guides/platform/read-replicas), which don't support writing to the database.

**Outcome:**

- The `private.rate_limits` table records the IP address and timestamp of each write request.
- The function rejects requests with an HTTP 420 response when an IP address makes more than 100 write requests in 5 minutes.

**Create the table:**

```sql
create table private.rate_limits (
  ip inet,
  request_at timestamp
);

-- add an index so that lookups are fast
create index rate_limits_ip_request_at_idx on private.rate_limits (ip, request_at desc);
```

The `private` schema prevents Data API access to the rate-limit records.

**Create the request check:** Create the `public.check_request` function:

```sql
create function public.check_request()
  returns void
  language plpgsql
  security definer
  as $$
declare
  req_method text := current_setting('request.method', true);
  req_ip inet := split_part(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    ',', 1)::inet;
  count_in_five_mins integer;
begin
  if req_method = 'GET' or req_method = 'HEAD' or req_method is null then
    -- rate limiting can't be done on GET and HEAD requests
    return;
  end if;

  select
    count(*) into count_in_five_mins
  from private.rate_limits
  where
    ip = req_ip and request_at between now() - interval '5 minutes' and now();

  if count_in_five_mins > 100 then
    raise sqlstate 'PGRST' using
      message = json_build_object(
        'message', 'Rate limit exceeded, try again after a while')::text,
      detail = json_build_object(
        'status',  420,
        'status_text', 'Enhance Your Calm')::text;
  end if;

  insert into private.rate_limits (ip, request_at) values (req_ip, now());
end;
  $$;
```

**Register the request check:** Configure the `public.check_request()` function to run on every Data API request:

```sql
alter role authenticator
  set pgrst.db_pre_request = 'public.check_request';

notify pgrst, 'reload config';
```

**Clean up old records:** Set up a [`pg_cron`](/docs/guides/database/extensions/pg_cron) job to delete old entries from `private.rate_limits`.

</TabPanel>

<TabPanel id="use-additional-api-key" label="Use additional API keys">

Use application-managed API keys when you need another access check. This approach applies to applications that:

- Use the Data API without RLS policies.
- Don't use [Supabase Auth](/auth) or another authentication system and rely on the `anon` role.

**Required Supabase key:** The `apikey` header is mandatory and not configurable. If you use another API key, distribute both the publishable key and your application's custom key. See [API keys](/docs/guides/getting-started/api-keys).

**Outcome:**

- Your application requires the presence of the `x-app-api-key` header when the `anon` role is used to prevent abuse of your API.
- These API keys are stored in the `private.anon_api_keys` table, and are distributed independently.
- Each request using the `anon` role will be blocked with HTTP 403 if the `x-app-api-key` header is not registered in the table.

**Create the table:**

```sql
create table private.anon_api_keys (
  id uuid primary key,
  -- other relevant fields
);
```

**Create the request check:** Create the `public.check_request` function:

```sql
create function public.check_request()
  returns void
  language plpgsql
  security definer
  as $$
declare
  req_app_api_key text := current_setting('request.headers', true)::json->>'x-app-api-key';
  is_app_api_key_registered boolean;
  jwt_role text := current_setting('request.jwt.claims', true)::json->>'role';
begin
  if jwt_role <> 'anon' then
    -- not `anon` role, allow the request to pass
    return;
  end if;

  select
    true into is_app_api_key_registered
  from private.anon_api_keys
  where
    id = req_app_api_key::uuid
  limit 1;

  if is_app_api_key_registered is true then
    -- api key is registered, allow the request to pass
    return;
  end if;

  raise sqlstate 'PGRST' using
    message = json_build_object(
      'message', 'No registered API key found in x-app-api-key header.')::text,
    detail = json_build_object(
      'status', 403)::text;
end;
  $$;
```

**Register the request check:** Configure the `public.check_request()` function to run on every Data API request:

```sql
alter role authenticator
  set pgrst.db_pre_request = 'public.check_request';

notify pgrst, 'reload config';
```

</TabPanel>

</Tabs>
