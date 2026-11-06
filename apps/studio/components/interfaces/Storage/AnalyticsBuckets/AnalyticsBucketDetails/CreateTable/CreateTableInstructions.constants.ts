export const getPyicebergSnippet = ({
  ref,
  warehouse,
  catalogUri,
  s3Endpoint,
  s3Region,
  s3AccessKey,
  s3SecretKey,
  token,
}: {
  ref?: string
  warehouse?: string
  catalogUri?: string
  s3Endpoint?: string
  s3Region?: string
  s3AccessKey?: string
  s3SecretKey?: string
  token?: string
}) =>
  `
from pyiceberg.catalog import load_catalog
import pyarrow as pa
import datetime

# Supabase project ref
PROJECT_REF = "${ref ?? '<your-supabase-project-ref>'}"

# Configuration for Iceberg REST Catalog
WAREHOUSE = "${warehouse ?? 'your-analytics-bucket-name'}"
TOKEN = "${token ?? '•••••••••••••'}"

# Configuration for S3-Compatible Storage
S3_ACCESS_KEY = "${s3AccessKey ?? '•••••••••••••'}"
S3_SECRET_KEY = "${s3SecretKey ?? '•••••••••••••'}"
S3_REGION = "${s3Region}"
S3_ENDPOINT = f"${s3Endpoint ?? 'https://{PROJECT_REF}.supabase.co/storage/v1/s3'}"
CATALOG_URI = f"${catalogUri ?? 'https://{PROJECT_REF}.supabase.co/storage/v1/iceberg'}"

# Load the Iceberg catalog
catalog = load_catalog(
    "supabase",
    type="rest",
    warehouse=WAREHOUSE,
    uri=CATALOG_URI,
    token=TOKEN,
    **{
        "py-io-impl": "pyiceberg.io.pyarrow.PyArrowFileIO",
        "s3.endpoint": S3_ENDPOINT,
        "s3.access-key-id": S3_ACCESS_KEY,
        "s3.secret-access-key": S3_SECRET_KEY,
        "s3.region": S3_REGION,
        "s3.force-virtual-addressing": False,
    },
)

# Create namespace if it doesn't exist
print("Creating catalog 'default'...")
catalog.create_namespace_if_not_exists("default")

# Define schema for your Iceberg table
schema = pa.schema([
    pa.field("event_id", pa.int64()),
    pa.field("event_name", pa.string()),
    pa.field("event_timestamp", pa.timestamp("ms")),
])

# Create table (if it doesn't exist already)
print("Creating table 'events'...")
table = catalog.create_table_if_not_exists(("default", "events"), schema=schema)

# Generate and insert sample data
print("Preparing sample data to be inserted...")
current_time = datetime.datetime.now()
data = pa.table({
    "event_id": [1, 2, 3],
    "event_name": ["login", "logout", "purchase"],
    "event_timestamp": [current_time, current_time, current_time],
})

# Append data to the Iceberg table
print("Inserting data into 'events'...")
table.append(data)

print("Completed!")
# Scan table and print data as pandas DataFrame
df = table.scan().to_pandas()
print(df)
`.trim()
