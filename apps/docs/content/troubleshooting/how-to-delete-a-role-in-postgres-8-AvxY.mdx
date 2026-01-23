---
title = "How to delete a role in Postgres"
github_url = "https://github.com/orgs/supabase/discussions/27427"
date_created = "2024-06-20T19:21:11+00:00"
topics = [ "database" ]
keywords = [ "role", "delete", "postgres" ]
database_id = "085d7649-0b5d-4c3c-b6a1-f2da4b9f33dd"

[[errors]]
message = "a role cannot be removed while it is still referenced in any database of the cluster"
---

[Quote from Postgres docs:](https://www.postgresql.org/docs/current/sql-droprole.html#:~:text=A%20role%20cannot%20be%20removed,been%20granted%20on%20other%20objects.)

> A role cannot be removed if it is still referenced in any database of the cluster; an error will be raised if so. Before dropping the role, you must drop all the objects it owns (or reassign their ownership) and revoke any privileges the role has been granted on other objects.

First make sure that Postgres has ownership over the role:

```sql
GRANT <role> TO "postgres";
```

Then you must reassign any objects owned by role:

```sql
REASSIGN OWNED BY <role> TO postgres;
```

Once ownership is transferred, you can run the following query:

```sql
DROP OWNED BY <role>;
```

[DROP OWNED BY](https://www.postgresql.org/docs/current/sql-drop-owned.html) does delete all objects owned by the role, which should be none. However, it also revokes the role's privileges. Once this is done, you should be able to run:

```sql
DROP role <role>;
```

If you encounter any issues, create a [support ticket](/dashboard/support/new)
