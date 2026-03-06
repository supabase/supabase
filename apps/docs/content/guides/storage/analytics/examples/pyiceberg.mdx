---
title: 'PyIceberg'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [Share feedback](https://github.com/orgs/supabase/discussions/40116) as we refine the experience and expand access.

</Admonition>

PyIceberg is a Python client for Apache Iceberg that enables programmatic interaction with Iceberg tables. Use it to create, read, update, and delete data in your analytics buckets.

## Installation

```bash
pip install pyiceberg pyarrow
```

## Basic setup

Here's a complete example showing how to connect to your Supabase analytics bucket and perform operations:

```python
from pyiceberg.catalog import load_catalog
import pyarrow as pa
import datetime

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

# Load the Iceberg REST Catalog
catalog = load_catalog(
    "supabase-analytics",
    type="rest",
    warehouse=WAREHOUSE,
    uri=CATALOG_URI,
    token=SERVICE_KEY,
    **{
        "py-io-impl": "pyiceberg.io.pyarrow.PyArrowFileIO",
        "s3.endpoint": S3_ENDPOINT,
        "s3.access-key-id": S3_ACCESS_KEY,
        "s3.secret-access-key": S3_SECRET_KEY,
        "s3.region": S3_REGION,
        "s3.force-virtual-addressing": False,
    },
)

print("✓ Successfully connected to Iceberg catalog")
```

## Creating tables

```python
# Create a namespace for organization
catalog.create_namespace_if_not_exists("analytics")

# Define the schema for your Iceberg table
schema = pa.schema([
    pa.field("event_id", pa.int64()),
    pa.field("user_id", pa.int64()),
    pa.field("event_name", pa.string()),
    pa.field("event_timestamp", pa.timestamp("ms")),
    pa.field("properties", pa.string()),
])

# Create the table
table = catalog.create_table_if_not_exists(
    ("analytics", "events"),
    schema=schema
)

print("✓ Created table: analytics.events")
```

## Writing data

```python
import datetime

# Prepare your data
current_time = datetime.datetime.now()
data = pa.table({
    "event_id": [1, 2, 3, 4, 5],
    "user_id": [101, 102, 101, 103, 102],
    "event_name": ["login", "view_product", "logout", "purchase", "login"],
    "event_timestamp": [current_time] * 5,
    "properties": [
        '{"browser":"chrome"}',
        '{"product_id":"123"}',
        '{}',
        '{"amount":99.99}',
        '{"browser":"firefox"}'
    ],
})

# Append data to the table
table.append(data)
print("✓ Appended 5 rows to analytics.events")
```

## Reading data

```python
# Scan the entire table
scan_result = table.scan().to_pandas()
print(f"Total rows: {len(scan_result)}")
print(scan_result.head())

# Query with filters
filtered = table.scan(
    filter="event_name = 'login'"
).to_pandas()
print(f"Login events: {len(filtered)}")

# Select specific columns
selected = table.scan(
    selected_fields=["user_id", "event_name", "event_timestamp"]
).to_pandas()
print(selected.head())
```

## Advanced operations

### Listing tables and namespaces

```python
# List all namespaces
namespaces = catalog.list_namespaces()
print("Namespaces:", namespaces)

# List tables in a namespace
tables = catalog.list_tables("analytics")
print("Tables in analytics:", tables)

# Get table metadata
table_metadata = catalog.load_table(("analytics", "events"))
print("Schema:", table_metadata.schema())
print("Partitions:", table_metadata.partitions())
```

### Handling errors

```python
try:
    # Attempt to load a table
    table = catalog.load_table(("analytics", "nonexistent"))
except Exception as e:
    print(f"Error loading table: {e}")

# Check if table exists before creating
namespace = "analytics"
table_name = "events"

try:
    existing_table = catalog.load_table((namespace, table_name))
    print(f"Table already exists")
except Exception:
    print(f"Table does not exist, creating...")
    table = catalog.create_table((namespace, table_name), schema=schema)
```

## Performance tips

- **Batch writes** - Insert data in batches rather than row-by-row for better performance
- **Partition strategies** - Use partitioning for large tables to improve query performance
- **Schema evolution** - PyIceberg supports schema changes without rewriting data
- **Data format** - Use Parquet for efficient columnar storage

## Complete example: ETL pipeline

```python
from pyiceberg.catalog import load_catalog
import pyarrow as pa
import pandas as pd

# Setup (see Basic Setup section above)
catalog = load_catalog(...)

# Step 1: Create analytics namespace
catalog.create_namespace_if_not_exists("warehouse")

# Step 2: Define table schema
schema = pa.schema([
    pa.field("id", pa.int64()),
    pa.field("name", pa.string()),
    pa.field("created_at", pa.timestamp("ms")),
])

# Step 3: Create table
table = catalog.create_table_if_not_exists(
    ("warehouse", "products"),
    schema=schema
)

# Step 4: Load data from CSV or database
df = pd.read_csv("products.csv")
data = pa.Table.from_pandas(df)

# Step 5: Write to analytics bucket
table.append(data)
print(f"✓ Loaded {len(data)} products to warehouse.products")

# Step 6: Verify
result = table.scan().to_pandas()
print(result.describe())
```

## Next steps

- [Query with Postgres](/docs/guides/storage/analytics/query-with-postgres)
- [Analyze with Apache Spark](/docs/guides/storage/analytics/examples/apache-spark)
- [Explore with DuckDB](/docs/guides/storage/analytics/examples/duckdb)
