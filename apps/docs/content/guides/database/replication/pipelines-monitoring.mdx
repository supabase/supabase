---
id: 'pipelines-monitoring'
title: 'Monitor pipeline status'
description: 'Monitor the status and health of pipelines created with Supabase Pipelines.'
subtitle: 'Track replication status, view logs, and troubleshoot issues.'
sidebar_label: 'Monitoring'
---

<$Partial path="pipelines-public-alpha.mdx" />

After setting up Supabase Pipelines, you can monitor the status and health of your pipelines directly from the Dashboard. A pipeline first performs an initial sync of existing rows, then uses ongoing replication (CDC) to send subsequent database changes to your destination.

### Viewing pipeline status

To monitor your pipelines:

1. Navigate to the [**Database > Replication**](/dashboard/project/_/database/replication) section of the Dashboard
2. You'll see a list of all your destinations with their pipeline status

#### Pipeline states

Each destination shows its pipeline in one of these states:

| State          | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| **Stopped**    | Pipeline is not running                                                         |
| **Starting**   | Pipeline is being started                                                       |
| **Running**    | Pipeline is actively replicating data                                           |
| **Stopping**   | Pipeline is being stopped                                                       |
| **Restarting** | Pipeline settings or table state are being applied before replication restarts  |
| **Failed**     | Pipeline has encountered an error (hover over the status to view error details) |
| **Unknown**    | The Dashboard can't currently determine the pipeline status                     |

### Viewing detailed pipeline metrics

For detailed information about a specific pipeline, click **View pipeline** on the destination. This opens the pipeline status page where you can monitor replication performance and table states.

<Image
  alt="Running pipeline status page showing replication metrics and a live table"
  caption="Use the pipeline status page to check replication lag, WAL retention remaining, connection health, and table states."
  src="/docs/img/database/replication/pipelines-metrics.png"
  width={5080}
  height={2716}
  zoomable
/>

#### Replication lag metrics

The status page shows replication lag metrics that help you determine how far the pipeline is behind Postgres. These metrics are loaded directly from Postgres replication slot state.

The destinations list also shows a compact lag value. This value is byte-based: it shows how much WAL the pipeline has not confirmed as flushed yet. A value of **Caught up** means the pipeline has confirmed every change currently available for its slot.

The detailed status page shows:

