---
title = "Resolving 42P01: relation does not exist error"
github_url = "https://github.com/orgs/supabase/discussions/29577"
date_created = "2024-09-29T15:52:41+00:00"
topics = [ "database" ]
keywords = [ "relation", "schema", "capitalization" ]
database_id = "72e93bc8-597d-4c72-8d86-4997679196fd"

[[errors]]
code = "42P01"
message = "relation \"<some table name>\" does not exist"

[[errors]]
code = "42501"
message = "permission denied"
---

`42P01` is a[ Postgres level error](https://www.postgresql.org/docs/current/errcodes-appendix.html), that can also be found in the [PostgREST error docs](https://postgrest.org/en/v12/references/errors.html)

```sql
42P01: relation "<some table name>" does not exist
```

## There are a few possible causes

---

### Cause 1: Search path broken

When directly accessing a table that is not in the `public` schema, it's important to reference the external schema explicitly in your query. Below is an example from the [JS client:](/docs/reference/javascript/select)

```js
const { data, error } = await supabase.schema('myschema').from('mytable').select()
```

If after calling the table directly, you get a `42501` permission denied error, then you must also [expose the custom schema to the API.](/docs/guides/api/using-custom-schemas). For Supabase managed schemas, such as `vault` and `auth`, these cannot be directly accessed through the DB REST API for security reasons. If necessary, they can be strictly accessed through [security definer functions.](/docs/guides/database/functions?queryGroups=language&language=sql&queryGroups=example-view&example-view=sql#security-definer-vs-invoker)

---

### Cause 2: Ignoring capitalization and other typos

The table could be defined as: CREATE TABLE “Hello”`. The double quotes make it case-sensitive, so it becomes essential to call the table with the appropriate title. It is possible to change the table name to be lowercase for convenience, either in the Table Editor, or with raw SQL:

```sql
alter table "Table_name"
rename to table_name;
```

---

### Cause 3: Table or function actually does not exist

One may have never made the table or dropped it deliberately or accidentally. This can be quickly checked with the following query:

```sql
-- For tables
SELECT * FROM information_schema.tables
WHERE table_name ILIKE 'example_table'; --<------ Add relevant table name
```

```sql
-- For functions
select
  p.proname as function_name,
  n.nspname as schema_name,
  pg_get_functiondef(p.oid) as function_definition
from
  pg_proc as p
  join pg_namespace as n on p.pronamespace = n.oid
where n.nspname in ('public', 'your custom schema') -- <------ Add other relevant schemas
order by n.nspname, p.proname;
```

---
