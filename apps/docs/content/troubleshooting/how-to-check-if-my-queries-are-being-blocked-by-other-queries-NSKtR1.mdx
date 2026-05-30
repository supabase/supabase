---
title = "How to check if my queries are being blocked by other queries?"
github_url = "https://github.com/orgs/supabase/discussions/19681"
date_created = "2023-12-13T15:56:12+00:00"
topics = [ "database" ]
database_id = "990ed738-2e00-42ce-9892-77c16f870cdc"
---

## You can set a lock monitor view to help investigate these.

Once you run the query that takes a long time to complete, you can go in the dashboard (or select from this view below) to check what are the blocks.

```sql
create view
  public.lock_monitor as
select
  coalesce(
    blockingl.relation::regclass::text,
    blockingl.locktype
  ) as locked_item,
  now() - blockeda.query_start as waiting_duration,
  blockeda.pid as blocked_pid,
  blockeda.query as blocked_query,
  blockedl.mode as blocked_mode,
  blockinga.pid as blocking_pid,
  blockinga.query as blocking_query,
  blockingl.mode as blocking_mode
from
  pg_locks blockedl
  join pg_stat_activity blockeda on blockedl.pid = blockeda.pid
  join pg_locks blockingl on (
    blockingl.transactionid = blockedl.transactionid
    or blockingl.relation = blockedl.relation
    and blockingl.locktype = blockedl.locktype
  )
  and blockedl.pid <> blockingl.pid
  join pg_stat_activity blockinga on blockingl.pid = blockinga.pid
  and blockinga.datid = blockeda.datid
where
  not blockedl.granted
  and blockinga.datname = current_database();
```
