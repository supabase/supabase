---
id: 'securing-your-api'
title: 'Securing your API'
description: 'Secure your Data API with explicit grants and Postgres Row Level Security.'
---

The Data API is designed to work with Postgres' built-in access controls. Two layers work together:

1. **Grants** determine which Postgres roles (`anon`, `authenticated`, `service_role`) can reach a given table, view, or function over the Data API.
2. **Row Level Security (RLS) policies** then determine which rows those roles can read or modify from the tables exposed in step 1.
3. **Both together** grant control _whether_ a role can touch an object. RLS controls _what_ rows they see.

## Grant access explicitly

A table isn't reachable through the Data API unless you have granted a role privileges on it. Grant the minimum privileges each role needs. For example:

```sql
-- Read-only access for anonymous clients
grant select on table public.your_table to anon;

-- Full access for signed-in users (still subject to RLS)
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

See [the Database API 42501 errors troubleshooting guide](/docs/guides/troubleshooting/database-api-42501-errors) for the full troubleshooting flow.

<Admonition type="tip">

Bundle grants with your RLS setup in the same migration. They belong together: `grant` controls role access, `enable row level security` and policies control row access.

</Admonition>

## Default privileges for new tables and functions

By default on existing projects, tables and functions you create in `public` are automatically granted `SELECT`, `INSERT`, `UPDATE`, `DELETE` (or `EXECUTE` for functions) to `anon`, `authenticated`, and `service_role`. That means a new table is reachable through the Data API the moment it lands, even if you forgot to enable RLS or did not intend to expose it.

Supabase is moving the platform default to **revoke** these automatic grants, so that exposure becomes opt-in, read more about the change in [this changelog entry](https://github.com/orgs/supabase/discussions/45329).

To opt an existing project in today, open the [SQL Editor](/dashboard/project/_/sql/new) and run:

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

## Use a dedicated API schema

If you want an extra boundary around your Data API, lock down the `public` schema and expose a dedicated schema, such as `api`, instead. You can control access with grants in any schema, but this can make the surface easier to reason about: objects in `api` represent your Data API, while internal tables and helper functions stay in schemas that are not exposed. See [Using Custom Schemas](/docs/guides/api/using-custom-schemas) for setup steps.

## Disable the Data API

If your app never uses Supabase client libraries, REST, or GraphQL data endpoints, turn the Data API off:

1. Open the [Data API integration overview](/dashboard/project/_/integrations/data_api/overview) in the Dashboard.
2. Turn **Enable Data API** off.

With the Data API disabled, none of the auto-generated REST endpoints respond, regardless of grants or RLS.

## Add RLS policies

Enable Row Level Security (RLS) on all tables and views you have exposed via the Data API. You can then write RLS policies to grant users access to specific database rows based on their authentication token.

For functions, RLS does not apply. Instead, control access by granting `EXECUTE` privileges only to the roles that should be able to call the function, and review any `SECURITY DEFINER` functions carefully.

<Admonition type="danger">

Always enable Row Level Security on tables and views you expose via the Data API to protect your data. For functions, restrict access by granting `EXECUTE` only to appropriate roles.

</Admonition>

Any table created through the Supabase Dashboard will have RLS enabled by default. If you created the tables via the SQL editor or via another way, enable RLS like so:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="dashboard"
  queryGroup="database-method"
>
<TabPanel id="dashboard" label="Dashboard">

1. Go to the [Authentication > Policies](/dashboard/project/_/auth/policies) page in the Dashboard.
2. Select **Enable RLS** to enable Row Level Security.

</TabPanel>
<TabPanel id="sql" label="SQL">

```sql
alter table
  your_table enable row level security;
```

</TabPanel>
</Tabs>

With RLS enabled, you can create Policies that allow or disallow users to access and update data. We provide a detailed guide for creating Row Level Security Policies in our [Authorization documentation](/docs/guides/database/postgres/row-level-security).

<Admonition type="danger">

Any granted table **without RLS enabled** can be accessed by roles with matching Data API grants (for example, `anon`). Always make sure RLS is enabled, or that you've got other controls in place to avoid unauthorized access to your project's data.

</Admonition>

## Enforce additional rules on each request

Using Row Level Security policies may not always be adequate or sufficient to protect APIs.

Here are some common situations where additional protections are necessary:

- Enforcing per-IP or per-user rate limits.
- Checking custom or additional API keys before allowing further access.
- Rejecting requests after exceeding a quota or requiring payment.
- Disallowing direct access to certain tables, views, or functions in exposed schemas.

You can build these cases in your application by creating a Postgres function that will read information from the request and perform additional checks, such as counting the number of requests received or checking that an API key is already registered in your database before serving the response.

Define a function like so:

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

And register it to run on every Data API request using:

```sql
alter role authenticator
  set pgrst.db_pre_request = 'public.check_request';
