---
title: 'Realtime Data Sync to Analytics Buckets'
subtitle: 'Replicate your PostgreSQL data to analytics buckets in real-time.'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [Share feedback](https://github.com/orgs/supabase/discussions/40116) as the experience is refined and access is expanded.

</Admonition>

By combining replication powered by [Supabase ETL](https://github.com/supabase/etl) with **Analytics Buckets**, you can build an end-to-end data warehouse solution that automatically syncs changes from your Postgres database to Iceberg tables.

This guide provides a quickstart for replicating to Analytics Buckets. For complete replication configuration including other destinations, see the [Replication Setup Guide](/docs/guides/database/replication/replication-setup).

## How it works

The replication pipeline captures changes (INSERT, UPDATE, DELETE) from your Postgres database in real-time using Postgres logical replication and writes them to your analytics bucket. This allows you to maintain an always-up-to-date data warehouse without impacting your production workloads.

## Setup steps

### Step 1: Create an Analytics bucket

First, create a new analytics bucket to store your replicated data:

1. Navigate to **Storage** in the Supabase Dashboard.
2. Click **Create Bucket**.
3. Enter a name (e.g., `my-warehouse`).
4. Select **Analytics Bucket** as the type.
5. Click **Create**.

<Image
  alt="Creating a new analytics bucket"
  src="/docs/img/database/replication/replication-iceberg-new-bucket.png"

width={3560}
height={2146}
/>

### Step 2: Create a publication

A publication defines which tables and change types will be replicated. Create one using SQL in the Supabase SQL Editor:

```sql
-- Create publication for tables you want to replicate
CREATE PUBLICATION pub_warehouse
  FOR TABLE users, orders, products;
```

This publication will track all changes (INSERT, UPDATE, DELETE) for the specified tables. For advanced publication options like column filtering and row predicates, see the [Replication Setup Guide](/docs/guides/database/replication/replication-setup#advanced-publication-options).

### Step 3: Create the replication pipeline

Now set up the pipeline to sync data to your analytics bucket:

1. Navigate to **Database > Replication** in the Supabase Dashboard.
2. Click **Create Pipeline**.
3. Select the **Publication** you created in Step 2.
4. Select your **Analytics Bucket** as the destination.
5. Configure any additional settings as needed.
6. Click **Create and Start**.

<Image
  alt="Replication pipeline configuration"
  src="/docs/img/database/replication/replication-iceberg-details.png"

width={3560}
height={2146}
/>

## Monitoring your pipeline

Once started, you can monitor the pipeline status directly in the **Database > Replication** section:

- **Status** - Shows if the pipeline is running, paused, or encountered errors
- **Sync Progress** - View the number of records replicated
- **Logs** - Check detailed logs for troubleshooting

<Admonition type="note">

Deleted tables are automatically recreated by the pipeline. To permanently delete a table, pause the pipeline first or remove it from the publication before deleting. See the [FAQ](/docs/guides/database/replication/replication-faq#what-happens-if-i-delete-a-table-at-the-destination) for details.

</Admonition>

## Next steps

Once data is flowing to your analytics bucket, you can:

- [Query with SQL via Postgres](/docs/guides/storage/analytics/query-with-postgres)
- [Connect with PyIceberg](/docs/guides/storage/analytics/examples/pyiceberg)
- [Analyze with Apache Spark](/docs/guides/storage/analytics/examples/apache-spark)

For detailed replication configuration and advanced topics:

- [Replication Setup Guide](/docs/guides/database/replication/replication-setup) - Complete replication configuration including BigQuery and other destinations
- [Replication Monitoring Guide](/docs/guides/database/replication/replication-monitoring) - Monitor replication pipeline status and health
- [Replication FAQ](/docs/guides/database/replication/replication-faq) - Common questions about replication
