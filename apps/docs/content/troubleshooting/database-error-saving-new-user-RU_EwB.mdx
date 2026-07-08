---
title = "Database error saving new user"
github_url = "https://github.com/orgs/supabase/discussions/13043"
date_created = "2023-03-16T04:52:50+00:00"
topics = [ "auth", "studio" ]
keywords = [ "users" ]
database_id = "5d1c44ed-b2f6-4509-9312-1eeb8838e701"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Database error saving new user"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Database error creating new user"
---

You generally get this error when trying to invite a new user from the dashboard or when trying to insert a user into a table using the table editor in the Supabase dashboard. You may also see this error in logs in connection to failed signups.

This error is normally associated with a side effect of a database transaction.

**Common causes of this error:**

- You have a trigger/trigger function setup on the `auth.users` table that has an error
- You have added a constraint on the `auth.users` table which isn't being met
- You are using Prisma and it has broken all the permissions on the `auth.users` table

## Debugging this error:

**Step 1: Check the Auth logs**

Start in the [Auth logs explorer](/dashboard/project/_/logs/auth-logs) in your project dashboard. The logs surface the specific error message and give you the most direct signal about what went wrong.

**Step 2: Check the Postgres logs**

If the Auth logs point to a database-level issue, open the [Postgres logs explorer](/dashboard/project/_/logs/postgres-logs) to look for corresponding errors.

---

## Common errors

### NULL value in auth schema column

**Example Auth log error:**

```
500: Database error querying schema
error finding user: sql: Scan error on column index 8, name "confirmation_token": converting NULL to string is unsupported
```

**Cause:**

The `auth` schema is managed by Supabase and expects specific column formats. This error typically happens when users are inserted directly via SQL or using an AI tool that uses a direct SQL `INSERT`, rather than through the [Auth API](/docs/reference/javascript/auth-api). A direct insert can leave required columns as `NULL` when the Auth service expects an empty string.

**Fix:**

Run the following in the [SQL editor](/dashboard/project/_/sql), replacing `confirmation_token` with whichever column appears in your error message:

```sql
update auth.users
set confirmation_token = ''
where confirmation_token is null;
```

This sets all `NULL` values in that column to an empty string, which is what the Auth service expects.

---

### Relation does not exist

**Example Auth log error:**

```
failed to close prepared statement: ERROR: current transaction is aborted, commands ignored until end of transaction block (SQLSTATE 25P02): ERROR: relation "profiles" does not exist (SQLSTATE 42P01)
```

**Example Postgres log error:**

```
event_message: "relation "profiles" does not exist"
context: "PL/pgSQL function public.handle_new_user() line 3 at SQL statement"
```

**Cause:**

A trigger on `auth.users` is calling a function (in this case `handle_new_user`) that tries to insert into a table that does not exist. This is common when a `profiles` table is referenced in a trigger function but was never created, or was accidentally dropped.

**Fix:**

1. Check whether the missing table should exist in your `public` schema. If it should, create the table for the trigger to succeed and the error should resolve.

2. If the table is not needed, review the function definition and update or remove the reference. You can view and edit your database functions from the [Database Functions](/dashboard/project/_/database/functions) page in the dashboard.
