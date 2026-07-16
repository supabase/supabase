---
id: 'replication'
title: 'Database replication'
description: 'Compare read replicas, Supabase Pipelines, and manual replication.'
subtitle: 'An introduction to database replication and change data capture.'
sidebar_label: 'Overview'
---

Replication keeps data synchronized with another location. Logical replication products such as Supabase Pipelines use change data capture (CDC) to read database changes and apply them to a destination.

## Use cases

You might use database replication for:

- **Analytics and data warehousing**: Replicate your operational database to analytics platforms for complex analysis without impacting your application's performance.
- **Data integration**: Keep your data synchronized across different systems and services in your tech stack.
- **Operational reporting**: Maintain a copy of selected application data that you can query in another system.

## Replication methods

Supabase supports three replication methods. Choose based on whether you need another Supabase Postgres database, a managed replication pipeline to a destination system, or full control over your own logical replication setup.

### Read replicas

Read replicas are additional Supabase Postgres databases kept in sync with your primary database. Use them when you want read-only query capacity, lower latency in another region, or to isolate analytical reads from application writes while staying inside Supabase Postgres.

- [Set up read replicas](/docs/guides/platform/read-replicas)

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

### Pipelines

<$Partial path="pipelines-public-alpha.mdx" />

Supabase Pipelines is a managed CDC product for moving data from Supabase Postgres to supported destination systems. It uses Postgres logical replication with the open-source [Supabase ETL engine](https://github.com/supabase/etl). A destination is where your replicated data is stored; a pipeline first performs an initial sync of existing rows, then uses ongoing replication (CDC) to send subsequent database changes to that destination.

- [Set up Pipelines](/docs/guides/database/replication/pipelines)

#### Supported destinations

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
Pipelines currently supports BigQuery as the managed destination. You can [request early access to ClickHouse, Snowflake, and DuckLake](/go/supabase-pipelines-new-destinations) while we expand destination support.

Managed Pipelines run in **AWS `eu-central-1` (Frankfurt)**. Choose destination resources as close as possible to Frankfurt to reduce network latency and replication lag.

| Destination                                            | Insert       | Update       | Delete       | Truncate     | Schema change  | Description                                                         |
| ------------------------------------------------------ | ------------ | ------------ | ------------ | ------------ | -------------- | ------------------------------------------------------------------- |
| [BigQuery](/docs/guides/database/replication/bigquery) | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | Beta (limited) | Managed replication to Google BigQuery for analytics and reporting. |

### Manual replication

Manual replication uses the same underlying Postgres logical replication features as Pipelines, but you configure and operate the pieces yourself. Use this path when you want to connect tools such as Airbyte, Estuary, Fivetran, Materialize, Stitch, AWS DMS, or another system that supports Postgres logical replication.

- [Set up manual replication](/docs/guides/database/replication/manual-replication-setup)

## Related features

For realtime features and syncing data to clients (browsers, mobile apps), see [Realtime](/docs/guides/realtime).

Realtime also uses Postgres changes, but it is intended for broadcasting database updates to clients rather than maintaining a copy of your database in another system.

## Concepts and terms

### Write-Ahead Log (WAL)

Postgres uses a system called the Write-Ahead Log (WAL) to manage changes to the database. As you make changes, they are appended to the WAL, which is a series of files (also called "segments") where the file size can be specified. Once one segment is full, Postgres will start appending to a new segment. After a period of time, a checkpoint occurs and Postgres synchronizes the WAL with your database. Once the checkpoint is complete, then the WAL files can be removed from disk and free up space.

### Logical replication and WAL

Logical replication is a method of replication where Postgres uses WAL files to transmit changes to another Postgres database, or to a system that supports reading WAL files.

### LSN

LSN is a Log Sequence Number that identifies a position in the WAL. It is often used to determine the progress of replication in subscribers and calculate the lag of a replication slot.

## Logical replication architecture

When setting up logical replication, three key components are involved:

- `publication` - A set of tables on your primary database that will be `published`
- `replication slot` - A slot used for replicating the data from a single publication. The slot, when created, will specify the output format of the changes
- `subscription` - A subscription is created from an external system (that is, another Postgres database) and must specify the name of the `publication`. If you do not specify a replication slot, one is automatically created

## Logical replication output format

Logical replication is typically output in two forms, `pgoutput` and `wal2json`. The output method is how Postgres sends changes to any active replication slot.

## Logical replication configuration

When using logical replication, Postgres keeps WAL files around for longer than it otherwise needs them. If the files are removed too soon, then your `replication slot` can become inactive or lost if the database receives a large number of changes in a short time.

In order to mitigate this, Postgres has many options and settings that can be [tweaked](/docs/guides/database/custom-postgres-config) to manage the WAL usage effectively. Not all of these settings are user configurable as they can impact the stability of your database. For those that are, these should be considered as advanced configuration and not changed without understanding that they can cause additional disk space and resources to be used, as well as incur additional costs.

| Setting                                                                                  | Description                                            | User-facing | Default |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------- | ------- |
| [`max_replication_slots`](https://postgresqlco.nf/doc/en/param/max_replication_slots/)   | Max count of replication slots allowed                 | No          |         |
| [`wal_keep_size`](https://postgresqlco.nf/doc/en/param/wal_keep_size/)                   | Minimum size of WAL files to keep for replication      | No          |         |
| [`max_slot_wal_keep_size`](https://postgresqlco.nf/doc/en/param/max_slot_wal_keep_size/) | Max WAL size that can be reserved by replication slots | No          |         |
| [`checkpoint_timeout`](https://postgresqlco.nf/doc/en/param/checkpoint_timeout/)         | Max time between WAL checkpoints                       | No          |         |
