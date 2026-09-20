---
title = "Auth error: '500: Database error querying schema'"
date_created = "2026-07-02T20:04:03+00:00"
topics = [ "auth", "database" ]
keywords = []
[[errors]]
http_status_code = 500
message = "Database error querying schema"

---

If you observe the error message `500: Database error querying schema` in your Auth logs, it typically indicates that the Supabase Auth server has encountered `NULL` values in the `auth.users` table where a valid string or empty string is expected.

**Why Does This Happen?**
This issue usually occurs following manual SQL inserts or updates to the `auth.users` table. The Auth service expects specific columns to contain data or an empty string; when it encounters a `NULL` value instead, it triggers a validation error.

**How to Resolve This:**
Identify the column containing the `NULL` values (such as `email`) and execute the following command in the [SQL Editor](/dashboard/project/_/sql/new) to convert them to empty strings:

```sql
UPDATE auth.users
SET <column_name> = ''
WHERE <column_name> IS NULL;
```

Replace `<column_name>` with the specific column causing the error. To prevent this from recurring, ensure that any future manual modifications to the `auth` schema adhere to the service's requirements.