```

This configures the `public.check_request` function to run on every Data API request. To have the changes take effect, you should run:

```sql
notify pgrst, 'reload config';
```

<$Partial path="db_pre_request_warning.mdx" />

Inside the function you can perform any additional checks on the request headers or JWT and raise an exception to prevent the request from completing. For example, this exception raises an HTTP 402 Payment Required response with a `hint` and additional `X-Powered-By` header:

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

When raised within the `public.check_request` function, the resulting HTTP response will look like:

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

Use the [JSON operator functions](https://www.postgresql.org/docs/current/functions-json.html) to build rich and dynamic responses from exceptions.

If you use a custom HTTP status code like 419, you can supply the `status_text` key in the `detail` clause of the exception to describe the HTTP status.

If you're using PostgREST version 11 or lower ([find out your PostgREST version](/dashboard/project/_/settings/infrastructure)) a different and less powerful [syntax](https://postgrest.org/en/stable/references/errors.html#raise-errors-with-http-status-codes) needs to be used.

### Accessing request information

Like with RLS policies, you can access information about the request by using the `current_setting()` Postgres function. Here are some examples on how this works:

```sql
-- To get all the headers sent in the request
SELECT current_setting('request.headers', true)::json;

-- To get a single header, you can use JSON arrow operators
SELECT current_setting('request.headers', true)::json->>'user-agent';

-- Access Cookies
SELECT current_setting('request.cookies', true)::json;
```

| `current_setting()` | Example                                         | Description                          |
| ------------------- | ----------------------------------------------- | ------------------------------------ |
| `request.method`    | `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE` | Request's method                     |
| `request.path`      | `table`                                         | Table's path                         |
| `request.path`      | `view`                                          | View's path                          |
| `request.path`      | `rpc/function`                                  | Functions's path                     |
| `request.headers`   | `{ "User-Agent": "...", ... }`                  | JSON object of the request's headers |
| `request.cookies`   | `{ "cookieA": "...", "cookieB": "..." }`        | JSON object of the request's cookies |
| `request.jwt`       | `{ "sub": "a7194ea3-...", ... }`                | JSON object of the JWT payload       |

To access the IP address of the client look up the [X-Forwarded-For header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) in the `request.headers` setting. For example:

```sql
SELECT split_part(
  current_setting('request.headers', true)::json->>'x-forwarded-for',
  ',', 1); -- takes the client IP before the first comma (,)
```

Read more about [PostgREST's pre-request function](https://postgrest.org/en/stable/references/transactions.html#pre-request).

### Examples

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="rate-limit-per-ip"
  queryGroup="pre-request"
>
<TabPanel id="rate-limit-per-ip" label="Rate limit per IP">

You can only rate-limit `POST`, `PUT`, `PATCH` and `DELETE` requests. This is because `GET` and `HEAD` requests run in read-only mode, and will be served by [Read Replicas](/docs/guides/platform/read-replicas) which do not support writing to the database.

Outline:

- A new row is added to a `private.rate_limits` table each time a modifying action is done to the database containing the IP address and the timestamp of the action.
- If there are over 100 requests from the same IP address in the last 5 minutes, the request is rejected with an HTTP 420 code.

Create the table:

```sql
create table private.rate_limits (
  ip inet,
  request_at timestamp
);

-- add an index so that lookups are fast
create index rate_limits_ip_request_at_idx on private.rate_limits (ip, request_at desc);
```

The `private` schema is used as it cannot be accessed over the API!

Create the `public.check_request` function:

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

Finally, configure the `public.check_request()` function to run on every Data API request:

```sql
alter role authenticator
  set pgrst.db_pre_request = 'public.check_request';

notify pgrst, 'reload config';
```

<$Partial path="db_pre_request_warning.mdx" />

To clear old entries in the `private.rate_limits` table, set up a [pg_cron](/docs/guides/database/extensions/pg_cron) job to clean them up.

</TabPanel>

<TabPanel id="use-additional-api-key" label="Use additional API keys">

Some applications can benefit from using additional API keys managed by the application **in addition to the [Supabase API keys](/docs/guides/getting-started/api-keys)**. This is commonly necessary in cases like:

- Applications that use the Data API without RLS policies.
- Applications that do not use [Supabase Auth](/auth) or any other authentication system and rely on the `anon` role.

<Admonition type="tip">

Using the `apikey` header with the [Supabase API keys](/docs/guides/getting-started/api-keys) is mandatory and not configurable. If you use additional API keys, you have to distribute both the `publishable` API key and your application's custom API key.

</Admonition>

Outline:

- Your application requires the presence of the `x-app-api-key` header when the `anon` role is used to prevent abuse of your API.
- These API keys are stored in the `private.anon_api_keys` table, and are distributed independently.
- Each request using the `anon` role will be blocked with HTTP 403 if the `x-app-api-key` header is not registered in the table.

Set up the table:

```sql
create table private.anon_api_keys (
  id uuid primary key,
  -- other relevant fields
);
```

Create the `public.check_request` function:

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

Finally, configure the `public.check_request()` function to run on every Data API request:

```sql
alter role authenticator
  set pgrst.db_pre_request = 'public.check_request';

notify pgrst, 'reload config';
```

<$Partial path="db_pre_request_warning.mdx" />

</TabPanel>

</Tabs>
