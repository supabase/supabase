---
title: 'Hardening the Data API'
---

Your database's auto-generated Data API exposes the `public` schema by default. You can change this to any schema in your database, or even disable the Data API completely.

Any tables that are accessible through the Data API _must_ have [Row Level Security](/docs/guides/database/postgres/row-level-security) enabled. Row Level Security (RLS) is enabled by default when you create tables from the Supabase Dashboard. If you create a table using the SQL editor or your own SQL client or migration runner, you*must* enable RLS yourself.

## Shared responsibility

Your application's security is your responsibility as a developer. This includes RLS, falling under the [Shared Responsibility](/docs/guides/deployment/shared-responsibility-model) model. To help you:

- Supabase sends daily emails warning of any tables that are exposed to the Data API which do not have RLS enabled.
- Supabase provides a Security Advisor and other tools in the Supabase Dashboard to fix any issues.

## Private schemas

We highly recommend creating a `private` schema for storing tables that you do not want to expose via the Data API. These tables can be accessed via Supabase Edge Functions or any other serverside tool. In this model, you should implement your security model in your serverside code. Although it's not required, we _still_ recommend enabling RLS for private tables and then connecting to your database using a Postgres role with `bypassrls` privileges.

## Managing the public schema

If your `public` schema is used by other tools as a default space, you might want to lock down this schema. This helps prevent accidental exposure of data that's automatically added to `public`.

There are several levels of security hardening for the Data API:

- [Disabling the Data API entirely](#disabling-the-data-api). This is recommended if you _never_ need to access your database via Supabase client libraries or the REST and GraphQL endpoints.
- [Exposing a custom schema](#exposing-a-custom-schema-instead-of-public) instead of `public`, giving you explicit control over what is accessible.
- [Automatically enabling RLS on new tables](#automatically-enabling-rls-on-new-tables) using an event trigger.
- [Adjusting table-level grants](#table-level-grants) to control which roles can access specific tables.

## Disabling the Data API

You can disable the Data API entirely if you never intend to use the Supabase client libraries or the REST and GraphQL data endpoints. For example, if you only access your database via a direct connection on the server, disabling the Data API gives you the greatest layer of protection.

1. Go to [API Settings](/dashboard/project/_/settings/api) in the Supabase Dashboard.
1. Under **Data API Settings**, toggle **Enable Data API** off.

## Exposing a custom schema instead of `public`

If you want to use the Data API but with increased security, you can expose a custom schema instead of `public`. By not using `public`, which is often used as a default space and has laxer default permissions, you get more conscious control over your exposed data.

Any data, views, or functions that should be exposed need to be deliberately put within your custom schema (which we will call `api`), rather than ending up there by default.

### Step 1: Remove `public` from exposed schemas

1.  Go to [**API Settings**](/dashboard/project/_/settings/api) in the Supabase Dashboard.
1.  Under **Data API Settings**, remove `public` from **Exposed schemas**. Also remove `public` from **Extra search path**.
1.  Click **Save**.
1.  Go to [**Database Extensions**](/dashboard/project/_/database/extensions) and disable the `pg_graphql` extension.

### Step 2: Create an `api` schema and expose it

1.  Connect to your database. You can use `psql`, the [Supabase SQL Editor](/dashboard/project/_/sql), or the Postgres client of your choice.

1.  Create a new schema named `api`:

    ```sql
    create schema if not exists api;
    ```

1.  Grant the `anon` and `authenticated` roles usage on this schema.

    ```sql
    grant usage on schema api to anon, authenticated;
    ```

1.  Go to [API Settings](/dashboard/project/_/settings/api) in the Supabase Dashboard.

1.  Under **Data API Settings**, add `api` to **Exposed schemas**. Make sure it is the first schema in the list, so that it will be searched first by default.

1.  Under these new settings, `anon` and `authenticated` can execute functions defined in the `api` schema, but they have no automatic permissions on any tables. On a table-by-table basis, you can grant them permissions. For example:

    ```sql
    grant select on table api.<your_table> to anon;
    grant select, insert, update, delete on table api.<your_table> to authenticated;
    ```

## Automatically enabling RLS on new tables

Tables created via the Supabase Dashboard have RLS enabled by default. However, if you or your team create tables using the SQL editor, migrations, or an external tool, RLS will not be enabled automatically.

You can use an [event trigger](/docs/guides/database/postgres/event-triggers#example-trigger-function---auto-enable-row-level-security) to automatically enable RLS whenever a new table is created in the `public` schema. This ensures that no table is accidentally left exposed without RLS protection.

## Table-level grants

By default, tables in the `public` schema are granted full access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) to the `anon` and `authenticated` roles. This allows the Data API to query those tables on behalf of users.

You can adjust these privileges on a per-table basis to restrict which operations each role can perform. For example, you might want to:

- Allow `anon` users to only `SELECT` from a table, preventing anonymous writes.
- Prevent `anon` users from accessing a table entirely, making it available only to authenticated users.
- Restrict `authenticated` users to `SELECT` and `INSERT` only, preventing updates and deletes.

<Admonition type="tip">

Table-level privileges work alongside [Row Level Security](/docs/guides/database/postgres/row-level-security). Privileges control _which operations_ are possible, while RLS policies control _which rows_ are accessible. For full protection, use both: restrict privileges to limit operation types, and use RLS policies to control row-level access.

</Admonition>

### Adjusting table-level grants via the Dashboard

<Admonition type="note">

Adjusting table-level privileges via the Dashboard is currently in beta and will be available via gradual roll-out.

</Admonition>

1. Go to [**Table Editor**](/dashboard/project/_/editor) in the Supabase Dashboard.
2. Select the table you want to configure.
3. Click the vertical dots icon to open the table menu and select "Edit table".
4. Under **Data API Access**, click the settings icon to open **Adjust API privileges per role**.
5. For each role (`anon` and `authenticated`), select or deselect the privileges you want to grant.
6. Click **Save**.

### Adjusting table-level grants via SQL

You can also adjust privileges using SQL. For example, to allow only `SELECT` access for `anon` on a table:

```sql
-- Revoke all existing privileges
revoke all on table public.your_table from anon;

-- Grant only SELECT
grant select on table public.your_table to anon;
```

To remove all access for `anon` from a table:

```sql
revoke all on table public.your_table from anon;
```

To restore full access:

```sql
grant select, insert, update, delete on table public.your_table to anon;
```
