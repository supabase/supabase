# Supabase Database

> Every Supabase project is a dedicated Postgres database, trusted by millions of developers.

Supabase Database gives you a full Postgres database with no compromises. It is not a Postgres-compatible alternative or a shared cluster: every project gets its own dedicated Postgres instance that you can connect to directly with any Postgres client.

## Key Features

- **Dedicated Postgres**: each project is an isolated Postgres instance, not a shared tenant
- **100% portable**: bring your own Postgres database, or export and migrate away at any time
- **Auto-generated APIs**: REST (PostgREST) and GraphQL (pg_graphql) APIs generated from your schema, no backend code needed
- **Table Editor**: spreadsheet-like UI for viewing and editing data, with support for relationships, JSON columns, and foreign key lookups
- **SQL Editor**: write and save SQL queries directly in the dashboard, with autocomplete and syntax highlighting
- **Row Level Security**: fine-grained access control using Postgres RLS policies, integrated with Supabase Auth JWTs
- **40+ extensions**: enable Postgres extensions with a single click (pgvector, PostGIS, pg_cron, pg_stat_statements, and more)
- **Database Branching**: create isolated database branches synced with git branches, with Vercel Preview support
- **Read Replicas**: distribute read traffic across replicas in multiple regions for lower latency and higher throughput
- **Realtime**: subscribe to INSERT, UPDATE, DELETE, and other changes via WebSockets
- **Database Webhooks**: trigger Edge Functions or external HTTP endpoints on table events
- **Supabase ETL**: stream Postgres changes to external data warehouses in real time, with no pipelines

## Technical Details

- Engine: PostgreSQL (latest stable)
- Connection: direct Postgres connections (connection string), connection pooling via PgBouncer (Supavisor)
- Client libraries: JavaScript, Python, Dart (Flutter), Swift, Kotlin, C#
- Backups: automatic daily backups, Point-in-Time Recovery available as add-on
- Compute: configurable from Micro (2-core ARM) to 16XL+ (64-core ARM and above), with autoscaling options

## Links

- Documentation: https://supabase.com/docs/guides/database
- API Reference: https://supabase.com/docs/reference/javascript/select
- Dashboard: https://supabase.com/dashboard
