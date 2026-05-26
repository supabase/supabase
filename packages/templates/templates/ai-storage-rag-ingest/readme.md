# Storage RAG ingest template

Extends **RAG Pipeline** with file uploads. Files uploaded to the private `rag-files` bucket are downloaded by an Edge Function, converted to text, and inserted into the existing `rag_documents` and `rag_chunks` tables.

## How it works

1. A user uploads a `.txt`, `.md`, or `.markdown` file to `rag-files/<user_id>/...`.
2. A trigger on `storage.objects` creates a `public.rag_file_ingestions` row.
3. The trigger invokes `rag-file-ingest` through `pg_net`.
4. The function downloads the file, extracts UTF-8 text, chunks it, and inserts rows into the existing RAG tables.
5. The ingestion row is updated to `ready` or `failed`.

## Includes

- `supabase/schemas/storage-rag-ingest.sql` - bucket, policies, tracking table, and upload trigger
- `supabase/functions/rag-file-ingest/index.ts` - Storage download and RAG insert worker

## Configuration

Requires **RAG Pipeline**. The Edge Function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are injected automatically in hosted projects. For local development, set the `project_url` Vault secret to the local Functions URL.
