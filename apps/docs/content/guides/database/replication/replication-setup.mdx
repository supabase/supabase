---
id: 'replication-setup'
title: 'Replication Setup'
description: 'Set up replication using Postgres logical replication.'
subtitle: 'Configure publications and destinations for replication.'
sidebar_label: 'Setting up'
---

<Admonition type="caution" label="Private Alpha">

Replication is currently in private alpha. Access is limited and features may change.

</Admonition>

Replication uses **Postgres logical replication** to stream changes from your database. Powered by [Supabase ETL](https://github.com/supabase/etl), an open source tool built for Postgres logical replication, it provides a managed interface through the Dashboard to configure and monitor replication pipelines.

## Setup overview

Replication requires two main components: a **Postgres publication** (defines what to replicate) and a **destination** (where data is sent). Follow these steps to set up your replication pipeline.

<Admonition type="tip">

If you already have a Postgres publication set up, you can skip to [Step 2: Enable replication](#step-2-enable-replication).

</Admonition>

### Step 1: Create a Postgres publication

A Postgres publication defines which tables and change types will be replicated from your database. You create publications using SQL.

#### Creating a publication

The following SQL examples assume you have `users` and `orders` tables in your database.

##### Publication for specific tables

```sql
-- Create publication for both tables
create publication pub_users_orders
for table users, orders;
```

This publication will track all changes (INSERT, UPDATE, DELETE, TRUNCATE) for both the `users` and `orders` tables.

##### Publication for all tables in a schema

```sql
-- Create a publication for all tables in the public schema
create publication pub_all_public for tables in schema public;
```

This will track changes for all existing and future tables in the `public` schema.

##### Publication for all tables

```sql
-- Create a publication for all tables
create publication pub_all_tables for all tables;
```

This will track changes for all tables in your database.

#### Advanced publication options

##### Selecting specific columns

You can replicate only a subset of columns from a table:

```sql
-- Replicate only specific columns from the users table
create publication pub_users_subset
for table users (id, email, created_at);
```

This will only replicate the `id`, `email`, and `created_at` columns from the `users` table.

##### Filtering rows with a predicate

You can filter which rows to replicate using a WHERE clause:

```sql
-- Only replicate active users
create publication pub_active_users
for table users where (status = 'active');

-- Only replicate recent orders
create publication pub_recent_orders
for table orders where (created_at > '2024-01-01');
```

#### Viewing publications in the Dashboard

After creating a publication via SQL, you can view it in the Supabase Dashboard:

1. Navigate to **Database** → [Publications](/dashboard/project/_/database/publications) in your Supabase Dashboard
2. You'll see all your publications listed with their tables

### Step 2: Enable replication

Before adding destinations, you need to enable replication for your project:

1. Navigate to the [Database](/dashboard/project/_/database/replication) section in your Supabase Dashboard
2. Select the **replication** tab
3. Click **Enable replication** to activate replication for your project

<Image
  alt="Enable Replication"
  src="/docs/img/database/replication/replication-enable-replication.png"

width={3560}
height={2146}
/>

### Step 3: Add a destination

Once replication is enabled and you have a Postgres publication, you can add a destination. The destination is where your replicated data will be stored, while the pipeline is the active Postgres replication process that continuously streams changes from your database to that destination.

#### Choose and configure your destination

Follow these steps to configure your destination. The specific configuration depends on which destination type you choose. Both Analytics Buckets and BigQuery destinations are supported, though availability varies based on the planned roll-out strategy.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="analytics-buckets"
  queryGroup="destination"
>
<TabPanel id="analytics-buckets" label="Analytics Buckets">

[Analytics Buckets](/docs/guides/storage/analytics/introduction) are specialized storage buckets in Supabase Storage designed for analytical workloads. They provide S3-compatible storage and use the [Apache Iceberg](https://iceberg.apache.org/) open table format, making your data accessible via standard tools like DuckDB, Spark, and other analytics platforms.

When you replicate to Analytics Buckets, your database changes are automatically written in Iceberg format, creating tables in object storage that you can query for analytics.

##### Step 1: Create an analytics bucket

First, create an analytics bucket to store your replicated data:

1. Navigate to [Storage](/dashboard/project/_/storage/buckets) → **Analytics** in your Supabase Dashboard
2. Click **New bucket**

   <Image
     alt="Create new analytics bucket"
     src="/docs/img/database/replication/replication-iceberg-new-bucket.png"
     width={3560}
     height={2146}
   />

3. Fill in the bucket details:

   {' '}

   <Image
     alt="Analytics bucket details"
     src="/docs/img/database/replication/replication-iceberg-details.png"
     width={3560}
     height={2146}
   />

   - **Name**: A unique name for your bucket (e.g., `analytics_warehouse`)
   - **Region**: Select the region where your data will be stored

4. Click **Create bucket**

5. **Copy the credentials** displayed after bucket creation. You'll need these in the next steps:
   - **Catalog Token**: Authentication token for accessing the Iceberg catalog
   - **S3 Access Key ID**: Access key for S3-compatible storage
   - **S3 Secret Access Key**: Secret key for S3-compatible storage

##### Step 2: Configure analytics buckets as a destination

1. Navigate to [Database](/dashboard/project/_/database/replication) → **replication** in your Supabase Dashboard
2. Click **Add destination**

   <Image
     alt="Add Destination"
     src="/docs/img/database/replication/replication-add-destination.png"
     width={3560}
     height={2146}
   />

3. Configure the general settings:

   - **Destination name**: A name to identify this destination (e.g., "Analytics Warehouse")
   - **Publication**: The publication to replicate data from (created in [Step 1](#step-1-create-a-postgres-publication))
   - **Destination type**: Select **Analytics Buckets**

4. Configure Analytics Buckets settings:

   - **Bucket**: The name of your analytics bucket from Step 1
   - **Namespace**: The schema name where your tables will be replicated (e.g., `public`)
   - **Catalog Token**: Authentication token from Step 1
   - **S3 Access Key ID**: Access key from Step 1
   - **S3 Secret Access Key**: Secret key from Step 1

5. Configure **Advanced Settings** (optional):

   - **Batch wait time (milliseconds)**: How long to wait for more changes before sending a batch. Default is recommended for optimal performance.

6. Click **Create and start** to begin replication

Your replication pipeline will now start copying data from your database to the analytics bucket in Iceberg format.

##### How it works

Once configured, replication to Analytics Buckets:

1. Captures changes from your Postgres database (INSERT, UPDATE, DELETE, TRUNCATE operations)
2. Batches changes for optimal performance
3. Creates Iceberg tables automatically to match your Postgres schema
4. Streams data to Analytics Buckets

##### How tables are structured

Replicated tables use a changelog structure:

- Tables are created with a `_changelog` suffix in the name (e.g., `users_changelog`)
- Each table contains a `cdc_operation` column indicating the operation type: `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`
- This append-only format preserves the complete history of all changes

##### Limitations

- **Append-only log**: Currently provides an append-only log format rather than a full table representation

##### Additional resources

- [Analytics Buckets documentation](/docs/guides/storage/analytics/introduction) - Learn more about Analytics Buckets and S3-compatible storage
- [Realtime Data Sync to Analytics Buckets](/docs/guides/storage/analytics/replication) - Step-by-step guide for replicating to Analytics Buckets
- [Apache Iceberg](https://iceberg.apache.org/) - Official Iceberg documentation

</TabPanel>
<TabPanel id="bigquery" label="BigQuery">

[BigQuery](https://cloud.google.com/bigquery) is Google's fully managed data warehouse. You can replicate your database tables to BigQuery for analytics and reporting.

##### Step 1: Prepare GCP resources

Before configuring BigQuery as a destination, set up the following in Google Cloud Platform:

1. **Google Cloud Platform (GCP) account**: [Sign up for GCP](https://cloud.google.com/gcp) if you don't have one

2. **BigQuery dataset**: Create a [BigQuery dataset](https://cloud.google.com/bigquery/docs/datasets-intro) in your GCP project

   - Open the BigQuery console in GCP
   - Select your project
   - Click "Create Dataset"
   - Provide a dataset ID (e.g., `supabase_replication`)

3. **GCP service account key**: Create a [service account](https://cloud.google.com/iam/docs/keys-create-delete) with appropriate permissions:

   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Grant the **BigQuery Data Editor** role
   - Create and download the JSON key file

   Required permissions:

   - `bigquery.datasets.get`
   - `bigquery.tables.create`
   - `bigquery.tables.get`
   - `bigquery.tables.getData`
   - `bigquery.tables.update`
   - `bigquery.tables.updateData`

##### Step 2: Configure BigQuery as a destination

1. Navigate to [Database](/dashboard/project/_/database/replication) → **replication** in your Supabase Dashboard
2. Click **Add destination**

   <Image
     alt="BigQuery Configuration Settings"
     src="/docs/img/database/replication/replication-bigquery-details.png"
     width={3560}
     height={2146}
   />

3. Configure the general settings:

   - **Destination name**: A name to identify this destination (e.g., "BigQuery Warehouse")
   - **Publication**: The publication to replicate data from (created in [Step 1](#step-1-create-a-postgres-publication))
   - **Destination type**: Select **BigQuery**

4. Configure BigQuery-specific settings:

   - **Project ID**: Your BigQuery project identifier (found in the GCP Console)
   - **Dataset ID**: The name of your BigQuery dataset (without the project ID)

     <Admonition type="note">

     In the GCP Console, the dataset is shown as `project-id.dataset-id`. Enter only the part after the dot. For example, if you see `my-project.my_dataset`, enter `my_dataset`.

     </Admonition>

   - **Service Account Key**: Your GCP service account key in JSON format (from Step 1)

5. Configure **Advanced Settings** (optional):

   - **Batch wait time (milliseconds)**: How long to wait for more changes before sending a batch. Default is recommended for optimal performance.

6. Click **Create and start** to begin replication

Your replication pipeline will now start copying data from your database to BigQuery.

##### How it works

Once configured, replication to BigQuery:

1. Captures changes from your Postgres database (INSERT, UPDATE, DELETE, TRUNCATE operations)
2. Batches changes for optimal performance
3. Creates BigQuery tables automatically to match your Postgres schema
4. Streams data to BigQuery

##### How tables are structured

Due to BigQuery limitations, replicated tables use a versioned structure:

- The table you query is a **view** (e.g., `users`)
- The actual data is stored in versioned tables with a `_version` suffix (e.g., `users_version`)
- When a table is truncated in your database, a new version is created and the view automatically points to the latest version

This structure handles table truncations seamlessly while maintaining query compatibility.

##### Limitations

- **Row size**: Limited to 10 MB per row due to BigQuery Storage Write API constraints

##### Additional resources

- [BigQuery documentation](https://cloud.google.com/bigquery/docs) - Official Google BigQuery documentation

</TabPanel>
</Tabs>

### Step 4: Monitor your pipeline

After creating a destination, the replication pipeline will start and appear in the destinations list. You can monitor the pipeline's status and performance from the Dashboard.

<Image
  alt="Replication Destinations List"
  src="/docs/img/database/replication/replication-destinations-list.png"
  width={3560}
  height={2146}

/>

For comprehensive monitoring instructions including pipeline states, metrics, and logs, see the [Replication Monitoring guide](/docs/guides/database/replication/replication-monitoring).

### Managing your pipeline

You can manage your pipeline from the destinations list using the actions menu.

<Image
  alt="Pipeline Actions"
  src="/docs/img/database/replication/replication-pipeline-actions.png"
  width={3560}
  height={2146}

/>

Available actions:

- **Start**: Begin replication for a stopped pipeline
- **Stop**: Pause replication (changes will queue up in the WAL)
- **Restart**: Stop and start the pipeline (required after publication changes)
- **Edit destination**: Modify destination settings like credentials or advanced options
- **Delete**: Remove the destination and permanently stop replication

### Adding or removing tables

If you need to modify which tables are replicated after your replication pipeline is already running, follow these steps:

<Admonition type="note">

If your Postgres publication uses `FOR ALL TABLES` or `FOR TABLES IN SCHEMA`, new tables in that scope are automatically included in the publication. However, you still **must restart the replication pipeline** for the changes to take effect.

</Admonition>

#### Adding tables to replication

1. Add the table to your publication using SQL:

   ```sql
   -- Add a single table to an existing publication
   alter publication pub_users_orders add table products;

   -- Or add multiple tables at once
   alter publication pub_users_orders add table products, categories;
   ```

2. **Restart the replication pipeline** using the actions menu (see [Managing your pipeline](#managing-your-pipeline)) for the changes to take effect.

#### Removing tables from replication

1. Remove the table from your Postgres publication using SQL:

   ```sql
   -- Remove a single table from a publication
   alter publication pub_users_orders drop table orders;

   -- Or remove multiple tables at once
   alter publication pub_users_orders drop table orders, products;
   ```

2. **Restart the replication pipeline** using the actions menu (see [Managing your pipeline](#managing-your-pipeline)) for the changes to take effect.

<Admonition type="note">

Deleted tables are automatically recreated by the pipeline. To permanently delete a table, pause the pipeline first or remove it from the publication before deleting. See the [FAQ](/docs/guides/database/replication/replication-faq#what-happens-if-a-table-is-deleted-at-the-destination) for details.

</Admonition>

### How it works

Once configured, replication:

1. **Captures** changes from your Postgres database using Postgres publications and logical replication
2. **Streams** the changes through the replication pipeline
3. **Loads** the data to your destination in near real-time batches

Changes are sent in batches to optimize performance and reduce costs. The batch size and timing can be adjusted using the advanced settings. The replication pipeline currently performs data extraction and loading only, without transformation - your data is replicated as-is to the destination.

### Troubleshooting

If you encounter issues during setup:

- **Publication not appearing**: Ensure you created the Postgres publication via SQL and refresh the dashboard
- **Tables not showing in publication**: Verify your tables have primary keys (required for Postgres logical replication)
- **Pipeline failed to start**: Check the error message in the status view for specific details
- **No data being replicated**: Verify your Postgres publication includes the correct tables and event types

For more troubleshooting help, see the [Replication FAQ](/docs/guides/database/replication/replication-faq).

### Limitations

Replication has the following limitations:

- **Primary keys required**: Tables must have primary keys (Postgres logical replication requirement)
- **Custom data types**: Not supported
- **Schema changes**: Not automatically handled
- **No data transformation**: Data is replicated as-is without transformation
- **Data duplicates**: Duplicates can occur when stopping a pipeline if your database has transactions that take longer than a few minutes to complete. See [Can data duplicates occur?](/docs/guides/database/replication/replication-faq#can-data-duplicates-occur-during-pipeline-operations) for details

Destination-specific limitations (such as Iceberg's append-only log format or BigQuery's row size limits) are detailed in each destination tab in [Step 3](#step-3-add-a-destination) above.

### Future work

Replication is actively being developed. Planned improvements include:

- **DDL support**: Automatic handling of Postgres schema changes (ALTER TABLE, ADD COLUMN, etc.)
- **Additional destinations**: Support for more data warehouses and analytics platforms

There are no public timelines for these features, but they represent the roadmap for making replication more robust and flexible.

### Next steps

- [Monitor Replication](/docs/guides/database/replication/replication-monitoring)
- [View Replication FAQ](/docs/guides/database/replication/replication-faq)
