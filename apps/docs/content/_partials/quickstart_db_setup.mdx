export const sqlSetup = `-- Create the table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- Insert sample data into the table
insert into instruments (name)
values
('violin'),
('viola'),
('cello');

-- Grant the privileges the role needs, which is read access
grant select on public.instruments to anon;

-- Enable row level security for the table
alter table instruments enable row level security;

-- Create a policy to allow the anon role to read from the instruments table
create policy "public can read instruments"
on public.instruments
for select to anon
using (true);`

## 1. Create a Supabase project

To start, you need a Supabase project.

Create a new Supabase project from [the Dashboard of any organization](/dashboard/new/_) you belong to.

<Admonition type="tip" title="Want to create a project programmatically?">

Use [the Management API](/docs/reference/api/v1-create-a-project) or ask [the MCP server](/docs/guides/ai-tools/mcp#account-management) to create a new Supabase project.

</Admonition>

## 2. Set up your database

When your Supabase project is up and running, create an `instruments` table with some sample data. Then set only the privileges each Postgres role needs, add [Row Level Security (RLS)](/docs/guides/database/postgres/row-level-security) for enhanced security for database data by default, and create an RLS policy to make the data in the table publicly readable.

Do these steps within your project's dashboard by copying and running the snippet in your project's [SQL Editor](/dashboard/project/_/sql/new).

<Admonition type="tip">

Save some steps by <a href={`/dashboard/project/_/sql/new?content=${encodeURIComponent(sqlSetup)}`}>clicking here to prefill the SQL</a> in the SQL Editor, and then clicking **Run**.

</Admonition>

<Admonition type="tip" title="Want to setup the database programmatically?">

You can use [the Management API](/docs/reference/api/v1-run-a-query) or ask [the MCP server](/docs/guides/ai-tools/mcp#database) to execute SQL queries.

</Admonition>

```sql SQL_EDITOR
-- Create the table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- Insert sample data into the table
insert into instruments (name)
values
  ('violin'),
  ('viola'),
  ('cello');

-- Grant the privileges the role needs, which is read access
grant select on public.instruments to anon;

-- Enable row level security for the table
alter table instruments enable row level security;

-- Create a policy to allow the anon role to read from the instruments table
create policy "public can read instruments"
on public.instruments
for select to anon
using (true);
```

<Admonition type="note" label="Disabled the Data API during project setup?">

If you disabled the Data API during project setup, enable it in the [**Integrations > Data API**](/dashboard/project/_/integrations/data_api/settings) section of the Dashboard and expose the specific tables or functions you want to access. To automatically grant access for new tables and functions in `public`, enable **Automatically expose new tables**.

</Admonition>
