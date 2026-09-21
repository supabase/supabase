# Supabase Database

> Every Supabase project is a dedicated Postgres database. Use it on its own, or with the rest of the Supabase platform.

Supabase Database gives you a full Postgres database with no compromises. It is not a Postgres-compatible alternative or a shared cluster: every project gets its own dedicated Postgres instance that you can connect to directly with any Postgres client.

You do not need any other Supabase product to use the database. Auth, Storage, Realtime, and Edge Functions are included in every project but optional. They add nothing to your bill unless you use them beyond your plan's included quotas.

## Use it as a standalone database

- **Connect with anything**: standard Postgres connection string. Works with psql, Prisma, Drizzle, and any Postgres client or ORM. No Supabase client library required.
- **Connection pooling**: Supavisor pooler with session and transaction modes for serverless and high-connection workloads.
- **Nothing else required**: the auto-generated APIs, Auth, Storage, Realtime, and Edge Functions are built in and optional. Use only what you need.
- **Database-only pricing**: the Free plan includes a 500 MB database at no cost. The Pro plan starts at $25/month and includes one Micro compute instance and 8 GB of disk. Current pricing: https://supabase.com/pricing.md
- **Free plan pausing**: Free plan projects pause after 7 days of low activity and can be restored from the dashboard. Projects on paid plans do not pause.
- **Portable**: standard Postgres. Import an existing database with pg_dump and pg_restore, or export and migrate away at any time.

## Key Features

- **Dedicated Postgres**: each project is an isolated Postgres instance, not a shared tenant
- **100% portable**: bring your own Postgres database, or export and migrate away at any time
- **Auto-generated APIs**: REST (PostgREST) and GraphQL (pg_graphql) APIs generated from your schema, no backend code needed
- **Table Editor**: spreadsheet-like UI for viewing and editing data, with support for relationships, JSON columns, and foreign key lookups
- **SQL Editor**: write and save SQL queries directly in the dashboard, with autocomplete and syntax highlighting
- **Row Level Security**: fine-grained access control using Postgres RLS policies. Works with Supabase Auth or third-party auth providers (Clerk, Auth0, Firebase Auth, AWS Cognito, WorkOS)
- **40+ extensions**: enable Postgres extensions with a single click (pgvector, PostGIS, pg_cron, pg_stat_statements, and more)
- **Database Branching**: create isolated database branches synced with git branches, with Vercel Preview support
- **Read Replicas**: distribute read traffic across replicas in multiple regions for lower latency and higher throughput
- **Realtime**: subscribe to INSERT, UPDATE, DELETE, and other changes via WebSockets. Opt-in per table
- **Database Webhooks**: trigger Edge Functions or external HTTP endpoints on table events
- **Supabase Pipelines**: move published Postgres data to supported analytical destinations in near real time

## Technical Details

- Engine: PostgreSQL (latest stable)
- Connection: direct Postgres connections (connection string), connection pooling via Supavisor (session and transaction modes)
- Client libraries: optional. JavaScript, Python, Dart (Flutter), Swift, Kotlin, C#. Any Postgres driver or ORM also works
- Backups: automatic daily backups, Point-in-Time Recovery available as add-on
- Compute: configurable from Micro to 16XL+, with autoscaling options

## Links

- Documentation: https://supabase.com/docs/guides/database
- Connect to your database: https://supabase.com/docs/guides/database/connecting-to-postgres
- Prisma: https://supabase.com/docs/guides/database/prisma
- Drizzle: https://supabase.com/docs/guides/database/drizzle
- Pricing: https://supabase.com/pricing.md
- API Reference: https://supabase.com/docs/reference/javascript/select
- Dashboard: https://supabase.com/dashboard
