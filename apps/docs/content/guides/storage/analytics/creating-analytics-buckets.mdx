---
title: 'Creating Analytics Buckets'
subtitle: 'Set up your first analytics bucket using the SDK or dashboard.'
---

<Admonition type="caution">

This feature is in **Private Alpha**. API stability and backward compatibility are not guaranteed at this stage. Request access through this [form](https://forms.supabase.com/analytics-buckets).

</Admonition>

Analytics buckets use [Apache Iceberg](https://iceberg.apache.org/), an open-table format for efficient management of large analytical datasets. You can interact with analytics buckets using tools such as [PyIceberg](https://py.iceberg.apache.org/), [Apache Spark](https://spark.apache.org/), or any client supporting the [Iceberg REST Catalog API](https://editor-next.swagger.io/?url=https://raw.githubusercontent.com/apache/iceberg/main/open-api/rest-catalog-open-api.yaml).

## Creating an Analytics bucket

You can create an analytics bucket using either the Supabase SDK or the Supabase Dashboard.

### Using the Supabase SDK

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://your-project.supabase.co', 'your-service-key')

const { data, error } = await supabase.storage.analytics.createBucket('analytics-data')

if (error) {
  console.error('Failed to create analytics bucket:', error)
} else {
  console.log('Analytics bucket created:', data)
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client

supabase = create_client('https://your-project.supabase.co', 'your-service-key')

response = supabase.storage.analytics().create('analytics-data')

print('Analytics bucket created:', response)
```

</TabPanel>
</$Show>
</Tabs>

### Using the Supabase Dashboard

1. Navigate to the **Storage** section in the Supabase Dashboard.
2. Click **Create Bucket**.
3. Enter a name for your bucket (e.g., `my-analytics-bucket`).
4. Select **Analytics Bucket** as the bucket type.
5. Click **Create**.

<img alt="Create Analytics Bucket in Dashboard" src="/docs/img/storage/iceberg-bucket.png" />

## Next steps

Once you've created your analytics bucket, you can:

- [Connect with Iceberg clients](/docs/guides/storage/analytics/connecting-to-analytics-bucket) like PyIceberg or Apache Spark
- [Set up real-time replication](/docs/guides/storage/analytics/replication) from your Postgres database
- [Query data with Postgres](/docs/guides/storage/analytics/query-with-postgres) using the Iceberg Foreign Data Wrapper
