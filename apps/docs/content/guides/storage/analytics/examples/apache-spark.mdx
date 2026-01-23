---
title: 'Apache Spark'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [Share feedback](https://github.com/orgs/supabase/discussions/40116) as we refine the experience and expand access.

</Admonition>

Apache Spark enables distributed analytical processing of large datasets stored in your analytics buckets. Use it for complex transformations, aggregations, and machine learning workflows.

## Installation

First, ensure you have Spark installed. For Python-based workflows:

```bash
pip install pyspark
```

For detailed Spark setup instructions, see the [Apache Spark documentation](https://spark.apache.org/docs/latest/).

## Basic setup

Here's a complete example showing how to configure Spark with your Supabase analytics bucket:

```python
from pyspark.sql import SparkSession

# Configuration - Update with your Supabase credentials
PROJECT_REF = "your-project-ref"
WAREHOUSE = "your-analytics-bucket-name"
SERVICE_KEY = "your-service-key"

# S3 credentials from Project Settings > Storage
S3_ACCESS_KEY = "your-access-key"
S3_SECRET_KEY = "your-secret-key"
S3_REGION = "us-east-1"

# Construct Supabase endpoints
S3_ENDPOINT = f"https://{PROJECT_REF}.supabase.co/storage/v1/s3"
CATALOG_URI = f"https://{PROJECT_REF}.supabase.co/storage/v1/iceberg"

# Initialize Spark session with Iceberg configuration
spark = SparkSession.builder \
    .master("local[*]") \
    .appName("SupabaseIceberg") \
    .config("spark.driver.host", "127.0.0.1") \
    .config("spark.driver.bindAddress", "127.0.0.1") \
    .config(
        'spark.jars.packages',
        'org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.6.1,org.apache.iceberg:iceberg-aws-bundle:1.6.1'
    ) \
    .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions") \
    .config("spark.sql.catalog.supabase", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.supabase.type", "rest") \
    .config("spark.sql.catalog.supabase.uri", CATALOG_URI) \
    .config("spark.sql.catalog.supabase.warehouse", WAREHOUSE) \
    .config("spark.sql.catalog.supabase.token", SERVICE_KEY) \
    .config("spark.sql.catalog.supabase.s3.endpoint", S3_ENDPOINT) \
    .config("spark.sql.catalog.supabase.s3.path-style-access", "true") \
    .config("spark.sql.catalog.supabase.s3.access-key-id", S3_ACCESS_KEY) \
    .config("spark.sql.catalog.supabase.s3.secret-access-key", S3_SECRET_KEY) \
    .config("spark.sql.catalog.supabase.s3.remote-signing-enabled", "false") \
    .config("spark.sql.defaultCatalog", "supabase") \
    .getOrCreate()

print("✓ Spark session initialized with Iceberg")
```

## Creating tables

```python
# Create a namespace for organization
spark.sql("CREATE NAMESPACE IF NOT EXISTS analytics")

# Create a new Iceberg table
spark.sql("""
    CREATE TABLE IF NOT EXISTS analytics.events (
        event_id BIGINT,
        user_id BIGINT,
        event_name STRING,
        event_timestamp TIMESTAMP,
        properties STRING
    )
    USING iceberg
""")

print("✓ Created table: analytics.events")
```

## Writing data

```python
# Insert data into the table
spark.sql("""
    INSERT INTO analytics.events (event_id, user_id, event_name, event_timestamp, properties)
    VALUES
        (1, 101, 'login', TIMESTAMP '2024-01-15 10:30:00', '{"browser":"chrome"}'),
        (2, 102, 'view_product', TIMESTAMP '2024-01-15 10:35:00', '{"product_id":"123"}'),
        (3, 101, 'logout', TIMESTAMP '2024-01-15 10:40:00', '{}'),
        (4, 103, 'purchase', TIMESTAMP '2024-01-15 10:45:00', '{"amount":99.99}')
""")

print("✓ Inserted 4 rows into analytics.events")
```

## Reading data

```python
# Read the entire table
result_df = spark.sql("SELECT * FROM analytics.events")
result_df.show(truncate=False)

# Apply filters
filtered_df = spark.sql("""
    SELECT event_id, user_id, event_name
    FROM analytics.events
    WHERE event_name = 'login'
""")
filtered_df.show()

# Aggregations
summary_df = spark.sql("""
    SELECT
        event_name,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users
    FROM analytics.events
    GROUP BY event_name
    ORDER BY event_count DESC
""")
summary_df.show()
```

## Advanced operations

### Working with dataframes

```python
# Read as DataFrame
events_df = spark.read.format("iceberg").load("analytics.events")

# Apply Spark transformations
from pyspark.sql.functions import count, col, year, month

# Monthly event counts
monthly_events = events_df \
    .withColumn("month", month(col("event_timestamp"))) \
    .withColumn("year", year(col("event_timestamp"))) \
    .groupBy("year", "month", "event_name") \
    .agg(count("event_id").alias("count")) \
    .orderBy("year", "month")

monthly_events.show()
```

### Joining tables

```python
# Create another table
spark.sql("""
    CREATE TABLE IF NOT EXISTS analytics.users (
        user_id BIGINT,
        username STRING,
        email STRING
    )
    USING iceberg
""")

spark.sql("""
    INSERT INTO analytics.users VALUES
        (101, 'alice', 'alice@example.com'),
        (102, 'bob', 'bob@example.com'),
        (103, 'charlie', 'charlie@example.com')
""")

# Join events with users
joined_df = spark.sql("""
    SELECT
        e.event_id,
        e.event_name,
        u.username,
        u.email,
        e.event_timestamp
    FROM analytics.events e
    JOIN analytics.users u ON e.user_id = u.user_id
    ORDER BY e.event_timestamp
""")

joined_df.show(truncate=False)
```

### Exporting results

```python
# Export to Parquet
spark.sql("""
    SELECT event_name, COUNT(*) as count
    FROM analytics.events
    GROUP BY event_name
""").write \
    .mode("overwrite") \
    .parquet("/tmp/event_summary.parquet")

# Export to CSV
spark.sql("""
    SELECT *
    FROM analytics.events
    WHERE event_timestamp > TIMESTAMP '2024-01-15 10:30:00'
""").write \
    .mode("overwrite") \
    .option("header", "true") \
    .csv("/tmp/recent_events.csv")

print("✓ Results exported")
```

## Performance best practices

- **Partition tables** - Partition large tables by date or region for faster queries
- **Select columns** - Only select columns you need to reduce I/O
- **Use filters early** - Apply WHERE clauses to reduce data processed
- **Cache frequently accessed tables** - Use `spark.catalog.cacheTable()` for tables accessed multiple times
- **Cluster mode** - Use cluster mode for production workloads instead of local mode

## Complete example: Data processing pipeline

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, year, month, count

# Setup (see Basic Setup section above)
spark = SparkSession.builder \
    .master("local[*]") \
    .appName("SupabaseAnalytics") \
    .config("spark.sql.defaultCatalog", "supabase") \
    # ... (add all config from Basic Setup)
    .getOrCreate()

# Step 1: Read raw events
raw_events = spark.sql("SELECT * FROM analytics.events")

# Step 2: Transform and aggregate
monthly_summary = raw_events \
    .withColumn("month", month(col("event_timestamp"))) \
    .withColumn("year", year(col("event_timestamp"))) \
    .groupBy("year", "month", "event_name") \
    .agg(count("event_id").alias("total_events"))

# Step 3: Save results
monthly_summary.write \
    .mode("overwrite") \
    .option("path", "analytics.monthly_summary") \
    .saveAsTable("analytics.monthly_summary")

print("✓ Pipeline completed")
monthly_summary.show()
```

## Next steps

- [Query with Postgres](/docs/guides/storage/analytics/query-with-postgres)
- [Connect with PyIceberg](/docs/guides/storage/analytics/examples/pyiceberg)
- [Explore with DuckDB](/docs/guides/storage/analytics/examples/duckdb)
