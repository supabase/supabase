---
title: 'Iceberg Catalog'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [share feedback](https://github.com/orgs/supabase/discussions/40116) as we refine the experience and expand access.

</Admonition>

Analytics buckets require authentication with two distinct services:

## Architecture overview

**Iceberg REST Catalog** serves as the metadata management system for your Iceberg tables. It enables Iceberg clients such as PyIceberg and Apache Spark to perform critical operations:

- Creating and managing tables and namespaces
- Tracking schemas and handling schema evolution
- Managing partitions and table snapshots
- Ensuring transactional consistency and isolation

The REST Catalog only stores metadata describing your data's structure, schema, and partitioning strategy—not the actual data itself.

**S3-Compatible Storage Endpoint** handles the actual data storage and retrieval. It's optimized for reading and writing large analytical datasets stored in Parquet format, separate from the metadata management layer.

## Authentication setup

To connect to an analytics bucket, you need:

### 1. S3 credentials

Create S3 credentials through [**Project Settings > Storage**](/dashboard/project/_/storage/settings). See the [S3 Authentication Guide](/docs/guides/storage/s3/authentication) for detailed instructions.

You'll obtain:

- **Access Key ID**
- **Secret Access Key**
- **Region** (e.g., `us-east-1`)

### 2. Supabase service key

Retrieve your Service Key from [**Project Settings > API**](/dashboard/project/_/settings/api-keys). This key authenticates requests to the Iceberg REST Catalog.

### 3. Project reference

Your Supabase project reference is the subdomain in your project URL (e.g., `your-project-ref` in `https://your-project-ref.supabase.co`).

## Testing your connection

You can verify your setup by making a direct request to the Iceberg REST Catalog. Provide your Service Key as a Bearer token:

```bash
curl \
  --request GET -sL \
  --url 'https://<your-project-ref>.supabase.co/storage/v1/iceberg/v1/config?warehouse=<bucket-name>' \
  --header 'Authorization: Bearer <your-service-key>'
```

A successful response returns the catalog configuration including warehouse location and settings.

## Next steps

- [Connect with PyIceberg](/docs/guides/storage/analytics/examples/pyiceberg)
- [Connect with Apache Spark](/docs/guides/storage/analytics/examples/apache-spark)
- [Query with Postgres](/docs/guides/storage/analytics/query-with-postgres)
