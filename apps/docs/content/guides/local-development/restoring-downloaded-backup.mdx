---
title: Restoring a downloaded backup locally
subtitle: Restore a backup of a remote database on a local instance to inspect and extract data
---

If your paused project has exceeded its [restoring time limit](/docs/guides/platform/upgrading#time-limits), you can download a backup from the dashboard and restore it to your local development environment. This might be useful for inspecting and extracting data from your paused project.

<Admonition type="caution">

If you want to restore your backup to a hosted Supabase project, follow the [Migrating within Supabase guide](/docs/guides/platform/migrating-within-supabase) instead.

</Admonition>

## Downloading your backup

First, download your project's backup file from dashboard and identify its backup image version (following the `PG:` prefix):

<Image

alt="Project Paused: 90 Days Remaining"
src="/docs/img/guides/platform/paused-dl-image-version.png"

width={628}
height={389}
/>

## Restoring your backup

Given Postgres version `15.6.1.115`, start Postgres locally with `db_cluster.backup` being the path to your backup file.

```sh
supabase init
echo '15.6.1.115' > supabase/.temp/postgres-version
supabase db start --from-backup db_cluster.backup
```

Note that the earliest Supabase Postgres version that supports a local restore is `15.1.0.55`. If your hosted project was running on earlier versions, you will likely run into errors during restore. Before submitting any support ticket, make sure you have attached the error logs from `supabase_db_*` docker container.

Once your local database starts up successfully, you can connect using psql to verify that all your data is restored.

```sh
psql 'postgresql://postgres:postgres@localhost:54322/postgres'
```

If you want to use other services like Auth, Storage, and Studio dashboard together with your restored database, restart the local development stack.

```sh
supabase stop
supabase start
```

A Postgres database started with Supabase CLI is not production ready and should not be used outside of local development.
