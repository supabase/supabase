---
title = "Failed to retrieve tables"
topics = [ "database", "studio" ]
keywords = [ "failed to retrieve tables", "connection timeout", "522", "525" ]
database_id = "095da77f-b97f-455c-88d1-b6a0341452b1"

[[errors]]
message = "Failed to retrieve tables"
---

First, you can verify if this is isolated to your project or if it's a platform issue by viewing our [status page](https://status.supabase.com/).

If there are no issues, then it's likely a problem with your project.

This error occurs when the Studio (dashboard) is unable to retrieve the tables from the database. Generally, this is because the database is in a crashed state, which usually happens due to an out of memory error.
Trying to run a SQL query will often result in a timeout error like this:

```
 connection terminated due to query timeout
```

Trying to connect to the project via the API will often result in a 522 or 525 response code.

## Why this happens

Out of memory errors usually happen because of a sudden spike in database activity, or a sustained high level of activity, either due to a high volume of queries or very complex queries (or a combination of both).

Note that Nano, Micro, Small and Medium compute instances have 30 minutes of burst capacity on a daily basis so may be able to handle sustained high activity for a short period of time,
but not sudden spikes.

## Next steps and preventative measures

First:

- Immediately stop any ongoing queries to the database.
- Restart the instance from the project settings in the dashboard once you are confident there are no large ongoing queries (if there are, it may crash again). You can do that on [this page](/dashboard/project/_/settings/general). If it crashes again, re-review the logs to understand what may be causing the issue.

Once you are confident there will not be a crash loop, you can review the following steps:

- If this was intentional activity (often it's a case of uploading, or reading, a lot of test data), and it needs to be done again, batch requests into smaller chunks and reduce concurrency, and implementation pagination for select queries. Check out our [query optimisation docs](/docs/guides/database/query-optimization) for more information around general ideas here.
- If it was unintentional, double check for any recursive calls in your application code, edge functions or database functions.
- Consider your table and your query structure - if your tables are very "wide" (lots of columns) or have complicated data types within them, it may be worth revisiting your architecture.
- Continue to monitor your project's [query performance tab](/dashboard/project/_/observability/query-performance) and [enable index advisor](/docs/guides/database/extensions/index_advisor) if you haven't already - especially if there are a lot of select queries.
- If after monitoring your changes you still do not notice improvements, consider upgrading compute if you think this level of activity is going to be regular. It will give you more memory overhead to process tasks like this. You can view all compute offerings [here](/dashboard/project/_/settings/compute-and-disk).

If you want to effectively monitor your project's performance minute by minute, you can use the [Metrics API](/docs/guides/telemetry/metrics).
