Cloudflare D1 is Cloudflare's managed, serverless database with SQLite's SQL semantics, built-in disaster recovery, and Worker and HTTP API access.

The Cloudflare D1 Wrapper is a WebAssembly (Wasm) foreign data wrapper that allows you to read and write data from Cloudflare D1 databases within your Postgres database.

**Features**

- Query D1 databases directly from Postgres using SQL.
- Read and write support for D1 tables.
- Secure credential storage via Supabase Vault.
- Supports query pushdown (where, order by, limit).
