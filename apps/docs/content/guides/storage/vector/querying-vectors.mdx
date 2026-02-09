---
title: 'Querying Vectors'
subtitle: 'Perform similarity search and retrieve vectors using JavaScript SDK or PostgreSQL.'
---

<Admonition type="caution" title="This feature is in alpha">

Expect rapid changes, limited features, and possible breaking updates. [Share feedback](https://github.com/orgs/supabase/discussions/40116) as we refine the experience and expand access.

</Admonition>

Vector similarity search finds vectors most similar to a query vector using distance metrics. You can query vectors using the JavaScript SDK or directly from Postgres using SQL.

<Admonition type="tip" title="Comparison to pgvector">

Vector buckets and any [Foreign Data Wrappers (FDW)](/docs/guides/database/extensions/wrappers/overview) they use only support one similarity search algorithm, the `<===>` distance operator.

</Admonition>

## Basic similarity search

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

const index = supabase.storage.vectors.from('embeddings').index('documents-openai')

// Query with a vector embedding
const { data, error } = await index.queryVectors({
  queryVector: {
    float32: [0.1, 0.2, 0.3 /* ... embedding of 1536 dimensions ... */],
  },
  topK: 5,
  returnDistance: true,
  returnMetadata: true,
})

if (error) {
  console.error('Query failed:', error)
} else {
  // Results are ranked by similarity (lowest distance = most similar)
  data.vectors.forEach((result, rank) => {
    console.log(`${rank + 1}. ${result.metadata?.title}`)
    console.log(`   Similarity score: ${result.distance.toFixed(4)}`)
  })
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client

supabase = create_client('https://your-project.supabase.co', 'your-service-key')

index = supabase.storage.vectors().from_('embeddings').index('documents-openai')

# Query with a vector embedding
results = index.query(
    query_vector={'float32': [0.1, 0.2, 0.3]},  # ... embedding of 1536 dimensions
    topK=5,
    return_distance=True,
    return_metadata=True
)

if results:
    # Results are ranked by similarity (lowest distance = most similar)
    for rank, result in enumerate(results.vectors, 1):
        print(f'{rank}. {result.metadata.get("title") if result.metadata else "N/A"}')
        if result.distance is not None:
            print(f'   Similarity score: {result.distance:.4f}')
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Setup S3 Vector Wrapper (one-time setup)
-- https://supabase.com/docs/guides/database/extensions/wrappers/s3_vectors

-- Query similar vectors
SELECT
  key,
  metadata->>'title' as title,
  embd_distance(data) as distance,
  (1 - embd_distance(data)) as similarity_score
FROM s3_vectors.documents_openai
WHERE data <==> '[0.1, 0.2, 0.3, /* ... embedding ... */]'::embd
ORDER BY embd_distance(data) ASC
LIMIT 5;
```

</TabPanel>
</Tabs>

## Semantic search

Find documents similar to a query by embedding the query text:

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

const supabase = createClient(...)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function semanticSearch(query, topK = 5) {
  // Embed the query
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  })

  const queryVector = queryEmbedding.data[0].embedding

  // Search for similar vectors
  const { data, error } = await supabase.storage.vectors
    .from('embeddings')
    .index('documents-openai')
    .queryVectors({
      queryVector: { float32: queryVector },
      topK,
      returnDistance: true,
      returnMetadata: true
    })

  if (error) {
    throw error
  }

  return data.vectors.map((result) => ({
    id: result.key,
    title: result.metadata?.title,
    similarity: 1 - result.distance, // Convert distance to similarity (0-1)
    metadata: result.metadata
  }))
}

// Usage
const results = await semanticSearch('How do I use vector search?')
results.forEach((result) => {
  console.log(`${result.title} (${(result.similarity * 100).toFixed(1)}% similar)`)
})
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client
from openai import OpenAI
import os

supabase = create_client(...)
openai = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

async def semantic_search(query, top_k=5):
    # Embed the query
    query_embedding = openai.embeddings.create(
        model='text-embedding-3-small',
        input=query
    )

    query_vector = query_embedding.data[0].embedding

    # Search for similar vectors
    results = supabase.storage.vectors() \
        .from_('embeddings') \
        .index('documents-openai') \
        .query(
            query_vector={'float32': query_vector},
            topK=top_k,
            return_distance=True,
            return_metadata=True
        )

    return [
        {
            'id': result.key,
            'title': result.metadata.get('title') if result.metadata else None,
            'similarity': 1 - result.distance if result.distance else 0,  # Convert distance to similarity (0-1)
            'metadata': result.metadata
        }
        for result in results.vectors
    ]

# Usage
results = semantic_search('How do I use vector search?')
for result in results:
    print(f'{result["title"]} ({result["similarity"] * 100:.1f}% similar)')
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Semantic search from PostgreSQL
-- First, generate embedding from external API and store in a variable
-- Then use it to query vectors

WITH query_embedding AS (
  SELECT '[/* ... embedding from OpenAI API ... */]'::embd as embedding
)
SELECT
  key,
  metadata->>'title' as title,
  embd_distance(data) as distance,
  (1 - embd_distance(data)) as similarity_score
FROM s3_vectors.documents_openai,
     query_embedding
WHERE data <==> query_embedding.embedding
ORDER BY embd_distance(data) ASC
LIMIT 5;
```

</TabPanel>
</Tabs>

## Filtered similarity search

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
const index = supabase.storage.vectors
  .from('embeddings')
  .index('documents-openai')

// Search with metadata filter
const { data } = await index.queryVectors({
  queryVector: { float32: [...embedding...] },
  topK: 10,
  filter: {
    // Filter by metadata fields
    category: 'electronics',
    in_stock: true,
    price: { $lte: 500 } // Less than or equal to 500
  },
  returnDistance: true,
  returnMetadata: true
})
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
index = supabase.storage.vectors() \
    .from_('embeddings') \
    .index('documents-openai')

# Search with metadata filter
results = index.query(
    query_vector={'float32': [...embedding...]},
    topK=10,
    filter={
        # Filter by metadata fields
        'category': 'electronics',
        'in_stock': True,
        'price': {'$lte': 500}  # Less than or equal to 500
    },
    return_distance=True,
    return_metadata=True
)
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Search with metadata filters
SELECT
  key,
  metadata->>'title' as title,
  (metadata->>'price')::numeric as price,
  embd_distance(data) as distance,
  (1 - embd_distance(data)) as similarity
FROM s3_vectors.documents_openai
WHERE data <==> '[...]'::embd
  AND (metadata->>'category') = 'electronics'
  AND (metadata->>'in_stock')::boolean = true
  AND (metadata->>'price')::numeric <= 500
ORDER BY embd_distance(data) ASC
LIMIT 10;
```

</TabPanel>
</Tabs>

## Retrieving specific vectors

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
const index = supabase.storage.vectors.from('embeddings').index('documents-openai')

const { data, error } = await index.getVectors({
  keys: ['doc-1', 'doc-2', 'doc-3'],
  returnData: true,
  returnMetadata: true,
})

if (!error) {
  data.vectors.forEach((vector) => {
    console.log(`${vector.key}: ${vector.metadata?.title}`)
  })
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
index = supabase.storage.vectors().from_('embeddings').index('documents-openai')

results = index.get('doc-1', 'doc-2', 'doc-3', return_data=True, return_metadata=True)

if results:
    for vector in results.vectors:
        print(f'{vector.key}: {vector.metadata.get("title") if vector.metadata else "N/A"}')
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Retrieve specific vectors by key
select
  key,
  data as embedding,
  metadata
from s3_vectors.documents_openai
where key in ('doc-1', 'doc-2', 'doc-3');
```

</TabPanel>
</Tabs>

## Listing vectors

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
const index = supabase.storage.vectors.from('embeddings').index('documents-openai')

let nextToken = undefined
let pageCount = 0

do {
  const { data, error } = await index.listVectors({
    maxResults: 100,
    nextToken,
    returnData: false, // Don't return embeddings for faster response
    returnMetadata: true,
  })

  if (error) break

  pageCount++
  console.log(`Page ${pageCount}: ${data.vectors.length} vectors`)

  data.vectors.forEach((vector) => {
    console.log(`  - ${vector.key}: ${vector.metadata?.title}`)
  })

  nextToken = data.nextToken
} while (nextToken)
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
index = supabase.storage.vectors().from_('embeddings').index('documents-openai')

next_token = None
page_count = 0

while True:
    results = index.list(
        max_results=100,
        next_token=next_token,
        return_data=False,  # Don't return embeddings for faster response
        return_metadata=True
    )

    if not results:
        break

    page_count += 1
    print(f'Page {page_count}: {len(results.vectors)} vectors')

    for vector in results.vectors:
        print(f'  - {vector.key}: {vector.metadata.get("title") if vector.metadata else "N/A"}')

    next_token = results.nextToken
    if not next_token:
        break
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- List all vectors with pagination
select
  key,
  metadata
from s3_vectors.documents_openai
order by key asc
limit 100 offset 0;
-- To paginate, increase OFFSET for next page:
-- OFFSET 100 for page 2, OFFSET 200 for page 3, etc.
```

</TabPanel>
</Tabs>

## Hybrid search: Vectors + relational data

Combine similarity search with SQL filtering and joins:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
async function hybridSearch(queryVector, filters) {
  const index = supabase.storage.vectors.from('embeddings').index('documents-openai')

  // Get similar vectors with filters
  const { data: vectorResults } = await index.queryVectors({
    queryVector: { float32: queryVector },
    topK: 100,
    filter: filters,
    returnDistance: true,
    returnMetadata: true,
  })

  // Get additional details from relational database
  const { data: details } = await supabase
    .from('documents')
    .select('*')
    .in(
      'id',
      vectorResults.vectors.map((v) => v.metadata?.doc_id)
    )

  // Merge results
  return vectorResults.vectors.map((vector) => {
    const detail = details?.find((d) => d.id === vector.metadata?.doc_id)
    return {
      ...vector,
      ...detail,
    }
  })
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
def hybrid_search(query_vector, filters):
    index = supabase.storage.vectors().from_('embeddings').index('documents-openai')

    # Get similar vectors with filters
    vector_results = index.query(
        query_vector={'float32': query_vector},
        topK=100,
        filter=filters,
        return_distance=True,
        return_metadata=True
    )

    # Get additional details from relational database
    doc_ids = [v.metadata.get('doc_id') for v in vector_results.vectors if v.metadata and v.metadata.get('doc_id')]
    details_response = supabase.table('documents').select('*').in_('id', doc_ids).execute()
    details = details_response.data if details_response.data else []

    # Merge results
    return [
        {
            **vector.__dict__ if hasattr(vector, '__dict__') else {},
            **next((d for d in details if d['id'] == vector.metadata.get('doc_id')), {})
        }
        for vector in vector_results.vectors
    ]
```

</TabPanel>
</$Show>

<TabPanel id="sql" label="SQL (via S3 Vector Wrapper)">

```sql
-- Hybrid search: vectors + relational data join
SELECT
  v.key as vector_id,
  v.metadata->>'title' as vector_title,
  d.id as document_id,
  d.full_text,
  d.author,
  d.created_at,
  embd_distance(v.data) as similarity_score
FROM s3_vectors.documents_openai v
LEFT JOIN public.documents d
  ON v.metadata->>'doc_id' = d.id::text
WHERE v.data <==> '[...]'::embd
  AND embd_distance(v.data) < 0.3  -- High similarity threshold
  AND d.category = 'articles'
ORDER BY embd_distance(v.data) ASC
LIMIT 50;
```

</TabPanel>
</Tabs>

## Real-world examples

### RAG (retrieval-augmented generation)

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

async function retrieveContextForLLM(userQuery) {
  const supabase = createClient(...)
  const openai = new OpenAI()

  // 1. Embed the user query
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: userQuery
  })

  // 2. Retrieve relevant documents
  const { data: vectorResults } = await supabase.storage.vectors
    .from('embeddings')
    .index('documents-openai')
    .queryVectors({
      queryVector: { float32: queryEmbedding.data[0].embedding },
      topK: 5,
      returnMetadata: true
    })

  // 3. Use vectors to augment LLM prompt
  const context = vectorResults.vectors
    .map(v => v.metadata?.content || '')
    .join('\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Use the following context to answer the user's question:\n\n${context}`
      },
      {
        role: 'user',
        content: userQuery
      }
    ]
  })

  return response.choices[0].message.content
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from openai import OpenAI
from supabase import create_client

async def retrieve_context_for_llm(user_query):
    supabase = create_client(...)
    openai = OpenAI()

    # 1. Embed the user query
    query_embedding = openai.embeddings.create(
        model='text-embedding-3-small',
        input=user_query
    )

    # 2. Retrieve relevant documents
    vector_results = supabase.storage.vectors() \
        .from_('embeddings') \
        .index('documents-openai') \
        .query(
            query_vector={'float32': query_embedding.data[0].embedding},
            topK=5,
            return_metadata=True
        )

    # 3. Use vectors to augment LLM prompt
    context = '\n\n'.join(
        v.metadata.get('content', '') if v.metadata else ''
        for v in vector_results.vectors
    )

    response = openai.chat.completions.create(
        model='gpt-4',
        messages=[
            {
                'role': 'system',
                'content': f'Use the following context to answer the user\'s question:\n\n{context}'
            },
            {
                'role': 'user',
                'content': user_query
            }
        ]
    )

    return response.choices[0].message.content
```

</TabPanel>
</$Show>
</Tabs>

### Product recommendations

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
async function recommendProducts(userEmbedding, topK = 5) {
  const supabase = createClient(...)

  // Find similar products
  const { data } = await supabase.storage.vectors
    .from('embeddings')
    .index('products-openai')
    .queryVectors({
      queryVector: { float32: userEmbedding },
      topK,
      filter: {
        in_stock: true
      },
      returnMetadata: true
    })

  return data.vectors.map((result) => ({
    id: result.metadata?.product_id,
    name: result.metadata?.name,
    price: result.metadata?.price,
    similarity: 1 - result.distance
  }))
}
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
def recommend_products(user_embedding, top_k=5):
    supabase = create_client(...)

    # Find similar products
    results = supabase.storage.vectors() \
        .from_('embeddings') \
        .index('products-openai') \
        .query(
            query_vector={'float32': user_embedding},
            topK=top_k,
            filter={'in_stock': True},
            return_metadata=True
        )

    return [
        {
            'id': result.metadata.get('product_id') if result.metadata else None,
            'name': result.metadata.get('name') if result.metadata else None,
            'price': result.metadata.get('price') if result.metadata else None,
            'similarity': 1 - result.distance if result.distance else 0
        }
        for result in results.vectors
    ]
```

</TabPanel>
</$Show>
</Tabs>

### Filtering before similarity search

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="javascript"
  queryGroup="language"
>
<TabPanel id="javascript" label="JavaScript">

```typescript
// Use metadata filters to reduce search scope
const { data } = await index.queryVectors({
  queryVector,
  topK: 100,
  filter: {
    category: 'electronics', // Pre-filter by category
  },
})
```

</TabPanel>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
# Use metadata filters to reduce search scope
results = index.query(
    query_vector=query_vector,
    topK=100,
    filter={'category': 'electronics'}  # Pre-filter by category
)
```

</TabPanel>
</$Show>
</Tabs>

## Next steps

- [Store vectors](/docs/guides/storage/vector/storing-vectors)
- [Work with vector indexes](/docs/guides/storage/vector/working-with-indexes)
- [Explore vector bucket limits](/docs/guides/storage/vector/limits)
