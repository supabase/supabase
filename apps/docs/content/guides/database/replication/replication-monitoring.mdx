---
id: 'replication-monitoring'
title: 'Replication Monitoring'
description: 'Monitor the status and health of your replication pipelines.'
subtitle: 'Track replication status, view logs, and troubleshoot issues.'
sidebar_label: 'Monitoring'
---

<Admonition type="caution" label="Private Alpha">

Replication is currently in private alpha. Access is limited and features may change.

</Admonition>

After setting up replication, you can monitor the status and health of your replication pipelines directly from the Supabase Dashboard. The pipeline is the active Postgres replication process that continuously streams changes from your database to your destination.

### Viewing pipeline status

To monitor your replication pipelines:

1. Navigate to the [Database](/dashboard/project/_/database/replication) section in your Supabase Dashboard
2. Select the **replication** tab
3. You'll see a list of all your destinations with their pipeline status

<Image
  alt="Destinations List"
  src="/docs/img/database/replication/replication-destinations-list.png"

width={3560}
height={2146}
/>

#### Pipeline states

Each destination shows its pipeline in one of these states:

| State        | Description                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| **Stopped**  | Pipeline is not running                                                         |
| **Starting** | Pipeline is being started                                                       |
| **Running**  | Pipeline is actively replicating data                                           |
| **Stopping** | Pipeline is being stopped                                                       |
| **Failed**   | Pipeline has encountered an error (hover over the status to view error details) |

### Viewing detailed pipeline metrics

For detailed information about a specific pipeline, click **View status** on the destination. This opens the pipeline status page where you can monitor replication performance and table states.

<Image
  alt="Pipeline Status View"
  src="/docs/img/database/replication/replication-view-status.png"

width={3560}
height={2146}
/>

#### Replication lag metrics

The status page shows replication lag metrics that help you determine how fast your pipeline is replicating data. These metrics are loaded directly from Postgres itself.

#### Table states

The pipeline status page also shows the state of individual tables being replicated. Each table can be in one of these states:

| State       | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| **Queue**   | Table is getting ready to be copied                                    |
| **Copying** | Initial snapshot of the table is being copied                          |
| **Copied**  | Table snapshot is complete and getting ready for real-time replication |
| **Live**    | Table is now replicating data in near real-time                        |
| **Error**   | Table has experienced an error during replication                      |

### Handling errors

Errors can occur at two levels: per table or per pipeline.

#### Table errors

Table errors occur during the copy phase and affect individual tables. These errors can be retried without stopping the entire pipeline.

<Image
  alt="Table Error Details"
  src="/docs/img/database/replication/replication-pipeline-table-error.png"

width={3560}
height={2146}
/>

**Viewing table error details:**

1. Click **View status** on your destination
2. Check the table states section to identify tables in **Error** state
3. Review the error message for that specific table

**Recovering from table errors:**

When a table encounters an error during the copy phase, you can reset the table state. This will restart the table copy from the beginning.

#### Pipeline errors

Pipeline errors occur during the streaming phase (Live state) and affect the entire pipeline. When streaming data, if an error occurs, the entire pipeline will stop and enter a **Failed** state. This prevents data loss by ensuring no changes are skipped.

<Admonition type="note">

When a pipeline error occurs, you'll receive an email notification immediately. This ensures you're promptly notified of any issues so you can take action to resolve them.

</Admonition>

<Image
  alt="Pipeline Error Details"
  src="/docs/img/database/replication/replication-pipeline-error.png"

width={3560}
height={2146}
/>

**Viewing pipeline error details:**

1. Hover over the **Failed** status in the destinations list to see a quick error summary
2. Click **View status** for comprehensive error information
3. Navigate to [Logs](/dashboard/project/_/logs/explorer) → **Replication** for detailed error logs

**Recovering from pipeline errors:**

To recover from a pipeline error, you'll need to:

1. Investigate the root cause using the error details and logs
2. Fix the underlying issue (e.g., destination connectivity, schema compatibility)
3. Restart the pipeline from the destinations list

### Viewing logs

To see detailed logs for all your replication pipelines:

1. Navigate to [Logs](/dashboard/project/_/logs/explorer) in your Supabase Dashboard
2. Select **Replication** from the log source filter
3. You'll see all logs from your replication pipelines

<Image
  alt="Replication Logs"
  src="/docs/img/database/replication/replication-logs.png"
  width={3560}
  height={2146}
/>

<Admonition type="note">

Logs contain diagnostic information that may be too technical for most users. If you're experiencing issues with replication, reaching out to support with your error details is recommended.

</Admonition>

### Common monitoring scenarios

#### Checking if replication is healthy

1. Navigate to [Database](/dashboard/project/_/database/replication) → **replication**
2. Verify your destination shows **Running** status
3. Click **View status** to check replication lag and table states
4. Ensure all tables show **Live** state

#### Investigating errors

If you see a **Failed** status:

1. Hover over the status to see the error summary
2. Click **View status** to see detailed error information
3. Check table states to identify which tables are affected
4. Navigate to [Logs](/dashboard/project/_/logs/explorer) → **Replication** for full error details
5. For table errors, attempt to reset the affected tables

#### Monitoring performance

To ensure optimal performance:

1. Regularly check replication lag metrics in the pipeline status view
2. Monitor table states to ensure tables are staying in **Live** state
3. Review logs for warnings or performance issues
4. If lag is consistently high, consider adjusting your publication or batch wait time settings

### Troubleshooting

If you notice issues with your replication:

1. **Check pipeline state**: Ensure the pipeline is in **Running** state
2. **Review table states**: Identify tables in **Error** state
3. **Check logs**: Navigate to Logs → Replication for detailed error information
4. **Verify publication**: Ensure your Postgres publication is properly configured
5. **Monitor replication lag**: High lag may indicate performance issues

For more troubleshooting tips, see the [Replication FAQ](/docs/guides/database/replication/replication-faq).

### Next steps

- [Set up replication](/docs/guides/database/replication/replication-setup)
- [View replication FAQ](/docs/guides/database/replication/replication-faq)