| Metric                      | What it means                                                                                                                                    | What to watch for                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Waiting to sync**         | Bytes of WAL between the pipeline's confirmed flush position and the current Postgres WAL position. This is the main byte-based replication lag. | A value that keeps growing means the pipeline is receiving changes more slowly than Postgres produces them.                                                     |
| **WAL retention remaining** | How much WAL can still accumulate before the replication slot is at risk of becoming unusable. This is controlled by `max_slot_wal_keep_size`.   | A small or shrinking value means you should investigate before required WAL is removed. `Unlimited` means Postgres is not reporting a slot WAL retention limit. |
| **Last check-in**           | How long it has been since the pipeline last sent replication feedback to Postgres.                                                              | An old value can mean the pipeline is stopped, disconnected, overloaded, or unable to make progress.                                                            |
| **Connected**               | Whether the pipeline's replication slot is active and currently being used.                                                                      | `Not connected` while the pipeline should be running usually means you should check pipeline status and logs.                                                   |
| **Slot status**             | How safely Postgres is keeping the WAL files the pipeline still needs.                                                                           | `Unreserved` and `Lost` require action. See [Slot statuses](#slot-statuses).                                                                                    |

Pipelines uses one main pipeline replication slot for ongoing replication. During the initial sync, it can also create temporary table-sync replication slots. These temporary slots let multiple tables sync in parallel, make large initial syncs faster, and allow individual tables to be retried without restarting the whole pipeline.

Temporary table-sync slots show the same kind of lag and slot health metrics while they are active. After a table finishes its initial sync and catches up, its temporary slot is removed and ongoing replication continues through the main pipeline slot. For overall replication health, focus first on the main pipeline slot.

#### Slot statuses

Replication slot status tells you whether Postgres is still retaining the WAL that the pipeline needs to continue from its current position.

| Status         | Meaning                                                                                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reserved**   | Healthy. Postgres is keeping the WAL files this pipeline's replication slot needs, and they are within the normal WAL size limit.                                                                                                                                            |
| **Extended**   | Healthy, but growing. The slot is holding on to more WAL than usual, but Postgres is still keeping everything the pipeline needs.                                                                                                                                            |
| **Unreserved** | At risk. Postgres is no longer reserving all WAL files this pipeline's replication slot needs. If the pipeline does not catch up soon, those files may be removed.                                                                                                           |
| **Lost**       | Broken. Some WAL files this pipeline's replication slot needs have already been removed. The pipeline can no longer continue from this slot. Recreate the pipeline, or set **Invalidated slot behavior** to **Recreate** in the pipeline's advanced settings and restart it. |
| **Unknown**    | Postgres reported an unknown or unavailable state for this pipeline's replication slot.                                                                                                                                                                                      |

#### Table states

The pipeline status page also shows the state of individual tables being replicated. Each table can be in one of these states:

| State             | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| **Queued**        | Table is waiting for the pipeline to begin its initial sync              |
| **Copying**       | Existing rows are being copied during the initial sync                   |
| **Copied**        | Initial sync is complete and the table is preparing to replicate changes |
| **Live**          | Table is now receiving ongoing replication                               |
| **Error**         | Table has experienced an error during replication                        |
| **Restarting**    | The table's initial sync is being restarted                              |
| **Not Available** | Table state is temporarily unavailable while the pipeline changes state  |
| **Unknown**       | The Dashboard received a table state it doesn't recognize                |

### Dealing with replication lag

Replication lag means the pipeline is behind the source database. Some lag is expected during the initial sync, after a burst of writes, or after restarting a stopped pipeline. Lag becomes a problem when it keeps increasing, when **WAL retention remaining** is running low, or when the slot status moves to **Unreserved** or **Lost**.

Lag can come from several places:

- **Destination throughput**: The destination is slow, rate-limited, unavailable, or rejecting writes.
- **Pipeline throughput**: The pipeline is overloaded, processing a very large transaction, or not performing as expected for the project workload.
- **Source database activity**: Postgres is producing WAL faster than the pipeline can consume it, often during bulk writes, migrations, or backfill jobs.
- **Network latency**: Latency or instability between the pipeline and source database can slow down WAL streaming.
- **Stopped or disconnected pipeline**: When a pipeline is stopped, disconnected, or failed, Postgres keeps WAL for the slot until the retention limit is reached.
- **Slow initial sync**: A temporary table-sync slot can fall behind if existing rows are copied more slowly than new changes are written to that table.

#### Initial sync and table-sync slots

A common initial sync issue happens when a large or busy table is still in **Copying** while new rows keep being inserted or updated. The temporary table-sync slot retains changes that happen during the initial sync. If copying is too slow compared to the table's write rate, the slot can move to **Unreserved** and then **Lost** if Postgres removes changes the sync still needs.

When a table-sync slot is lost, the affected table needs to run its initial sync again. Tune the copy settings, then retry the table:

- Increase **Copy connections per table** when one large table is the bottleneck. This lets the pipeline copy chunks of that table over multiple source connections, up to the point where the source database, network, or destination becomes the limit.
- Increase **Table sync workers** when several tables need to copy at the same time. Each worker can copy one table, and each worker uses an additional temporary replication slot during initial sync.
- If possible, run the initial sync during a quieter write period or reduce bulk writes until the table reaches **Live**.

After the affected table finishes copying and catches up, the temporary slot is deleted. The table then continues through the main pipeline replication slot.

#### Investigate the lag

1. Open [**Database > Replication**](/dashboard/project/_/database/replication) and check the destination's lag column.
2. Click **View pipeline** and check **Waiting to sync**, **WAL retention remaining**, **Last check-in**, **Connected**, and **Slot status**.
3. Check table states. Tables in **Copying** can create temporary lag while the initial sync catches up to ongoing changes. If a table-sync slot is **Unreserved** or **Lost**, tune copy parallelism and retry the affected table's initial sync.
4. Open [**Logs > Replication**](/dashboard/project/_/logs/replication-logs) and look for destination errors, retries, rate limits, schema errors, or repeated restarts.
5. Compare the lag trend with recent database activity, such as imports, migrations, bulk updates, or long transactions.

#### Respond based on the slot status

| Slot status    | What to do                                                                                                                                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reserved**   | If **Waiting to sync** is stable or decreasing, continue monitoring. If it keeps increasing, check destination write performance, logs, and whether the publication includes more tables or write volume than expected.                                                                                          |
| **Extended**   | Treat it as an early warning. Confirm the pipeline is connected, check logs for retries or destination slowness, and reduce avoidable write bursts if possible until the pipeline catches up.                                                                                                                    |
| **Unreserved** | Act soon. The slot is at risk of losing required WAL. Check whether the pipeline is connected and making progress, fix destination or pipeline errors, and contact support if the lag continues to grow.                                                                                                         |
| **Lost**       | The pipeline cannot continue from the existing slot because required WAL has been removed. Recreate the pipeline, or set **Invalidated slot behavior** to **Recreate** in the pipeline's advanced settings and restart the pipeline. This creates a new slot and starts replication from scratch for all tables. |
| **Unknown**    | Check replication logs for errors or missing slot details. If the status remains unknown while the pipeline should be running, contact support with the pipeline ID and recent log details.                                                                                                                      |

#### Reduce future lag risk

- Keep publications focused on the tables and operations you need at the destination.
- Avoid leaving pipelines stopped for long periods while the source database is still receiving writes.
- Schedule bulk updates, imports, and migrations during lower-traffic windows when possible.
- For BigQuery, verify that service account permissions, table requirements, and replica identity settings match the [BigQuery destination guide](/docs/guides/database/replication/bigquery).
- If the initial sync is the bottleneck, review **Table sync workers** and **Copy connections per table** in the pipeline's advanced settings. Increasing either can use more source database connections; increasing table sync workers can also use more temporary replication slots.

### Handling errors

Errors can occur at two levels: per table or per pipeline.

#### Table errors

Table errors occur during the initial sync and affect individual tables. These errors can be retried without stopping the entire pipeline.

**Viewing table error details:**

1. Click **View pipeline** on your destination
2. Check the table states section to identify tables in **Error** state
3. Review the error message for that specific table

**Recovering from table errors:**

When a table encounters an error during the initial sync, you can reset the table state. This restarts that table's initial sync from the beginning.

#### Pipeline errors

Pipeline errors can occur during startup or ongoing replication and affect the entire pipeline. If a non-retryable pipeline-level error occurs, the entire pipeline stops and enters a **Failed** state instead of silently skipping the failure.

**Viewing pipeline error details:**

1. Hover over the **Failed** status in the destinations list to see a quick error summary
2. Click **View pipeline** for comprehensive error information
3. Navigate to the [**Logs > Replication**](/dashboard/project/_/logs/replication-logs) section of the Dashboard for detailed error logs

**Recovering from pipeline errors:**

To recover from a pipeline error, you'll need to:

1. Investigate the root cause using the error details and logs
2. Fix the underlying issue (e.g., destination connectivity, schema compatibility)
3. Restart the pipeline from the destinations list

### Viewing logs

To see detailed logs for all your pipelines:

1. Navigate to the [**Logs > Replication**](/dashboard/project/_/logs/replication-logs) section of the Dashboard
2. Select **Replication** from the log source filter
3. You'll see all logs from your pipelines

<Admonition type="note">

Logs contain diagnostic information that may be too technical for most users. If you're experiencing issues with replication, reaching out to support with your error details is recommended.

</Admonition>

### Common monitoring scenarios

#### Checking if replication is healthy

1. Navigate to the [**Database > Replication**](/dashboard/project/_/database/replication) section of the Dashboard
2. Verify your destination shows a "Running" status
3. Click **View pipeline** to check replication lag and table states
4. Ensure all tables show a "Live" state

#### Investigating errors

If you see a **Failed** status:

1. Hover over the status to see the error summary
2. Click **View pipeline** to see detailed error information
3. Check table states to identify which tables are affected
4. Navigate to the [**Logs > Replication**](/dashboard/project/_/logs/replication-logs) section of the Dashboard for full error details
5. For table errors, attempt to reset the affected tables

#### Monitoring performance

To ensure optimal performance:

1. Regularly check replication lag metrics in the pipeline status view
2. Monitor table states to ensure tables are staying in a "Live" state
3. Review logs for warnings or performance issues
4. If lag is consistently high, review your publication and destination configuration

### Troubleshooting

If you notice issues with your replication:

1. **Check pipeline state**: Ensure the pipeline is in **Running** state
2. **Review table states**: Identify tables in **Error** state
3. **Check logs**: Navigate to the [**Logs > Replication**](/dashboard/project/_/logs/replication-logs) section of the Dashboard for detailed error information
4. **Verify publication**: Ensure your Postgres publication is properly configured
5. **Monitor replication lag**: High lag may indicate performance issues

For more troubleshooting tips, see the [Pipelines FAQ](/docs/guides/database/replication/pipelines-faq).

### Next steps

- [Set up Pipelines](/docs/guides/database/replication/pipelines)
- [View the Pipelines FAQ](/docs/guides/database/replication/pipelines-faq)
