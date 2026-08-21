# Supabase Vector

> Store, index, and query vector embeddings in Postgres with pgvector.

Supabase Vector is an AI toolkit that lets you store vector embeddings alongside your transactional data in the same Postgres database. Powered by the pgvector extension, it eliminates the need for a separate vector database while providing production-grade similarity search.

## Key Features

- **pgvector integration**: store, index, and query vector embeddings directly in Postgres
- **Co-located data**: vector embeddings live alongside your relational data, joined with standard SQL
- **Multiple index types**: IVFFlat and HNSW indexes for fast approximate nearest neighbor search
- **Distance metrics**: cosine distance, L2 (Euclidean) distance, max inner product
- **Metadata filtering**: filter similarity queries by any column or JSONB metadata
- **Python client (vecs)**: dedicated Python library for managing collections, upserting vectors, and querying
- **LLM integrations**: works with OpenAI, Hugging Face, Amazon SageMaker, LangChain, and more
- **Edge Functions**: generate embeddings using open source models directly in Edge Functions
- **Self-hostable**: run the full stack on your own infrastructure
- **SOC2 Type 2 compliant**: enterprise-grade security

## Common Use Cases

- Semantic search over documents, knowledge bases, or support tickets
- Retrieval-Augmented Generation (RAG) for LLM applications
- Image similarity detection
- Recommendation engines
- Auto-tagging and content classification
- ChatGPT plugins with long-term memory

## How It Works

1. Generate embeddings using any model (OpenAI, Hugging Face, Cohere, etc.)
2. Store embeddings in a Postgres table with a `vector` column
3. Create an HNSW or IVFFlat index for fast similarity search
4. Query with `<=>` (cosine), `<->` (L2), or `<#>` (inner product) operators
5. Combine with standard SQL: JOIN, WHERE, GROUP BY for hybrid queries

## Technical Details

- Extension: pgvector (open source)
- Max dimensions: 2,000 (HNSW), 16,000+ (flat)
- Index types: HNSW (recommended), IVFFlat
- Scaling: same compute scaling as your Supabase database (Micro to 16XL)
- Backups: automatic daily + PITR available

## Links

- Documentation: https://supabase.com/docs/guides/ai
- Python client: https://supabase.com/docs/guides/ai/vecs-python-client
- Dashboard: https://supabase.com/dashboard
