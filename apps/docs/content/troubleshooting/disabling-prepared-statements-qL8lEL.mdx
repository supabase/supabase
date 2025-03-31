---
title = "Disabling Prepared statements"
github_url = "https://github.com/orgs/supabase/discussions/28239"
date_created = "2024-07-28T15:32:23+00:00"
topics = [ "database", "supavisor" ]
keywords = [ "prepared", "statements", "transaction", "mode", "disable" ]
database_id = "04801b69-e7eb-4f40-8d41-81110397bbc2"
---

### It is important to note that although the direct connections and Supavisor in session mode support prepared statements, Supavisor in transaction mode does not.

## How to disable prepared statements for Supavisor in transaction mode

Each ORM or library configures prepared statements differently. Here are settings for some common ones. If you don't see yours, make a comment

# Prisma:

add ?pgbouncer=true to end of connection string:

```
postgres://[db-user].[project-ref]:[db-password]@aws-0-[aws-region].pooler.supabase.com:6543/[db-name]?pgbouncer=true
```

# Drizzle:

Add a prepared false flag to the client:

```ts
export const client = postgres(connectionString, { prepare: false })
```

# Node Postgres

[Just omit the "name" value in a query definition](https://node-postgres.com/features/queries#prepared-statements):

```ts
const query = {
  name: 'fetch-user', // <--------- DO NOT INCLUDE
  text: 'SELECT * FROM user WHERE id = $1',
  values: [1],
}
```

# Psycopg

set the [prepare_threshold](https://www.psycopg.org/psycopg3/docs/api/connections.html#psycopg.Connection.prepare_threshold) to `None`.

# asyncpg

Follow the recommendation in the [asyncpg docs](https://magicstack.github.io/asyncpg/current/faq.html#why-am-i-getting-prepared-statement-errors)

> disable automatic use of prepared statements by passing `statement_cache_size=0` to [asyncpg.connect()](https://magicstack.github.io/asyncpg/current/api/index.html#asyncpg.connection.connect) and [asyncpg.create_pool()](https://magicstack.github.io/asyncpg/current/api/index.html#asyncpg.pool.create_pool) (and, obviously, avoid the use of [Connection.prepare()](https://magicstack.github.io/asyncpg/current/api/index.html#asyncpg.connection.Connection.prepare));

# Rust's Deadpool or `tokio-postgres`:

- Check [GitHub Discussion](https://github.com/bikeshedder/deadpool/issues/340#event-13642472475)
