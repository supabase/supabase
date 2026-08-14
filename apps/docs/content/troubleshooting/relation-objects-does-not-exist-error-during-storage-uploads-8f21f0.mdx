---
title = "Postgres error 'relation objects does not exist' during Storage uploads"
date_created = "2026-06-10T15:05:10+00:00"
topics = [ "auth", "database", "storage" ]
keywords = []
[[errors]]
code = "42P01"
message = "relation 'objects' does not exist"

[[errors]]
http_status_code = 500
message = "Internal Server Error"
---

If authenticated users receive a `500 Internal Server Error` during file uploads and your database logs report `error: relation "objects" does not exist`, it typically indicates the database cannot locate the required internal storage tables.

**Why Does This Happen?**
This error occurs when the `authenticated` role's `search_path` does not include the `storage` schema. Because the schema is missing from the path, the database fails to find the `objects` table (which resides in `storage.objects`) during the upload process.

**How to Fix:**
You can resolve this by updating the role configuration via the [SQL Editor](/dashboard/project/_/sql/new):

1. Execute the following command to append the storage schema to the role's search path:
   `ALTER ROLE authenticated SET search_path = public, storage;`
2. Verify that uploads from authenticated users now succeed.

**Best Practices:**

- To maintain compatibility with default schema permissions, avoid creating custom Postgres roles for application users.
- Instead, use custom claims within `auth.users.raw_app_meta_data` to manage user-specific logic or permissions.
