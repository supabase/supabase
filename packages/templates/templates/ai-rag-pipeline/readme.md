# RAG pipeline template

A turn-key retrieval-augmented generation setup. POST text to `rag-ingest` and it is chunked, embedded, and stored. POST a question to `rag-query` and the top matching chunks come back, ready to drop into a model prompt.

## How it works

1. Client calls `rag-ingest` with `{ source, content, metadata? }`.
2. The function inserts a `public.rag_documents` row and splits the content into ~1,000-character chunks in `public.rag_chunks`.
3. A trigger enqueues each chunk on the `rag_embedding_jobs` `pgmq` queue.
4. A `pg_cron` job drains the queue every 10 seconds and invokes the `rag-embed` worker.
5. The worker calls OpenAI's embedding API and writes the vectors back to `rag_chunks`.
6. Clients call `rag-query` with a question — the function embeds the query and returns the closest chunks via the `match_rag_chunks` SQL helper.

## Includes

- `supabase/schemas/rag.sql` — documents, chunks, HNSW index, queue, cron, and trigger
- `supabase/functions/rag-ingest/index.ts` — accepts text, splits into chunks
- `supabase/functions/rag-embed/index.ts` — batch worker invoked by `pg_cron`
- `supabase/functions/rag-query/index.ts` — embeds a query and returns matches
- `supabase/seed.sql` — local `project_url` secret used by `pg_net`

## Configuration

Set `OPENAI_API_KEY` on the project (`supabase secrets set OPENAI_API_KEY=...`). The pipeline uses `text-embedding-3-small` (1536 dimensions); change `embedding_dim` in `rag.sql` and the model name in the worker if you switch.

## Dependencies

Requires **database**, **api**, and **functions**. Optional: **queues** (the schema enables `pgmq` itself) and **ai-vector-search** if you want the generic `documents` table side by side.
