---
title: 'Migrate from Heroku to Supabase'
description: 'Migrate your Heroku Postgres database to Supabase.'
topics: ['Migration', 'Database']
---

Supabase is one of the best [free alternatives to Heroku Postgres](/alternatives/supabase-vs-heroku-postgres). This guide shows how to migrate your Heroku Postgres database to Supabase. This migration requires the [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) and [psql](https://www.postgresql.org/docs/current/app-psql.html) CLI tools, which are installed automatically as part of the complete Postgres installation package.

Alternatively, use the [Heroku to Supabase migration tool](https://migrate.supabase.com/) to migrate in a few clicks.

## Retrieve your Heroku database credentials

1. Sign in to your [Heroku account](https://heroku.com) and select the project you want to migrate.
1. Click **Resources** in the menu and select your **Heroku Postgres** database.
1. Click **Settings** in the menu.
1. Click **View Credentials** and save the following information:
   - Host (`$HEROKU_HOST`)
   - Database (`$HEROKU_DATABASE`)
   - User (`$HEROKU_USER`)
   - Password (`$HEROKU_PASSWORD`)

## Retrieve your Supabase connection string

1. If you're new to Supabase, [create a project](/dashboard).
1. Get your project's Session pooler connection string from your project dashboard by clicking [Connect](/dashboard/project/_?showConnect=true&method=session).
1. Replace [YOUR-PASSWORD] in the connection string with your database password. You can reset your database password on the [Database Settings page](/dashboard/project/_/database/settings) if you do not have it.

## Export your Heroku database to a file

Use `pg_dump` with your Heroku credentials to export your Heroku database to a file (e.g., `heroku_dump.sql`).

```bash
pg_dump --clean --if-exists --quote-all-identifiers \
 -h $HEROKU_HOST -U $HEROKU_USER -d $HEROKU_DATABASE \
 --no-owner --no-privileges > heroku_dump.sql
```

## Import the database to your Supabase project

Use `psql` to import the Heroku database file to your Supabase project.

```bash
psql -d "$YOUR_CONNECTION_STRING" -f heroku_dump.sql
```

## Additional options

- To only migrate a single database schema, add the `--schema=PATTERN` parameter to your `pg_dump` command.
- To exclude a schema: `--exclude-schema=PATTERN`.
- To only migrate a single table: `--table=PATTERN`.
- To exclude a table: `--exclude-table=PATTERN`.

Run `pg_dump --help` for a full list of options.

> [!CAUTION]
>
> - If you're planning to migrate a database larger than 6 GB, we recommend [upgrading to at least a Large compute add-on](/docs/guides/platform/compute-and-disk). This will ensure you have the necessary resources to handle the migration efficiently.
> - We strongly advise you to pre-provision the disk space you will need for your migration. On paid projects, you can do this by navigating to the [Infrastructure settings](/dashboard/project/_/settings/infrastructure) page. For more information on disk scaling and disk limits, check out our [disk settings](/docs/guides/platform/compute-and-disk#disk) documentation.

## Enterprise

[Contact us](https://forms.supabase.com/enterprise) if you need more help migrating your project.
