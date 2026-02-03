---
title: 'DuckDB'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [Share feedback](https://github.com/orgs/supabase/discussions/40116) as we refine the experience and expand access.

</Admonition>

DuckDB is a high-performance SQL database system optimized for analytical workloads. It can directly query Iceberg tables stored in your analytics buckets, making it ideal for data exploration and complex analytical queries.

## Installation

Install DuckDB and the Iceberg extension:

```bash
pip install duckdb duckdb-iceberg
```

## Connecting to Analytics buckets

Here's a complete example of connecting to your Supabase analytics bucket and querying Iceberg tables:

```python
import duckdb
import os

# Configuration
PROJECT_REF = "your-project-ref"
WAREHOUSE = "your-analytics-bucket-name"
SERVICE_KEY = "your-service-key"

# S3 credentials
S3_ACCESS_KEY = "your-access-key"
S3_SECRET_KEY = "your-secret-key"
S3_REGION = "us-east-1"

# Construct endpoints
S3_ENDPOINT = f"https://{PROJECT_REF}.supabase.co/storage/v1/s3"
CATALOG_URI = f"https://{PROJECT_REF}.supabase.co/storage/v1/iceberg"

# Initialize DuckDB connection
conn = duckdb.connect(":memory:")

# Install and load the Iceberg extension
conn.install_extension("iceberg")
conn.load_extension("iceberg")

# Configure Iceberg catalog with Supabase credentials
conn.execute(f"""
    CREATE SECRET (
        TYPE S3,
        KEY_ID '{S3_ACCESS_KEY}',
        SECRET '{S3_SECRET_KEY}',
        REGION '{S3_REGION}',
        ENDPOINT '{S3_ENDPOINT}',
        URL_STYLE 'virtual'
    );
""")

# Configure the REST catalog
conn.execute(f"""
    ATTACH 'iceberg://{CATALOG_URI}' AS iceberg_catalog
    (
        TYPE ICEBERG_REST,
        WAREHOUSE '{WAREHOUSE}',
        TOKEN '{SERVICE_KEY}'
    );
""")

# Query your Iceberg tables
result = conn.execute("""
    SELECT *
    FROM iceberg_catalog.default.events
    LIMIT 10
""").fetchall()

for row in result:
    print(row)

# Complex aggregation example
analytics = conn.execute("""
    SELECT
        event_name,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users
    FROM iceberg_catalog.default.events
    GROUP BY event_name
    ORDER BY event_count DESC
""").fetchdf()

print(analytics)
```

## Key features with DuckDB

### Efficient data exploration

DuckDB's lazy evaluation means it only scans the data you need:

```python
# This only reads the columns you select
events = conn.execute("""
    SELECT event_id, event_name, event_timestamp
    FROM iceberg_catalog.default.events
    WHERE event_timestamp > NOW() - INTERVAL '7 days'
""").fetchdf()
```

### Converting to Pandas

Convert results to Pandas DataFrames for further analysis:

```python
df = conn.execute("""
    SELECT *
    FROM iceberg_catalog.default.events
""").fetchdf()

# Use pandas for visualization or further processing
print(df.describe())
```

### Exporting results

Save your analytical results to various formats:

```python
# Export to Parquet
conn.execute("""
    COPY (
        SELECT * FROM iceberg_catalog.default.events
    ) TO 'results.parquet'
""")

# Export to CSV
conn.execute("""
    COPY (
        SELECT event_name, COUNT(*) as count
        FROM iceberg_catalog.default.events
        GROUP BY event_name
    ) TO 'summary.csv' (FORMAT CSV, HEADER true)
""")
```

## Best practices

- **Connection pooling** - Reuse connections for multiple queries
- **Partition pruning** - Filter by partition columns to improve query performance
- **Column selection** - Only select columns you need to reduce I/O
- **Limit results** - Use LIMIT during exploration to avoid processing large datasets

## Next steps

- [Query with Postgres](/docs/guides/storage/analytics/query-with-postgres)
- [Connect with PyIceberg](/docs/guides/storage/analytics/examples/pyiceberg)
- [Analyze with Apache Spark](/docs/guides/storage/analytics/examples/apache-spark)
