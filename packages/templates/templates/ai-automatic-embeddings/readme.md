# Automatic embeddings template

Keeps document embeddings in sync using database triggers and an Edge Function embed worker.

## Includes

- Embeddings schema and queue tables
- `embed` Edge Function for batch embedding
- Seed data for local development

## Dependencies

Requires **database**, **api**, and **functions**. Works best with **ai-vector-search** for similarity queries.
