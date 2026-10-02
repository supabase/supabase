---
title = "RLS policy causes infinite recursion"
date_created = "2026-06-29T03:04:33+00:00"
topics = [ "database", "storage" ]
keywords = ["infinite recursion", "RLS"]
---

If your Storage or database requests encounter an error and the corresponding Postgres logs show '_infinite recursion detected in policy for relation "table_name"_', it is because of infinite recursion in your Row-Level Security (RLS) policies.

**Why Does This Happen?**

This error indicates a circular dependency between RLS policies. It occurs when an RLS policy queries a table with RLS enabled, and that table's policies end up triggering the original policy again.

This can happen when:

- A policy queries the same table.
- A policy queries another table whose RLS policies eventually reference the original table, creating a circular dependency.

Postgres detects the recursive policy evaluation and terminates the query to prevent infinite recursion. This error can also occur during Storage operations if a Storage RLS policy references a table with self-referencing or mutually recursive RLS policies.

**How to Resolve This Issue:**

Option 1: Update the table's RLS policies to ensure they do not directly or indirectly create a circular dependency.

Option 2: Wrap the permission check in a SECURITY DEFINER function. This executes with the privileges of the user who created the function — if created with a role like postgres, it bypasses RLS on the target table and breaks the recursion. See [Use Security Definer Functions](/docs/guides/database/postgres/row-level-security#use-security-definer-functions) for details.
