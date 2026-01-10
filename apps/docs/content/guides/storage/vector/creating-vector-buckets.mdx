---
title: 'Creating Vector Buckets'
subtitle: 'Set up vector buckets and indexes using the dashboard or JavaScript SDK.'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [Share feedback](https://github.com/orgs/supabase/discussions/40116) as we refine the experience and expand access.

</Admonition>

Vector buckets organize your vector data into logical units. Within each bucket, you create indexes that define how vectors are stored and searched based on their dimensions and distance metrics.

## Creating a Vector bucket

You can create vector buckets using either the Supabase Dashboard or the SDK.

### Using the Supabase Dashboard

1. Navigate to the **Storage** section in the Supabase Dashboard.
2. Click **Create Bucket**.
3. Enter a name for your bucket (e.g., `embeddings` or `semantic-search`).
4. Select **Vector Bucket** as the bucket type.
5. Click **Create**.

Your vector bucket is now ready. The next step is to create indexes within it.

### Using the SDK

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

// Create a vector bucket
await supabase.storage.vectors.createBucket('embeddings')

console.log('✓ Vector bucket created: embeddings')
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client

supabase = create_client('https://your-project.supabase.co', 'your-service-key')

# Create a vector bucket
supabase.storage.vectors().create_bucket('embeddings')

print('✓ Vector bucket created: embeddings')
```

</TabPanel>
</$Show>
</Tabs>

## Creating indexes

Indexes organize vectors within a bucket with consistent dimensions and distance metrics. For comprehensive index management documentation, see [Working with Vector Indexes](/docs/guides/storage/vector/working-with-indexes).

### Quick start: Creating an index via Dashboard

1. Open your vector bucket.
2. Click **Create Index**.
3. Enter an index name (e.g., `documents-openai`).
4. Set the dimension matching your embeddings (e.g., `1536` for OpenAI's text-embedding-3-small).
5. Select the distance metric (`cosine`, `euclidean`, or `l2`).
6. Click **Create**.

### Quick start: Creating an index via SDK

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
const bucket = supabase.storage.vectors.from('embeddings')

// Create an index
await bucket.createIndex({
  indexName: 'documents-openai',
  dataType: 'float32',
  dimension: 1536,
  distanceMetric: 'cosine',
})

console.log('✓ Index created: documents-openai')
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
bucket = supabase.storage.vectors().from_('embeddings')

# Create an index
bucket.create_index(
    index_name='documents-openai',
    dimension=1536,
    distance_metric='cosine',
    data_type='float32'
)

print('✓ Index created: documents-openai')
```

</TabPanel>
</$Show>
</Tabs>

### Key details

- **Dimension** must match your embedding model (e.g., 1536 for OpenAI)
- **Distance metric** (`cosine`, `euclidean`, or `l2`) is immutable after creation
- **Maximum indexes per bucket**: 10
- **Maximum batch size**: 500 vectors per operation

For detailed information on distance metrics, embedding dimensions, managing multiple indexes, and advanced index operations, see [Working with Vector Indexes](/docs/guides/storage/vector/working-with-indexes).

## Next steps

After creating your bucket and indexes, you can:

- [Store vectors](/docs/guides/storage/vector/storing-vectors)
- [Query vectors with similarity search](/docs/guides/storage/vector/querying-vectors)
- [Explore vector bucket limits](/docs/guides/storage/vector/limits)
