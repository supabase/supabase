---
title = "FDW Wrappers error: 'component verification failed'"
date_created = "2026-06-09T16:04:36+00:00"
topics = [ "platform" ]
keywords = []
[[errors]]
code = "HV000"
message = "guest fdw error: component verification failed"

---

If you are observing an `ERROR: HV000: guest fdw error: component verification failed` when querying a wrapper foreign tables, it indicates that the configured Wasm package metadata does not match the downloaded component. As a security measure, the Wrappers extension blocks the module when this mismatch occurs.

To resolve this, update your foreign server configuration to use the correct package version and checksum. Details depend on the exact Wrapper and can be found here: https://fdw.dev/catalog/wasm/

**How to fix the configuration:**
Run the following SQL via the [SQL Editor](/dashboard/project/_/sql/new):

```sql
ALTER SERVER example_server OPTIONS (
  SET fdw_package_url '[THE_CORRECT_URL]',
  SET fdw_package_version '[THE_CORRECT_VERSION]',
  SET fdw_package_checksum '[INTERNAL_ID]'
);
```

**Verify the update:**
You can confirm the update by inspecting the server options:

```sql
select srvname, unnest(srvoptions) as option
from pg_foreign_server
where srvname = 'example_server';
```

Test the connection by querying your foreign table:

```sql
select * from example_table limit 1;
```
