---
id: 'replication'
title: 'Database Replication'
description: 'Replicate your database to external destinations using Supabase replication or manual replication.'
subtitle: 'An introduction to database replication and change data capture.'
sidebar_label: 'Overview'
---

Replication is the process of copying changes from your database to another location. It's also referred to as change data capture (CDC): capturing all the changes that occur to your data.

## Use cases

You might use database replication for:

- **Analytics and Data Warehousing**: Replicate your operational database to analytics platforms for complex analysis without impacting your application's performance.
- **Data Integration**: Keep your data synchronized across different systems and services in your tech stack.
- **Backup and Disaster Recovery**: Maintain up-to-date copies of your data in different locations.

## Replication methods

Supabase supports three methods for replicating your database to external destinations:

### Read Replicas

Additional databases that are kept in sync with your Primary database. These read-only databases can be deployed across multiple regions, for lower latency and better resource management.

- [Set up Read Replicas](/docs/guides/platform/read-replicas)

### Replication

<Admonition type="caution" label="Private Alpha">

Replication is currently in private alpha. Access is limited and features may change.

</Admonition>

Replication powered by [Supabase ETL](https://github.com/supabase/etl) automatically replicates data to supported systems.

- [Set up replication](/docs/guides/database/replication/replication-setup)

### Manual replication

Configure your own replication using external tools and Postgres's native logical replication. This gives you full control over the replication process and allows you to use any tool that supports Postgres logical replication.

- [Set up Manual Replication](/docs/guides/database/replication/manual-replication-setup)

## Related features

Choose the data syncing method based on your use case:

- For realtime features and syncing data to clients (browsers, mobile apps), see [Realtime](/docs/guides/realtime)
- For deploying read-only databases across multiple regions, see [Read Replicas](/docs/guides/platform/read-replicas)

## Concepts and terms

### Write-Ahead Log (WAL)

Postgres uses a system called the Write-Ahead Log (WAL) to manage changes to the database. As you make changes, they are appended to the WAL, which is a series of files (also called "segments") where the file size can be specified. Once one segment is full, Postgres will start appending to a new segment. After a period of time, a checkpoint occurs and Postgres synchronizes the WAL with your database. Once the checkpoint is complete, then the WAL files can be removed from disk and free up space.

### Logical replication and WAL

Logical replication is a method of replication where Postgres uses the WAL files and transmit those changes to another Postgres database, or a system that supports reading WAL files.

### LSN

LSN is a Log Sequence Number that is used to identify the position of a WAL file in the WAL directory. It is often used to determine the progress of replication in subscribers and calculate the lag of a replication slot.

## Logical replication architecture

When setting up logical replication, three key components are involved:

- `publication` - A set of tables on your primary database that will be `published`
- `replication slot` - A slot used for replicating the data from a single publication. The slot, when created, will specify the output format of the changes
- `subscription` - A subscription is created from an external system (i.e. another Postgres database) and must specify the name of the `publication`. If you do not specify a replication slot, one is automatically created

## Logical replication output format

Logical replication is typically output in 2 forms, `pgoutput` and `wal2json`. The output method is how Postgres sends changes to any active replication slot.

## Logical replication configuration

When using logical replication, Postgres is then configured to keep WAL files around for longer than it needs them. If the files are removed too quickly, then your `replication slot` will become inactive and, if the database receives a large number of changes in a short time, then the `replication slot` can become lost as it was not able to keep up.

In order to mitigate this, Postgres has many options and settings that can be [tweaked](/docs/guides/database/custom-postgres-config) to manage the WAL usage effectively. Not all of these settings are user configurable as they can impact the stability of your database. For those that are, these should be considered as advanced configuration and not changed without understanding that they can cause additional disk space and resources to be used, as well as incur additional costs.

| Setting                                                                                  | Description                                            | User-facing | Default |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------- | ------- |
| [`max_replication_slots`](https://postgresqlco.nf/doc/en/param/max_replication_slots/)   | Max count of replication slots allowed                 | No          |         |
| [`wal_keep_size`](https://postgresqlco.nf/doc/en/param/wal_keep_size/)                   | Minimum size of WAL files to keep for replication      | No          |         |
| [`max_slot_wal_keep_size`](https://postgresqlco.nf/doc/en/param/max_slot_wal_keep_size/) | Max WAL size that can be reserved by replication slots | No          |         |
| [`checkpoint_timeout`](https://postgresqlco.nf/doc/en/param/checkpoint_timeout/)         | Max time between WAL checkpoints                       | No          |         |
