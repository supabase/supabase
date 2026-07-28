---
id: 'cli-workflows'
title: 'Local development workflow'
description: 'Set up and run your day-to-day local development workflow with the Supabase CLI.'
subtitle: 'Set up and run your day-to-day local development workflow with the Supabase CLI.'
---

This guide walks through two common starting points for local development with the Supabase CLI, and shows how they converge into the same daily workflow. By the end, you'll have a `./supabase` directory in your repo that anyone can clone to recreate the full project, locally or on a fresh remote instance.

There are two starting points, both leading to the same place: database schema and migrations tracked in version control, with seed data for local development.

- **[Move an existing project to local development](#move-an-existing-project-to-local-development)**: you have a project on the Supabase platform and want to bring it into a proper local development workflow.
- **[Start a new project from scratch](#start-a-new-project-from-scratch)**: you're building locally and will eventually push to a remote instance.

## Before you begin

You need the Supabase CLI installed and a Docker-compatible runtime running. If you haven't set these up yet, see [Install and run the CLI](/docs/guides/local-development/cli/getting-started) for installation across macOS, Windows, and Linux, and for the details of what `supabase start` brings up and how to access each service.

Keep in mind that **the local stack is for development only**. It is not hardened for production use and must never be exposed to external traffic. It has no TLS, no rate limiting, and default credentials. Use it to develop and test, then deploy to the [Supabase Platform](https://supabase.com) or a proper self-hosted setup for anything beyond that.

<Admonition type="note" label="`supabase` vs. `npx supabase`">

How you invoke the CLI depends on how you installed it:

- Installed globally with **Homebrew or Scoop**: run `supabase <command>`.
- Added as a **project dependency** with npm, pnpm, yarn, or bun: run it through your package runner instead, for example `npx supabase <command>` (or `pnpm supabase`, `yarn supabase`, `bunx supabase`).

Every example in this guide is written as `supabase <command>`. Translate it to whichever form matches your install. See [Install and run the CLI](/docs/guides/local-development/cli/getting-started) for the full setup.

</Admonition>

<Admonition type="tip" label="Starting from a template">

If you want a working project to explore rather than an empty one, `supabase bootstrap` scaffolds a starter application (Next.js, Flutter, and more) with schema, migrations, and config already wired up. It's an alternative entry point to `supabase init` when starting a new project from scratch.

</Admonition>

## The `./supabase` directory

After `supabase init`, your project contains a `./supabase` directory. Here's what goes in it and what to commit:

| Path                   | Purpose                                                           | Commit? |
| ---------------------- | ----------------------------------------------------------------- | ------- |
| `config.toml`          | Local stack configuration (ports, auth settings, etc.)            | Yes     |
| `migrations/`          | Timestamped SQL migration files, applied in order                 | Yes     |
| `seed.sql`             | Dev/test data, applied after migrations on `start` and `db reset` | Yes     |
| `schemas/`             | Declarative schema files (if using that approach)                 | Yes     |
| `.temp/`, `.branches/` | CLI internal state                                                | No      |

The `config.toml` is safe to commit. It contains no secrets by default. If you add sensitive values (OAuth credentials, API keys), use the `env()` function to reference environment variables instead of hardcoding them. See [Managing config and secrets](/docs/guides/local-development/managing-config).

<Admonition type="note" label="Local vs. remote targets">

Many database commands accept `--local` and `--linked` flags to choose what they act on. The defaults are not the same across commands: `db diff` and `db reset` default to `--local`, while `db pull`, `db push`, and `db dump` default to `--linked`. When in doubt, pass the flag explicitly.

</Admonition>

## Move an existing project to local development

You've built a project on the Supabase platform, with tables created via the Dashboard, SQL editor, or client libraries. Now you want a local dev setup with everything in version control.

### Step 1: Initialize

In your project root:

```bash
supabase init
```

This creates `./supabase/config.toml`. If you already have a project directory with application code, run this at the root. The `supabase/` directory will sit alongside your app code.

### Step 2: Authenticate

```bash
supabase login
```

Opens a browser to generate an access token. The token is stored locally and used for all subsequent CLI commands that interact with the platform.

### Step 3: Link to your remote project

```bash
supabase link --project-ref <project-id>
```

Find your project ID in the Supabase Dashboard URL: `https://supabase.com/dashboard/project/<project-id>`.

This tells the CLI which remote project to connect to for `db pull`, `db push`, and other remote operations. You'll be prompted for the database password, which is the password set when you created the project.

### Step 4: Pull the remote schema

```bash
supabase db pull
```

This connects to your remote database, dumps the entire schema, and saves it as a migration file:

```
supabase/migrations/<timestamp>_remote_schema.sql
```

This initial migration is your baseline. It represents the current state of your database, and all future changes build on top of it. `db pull` also records this migration as already applied in the remote migration history (the `supabase_migrations.schema_migrations` table), so a later `db push` won't try to reapply it.

<Admonition type="caution" label="Review the generated migration">

`db pull` diffs your remote database against the CLI's default local stack, so the generated file can include statements you didn't expect. A common example is `DROP EXTENSION pg_net;`, emitted when your remote project has an extension disabled that the local stack enables by default. These statements apply silently on `db reset` and change your local schema, so read the file before committing it. See [Cleaning up generated migrations](#cleaning-up-generated-migrations) for what to look for.

</Admonition>

<Admonition type="tip">

If you also use Supabase Auth or Storage and have customized their schemas, pull them separately:

```bash
supabase db pull --schema auth -f pull-auth-schema
supabase db pull --schema storage -f pull-storage-schema
```

These schemas are managed by Supabase and typically don't need to be pulled unless you've made custom modifications.

</Admonition>

### Step 5: Create seed data

You have two options:

**Option A: Dump existing data from remote** (then clean it up):

```bash
supabase db dump --data-only --linked > supabase/seed.sql
```

<Admonition type="caution">

Review and clean up the dump before committing. Remove production user data, secrets, personal information, and anything sensitive. Keep only representative test data that a developer needs to work with the project.

</Admonition>

**Option B: Write seed data by hand** (recommended for most projects):

Create `supabase/seed.sql` with INSERT statements that set up a useful local development state: a few test users, sample data, and so on. This is often better than dumping production data because you control exactly what's in it.

For more on organizing seed files, glob patterns, and generating realistic data, see [Seeding your database](/docs/guides/local-development/seeding-your-database).

### Step 6: Verify

```bash
supabase start
supabase db reset
```

`db reset` destroys the local database and recreates it from scratch: it applies all migrations in order, then runs `seed.sql`. If this succeeds, your setup is reproducible. Anyone who clones the repo can do the same.

### Step 7: Commit

```bash
git add supabase/
git commit -m "add supabase local development setup"
```

Your project now has a fully reproducible local development environment.

<Admonition type="note" label="What about declarative schemas?">

For an existing project, the pulled migration already serves as your schema baseline. You don't need to also create a `schemas/` directory, because that would mean maintaining two representations of the same schema. If you want to adopt declarative schemas later, see [Declarative database schemas](/docs/guides/local-development/declarative-database-schemas). For day-to-day changes going forward, see [The daily workflow](#the-daily-workflow) below.

</Admonition>

## Start a new project from scratch

No remote project yet. You're building from scratch and want to do it right from the start.

### Step 1: Initialize

```bash
supabase init
```

### Step 2: Start the local stack

```bash
supabase start
```

On first run, Docker images are pulled, which takes a few minutes. Subsequent starts are fast. Once running, the CLI outputs local service URLs and credentials, including the Studio URL for a local instance of the Dashboard. See [Install and run the CLI](/docs/guides/local-development/cli/getting-started#access-your-projects-services) for the full output and how to reach each service.

### Step 3: Create your schema

Two approaches, pick one:

**Option A: Declarative schema** (recommended for new projects)

Declare the state you want your database to be in as a file in `supabase/schemas/`, for example:

```sql title="supabase/schemas/schema.sql"
create table public.todos (
  id bigint generated by default as identity primary key,
  created_at timestamptz default now() not null,
  title text not null,
  is_complete boolean default false not null,
  user_id uuid references auth.users (id) default auth.uid() not null
);

alter table public.todos enable row level security;

create policy "Users can read their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can create their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);
```

Then generate a migration from it:

```bash
supabase db diff -f initial-schema
```

This compares your declared schema against the current (empty) database and generates a migration file in `supabase/migrations/`. For the full declarative workflow, including managing views and functions, ordering schema files, and known caveats, see [Declarative database schemas](/docs/guides/local-development/declarative-database-schemas).

**Option B: Write the migration directly**

```bash
supabase migration new initial-schema
```

This creates an empty file at `supabase/migrations/<timestamp>_initial-schema.sql`. Write your SQL in it, then apply:

```bash
supabase db reset
```

### Step 4: Add seed data

Create `supabase/seed.sql`:

```sql title="supabase/seed.sql"
-- Create a test user (Supabase Auth)
-- Note: this is a placeholder row so seeded data has a user_id to reference.
-- It has no password, so it can't be used to sign in. To create a
-- login-capable user, use the Auth admin API or the local Studio.
insert into auth.users (id, email, raw_user_meta_data)
values ('d0e3c8f0-1234-5678-9abc-def012345678', 'test@example.com', '{}');

-- Seed application data
insert into public.todos (title, user_id)
values
  ('Buy groceries', 'd0e3c8f0-1234-5678-9abc-def012345678'),
  ('Write documentation', 'd0e3c8f0-1234-5678-9abc-def012345678');
```

### Step 5: Verify

```bash
supabase db reset
```

Drops everything, applies migrations, runs seed. If this passes, your project is reproducible.

### Step 6: Commit

```bash
git add supabase/
git commit -m "add supabase local development setup"
```

## The daily workflow

Both starting points converge here. You have a working `./supabase` directory in your repo. Here's how day-to-day development works.

### Making schema changes

Which approach you use is a project-level decision, set when you first created your schema - not a per-change choice. It depends on whether you keep declarative files in `supabase/schemas/`. Pick the tab that matches your project.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="declarative"
  queryGroup="schema-approach"
>
<TabPanel id="declarative" label="Declarative schemas">

1. Edit your schema file(s) in `supabase/schemas/` (add a table, a column, a policy, etc.)
2. Generate a migration: `supabase db diff -f add-due-date-to-todo`
3. Review the generated migration file. See [Cleaning up generated migrations](#cleaning-up-generated-migrations)
4. Verify the full chain: `supabase db reset`
5. Commit the schema file **and** the migration together

<Admonition type="caution">

`db diff` compares your `supabase/schemas/` files against your existing migrations; it does **not** read the live local database. Changes you make directly in Studio or via SQL are ignored, so `db diff` reports "No schema changes found" and silently drops them. Always edit the schema files, then diff.

</Admonition>

  </TabPanel>
  <TabPanel id="imperative" label="Imperative migrations">
    
**If you made changes through the local Studio UI:**

```bash
supabase db diff -f add-due-date-to-todo
```

This captures your UI changes as a migration file. This works only when your project has **no** declarative files in `supabase/schemas/`: `db diff` then compares the live local database against your migrations. If you use declarative schemas, don't edit through Studio expecting `db diff` to catch it - see the **Declarative schemas** tab.

**If you prefer to write SQL directly:**

```bash
supabase migration new add-due-date-to-todo
```

Write the SQL in the generated file. Then verify:

```bash
supabase db reset
```

Commit the migration.

</TabPanel>
</Tabs>

### Generating types

If your app uses the generated TypeScript types, regenerate them whenever your schema changes:

```bash
supabase gen types --lang typescript --local > database.types.ts
```

Use `--linked` instead of `--local` to generate from your remote project. TypeScript is the default language; pass `--lang go`, `--lang swift`, or `--lang python` for others.

For working with the generated types (helper types, JSON inference, type-safe queries) and automating regeneration in CI, see [Generating types](/docs/guides/api/rest/generating-types).

### Staying in sync with your team

When someone else pushes new migrations:

```bash
git pull
supabase db reset
```

`db reset` replays all migrations from scratch, so you'll always match the current state of the repo.

## Pushing to a remote project

When you're ready to deploy your schema to a remote Supabase instance:

```bash
# Authenticate (if not already)
supabase login

# Link to the remote project (if not already)
supabase link --project-ref <project-id>

# Preview what will be applied
supabase db push --dry-run

# Apply migrations
supabase db push
```

`db push` applies only migrations that haven't been applied to the remote yet. It tracks this via the `supabase_migrations.schema_migrations` table created automatically on the remote database.

To also seed a fresh remote instance (dev/staging environments only):

```bash
supabase db push --include-seed
```

<Admonition type="caution">

Never use `--include-seed` on a production database. Seed data is for development and testing.

</Admonition>

### Resetting a remote dev or staging project

If a dev or staging remote drifts or gets into a messy state, you can wipe it and rebuild it from your local migrations:

```bash
supabase db reset --linked
```

Unlike the default `supabase db reset`, which targets your local database, the `--linked` flag runs against the remote project you connected with `supabase link`: it drops the remote schema, then replays every local migration in order. Add `--include-seed` to reload seed data as well.

<Admonition type="danger">

`db reset --linked` is destructive: it erases all data in the linked remote database. Only run it against throwaway dev or staging projects, and double-check which project you're linked to (`supabase projects list` shows the linked one) before running it. Never use it on production.

</Admonition>

For multi-environment setups with CI/CD (feature branches, staging, production), see [Managing Environments](/docs/guides/deployment/managing-environments).

## Key commands at a glance

| Command                                | What it does                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `supabase init`                        | Creates `./supabase/config.toml`                                                                        |
| `supabase start`                       | Starts the local stack, applies migrations + seed                                                       |
| `supabase stop`                        | Stops the local stack (data persists until `db reset`)                                                  |
| `supabase db reset`                    | Destroys local DB, applies all migrations + seed from scratch                                           |
| `supabase db reset --linked`           | Destroys the **linked remote** DB and rebuilds it from local migrations (destructive; dev/staging only) |
| `supabase db diff -f <name>`           | Generates a migration by diffing current DB state against a shadow database                             |
| `supabase db pull`                     | Pulls remote schema into a new local migration file                                                     |
| `supabase db push`                     | Applies pending local migrations to the remote database                                                 |
| `supabase db dump`                     | Exports remote DB schema (or `--data-only` for data) via `pg_dump`                                      |
| `supabase migration new <name>`        | Creates an empty migration file                                                                         |
| `supabase migration list`              | Compares local migrations against remote migration history                                              |
| `supabase gen types --lang typescript` | Generates TypeScript types from your database schema                                                    |
| `supabase link --project-ref`          | Connects local project to a remote Supabase project                                                     |
| `supabase login`                       | Authenticates with the Supabase platform                                                                |

For the full command reference and every flag, see the [CLI reference](/docs/reference/cli).

## Cleaning up generated migrations

When `supabase db diff` generates a migration, it may include statements that are technically correct but noisy. Review every generated migration before committing.

### Grants

You may see lines like:

```sql
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.todos TO anon;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.todos TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.todos TO service_role;
```

These appear because the diff tool treats permissions as part of the schema state. For tables in the `public` schema, these grants are applied by default and the lines are redundant. They're harmless, but if you want clean migrations, you can remove them. Be consistent across your team about whether you keep or remove them.

### Revoke/re-grant patterns

Sometimes a diff produces:

```sql
REVOKE ALL ON TABLE public.todos FROM anon;
GRANT ALL ON TABLE public.todos TO anon;
```

This is the diff tool being overly cautious. If you haven't changed permissions, these lines can be safely removed.

### Extension statements

`CREATE EXTENSION IF NOT EXISTS ...` may appear. Keep these if the extension is required by your migration. Remove them if the extension is already created by a previous migration or is part of the default Supabase setup.

### Known limitations of `db diff`

The diff is generated by `pg-delta`, the default schema diff engine. (The older [`migra`](https://github.com/djrobstep/migra) engine is still available: set `enabled = false` under `[experimental.pgdelta]` in `config.toml`, or pass `--use-migra`.) No diff engine captures everything. Most notably, DML (INSERT, UPDATE, DELETE) is not tracked, so data changes must be added to the migration manually, and some entities like RLS policy renames and certain view properties don't diff cleanly. See the [full list of caveats](/docs/guides/local-development/declarative-database-schemas#known-caveats) in the declarative schemas guide.

Treat `db diff` output as a draft, not a final migration. When in doubt, review the generated SQL and adjust it manually.

## Troubleshooting

**`db reset` fails with a migration error**

The output will show which migration file failed and the SQL error. Fix the migration file, then run `db reset` again.

**`db push` says migrations are already applied**

The remote database already has those migrations in its history. Run `supabase migration list` to compare local vs. remote state. If they're out of sync, use `supabase migration repair` to correct the remote history.

**Schema drift: remote was changed outside of migrations**

If someone modified the remote database directly (via Dashboard, SQL editor, etc.), run `supabase db pull` to capture those changes as a new migration file. Then `supabase db reset` locally to verify everything still works.

**Docker issues on `supabase start`**

Ensure Docker is running and has at least 7 GB of RAM allocated. If containers fail health checks, try:

```bash
supabase stop
supabase start
```

If problems persist, `supabase stop --no-backup` for a clean restart (this removes local database data).
