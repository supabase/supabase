---
title: 'ClickHouse Partnership, improved Postgres Replication, and Disk Management'
description: Improving the developer experience between Postgres and ClickHouse.
author: paul_copplestone
imgSocial: clickhouse-supabase/supabase-clickhouse-og.png
imgThumb: clickhouse-supabase/supabase-clickhouse-og.png
categories:
  - developers
  - postgres
tags:
  - postgres
  - clickhouse
date: '2024-10-30'
toc_depth: 3
---

We're seeing an emerging trend for AI customers: Postgres and ClickHouse is becoming the “default data stack”.

This makes sense - AI companies typically generate a lot of logs and analytical data, which is better suited for an OLAP database like ClickHouse.

<Quote img="justin-torre.png" caption="Justin Torre, CTO @ Helicone.ai">

The combination of Supabase and ClickHouse together are perfect for [Helicone.ai](https://helicone.ai), providing the flexibility of Postgres with the analytical power of ClickHouse — an open-source stack we can trust and customize.

</Quote>

## Supabase + ClickHouse Partnership

The partnership between Supabase and ClickHouse aims to create a seamless experience, building on the already solid Postgres + ClickHouse foundation. Today, we're releasing new features to enhance this integration.

<Quote img="aaron-katz.jpg" caption="Aaron Katz, CEO @ ClickHouse Inc.">

ClickHouse is very excited to partner with Supabase to make it easy for customers to use both technologies together. Through this partnership, we aim to make it even simpler for Postgres developers to use ClickHouse in conjunction and build real-time, data-driven applications at scale.

</Quote>

## Using Postgres and ClickHouse together

Before diving into those changes, some context on how most customers use Supabase and ClickHouse together. While both are databases, they serve different use-cases:

- **Postgres:** Ideal for storing and querying application data, powering critical transactional and web app use cases.
- **ClickHouse:** Optimized for analytics and reporting, supporting both customer-facing and internal applications

Postgres is a row-oriented database, ClickHouse is column-oriented. The ClickHouse team have a [great write up about the difference](https://clickhouse.com/docs/en/intro#row-oriented-vs-column-oriented-storage) between the two formats.

<Img
  alt="Browser proxy diagram"
  src={{
    light: '/images/blog/clickhouse-supabase/postgres-clickhouse--light.png',
    dark: '/images/blog/clickhouse-supabase/postgres-clickhouse--dark.png',
  }}
/>

To provide an interface between these, Supabase customers generally use:

1. [clickhouse_fdw](https://supabase.com/docs/guides/database/extensions/wrappers/clickhouse) to query their ClickHouse data from their Postgres database.
2. [PeerDB](https://www.peerdb.io/) to replicate their data from Postgres to ClickHouse.

<Img
  alt="Browser proxy diagram"
  src={{
    light: '/images/blog/clickhouse-supabase/postgres-clickhouse-integration--light.png',
    dark: '/images/blog/clickhouse-supabase/postgres-clickhouse-integration--dark.png',
  }}
/>

## Improving the ClickHouse & Supabase experience

We're making a number of changes to our platform based on the feedback we've had from customers.

### Updated ClickHouse Foreign Data Wrapper

Using the [ClickHouse FDW](https://fdw.dev/catalog/clickhouse/), you can directly query your ClickHouse database from Postgres:

```sql
-- Connect Postgres to your ClickHouse database:
create foreign table user_analytics (
  id bigint,
  user_id bigint,
  event text
)
server clickhouse_server
options ( table 'UserAnalytics' );

-- Query your ClickHouse instance from Postgres:
select * from user_analytics where user_id = 1;
```

This means you can query your ClickHouse data using the Postgres tooling that you're familiar with.

The Wrapper now has support for ClickHouse [Parameterized Views](https://clickhouse.com/docs/en/sql-reference/statements/create/view#parameterized-view). With this update, you can pass query parameters directly to ClickHouse, taking full advantage of its analytical engine::

```sql
create foreign table user_analytics (
  id bigint,
  user_id bigint,
  _event text,
)
server clickhouse_server
options ( table '(select * from UserAnalytics(event=${_event}))' );

select * from user_analytics where _event='button_click';
```

### More granular replication control

Many of our customers use [PeerDB](https://www.peerdb.io/) to replicate data from Postgres to ClickHouse. This has occasionally presented challenges, particularly with Postgres's default 1GB WAL size, which, for large data volumes, can result in data loss if the WAL exceeds this size.

To resolve this, we've added 13 [configurable Postgres parameters](/docs/guides/database/custom-postgres-config), enabling you to adjust replication settings through the CLI. For example, you can increase the default WAL size to 2GB:

```
supabase --experimental --project-ref xxxx-yyy \
postgres-config update --config max_slot_wal_keep_size=2GB
```

The new CLI config includes the following Postgres parameters:

1. [logical_decoding_work_mem](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-LOGICAL-DECODING-WORK-MEM): Controls memory used during logical decoding.
2. [max_connections](https://www.postgresql.org/docs/current/runtime-config-connection.html#GUC-MAX-CONNECTIONS): Limits total connections to the Postgres server.
3. [max_locks_per_transaction](https://www.postgresql.org/docs/current/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION): Sets the maximum locks allowed in a single transaction.
4. [max_replication_slots](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-REPLICATION-SLOTS): Defines the number of replication slots for data streaming.
5. [max_slot_wal_keep_size](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-SLOT-WAL-KEEP-SIZE): Limits disk space for WAL in replication slots.
6. [max_standby_archive_delay](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-STANDBY-ARCHIVE-DELAY): Sets how long standby servers can wait for archive recovery.
7. [max_standby_streaming_delay](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-STANDBY-STREAMING-DELAY): Controls delay on standby servers for streaming replication.
8. [max_wal_size](https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-MAX-WAL-SIZE): Specifies the maximum size of the Write Ahead Log.
9. [max_wal_senders](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-WAL-SENDERS): Sets the maximum number of processes sending WAL data.
10. [max_worker_processes](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-WORKER-PROCESSES): Defines the number of background worker processes.
11. [shared_buffers](https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-SHARED-BUFFERS): Determines the amount of memory for shared buffers.
12. [wal_keep_size](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-WAL-KEEP-SIZE): Sets minimum WAL size to keep for standby servers.
13. [wal_sender_timeout](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-WAL-SENDER-TIMEOUT): Specifies the timeout for inactive WAL sender processes.

### Improved Disk Management

Supabase now provides granular control over disk usage for your Postgres database:

<Img
  alt="Disk management"
  src={{
    light: '/images/blog/clickhouse-supabase/disk-management.png',
    dark: '/images/blog/clickhouse-supabase/disk-management.png',
  }}
/>

This is driven directly by customers using tools like PeerDB. With adjustable WAL configuration, it's important that developers can manage the disk as well. For example, on the Pro Plan's 8GB disk, you can configure your project with options like:

- Default: 7GB database space, 1GB Write Ahead Log
- Custom example: 6GB database space, 2 GB Write Ahead Log

Additionally, we're introducing High-performance Disks. We'll release more details about this later.

### ClickHouse platform updates

The ClickHouse team have also been busy. They've released a number of updates to their platform, including:

1. A native Supabase OAuth integration in PeerDB for Postgres CDC to ClickHouse.
2. Support for IPV6 in PeerDB Cloud.

You can learn more about these features in the [Supabase Partnership](https://clickhouse.com/blog/supabase-partnership-native-postgres-replication-clickhouse-fdw) post they released today.

## What's next?

Improving the experience between Postgres and ClickHouse is the first phase of this partnership. We're already working on native platform integrations. If you're using (or plan to use) Supabase and ClickHouse together please [reach out](https://supabase.com/enterprise) - we'd love more design partners to help shape the future of this integration.

<Img
  alt="Supabase integrations"
  src={{
    light: '/images/blog/clickhouse-supabase/integrations.png',
    dark: '/images/blog/clickhouse-supabase/integrations.png',
  }}
/>

If you simply want to try out the tools and updates we've described above, you can get started with all of them, free of charge:

- Supabase: [database.new](https://database.new)
- ClickHouse: [clickhouse.com](https://clickhouse.com/)
- PeerDB: [peerdb.io](https://www.peerdb.io/)
