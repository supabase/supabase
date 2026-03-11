---
title = "Prisma Error Management"
github_url = "https://github.com/orgs/supabase/discussions/27395"
date_created = "2024-06-19T19:51:23+00:00"
topics = [ "database" ]
keywords = [ "prisma", "timeout", "connection", "pgbouncer", "schema", "migration" ]
database_id = "28d842fd-8ba3-46f0-a307-082d946e0d94"

[[errors]]
message = "Can't reach database server at"

[[errors]]
message = "Timed out fetching a new connection from the connection pool"

[[errors]]
message = "prepared statement \"\" already exists"

[[errors]]
message = "Max client connections reached"

[[errors]]
message = "Server has closed the connection"

[[errors]]
message = "Drift detected: Your database schema is not in sync with your migration history"
---

> This guide has been deprecated. Use the troubleshooting guide in the [Supabase docs](/docs/guides/database/prisma/prisma-troubleshooting).

# Addressing specific errors:

Prisma, unlike other libraries, uses [query parameters for configurations](https://www.prisma.io/docs/orm/overview/databases/postgresql#arguments).

Some can be used to address specific errors and can be appended to end of your connection string like so:

```md
.../postgres?KEY1=VALUE&KEY2=VALUE&KEY3=VALUE
```

## `Can't reach database server at`:

Increase `connect_timeout` to 30s and check to make sure you are using a valid connection string.

```md
.../postgres?connect_timeout=30
```

## `Timed out fetching a new connection from the connection pool`:

Increase `pool_timeout` to 30s .

```md
.../postgres?pool_timeout=30
```

## `... prepared statement "" already exists`

Add pgbouncer=true to the connection string.

```md
.../postgres?pgbouncer=true
```

## `Max client connections reached`

Check out this [guide](https://github.com/orgs/supabase/discussions/22305) for managing this error

## `Server has closed the connection`

According to this [GitHub Issue for Prisma](https://github.com/prisma/prisma/discussions/7389), it may be related to large return values for queries. Try to limit the total amount of rows returned for particularly large requests.

## `Drift detected: Your database schema is not in sync with your migration history`

Prisma will try to act as the source of truth for your database structures. If you `CREATE`, `DROP`, or `ALTER` database objects outside of a Prisma Migration, it is likely to detect drift and may offer to correct the situation by purging your schemas. To circumvent this issue, try [baselining your migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining).

Some users have discussed how they managed this problem in a [GitHub Discussion.](https://github.com/prisma/prisma/issues/19100#top)

# Management suggestions

## Make a custom role for Prisma to increase observability

**Imagine your database as a house, and users as the people with keys.**

- By default, most developers use the "master key" (the `postgres` role) to access everything. But it's safer to give Prisma its own key! This way, it can only access the rooms (tables) it needs.
- it's usually safer to give Prisma its own key! This way, it can only access the rooms (tables) it needs.
- Plus, with separate keys, it's easier to see what Prisma is doing in your house with monitoring tools, such as [PGAudit](/docs/guides/database/extensions/pgaudit?queryGroups=database-method&database-method=sql) and [pg_stat_activity](/docs/guides/platform/performance).

### Creating the Prisma user:

```sql
create user "prisma" with password 'secret_password' bypassrls createdb;
```

> Prisma requires the [`createdb` modifier](/blog/postgres-roles-and-privileges#role-attributes) to create shadow databases. It uses them to help manage migrations.

### Give Postgres ownership of the new user:

This allows you to view Prisma migration changes in the [Dashboard](/dashboard/project/_/editor)

```sql
grant "prisma" to "postgres";
```

### Keep it safe!

Use a strong password for Prisma. Bitwarden provides a free and simple [password generator](https://bitwarden.com/password-generator/) that can make one for you.

If you need to change it later, you can use the below SQL:

```sql
alter user "prisma" with password 'new_password';
```

### Grant Prisma access

The below example gives Prisma full authority over all database objects in the public schema:

```sql
  -- Grant it necessary permissions over the relevant schemas (public)
  grant usage on schema public to prisma;
  grant create on schema public to prisma;
  grant all on all tables in schema public to prisma;
  grant all on all routines in schema public to prisma;
  grant all on all sequences in schema public to prisma;
  alter default privileges for role postgres in schema public grant all on tables to prisma;
  alter default privileges for role postgres in schema public grant all on routines to prisma;
  alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

> For more guidance on specifying access, check out this [article](/blog/postgres-roles-and-privileges#creating-objects-and-assigning-privileges) on privileges

## Optimize Prisma queries:

In the [Query Performance Advisor](/dashboard/project/_/database/query-performance), you can view long-running or frequently accessed queries by role:

<img
  width="1509"
  alt="Screenshot 2024-06-19 at 1 25 16 PM"
  src="https://github.com/supabase/supabase/assets/91111415/46e2feae-9fca-4436-a957-2c995eb5ca92"
/>

Selecting a query can reveal suggestions to improve its performance

## Configuring connections

Useful Links:

- [How to Monitor Connections and Find the Correct Pool Size](https://github.com/orgs/supabase/discussions/27141).
- [Supavisor FAQ](https://github.com/orgs/supabase/discussions/21566)

Supabase provides 3 database connection strings that can be used simultaneously if necessary. You can find them on the dashboard by clicking [Connect](/dashboard/project/_?showConnect=true).

### Direct connection:

Best used with stationary servers, such as VMs and long-standing containers, but it only works in IPv6 environments unless the [IPv4 Add-On](/dashboard/project/_/settings/addons) is enabled. If you are unsure if your network is IPv6 compatible, [check here](https://github.com/orgs/supabase/discussions/27034).

```md
# Example Connection

postgresql://postgres:[PASSWORD]@db.[PROJECT REF].supabase.co:5432/postgres
```

### Supavisor in session mode (port 5432):

```md
# Example Connection

postgres://[DB-USER].[PROJECT REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

An alternative to direct connections when working in IPv4-only environments.

> Session mode is a good option for migrations

### Supavisor in transaction mode (port 6543):

```md
# Example Connection

postgres://[DB-USER].[PROJECT REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Should be used when deploying to:

- Horizontally auto-scaling servers
- Edge/Serverless deployments

When working in serverless/edge environments, it is recommended to set the `connection_limit=1` and then gradually increase it if necessary.
