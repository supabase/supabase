---
title = "Storage error: 403 Forbidden: 'new row violates row-level security policy' on upload"
date_created = "2026-06-19T09:05:11+00:00"
topics = [ "auth", "database", "storage" ]
keywords = []
[[errors]]
http_status_code = 403
message = "Forbidden"

---

If you are observing a 403 Forbidden error with the message 'new row violates row-level security policy' when uploading files, it typically indicates that the database cannot return the metadata for the newly created object. This can happen even if your INSERT policies are correctly defined and the user's JWT is valid.

**Why Does This Happen?**
The Supabase Storage API executes an `INSERT` operation followed by a `RETURNING *` clause to provide object details back to the client. If a **SELECT** RLS policy is missing or does not cover the object being uploaded, the database is unable to return the row metadata. This results in a policy violation that causes the entire transaction to fail.

**How to Resolve:**
Add a **SELECT** RLS policy to the `example_schema.example_table` (specifically `storage.objects`) that mirrors your `INSERT` requirements. Ensure the policy allows the authenticated user to read the record they are currently creating.

- For example, if your INSERT policy is restricted to `auth.uid()`, your SELECT policy must also permit access based on `auth.uid()` or the specific bucket and path.

You can manage your RLS policies via the [Dashboard](/dashboard/project/_/auth/policies) or the [SQL editor](/dashboard/project/_/sql/new).
