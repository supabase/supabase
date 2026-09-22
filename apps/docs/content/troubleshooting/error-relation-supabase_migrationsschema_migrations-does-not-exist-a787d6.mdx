---
title = "Error: relation 'supabase_migrations.schema_migrations' does not exist"
date_created = "2026-07-02T20:06:29+00:00"
topics = [ "cli", "database" ]
keywords = []
---

If you are observing the error `relation "supabase_migrations.schema_migrations" does not exist` in your Postgres logs, it is typically caused by the Supabase dashboard polling for migration history.

**Why Does This Happen?**
The Supabase dashboard performs background queries to retrieve migration data from a table that is managed specifically by the Supabase CLI. If you are using a custom migration tool, a manual setup, or have not yet deployed migrations via the CLI, this table will not exist, causing the logs to report this error.

**How to Resolve:**

- **Ignore the error:** If you are not using the Supabase CLI to manage your database migrations, this error is a harmless side effect of dashboard polling and can be safely ignored.
- **Initialize the migration metadata**: If you manage your database with the Supabase CLI, running `supabase db push` will create the supabase_migrations schema and schema_migrations table as part of applying your local migrations. Be aware that this command may also apply any pending migration files to your database, so only run it if that's your intended workflow.
