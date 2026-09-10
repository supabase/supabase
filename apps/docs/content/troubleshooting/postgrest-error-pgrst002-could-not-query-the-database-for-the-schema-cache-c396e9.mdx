---
title = "PostgREST error: {PGRST002: Could not query the database for the schema cache}"
date_created = "2026-05-19T10:04:53+00:00"
topics = [ "database" ]
keywords = [ "postgrest" ]
[[errors]]
code = "PGRST002"
message = "Could not query the database for the schema cache"

---

A schema should first be removed from the **Exposed schemas** in Data API settings before dropping it from the database.

If you encounter a `PGRST002` error when making API requests, it can be that a schema still listed in the Data API configuration has been dropped from the database. PostgREST cannot build the schema cache if any schema defined in its `db_schemas` setting is missing.

**How to resolve this issue:**

1. Temporarily recreate the deleted schema to restore API connectivity.
2. Navigate to [Project Settings > Data API](/dashboard/project/_/settings/api).
3. Remove the target schema from the **Exposed Schemas** list and click **Save**.
4. Once the settings are saved, you can safely drop the schema from the database.

**Manual Overrides**

If you have manually executed `ALTER ROLE authenticator SET pgrst.db_schemas`, the Dashboard UI will no longer manage your schemas. You must manually update the role configuration:

```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, example_schema';
NOTIFY pgrst, 'reload config';
```
