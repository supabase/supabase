---
title = "Interpreting Supabase Grafana IO charts"
github_url = "https://github.com/orgs/supabase/discussions/27003"
date_created = "2024-06-04T15:32:14+00:00"
topics = [ "database", "platform" ]
keywords = [ "io", "disk", "database", "grafana" ]
database_id = "0056cd40-df04-4045-bbfb-c245cb15b85d"
---

> [Supabase Grafana Installation Guide](/docs/guides/platform/metrics#deploying-supabase-grafana)

There are two primary values that matter for IO:

- **Disk Throughput**: how much data can be moved to and from disk per second
- **IOPS(Input/Output per second)**: how many read/write requests can be performed against your disk per second

Each compute instance has unique IO settings. The current baseline (sustained) and max (burst) limits are listed below.

<ComputeDiskLimitsTable />

Compute sizes below XL can burst above baseline for short periods before returning back to their baseline behavior.

There are other metrics that indicate IO strain.

This example shows a 16XL database exhibiting severe IO strain:

![image](/docs/img/troubleshooting/9c6e0f9c-f842-463b-b214-1a9e31de3b2c.png)

Its Disk IOPS is constantly near peak capacity:

![image](/docs/img/troubleshooting/ec5ed538-985b-411d-a0d7-be718b28d367.png)

Its throughput is also high:

![image](/docs/img/troubleshooting/90cb6a70-fc67-4666-9217-6fa37cfacf82.png)

As a side-effect, its CPU is encumbered by heavy Busy IOWait activity:

![image](/docs/img/troubleshooting/9b88a738-65d6-4be4-8fa0-bc3f13a9a408.png)

Excessive IO usage is highly problematic as it clarifies that your database is expending more IO than it normally is intended to manage. This can be caused by

- **Excessive and needless sequential scans:** poorly indexed tables force requests to scan disk ([guide to resolve](https://github.com/orgs/supabase/discussions/22449))
- **Too little cache**: There is not enough memory, so instead of reading data from the memory cache, it is accessed from disk ([guide to inspect](https://github.com/orgs/supabase/discussions/22449))
- **Poorly optimized RLS policies**: RLS that rely heavily on joins are more likely to hit disk. If possible, they should optimized ([RLS best practice guide](/docs/guides/database/postgres/row-level-security#rls-performance-recommendations))
- **Excessive bloat**: This is the least likely to cause major issues, but bloat can take up space, preventing data on disk from being placed in the same locality. This can force the database to scan more pages than necessary. ([explainer guide](/blog/postgres-bloat))
- **Uploading high amounts of data:** temporarily increase compute add-on size for the duration of the uploads
- **Insufficient memory**: Sometimes an inadequate amount of memory forces queries to hit disk instead of the memory cache. Address memory issues ([guide](https://github.com/orgs/supabase/discussions/27021)) can reduce disk strain.

If a database exhibited some of these metrics for prolonged periods, then there are a few primary approaches:

- Scale the database to get more IO if possible
- Optimize queries/tables or refactor database/app to reduce IO
- Spin-up a [read-replica](/dashboard/project/_/settings/infrastructure)
- Modify IO configs in the [Compute and Disk settings](/dashboard/project/_/settings/compute-and-disk)
- [Partitions](/docs/guides/database/partitions): Generally should be used on very large tables to minimize data pulled from disk

Other useful Supabase Grafana guides:

- [Connections](https://github.com/orgs/supabase/discussions/27141)
- [Memory](https://github.com/orgs/supabase/discussions/27021)
- [CPU](https://github.com/orgs/supabase/discussions/27022)

### Esoteric factors

**Webhooks**:
Supabase webhooks use the pg_net extension to handle requests. The `net.http_request_queue` table isn't indexed to keep write costs low. However, if you upload millions of rows to a webhook-enabled table too quickly, it can significantly increase the read costs for the extension.

To check if reads are becoming expensive, run:

```sql
select count(*) as exact_count from net.http_request_queue;
-- the number should be relatively low <20,000
```

If you encounter this issue, you can either:

1. Increase your compute size to help handle the large volume of requests.

2. Truncate the table to clear the queue:

```sql
TRUNCATE net.http_request_queue;
```
