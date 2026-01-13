---
title = "Errors when creating / updating / deleting users"
github_url = "https://github.com/orgs/supabase/discussions/21247"
date_created = "2024-02-14T04:26:37+00:00"
topics = [ "auth", "database", "studio" ]
keywords = [ "users" ]
database_id = "c5d8260b-c17a-4f6c-ab20-801f953f6c94"

[api]
sdk = [ "auth-signup" ]

[[errors]]
message = "Failed to send magic link: failed to make magiclink request: Error sending magic link"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Database error saving new user"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Failed to create user"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Database error creating new user"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Failed to delete user"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Database error deleting user"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Error updating user"

[[errors]]
http_status_code = 500
code = "unexpected_failure"
message = "Database error updating user"

---

These error are normal a side effect of issues in your custom user management logic. This can cause errors that return HTTP `500` status codes with a of code `unexpected_failure` and one of the following error messages

- Failed to create user: Database error creating new user
- Failed to update user: Error updating user
- Failed to delete user: Database error deleting user
- Database error updating user
- Database error saving new user

## Debugging this error

- [Auth logs](/dashboard/project/_/logs/auth-logs): as the error relates to [Auth](/docs/guides/auth) users
- [Postgres logs](/dashboard/project/_/logs/postgres-logs): for raw error logs related to database

## Common causes of this error:

- Trigger/trigger function setup on the `auth.users` table
- A constraint on the `auth.users` table which isn't being met
- You are using Prisma and it has broken all the permissions on the `auth.users` table

## Example error messages

Use the hints provided in the error message to fix issues in your custom user management logic.

**Trigger/trigger function related error messages** - [Solution for trigger related issues](/docs/guides/troubleshooting/dashboard-errors-when-managing-users-N1ls4A#solution-for-trigger-related-issues)

```
"error":"error update user`s last_sign_in field: ERROR: permission denied for table profiles (SQLSTATE 42501)"
```

**Constraint related error message** - [Solution for constraint related issues](/docs/guides/troubleshooting/dashboard-errors-when-managing-users-N1ls4A#solution-for-constraint-related-issues)

```
ERROR:  23503: update or delete on table "users" violates foreign key constraint "profiles_id_fkey" on table "profiles"
DETAIL:  Key (id)=(7428a53c-75b7-4531-9ae9-1567d9c4ac0a) is still referenced from table "profiles".
```

**Missing column**

```
ERROR: column \"updated_at\" of relation \"profiles\" does not exist (SQLSTATE 42703)
```

**Broken search path / incorrect name** - [42P01 related solution](/docs/guides/troubleshooting/resolving-42p01-relation-does-not-exist-error-W4_9-V)

```
failed to close prepared statement: ERROR: current transaction is aborted, commands ignored until end of transaction block (SQLSTATE 25P02): ERROR: relation \"public.profiles\" does not exist (SQLSTATE 42P01)
```

---

## Solution for constraint related issues

- Check for foreign/primary key relationship between the `auth.users` table and another table
- Then ALTER the [behavior](https://stackoverflow.com/questions/5383612/setting-up-table-relations-what-do-cascade-set-null-and-restrict-do) of the relationship and recreate it with a less [restrictive constraint](https://stackoverflow.com/questions/3359329/how-to-change-the-foreign-key-referential-action-behavior).
- If this is related to deleting records, review the [Cascade Deletes doc](/docs/guides/database/postgres/cascade-deletes) for possible approaches (e.g. using `CASCADE` / `SET NULL`)

---

## Solution for trigger related issues

Supabase Auth uses your project's database to store user data. It relies on the `auth` schema, and Supabase restricts access to the `auth` schema to prevent unintended custom changes that could break the functionality of the Auth service.

Check if the `auth` schema contains any triggers in the [Dashboard's trigger section](/dashboard/project/_/database/triggers?schema=auth).

1. Identify related functions using `security invoker` from the [Dashboard's function section](/dashboard/project/_/database/functions)
2. Remove all triggers by dropping their functions with a CASCADE modifier shown below (This command still works because the `postgres` role has the ownership of the function, and the `CASCADE` clause will drop the trigger indirectly.)

```sql
DROP FUNCTION <function name>() CASCADE;

-- If you'd prefer, you can drop the trigger alone with the following query:
-- DROP TRIGGER <trigger_name> on auth.<table_name>;
```

3. Recreate the functions with a [security definer](/docs/guides/database/functions#security-definer-vs-invoker) modifier
4. Recreate the triggers

**Example function and trigger using security definer**
The [SQL Editor](/dashboard/project/_/sql/) contains a template for [User Management](/dashboard/project/_/sql/quickstarts). Within it, there is a working example of how to setup triggers with security definer that may be worth referencing:

```sql
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

create function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Explanation

One of the most common design patterns in Supabase is to add a trigger to the `auth.users` table. The database role managing authentication (`supabase_auth_admin`) only has the necessary permissions it needs to perform its duties. So, when a trigger operated by the `supabase_auth_admin` interacts outside the auth schema, it causes a permission error.

A security definer function retains the privileges of the database user that created it. As long as it is the `postgres` role, your auth triggers should be able to engage with outside tables.
