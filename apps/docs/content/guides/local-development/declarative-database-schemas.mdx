---
id: 'declarative-database-schemas'
title: 'Declarative database schemas'
description: 'Manage your database schemas in one place and generate versioned migrations.'
subtitle: 'Manage your database schemas in one place and generate versioned migrations.'
---

## Overview

Declarative schemas provide a developer-friendly way to maintain <InfoTooltip tooltipContent={<><p>Files of SQL statements that track the evolution of your database schema over time.<br />They allow you to version control your database schema alongside your application code.</p><p>See the <Link href="/guides/deployment/database-migrations" className="underline">database migrations</Link> guide to learn more.</p></>}>schema migrations</InfoTooltip>.

[Migrations](/docs/guides/deployment/database-migrations) are traditionally managed imperatively (you provide the instructions on how exactly to change the database). This can lead to related information being scattered over multiple migration files. With declarative schemas, you instead declare the state you want your database to be in, and the instructions are generated for you.

## Schema migrations

Schema migrations are SQL statements written in Data Definition Language. They are versioned in your `supabase/migrations` directory to ensure schema consistency between local and remote environments.

### Declaring your schema

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Create your first schema file">
      Create a SQL file in `supabase/schemas` directory that defines an `employees` table.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```sql name=supabase/schemas/employees.sql
create table "employees" (
  "id" integer not null,
  "name" text
);
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

<StepHikeCompact>

  <StepHikeCompact.Step step={2}>
    <StepHikeCompact.Details title="Generate a migration file">
      Generate a migration file by diffing against your declared schema.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```bash name=Terminal
supabase db diff -f create_employees_table
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

<StepHikeCompact>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Start the local database and apply migrations">
      Start the local database first. Then, apply the migration manually to see your schema changes in the local Dashboard.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```bash name=Terminal
supabase start
supabase migration up
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

### Updating your schema

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Add a new column">
      Edit `supabase/schemas/employees.sql` file to add a new column to `employees` table.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```sql name=supabase/schemas/employees.sql
create table "employees" (
  "id" integer not null,
  "name" text,
  "age" smallint not null
);
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

<Admonition type="tip">

Some entities like views and enums expect columns to be declared in a specific order. To avoid messy diffs, always append new columns to the end of the table.

</Admonition>

<StepHikeCompact>

  <StepHikeCompact.Step step={2}>
    <StepHikeCompact.Details title="Generate a new migration">
      Diff existing migrations against your declared schema.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```bash name=Terminal
supabase db diff -f add_age
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

<StepHikeCompact>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Review the generated migration">
      Verify that the generated migration contain a single incremental change.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```sql name=supabase/migrations/<timestamp>_add_age.sql
alter table "public"."employees" add column "age" smallint not null;
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

<StepHikeCompact>
  <StepHikeCompact.Step step={4}>
    <StepHikeCompact.Details title="Apply the pending migration">
      Start the database locally and apply the pending migration.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```bash name=Terminal
supabase migration up
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

### Deploying your schema changes

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Log in to the Supabase CLI">
      [Log in](/docs/reference/cli/supabase-login) via the Supabase CLI.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```bash name=Terminal
supabase login
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={2}>
    <StepHikeCompact.Details title="Link your remote project">
      Follow the on-screen prompts to [link](/docs/reference/cli/supabase-link) your remote project.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```bash name=Terminal
supabase link
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Deploy database changes">
      [Push](/docs/reference/cli/supabase-db-push) your changes to the remote database.
    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

<$CodeTabs>

```bash name=Terminal
supabase db push
```

</$CodeTabs>

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

### Managing dependencies

As your database schema evolves, you will probably start using more advanced entities like views and functions. These entities are notoriously verbose to manage using plain migrations because the entire body must be recreated whenever there is a change. Using declarative schema, you can now edit them in-place so it’s much easier to review.

<$CodeTabs>

```sql name=supabase/schemas/employees.sql
create table "employees" (
  "id" integer not null,
  "name" text,
  "age" smallint not null
);

create view "profiles" as
  select id, name from "employees";

create function "get_age"(employee_id integer) RETURNS smallint
  LANGUAGE "sql"
AS $$
  select age
  from employees
  where id = employee_id;
$$;
```

</$CodeTabs>

Your schema files are run in lexicographic order by default. The order is important when you have foreign keys between multiple tables as the parent table must be created first. For example, your `supabase` directory may end up with the following structure.

```bash
.
└── supabase/
    ├── schemas/
    │   ├── employees.sql
    │   └── managers.sql
    └── migrations/
        ├── 20241004112233_create_employees_table.sql
        ├── 20241005112233_add_employee_age.sql
        └── 20241006112233_add_managers_table.sql
```

For small projects with only a few tables, the default schema order may be sufficient. However, as your project grows, you might need more control over the order in which schemas are applied. To specify a custom order for applying the schemas, you can declare them explicitly in `config.toml`. Any glob patterns will evaluated, deduplicated, and sorted in lexicographic order. For example, the following pattern ensures `employees.sql` is always executed first.

<$CodeTabs>

```toml name=supabase/config.toml
[db.migrations]
schema_paths = [
  "./schemas/employees.sql",
  "./schemas/*.sql",
]
```

</$CodeTabs>

### Pulling in your production schema

To set up declarative schemas on a existing project, you can pull in your production schema by running:

<$CodeTabs>

```bash name=Terminal
supabase db dump > supabase/schemas/prod.sql
```

</$CodeTabs>

From there, you can start breaking down your schema into smaller files and generate migrations. You can do this all at once, or incrementally as you make changes to your schema.

### Rolling back a schema change

During development, you may want to rollback a migration to keep your new schema changes in a single migration file. This can be done by resetting your local database to a previous version.

<$CodeTabs>

```bash name=Terminal
supabase db reset --version 20241005112233
```

</$CodeTabs>

After a reset, you can [edit the schema](#updating-your-schema) and regenerate a new migration file. Note that you should not reset a version that's already deployed to production.

If you need to rollback a migration that's already deployed, you should first revert changes to the schema files. Then you can generate a new migration file containing the down migration. This ensures your production migrations are always rolling forward.

<Admonition type="danger">

SQL statements generated in a down migration are usually destructive. You must review them carefully to avoid unintentional data loss.

</Admonition>

## Known caveats

The `migra` diff tool used for generating schema diff is capable of tracking most database changes. However, there are edge cases where it can fail.

If you need to use any of the entities below, remember to add them through [versioned migrations](/docs/guides/deployment/database-migrations) instead.

### Data manipulation language

- DML statements such as `insert`, `update`, `delete`, etc., are not captured by schema diff

### View ownership

- [view owner and grants](https://github.com/djrobstep/migra/issues/160#issuecomment-1702983833)
- [security invoker on views](https://github.com/djrobstep/migra/issues/234)
- [materialized views](https://github.com/djrobstep/migra/issues/194)
- doesn’t recreate views when altering column type

### RLS policies

- [alter policy statements](https://github.com/djrobstep/schemainspect/blob/master/schemainspect/pg/obj.py#L228)
- [column privileges](https://github.com/djrobstep/schemainspect/pull/67)

### Other entities

- schema privileges are not tracked because each schema is diffed separately
- [comments are not tracked](https://github.com/djrobstep/migra/issues/69)
- [partitions are not tracked](https://github.com/djrobstep/migra/issues/186)
- [`alter publication ... add table ...`](https://github.com/supabase/cli/issues/883)
- [create domain statements are ignored](https://github.com/supabase/cli/issues/2137)
- [grant statements are duplicated from default privileges](https://github.com/supabase/cli/issues/1864)
