---
id: 'manage-usage-pipelines'
title: 'Manage Pipelines usage'
---

## What you are charged for

You are charged for configured pipelines and pipeline data processed. Data processed is billed at different rates during initial sync and ongoing replication. Pipelines are charged by the hour for as long as they are configured, including while they are stopped.

- **Pipeline hours** measure how long each pipeline remains configured. Delete a pipeline to end this charge.
- **Initial sync data processed** is the Postgres row data accepted by the destination when a table is first synchronized or synchronized again.
- **Ongoing replication data processed** is the Postgres row data accepted by the destination for subsequent database changes. It depends on how much your published data changes, not on the source table size, WAL size, or destination's compressed storage size.

Destination-provider charges are separate. For example, Google Cloud can charge for BigQuery ingestion, storage, and CDC compute.

## How data processed is measured

Pipeline data processed is the amount of logical row data emitted by Postgres for replication, successfully processed by a pipeline, and accepted by its destination. It is not based on physical table storage or destination-specific encoding, making usage consistent across destinations.

The measurement includes:

- **Initial sync and resynchronization**: Row data emitted by Postgres COPY.
- **Ongoing replication**: Row values Postgres emits for inserts, updates, and deletes. Updates include new row values and any previous identity values Postgres emits. Deletes include the emitted identity values.

Failed destination write attempts that Pipelines retries are not counted. Data is counted only after the destination acknowledges successful processing. In rare cases, Pipelines can count an acknowledged batch but crash or be interrupted before its replication checkpoint is persisted. Recovery can then process and count the same data again.

Data successfully processed again as part of a user-requested resynchronization, table restart, or pipeline reset is also counted again.

### Cost estimates

The Dashboard provides a quick planning estimate of initial sync volume and cost using information already available about your source tables. It is designed to give you a useful indication before initial sync begins without first scanning and encoding all the data that the sync will process.

If an estimate is unavailable, you can still create the pipeline or restart tables.

<Admonition type="note">

Use this estimate as a planning guide rather than an exact quote. The final volume is measured from the data successfully processed during initial sync and can vary based on your published data and filters.

</Admonition>

Actual charges use the logical Postgres row data copied after publication column and row filters and accepted by the destination.

### Usage on your invoice

Usage is shown as "ETL Pipeline Hours", "ETL Copy Backfill Data GB", and "ETL Replicated Data GB" on your invoice.

## Pricing

<$Partial path="billing/pricing/pricing_pipelines.mdx" />

## Billing examples

### Billing period without an initial sync

The project has a configured pipeline for the entire month.

| Line Item                     | Units     | Costs                        |
| ----------------------------- | --------- | ---------------------------- |
| Pro Plan                      | -         | <Price price="25" />         |
| Compute Hours Small Project 1 | 730 Hours | <Price price="15.04" />      |
| ETL Pipeline Hours            | 730 Hours | <Price price="38.69" />      |
| ETL Replicated Data GB        | 150 GB    | <Price price="450" />        |
| **Subtotal**                  |           | **<Price price="528.73" />** |
| Compute Credits               |           | -<Price price="10" />        |
| **Total**                     |           | **<Price price="518.73" />** |

### Multiple projects with initial syncs

Multiple projects had a configured pipeline for the entire month and processed data during initial sync and ongoing replication.

| Line Item                           | Units     | Costs                         |
| ----------------------------------- | --------- | ----------------------------- |
| Pro Plan                            | -         | <Price price="25" />          |
|                                     |           |                               |
| Compute Hours Small Project 1       | 730 Hours | <Price price="15.04" />       |
| ETL Pipeline Hours Project 1        | 730 Hours | <Price price="38.69" />       |
| ETL Replicated Data GB Project 1    | 15 GB     | <Price price="45" />          |
| ETL Copy Backfill Data GB Project 1 | 150 GB    | <Price price="90" />          |
|                                     |           |                               |
| Compute Hours Small Project 2       | 730 Hours | <Price price="15.04" />       |
| ETL Pipeline Hours Project 2        | 730 Hours | <Price price="38.69" />       |
| ETL Replicated Data GB Project 2    | 70 GB     | <Price price="210" />         |
| ETL Copy Backfill Data GB Project 2 | 1,500 GB  | <Price price="900" />         |
|                                     |           |                               |
| **Subtotal**                        |           | **<Price price="1377.46" />** |
| Compute Credits                     |           | -<Price price="10" />         |
| **Total**                           |           | **<Price price="1367.46" />** |

### After deleting a pipeline after one day

Pipeline hours are billed in arrears for as long as a pipeline is configured, including while it is stopped. After you delete the pipeline, pipeline-hour billing ends.

| Line Item                     | Hours | Costs                       |
| ----------------------------- | ----- | --------------------------- |
| Pro Plan                      | -     | <Price price="25" />        |
|                               |       |                             |
| Compute Hours Small Project 1 | 730   | <Price price="15.04" />     |
| ETL Pipeline Hours Project 1  | 24    | <Price price="1.27" />      |
|                               |       |                             |
| **Subtotal**                  |       | **<Price price="41.31" />** |
| Compute Credits               |       | -<Price price="10" />       |
| **Total**                     |       | **<Price price="31.31" />** |

## Optimize usage

- Include only the tables and columns that you need at the destination.
- Keep high-churn tables out of the publication when their changes are not needed for analytics.
- If you no longer require replication, delete the pipeline through your [project's replication settings](/dashboard/project/_/database/replication) to stop pipeline-hour charges.
