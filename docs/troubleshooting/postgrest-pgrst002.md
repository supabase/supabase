# Troubleshooting PostgREST PGRST002 Error

## Overview

The PGRST002 error ("Could not query the database for the schema cache") occurs when PostgREST cannot load its schema cache from the PostgreSQL database. This prevents the REST API from functioning.

## Symptoms

- HTTP 503 responses from `/rest/v1/` endpoints
- Error message: `{"message":"Could not query the database for the schema cache","code":"PGRST002"}`
- All REST API calls fail, including the root introspection endpoint
- Direct SQL queries via the dashboard still work normally

## Common Causes

1. **Missing authenticator role permissions** - The `authenticator` role lacks USAGE on schemas or SELECT on tables
2. **Stuck advisory locks** - Database locks blocking PostgREST's schema cache queries
3. **Stuck replication slots** - Logical replication slots holding WAL and blocking operations
4. **Database connection issues** - PostgREST cannot connect to the database
5. **Schema cache corruption** - The in-memory schema cache becomes corrupted

## Automated Diagnosis

Use the built-in PostgREST Health tool in the Infrastructure settings page:

1. Navigate to **Project Settings → Infrastructure**
2. Click **Check Health** in the PostgREST Health section
3. Review the diagnostic results and follow the recommendations

## Manual Diagnosis

Run these SQL queries in the SQL Editor to diagnose the issue:

### Check PostgREST Health Status

```sql
SELECT public.get_postgrest_health();
```

This returns a comprehensive health report including:
- Authenticator role existence and permissions
- Schema cache status
- Stuck replication slots
- Specific issues and recommendations

### Check Schema Cache Status

```sql
SELECT public.check_postgrest_schema_cache();
```

### Check for Stuck Replication Slots

```sql
SELECT public.check_stuck_replication_slots();
```

## Solutions

### 1. Grant PostgREST Permissions

If the diagnostic shows missing permissions:

```sql
SELECT public.grant_postgrest_permissions();
```

This function:
- Creates the `authenticator` role if it doesn't exist
- Grants USAGE on all non-system schemas
- Grants SELECT on all tables in public schema
- Grants access to information_schema and pg_catalog

### 2. Force Schema Cache Reload

```sql
SELECT public.force_postgrest_schema_reload();
```

Or manually:

```sql
NOTIFY pgrst, 'reload schema';
```

### 3. Clean Stuck Replication Slots

If stuck replication slots are detected:

```sql
-- List all replication slots
SELECT slot_name, active, restart_lsn 
FROM pg_replication_slots;

-- Drop inactive slots (be careful!)
SELECT pg_drop_replication_slot('slot_name');
```

### 4. Restart PostgREST Service

From the dashboard:
1. Go to **Project Settings → Infrastructure**
2. Use the **Restart PostgREST** button

Or via the API:

```bash
curl -X POST https://api.supabase.com/platform/projects/{ref}/restart-services \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "restartRequest": {
      "region": "your-region",
      "services": ["postgrest"]
    }
  }'
```

### 5. Check Database Connections

Verify PostgREST can connect to the database:

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check for connection limits
SHOW max_connections;
```

## Prevention

### Monitor Schema Permissions

Regularly verify the `authenticator` role has proper permissions:

```sql
-- Check schema USAGE
SELECT * FROM information_schema.schema_privileges 
WHERE grantee = 'authenticator';

-- Check table SELECT
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'authenticator' AND table_schema = 'public';
```

### Monitor Replication Slots

Check for stuck replication slots periodically:

```sql
SELECT slot_name, active, restart_lsn, confirmed_flush_lsn
FROM pg_replication_slots
WHERE active = false;
```

### Set Appropriate Timeouts

Configure database timeouts to prevent stuck queries:

```sql
-- In your PostgreSQL configuration
ALTER DATABASE your_db SET statement_timeout = '30s';
ALTER DATABASE your_db SET lock_timeout = '10s';
```

## Advanced Troubleshooting

### Check PostgREST Logs

If you have access to the infrastructure, check PostgREST logs:

```bash
docker logs supabase-rest --tail 100
```

Look for:
- Connection errors
- Permission denied messages
- Lock timeout errors
- Schema loading failures

### Verify Database Objects

Ensure required system catalogs are accessible:

```sql
-- Check information_schema access
SELECT * FROM information_schema.schemata LIMIT 1;

-- Check pg_catalog access  
SELECT * FROM pg_catalog.pg_tables LIMIT 1;

-- Check table definitions
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' LIMIT 1;
```

### Check for Long-Running Transactions

Long-running transactions can hold locks:

```sql
SELECT pid, now() - pg_stat_activity.xact_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

## When to Contact Support

Contact Supabase support if:

1. The issue persists after trying all solutions above
2. You need infrastructure-level PostgREST restart
3. You suspect a platform-wide issue
4. The problem recurs frequently despite fixes

Provide:
- Project reference (`ref`)
- Region
- Steps already taken
- Diagnostic output from `get_postgrest_health()`
- Any relevant error messages

## Related Issues

- [#46237](https://github.com/supabase/supabase/issues/46237) - Persistent PGRST002 on specific projects
- [#46225](https://github.com/supabase/supabase/issues/46225) - Intermittent PGRST002 errors

## Additional Resources

- [PostgREST Documentation](https://postgrest.org/en/stable/)
- [Supabase API Documentation](https://supabase.com/docs/guides/api)
- [Database Permissions Guide](https://supabase.com/docs/guides/database/postgres/roles)