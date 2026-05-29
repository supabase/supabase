---
title = "Transferring from platform to self-hosted Supabase"
github_url = "https://github.com/orgs/supabase/discussions/22712"
date_created = "2024-04-14T15:19:10+00:00"
topics = [ "database", "self-hosting" ]
keywords = [ "migrate", "pg_dump", "psql", "self-host" ]
database_id = "c6b6ae3c-1b5b-4ba8-a40f-5f2ca1f007e2"
---

For a detailed, step-by-step guide on restoring your database from the Supabase platform to a [self-hosted Supabase](/docs/guides/self-hosting) instance, see [Restore a Platform Project to Self-Hosted](/docs/guides/self-hosting/restore-from-platform).

### Quick reference

Back up your cloud database:

```bash
supabase db dump --db-url "[CONNECTION_STRING]" -f roles.sql --role-only
```

```bash
supabase db dump --db-url "[CONNECTION_STRING]" -f schema.sql
```

```bash
supabase db dump --db-url "[CONNECTION_STRING]" -f data.sql --use-copy --data-only
```

Restore to your self-hosted instance:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "postgres://postgres.your-tenant-id:[POSTGRES_PASSWORD]@[your-domain]:5432/postgres"
```
