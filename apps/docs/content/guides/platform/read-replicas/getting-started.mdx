---
title: 'Getting started with Read Replicas'
description: 'Deploy read-only databases across multiple regions, for lower latency.'
subtitle: 'Deploy read-only databases across multiple regions, for lower latency and better resource management.'
---

## Prerequisites

<Admonition type="note">

Read Replicas are available for all projects on the Pro, Team and Enterprise plans. Spin one up now over at the [Infrastructure Settings page](/dashboard/project/_/settings/infrastructure).

</Admonition>

Projects must meet these requirements to use Read Replicas:

1. Running on AWS.
2. Running on at least a [Small compute add-on](/docs/guides/platform/compute-add-ons).

   - Read Replicas are started on the same compute instance as the Primary to keep up with changes.

3. Running on Postgres 15+.

   - For projects running on older versions of Postgres, you need to [upgrade to the latest platform version](/docs/guides/platform/migrating-and-upgrading-projects#pgupgrade).

4. Not using [legacy logical backups](/docs/guides/platform/backups#point-in-time-recovery)

   - Physical backups are automatically enabled if using [Point in time recovery (PITR)](/docs/guides/platform/backups#point-in-time-recovery)

## Creating a Read Replica

To add a Read Replica, go to the [Database Replication page](/dashboard/project/_/database/replication) in your project dashboard.

You can also manage Read Replicas using the Management API (beta functionality):

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Create a new Read Replica
curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/read-replicas/setup" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "us-east-1"
  }'

# Delete a Read Replica
curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/read-replicas/remove" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "database_identifier": "abcdefghijklmnopqrst"
  }'
```

<Admonition type="note">

Projects on an XL compute add-on or larger can create up to five Read Replicas. Projects on compute add-ons smaller than XL can create up to two Read Replicas. All Read Replicas inherit the compute size of their Primary database.

</Admonition>

### Deploying a Read Replica

We deploy a Read Replica using a physical backup as a starting point, and a combination of write ahead logging (WAL) file archives and direct replication from the Primary database to catch up. Both components may take significant time to complete, depending on your specific workload.

The time to restore from a physical backup is dependent and directly related to the database size of your project. The time taken to catch up to the primary using WAL archives and direct replication is dependent on the level of activity on the Primary database. A more active database produces a larger number of WAL files that need to be processed.

Along with the progress of the deployment, the dashboard displays rough estimates for each component.

## Replication method details

We use a hybrid approach to replicate data from a Primary to its Read Replicas, combining the native methods of streaming replication and file-based log shipping.

### Streaming replication

Postgres generates a Write Ahead Log (WAL) as database changes occur. With streaming replication, these changes stream from the Primary to the Read Replica server. The WAL alone is sufficient to reconstruct the database to its current state.

This replication method is fast, since the Primary streams changes directly to the Read Replica. However, it faces challenges when the Read Replica can't keep up with the WAL changes from its Primary. This can happen when the Read Replica is too small, running on degraded hardware, or has a heavier workload running.

To address this, Postgres provides tunable configuration, like `wal_keep_size`, to adjust the WAL retained by the Primary. If the Read Replica fails to "catch up" before the WAL surpasses the `wal_keep_size` setting, it terminates the replication. Tuning is an art - the amount of WAL required varies for every situation.

### File-based log shipping

In this replication method, the Primary continuously buffers WAL changes to a local file and then sends the file to the Read Replica. If multiple Read Replicas are present, files could also be sent to an intermediary location accessible by all replicas.

The Read Replica then reads the WAL files and applies those changes. There is higher replication lag than streaming replication since the Primary buffers the changes locally first. It also means there is a small chance that WAL changes do not reach Read Replicas if the Primary goes down before the file is transferred. In these cases, if the Primary fails a Replica using streaming replication would (in most cases) be more up-to-date than a Replica using file-based log shipping.

### File-based log shipping meets streaming replication

<Image
  alt="Map view of Primary and Read Replica databases"
  caption="Map view of Primary and Read Replica databases"
  src="/docs/img/guides/platform/read-replicas/streaming-replication-dark.png?v=1"
  containerClassName="max-w-[700px] mx-auto"
  zoomable
/>

We bring these two methods together to achieve quick, stable, and reliable replication. Each method addresses the limitations of the other. Streaming replication minimizes replication lag, while file-based log shipping provides a fallback. For file-based log shipping, we use our existing Point In Time Recovery (PITR) infrastructure. We regularly archive files from the Primary using [WAL-G](https://github.com/wal-g/wal-g), an open source archival and restoration tool, and ship the WAL files to off-site, durable cloud storage, such as S3.

We combine it with streaming replication to reduce replication lag. Once WAL-G files have been synced from S3, Read Replicas connect to the Primary and stream the WAL directly.

### Restart or compute add-on change behaviour

When you restart a project that utilizes Read Replicas, or change the compute add-on size, the Primary database gets restarted first. During this period, the Read Replicas remain available.

Once the Primary database has completed restarting (or resizing, in case of a compute add-on change) and become available for usage, all the Read Replicas are restarted (and resized, if needed) concurrently.

## Operations blocked by Read Replicas

### Project upgrades and data restorations

The following procedures require all Read Replicas for a project to be brought down before performing them:

1. [Project upgrades](/docs/guides/platform/migrating-and-upgrading-projects#pgupgrade)
2. [Data restorations](/docs/guides/platform/backups#pitr-restoration-process)

These operations need to complete before you can re-deploy Read Replicas.

### Monitoring replication lag

You can monitor replication lag for a specific Read Replica through a project dashboard on the [**Database Reports page**](/dashboard/project/_/observability/database). Read Replicas have an additional chart under **Replica Information** displaying historical replication lag in seconds.

You can see realtime replication lag in seconds on the [**Infrastructure Settings** page](/dashboard/project/_/settings/infrastructure). This is the value on top of the Read Replica.

<Admonition type="note">

There is no single threshold to indicate when you should address replication lag. It is dependent on the requirements of your project.

</Admonition>

<Admonition type="tip">

If you are already ingesting your [project's metrics](/docs/guides/platform/metrics#accessing-the-metrics-endpoint) into your own environment, you can also keep track of replication lag and set alarms with the `physical_replication_lag_physical_replica_lag_seconds` metric.

</Admonition>

### Addressing high replication lag

Some common sources of high replication lag include:

1. **Exclusive locks on tables on the Primary**: Operations such as `drop table` and `reindex` take an access-exclusive lock on the table. This can result in increasing replication lag for the duration of the lock.
2. **Resource Constraints on the database**: Heavy utilization on the primary or the replica, if run on an under-resourced project, can result in high replication lag. This includes the characteristics of the disk being utilized (IOPS, Throughput).
3. **Long-running transactions on the Primary**: Transactions that run for a long-time on the primary can also result in high replication lag. You can use the `pg_stat_activity` view to identify and terminate such transactions if needed. `pg_stat_activity` is a live view, and does not offer historical data on transactions that might have been active for a long time in the past.
   High replication lag can result in stale data returned for queries executed against the affected read replicas.

<Admonition type="tip" >

You can find additional resources on replication lag in [the Google documentation](https://cloud.google.com/sql/docs/postgres/replication/replication-lag), [the AWS documentation](https://repost.aws/knowledge-center/rds-postgresql-replication-lag), and [the several nines blog](https://severalnines.com/blog/what-look-if-your-postgresql-replication-lagging/).

</Admonition>

## Troubleshooting

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

### An "Init failed" status

The replica status "Init failed" in the dashboard indicates that the Read Replica has failed to deploy. Some possible scenarios as to why a Read Replica deployment may have failed are the following:

- An underlying instance failed to come up.
- A network issue leading to inability to connect to the Primary database.
- A possible incompatible database settings between the Primary and Read Replica databases.
- Platform issues.
- Very high active workloads combined with large (50+ GB) database sizes

It is safe to drop this failed Read Replica, and in the event of a transient issue, attempt to spin up another one. If spinning up Read Replicas for your project consistently fails, check the[status page](https://status.supabase.com) for any ongoing incidents, or [open a support ticket](/dashboard/support/new). To aid the investigation, do not bring down the recently failed Read Replica.

{/* supa-mdx-lint-enable-next-line Rule001HeadingCase */}
