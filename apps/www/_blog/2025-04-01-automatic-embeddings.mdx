---
title: 'Automatic Embeddings in Postgres'
description: Automatic embeddings move the vector generation step into Postgres
categories:
  - launch-week
  - product
tags:
  - launch-week
  - postgres
date: '2025-04-01T00:00:00'
toc_depth: 3
author: gregnr
imgSocial: lw14-automatic-embeddings/automatic-embeddings-og.png
imgThumb: lw14-automatic-embeddings/automatic-embeddings-thumb.png
launchweek: '14'
---

Today we’re releasing [automatic embeddings](/docs/guides/ai/automatic-embeddings) - automate embedding generation and updates using Supabase [Vector](/modules/vector), [Queues](/modules/queues), [Cron](/modules/cron), and [pg_net](/docs/guides/database/extensions/pg_net) extension, and [Edge Functions](/edge-functions).

Embeddings power features like semantic search, recommendations, and retrieval-augmented generation (RAG). They represent text or other content as high-dimensional vectors. At query time, you convert the input into a vector and compare it to stored vectors to find similar items.

Postgres with [`pgvector`](https://github.com/pgvector/pgvector) already supports storing and searching over vectors. But generating and maintaining those embeddings has been left to the application. This often means building a separate pipeline just to keep vector data in sync.

Automatic embeddings bring that pipeline into the database. You can manage embedding generation using SQL, triggers, and extensions like `pgmq`, `pg_cron`, and `pg_net`. No new runtimes or services are required.

## The problem: external embedding pipelines create drift and complexity

Most teams implementing semantic features in Postgres end up building their own pipeline. The general pattern looks like this:

1. Store source content (e.g. documents, tickets, articles)
2. Generate an embedding using an external model
3. Store the result in a vector column
4. Re-run the embedding job if the content changes
5. Handle retries if the model fails or times out

This pipeline is easy to describe but hard to implement. It introduces inconsistency between your source of truth (Postgres) and derived data (the embeddings). It also requires background workers, queues, observability, and external coordination.

Here are some ways this pipeline can fall apart:

- **Drift**. If you update the content but forget to re-embed it, your search quality drops.
- **Latency**. Some embedding APIs are slow or rate-limited. If you call them synchronously on write, you add latency to the write path.
- **Lack of resilience**. If your background worker dies or the queue fails, you may not notice until things break.
- **Schema duplication**. Your application ends up duplicating logic that could live in the schema.

## What are automatic embeddings?

Automatic embeddings move the vector generation step into Postgres. Not literally. Inference still happens via an external model, but the responsibility for coordinating that process becomes part of your database.

When a row is inserted or updated, Postgres can automatically enqueue a job to generate or refresh its embedding. That job runs in the background, retries if it fails, and stores the result back into the vector column.

This approach has a few benefits:

- **No drift**. Embeddings stay in sync with content updates.
- **Bring your own model**. You can point to any API that returns a vector.
- **All SQL**. You can enqueue, inspect, and retry embedding jobs without leaving Postgres.

A number of use cases get easier when embeddings are automatically managed:

- Build semantic search without leaving SQL
- Keep embeddings fresh as data changes
- Use vector search for deduplication or anomaly detection
- Combine structured and semantic filters in a single query
- Enrich or classify rows using embedding-based inheritance

## Design patterns for generating embeddings

There are two approaches to automatic embeddings today:

### Generated columns

```sql
create table documents (
  id uuid primary key,
  content text,
  embedding vector(1536) generated always as (embed(content)) stored
);
```

This uses a generated column to call an embedding function on write. It only works if your model is local and fast. In practice, this approach with the `embed()` function blocks the write path and doesn’t scale well.

### Trigger-based asynchronous embeddings

This is the pattern we use at Supabase. It uses a few common extensions:

- SQL triggers to enqueue work when rows are inserted or updates
- `pgmq` to enqueue embedding jobs inside a transactional message queue
- `pg_net` to send async HTTP requests to an Edge Function (and in turn, embedding provider like OpenAI)
- `pg_cron` to run workers that process the queue
- `pgvector` for storing and searching over embeddings

You can inspect the queue, retry failed jobs, and customize the Edge Function used to generate embeddings. You can find the complete reference implementation in the [Supabase Automatic Embeddings Guide](/docs/guides/ai/automatic-embeddings).

## How to use automatic embeddings

After applying the implementation from the guide, it is as easy as adding two triggers to a table.

### Set up the table

First let’s create a `documents` table with an `embedding` column to store the vector.

```sql
-- Table to store documents with embeddings
create table documents (
  id integer primary key generated always as identity,
  title text not null,
  content text not null,
  embedding halfvec(1536),
  created_at timestamp with time zone default now()
);

-- Index for vector search over document embeddings
create index on documents using hnsw (embedding halfvec_cosine_ops);
```

### Create the embedding pipeline

Next we create an `embedding_input` function that tells the embedding generator what to use as the source content:

```sql
-- Customize the input for embedding generation
-- e.g. Concatenate title and content with a markdown header
create or replace function embedding_input(doc documents)
returns text
language plpgsql
immutable
as $$
begin
  return '# ' || doc.title || E'\n\n' || doc.content;
end;
$$;
```

This is useful for many embedding pipelines where you want your embedding to represent a combination of multiple text columns like title + content instead of a single column.

Finally we add two triggers:

```sql
-- Trigger for insert events
create trigger embed_documents_on_insert
  after insert
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');

-- Trigger for update events
create trigger embed_documents_on_update
  after update of title, content -- must match the columns in embedding_input()
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');
```

These ensure that embeddings are updated for both new records (inserts) and modified records (updates). Note that these triggers fire off “embedding jobs” that run asynchronously instead of blocking the write path with a long-running operation.

Under the hood, `pg_cron` will batch embedding jobs at an interval and send them off to an Edge Function to perform the actual embedding generation. The default generation logic looks something like this:

```ts
/**
 * Generates an embedding for the given text.
 */
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  const [data] = response.data
  if (!data) {
    throw new Error('failed to generate embedding')
  }
  return data.embedding
}
```

But you can adjust this to use any inference API and model that you prefer.

### Generate automatic embeddings and query the table

Now, you can insert a new document into your table:

```sql
insert into documents (title, content)
values
  ('Understanding Vector Databases', 'Vector databases are specialized...');
```

This will kick off the embedding pipeline within a Supabase Edge Function. If you were to immediately query for the document you just inserted, the `embedding` column will be empty:

```sql
select id, embedding
from documents
where title = 'Understanding Vector Databases';
```

However, if you were to retry in a few seconds, the `embedding` column will be populated correctly. This is because the pipeline is asynchronous and the Edge Function will be working in the background to generate the embedding and store it properly.

Similarly, if you were to come back and update the row you added to the `documents` table, at first the `embedding` column will be null because the trigger initially resets it. The trigger also queues up the Edge Function that will generate and populate the `embedding` column, which should complete within seconds. This keeps your data and its associated embedding in sync.

## Conclusion

You can get started with automatic embeddings today:

- [Read the full implementation details](/docs/guides/ai/automatic-embeddings) in our docs
- [Get started with Supabase](/dashboard/sign-in?returnTo=%2Fprojects) and try it out today
