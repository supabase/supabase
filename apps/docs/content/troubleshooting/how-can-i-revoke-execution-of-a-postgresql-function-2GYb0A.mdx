---
title = "How can I revoke execution of a Postgres function?"
github_url = "https://github.com/orgs/supabase/discussions/17606"
date_created = "2023-09-21T03:04:41+00:00"
topics = [ "database", "functions" ]
keywords = [ "functions", "permissions" ]
database_id = "b7edb30b-beee-40ae-9b4f-666ef6411bb6"

[[errors]]
message = "ERROR: permission denied for function foo"
---

All functions access is PUBLIC by default, this means that any role can execute it. To revoke execution, there are 2 steps required:

- Revoke function execution (`foo` in this case) from PUBLIC:

```sql
revoke execute on function foo from public;
```

- Revoke execution from a particular role (`anon` in this case):

```sql
revoke execute on function foo from anon;
```

Now `anon` should get an error when trying to execute the function:

```sql
begin;
set local role anon;
select foo();
ERROR:  permission denied for function foo
```
