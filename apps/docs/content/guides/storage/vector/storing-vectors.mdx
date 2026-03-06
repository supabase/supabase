---
title: 'Storing Vectors'
subtitle: 'Insert and update vector embeddings with metadata using the JavaScript SDK or Postgres.'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [Share feedback](https://github.com/orgs/supabase/discussions/40116) as we refine the experience and expand access.

</Admonition>

Once you've created a bucket and index, you can start storing vectors. Vectors can include optional metadata for filtering and enrichment during queries.

## Basic vector insertion

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

// Get bucket and index
const bucket = supabase.storage.vectors.from('embeddings')
const index = bucket.index('documents-openai')

// Insert vectors
const { error } = await index.putVectors({
  vectors: [
    {
      key: 'doc-1',
      data: {
        float32: [0.1, 0.2, 0.3 /* ... rest of embedding ... */],
      },
      metadata: {
        title: 'Getting Started with Vector Buckets',
        source: 'documentation',
      },
    },
    {
      key: 'doc-2',
      data: {
        float32: [0.4, 0.5, 0.6 /* ... rest of embedding ... */],
      },
      metadata: {
        title: 'Advanced Vector Search',
        source: 'blog',
      },
    },
  ],
})

if (error) {
  console.error('Error storing vectors:', error)
} else {
  console.log('✓ Vectors stored successfully')
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client

supabase = create_client('https://your-project.supabase.co', 'your-service-key')

# Get bucket and index
bucket = supabase.storage.vectors().from_('embeddings')
index = bucket.index('documents-openai')

# Insert vectors
index.put([
    {
        'key': 'doc-1',
        'data': {'float32': [0.1, 0.2, 0.3]},  # ... rest of embedding
        'metadata': {
            'title': 'Getting Started with Vector Buckets',
            'source': 'documentation',
        },
    },
    {
        'key': 'doc-2',
        'data': {'float32': [0.4, 0.5, 0.6]},  # ... rest of embedding
        'metadata': {
            'title': 'Advanced Vector Search',
            'source': 'blog',
        },
    },
])

print('✓ Vectors stored successfully')
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Setup S3 Vector Wrapper (one-time setup)
-- https://supabase.com/docs/guides/database/extensions/wrappers/s3_vectors

-- Insert vectors into the index
INSERT INTO s3_vectors.documents_openai (key, data, metadata)
VALUES
  (
    'doc-1',
    '[0.1, 0.2, 0.3, /* ... rest of embedding ... */]'::embd,
    '{"title": "Getting Started with Vector Buckets", "source": "documentation"}'::jsonb
  ),
  (
    'doc-2',
    '[0.4, 0.5, 0.6, /* ... rest of embedding ... */]'::embd,
    '{"title": "Advanced Vector Search", "source": "blog"}'::jsonb
  );
```

</TabPanel>
</Tabs>

## Storing vectors from Embeddings API

Generate embeddings using an LLM API and store them directly:

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
import OpenAI from 'openai'

const supabase = createClient('https://your-project.supabase.co', 'your-service-key')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Documents to embed and store
const documents = [
  { id: '1', title: 'How to Train Your AI', content: 'Guide for training models...' },
  { id: '2', title: 'Vector Search Best Practices', content: 'Tips for semantic search...' },
  {
    id: '3',
    title: 'Building RAG Systems',
    content: 'Implementing retrieval-augmented generation...',
  },
]

// Generate embeddings
const embeddings = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: documents.map((doc) => doc.content),
})

// Prepare vectors for storage
const vectors = documents.map((doc, index) => ({
  key: doc.id,
  data: {
    float32: embeddings.data[index].embedding,
  },
  metadata: {
    title: doc.title,
    source: 'knowledge_base',
    created_at: new Date().toISOString(),
  },
}))

// Store vectors in batches (max 500 per request)
const bucket = supabase.storage.vectors.from('embeddings')
const vectorIndex = bucket.index('documents-openai')

for (let i = 0; i < vectors.length; i += 500) {
  const batch = vectors.slice(i, i + 500)
  const { error } = await vectorIndex.putVectors({ vectors: batch })

  if (error) {
    console.error(`Error storing batch ${i / 500 + 1}:`, error)
  } else {
    console.log(`✓ Stored batch ${i / 500 + 1} (${batch.length} vectors)`)
  }
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client
from openai import OpenAI
from datetime import datetime

supabase = create_client('https://your-project.supabase.co', 'your-service-key')
openai = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# Documents to embed and store
documents = [
    {'id': '1', 'title': 'How to Train Your AI', 'content': 'Guide for training models...'},
    {'id': '2', 'title': 'Vector Search Best Practices', 'content': 'Tips for semantic search...'},
    {'id': '3', 'title': 'Building RAG Systems', 'content': 'Implementing retrieval-augmented generation...'},
]

# Generate embeddings
embeddings_response = openai.embeddings.create(
    model='text-embedding-3-small',
    input=[doc['content'] for doc in documents]
)

# Prepare vectors for storage
vectors = []
for doc, embedding_data in zip(documents, embeddings_response.data):
    vectors.append({
        'key': doc['id'],
        'data': {'float32': embedding_data.embedding},
        'metadata': {
            'title': doc['title'],
            'source': 'knowledge_base',
            'created_at': datetime.now().isoformat(),
        },
    })

# Store vectors in batches (max 500 per request)
bucket = supabase.storage.vectors().from_('embeddings')
vector_index = bucket.index('documents-openai')

batch_size = 500
for i in range(0, len(vectors), batch_size):
    batch = vectors[i:i + batch_size]
    vector_index.put(batch)
    print(f'✓ Stored batch {i // batch_size + 1} ({len(batch)} vectors)')
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Insert vectors with pre-generated embeddings
INSERT INTO s3_vectors.documents_openai (key, data, metadata)
VALUES
  (
    '1',
    '[0.1, 0.2, 0.3, /* ... rest of embedding ... */]'::embd,
    '{"title": "How to Train Your AI", "source": "knowledge_base", "created_at": "2025-01-01T00:00:00Z"}'::jsonb
  ),
  (
    '2',
    '[0.4, 0.5, 0.6, /* ... rest of embedding ... */]'::embd,
    '{"title": "Vector Search Best Practices", "source": "knowledge_base", "created_at": "2025-01-01T00:00:00Z"}'::jsonb
  ),
  (
    '3',
    '[0.7, 0.8, 0.9, /* ... rest of embedding ... */]'::embd,
    '{"title": "Building RAG Systems", "source": "knowledge_base", "created_at": "2025-01-01T00:00:00Z"}'::jsonb
  );
```

</TabPanel>
</Tabs>

## Updating vectors

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
const index = bucket.index('documents-openai')

// Update a vector (same key)
const { error } = await index.putVectors({
  vectors: [
    {
      key: 'doc-1',
      data: {
        float32: [0.15, 0.25, 0.35 /* ... updated embedding ... */],
      },
      metadata: {
        title: 'Getting Started with Vector Buckets - Updated',
        updated_at: new Date().toISOString(),
      },
    },
  ],
})

if (!error) {
  console.log('✓ Vector updated successfully')
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
index = bucket.index('documents-openai')

# Update a vector (same key)
index.put([
    {
        'key': 'doc-1',
        'data': {'float32': [0.15, 0.25, 0.35]},  # ... updated embedding
        'metadata': {
            'title': 'Getting Started with Vector Buckets - Updated',
            'updated_at': datetime.now().isoformat(),
        },
    },
])

print('✓ Vector updated successfully')
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Update a vector (delete and re-insert)
DELETE FROM s3_vectors.documents_openai WHERE key = 'doc-1';

INSERT INTO s3_vectors.documents_openai (key, data, metadata)
VALUES (
  'doc-1',
  '[0.15, 0.25, 0.35, /* ... updated embedding ... */]'::embd,
  '{"title": "Getting Started with Vector Buckets - Updated", "updated_at": "2025-01-01T00:00:00Z"}'::jsonb
);
```

</TabPanel>
</Tabs>

## Deleting vectors

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
const index = bucket.index('documents-openai')

// Delete specific vectors
const { error } = await index.deleteVectors({
  keys: ['doc-1', 'doc-2'],
})

if (!error) {
  console.log('✓ Vectors deleted successfully')
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
index = bucket.index('documents-openai')

# Delete specific vectors
index.delete(['doc-1', 'doc-2'])

print('✓ Vectors deleted successfully')
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Delete vectors by key
delete from s3_vectors.documents_openai
where key in ('doc-1', 'doc-2');
```

</TabPanel>
</Tabs>

## Metadata best practices

Metadata makes vectors more useful by enabling filtering and context:

```typescript
const vectors = [
  {
    key: 'product-001',
    data: { float32: [...] },
    metadata: {
      product_id: 'prod-001',
      category: 'electronics',
      price: 299.99,
      in_stock: true,
      tags: ['laptop', 'portable'],
      description: 'High-performance ultrabook'
    }
  },
  {
    key: 'product-002',
    data: { float32: [...] },
    metadata: {
      product_id: 'prod-002',
      category: 'electronics',
      price: 99.99,
      in_stock: true,
      tags: ['headphones', 'wireless'],
      description: 'Noise-cancelling wireless headphones'
    }
  }
]

const { error } = await index.putVectors({ vectors })
```

### Metadata field guidelines

- **Keep it lightweight** - Metadata is returned with query results, so large values increase response size
- **Use consistent types** - Store the same field with consistent data types across vectors
- **Index key fields** - Mark fields you'll filter by to improve query performance
- **Avoid nested objects** - While supported, flat structures are easier to filter

## Batch processing large datasets

For storing large numbers of vectors efficiently:

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
import fs from 'fs'

const supabase = createClient(...)
const index = supabase.storage.vectors
  .from('embeddings')
  .index('documents-openai')

// Read embeddings from file
const embeddingsFile = fs.readFileSync('embeddings.jsonl', 'utf-8')
const lines = embeddingsFile.split('\n').filter(line => line.trim())

const vectors = lines.map((line, idx) => {
  const { key, embedding, metadata } = JSON.parse(line)
  return {
    key,
    data: { float32: embedding },
    metadata
  }
})

// Process in batches
const BATCH_SIZE = 500
let processed = 0

for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
  const batch = vectors.slice(i, i + BATCH_SIZE)

  try {
    const { error } = await index.putVectors({ vectors: batch })

    if (error) throw error

    processed += batch.length
    console.log(`Progress: ${processed}/${vectors.length}`)
  } catch (error) {
    console.error(`Batch failed at offset ${i}:`, error)
    // Optionally implement retry logic
  }
}

console.log('✓ All vectors stored successfully')
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client
import json

supabase = create_client(...)
index = supabase.storage.vectors().from_('embeddings').index('documents-openai')

# Read embeddings from file
with open('embeddings.jsonl', 'r') as f:
    lines = [line.strip() for line in f if line.strip()]

vectors = []
for line in lines:
    data = json.loads(line)
    vectors.append({
        'key': data['key'],
        'data': {'float32': data['embedding']},
        'metadata': data.get('metadata', {})
    })

# Process in batches
BATCH_SIZE = 500
processed = 0

for i in range(0, len(vectors), BATCH_SIZE):
    batch = vectors[i:i + BATCH_SIZE]

    try:
        index.put(batch)
        processed += len(batch)
        print(f'Progress: {processed}/{len(vectors)}')
    except Exception as e:
        print(f'Batch failed at offset {i}: {e}')
        # Optionally implement retry logic

print('✓ All vectors stored successfully')
```

</TabPanel>
</$Show>
</Tabs>

## Performance optimization

### Batch operations

Always use batch operations for better performance:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
// ❌ Inefficient - Multiple requests
for (const vector of vectors) {
  await index.putVectors({ vectors: [vector] })
}

// ✅ Efficient - Single batch operation
await index.putVectors({ vectors })
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
# ❌ Inefficient - Multiple requests
for vector in vectors:
    index.put([vector])

# ✅ Efficient - Single batch operation
index.put(vectors)
```

</TabPanel>
</$Show>
</Tabs>

### Metadata considerations

Keep metadata concise:

```typescript
// ❌ Large metadata
metadata: {
  full_document_text: 'Very long document content...',
  detailed_analysis: { /* large object */ }
}

// ✅ Lean metadata
metadata: {
  doc_id: 'doc-123',
  category: 'news',
  summary: 'Brief summary'
}
```

## Next steps

- [Query vectors with similarity search](/docs/guides/storage/vector/querying-vectors)
- [Work with vector indexes](/docs/guides/storage/vector/working-with-indexes)
- [Explore vector bucket limits](/docs/guides/storage/vector/limits)
