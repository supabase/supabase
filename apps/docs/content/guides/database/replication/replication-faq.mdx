---
id: 'replication-faq'
title: 'Replication FAQ'
description: 'Frequently asked questions about replication.'
subtitle: 'Common questions and answers about replication.'
sidebar_label: 'FAQ'
---

<Admonition type="caution" label="Private Alpha">

Replication is currently in private alpha. Access is limited and features may change.

</Admonition>

## What destinations are supported?

Replication currently supports Analytics Buckets (Iceberg format) and BigQuery. See the destination tabs in the [Setup guide](/docs/guides/database/replication/replication-setup#step-3-add-a-destination) for configuration details.

Availability varies based on the planned roll-out strategy. The destinations you can access depend on your project and access level.

## Why is a table not being replicated?

Common reasons:

- **Missing primary key**: Tables must have a primary key to be replicated (Postgres logical replication requirement)
- **Not in publication**: Ensure the table is included in your Postgres publication
- **Unsupported data types**: Tables with custom data types are not supported

Check your publication settings and verify your table meets the requirements.

## Why aren't publication changes reflected after adding or removing tables?

After modifying your Postgres publication, you must restart the replication pipeline for changes to take effect. See [Adding or removing tables](/docs/guides/database/replication/replication-setup#adding-or-removing-tables) for instructions.

## Why is a pipeline in failed state?

Pipeline failures occur during the streaming phase when an error happens while replicating live data. This prevents data loss. To recover:

1. Check the error message by hovering over the **Failed** status
2. Click **View status** for detailed information
3. Fix the underlying issue (e.g., schema mismatches, destination connectivity)
4. Restart the pipeline

See [Handling errors](/docs/guides/database/replication/replication-monitoring#handling-errors) for more details.

## Why is a table in error state?

Table errors occur during the copy phase. To recover, click **View status**, find the affected table, and reset the table state. This will restart the table copy from the beginning.

## How to verify replication is working

Check the [Database](/dashboard/project/_/database/replication) → **replication** page:

1. Verify your pipeline shows **Running** status
2. Click **View status** to check table states
3. Ensure all tables show **Live** state (actively replicating)
4. Monitor replication lag metrics

See the [Replication Monitoring guide](/docs/guides/database/replication/replication-monitoring) for comprehensive monitoring instructions.

## How to stop or pause replication

You can manage your pipeline using the actions menu in the destinations list. See [Managing your pipeline](/docs/guides/database/replication/replication-setup#managing-your-pipeline) for details on available actions.

Note: Stopping replication will cause changes to queue up in the WAL.

## What happens if a table is deleted at the destination?

If a table is deleted downstream at the destination (e.g., in your Analytics Bucket or BigQuery dataset), the replication pipeline will automatically recreate it.

This behavior is by design to prevent the pipeline from breaking if tables are accidentally deleted. The pipeline ensures that all tables in your publication are always present at the destination.

**To permanently remove a table from your destination:**

You have two options:

**Option 1: Pause the pipeline first**

1. Pause or delete your replication pipeline
2. Delete the table at your destination
3. The table will not be recreated since the pipeline is not running

**Option 2: Remove from publication first**

1. Remove the table from your Postgres publication using `ALTER PUBLICATION ... DROP TABLE`
2. Restart your replication pipeline to apply the change (the table at the destination will remain but stop receiving new changes)
3. Delete the table at your destination

Note: Removing a table from the publication and restarting the pipeline does not delete the table downstream, it only stops replicating new changes to it.

## Can data duplicates occur during pipeline operations?

Yes, data duplicates can occur in certain scenarios when stopping a pipeline.

When you stop a pipeline (for restarts or updates), the replication process tries to finish processing any transactions that are currently being sent to your destination. It waits up to a few minutes to allow these in-progress transactions to complete cleanly before stopping.

However, if a transaction in your database takes longer than this waiting period to complete, the pipeline will stop before that entire transaction has been fully processed. When the pipeline starts again, it must restart the incomplete transaction from the beginning to maintain transaction boundaries, which results in some data being sent twice to your destination.

**Understanding transaction boundaries**: A transaction is a group of database changes that happen together (for example, all changes within a `BEGIN...COMMIT` block). Postgres logical replication must process entire transactions - it cannot process part of a transaction, stop, and then continue from the middle. This means if a transaction is interrupted, the whole transaction must be replayed when the pipeline resumes.

**Example scenario**: Suppose you have a batch operation that updates 10,000 rows within a single transaction. If this operation takes 10 minutes to complete and you stop the pipeline after 5 minutes (when 5,000 rows have been processed), the pipeline cannot resume from row 5,001. Instead, when it restarts, it must reprocess all 10,000 rows from the beginning, resulting in the first 5,000 rows being sent to your destination twice.

**Important**: There are currently no plans to implement automatic deduplication. If your use case requires guaranteed exactly-once delivery, you should implement deduplication logic in your downstream systems based on primary keys or other unique identifiers.

## Where to find replication logs

Navigate to [Logs](/dashboard/project/_/logs/explorer) → **Replication** to see all pipeline logs. Logs contain diagnostic information. If you're experiencing issues, contact support with your error details.

## How to get help

If you need assistance:

1. Check the [Replication Setup guide](/docs/guides/database/replication/replication-setup) and [Replication Monitoring guide](/docs/guides/database/replication/replication-monitoring)
2. Review this FAQ for common issues
3. Contact support with your error details and logs
