# Supabase Storage

> S3-compatible object storage with a global CDN, image transformations, and three purpose-built bucket types.

Supabase Storage is an open source object store that integrates natively with Supabase Auth and Postgres. It supports three bucket types for different workloads: files (general assets), analytics (Apache Iceberg), and vector (embeddings).

## Key Features

- **S3-compatible**: standard S3 API, works with existing S3 tools and SDKs
- **Global CDN**: assets served from 285+ cities worldwide for low-latency delivery
- **Image transformations**: resize, crop, and compress images on the fly via URL parameters
- **Row Level Security**: access policies written in SQL using Postgres RLS, integrated with Supabase Auth
- **Dashboard**: drag-and-drop uploads, file browsing, multi-select operations, folder management

## Bucket Types

### Files Buckets

For everyday assets and user content: images, videos, documents, PDFs, archives. Served from the global CDN with fine-grained access controls via RLS policies.

### Analytics Buckets

For large-scale analytical workloads on open table formats (Apache Iceberg). Designed for historical data, time-series data, logs, and ETL outputs. Optionally queryable via Postgres.

### Vector Buckets

For AI/ML workloads. Store and index vector embeddings with multiple distance metrics, metadata filtering, and fast similarity queries for RAG systems and AI-powered search.

## Technical Details

- Protocol: S3-compatible API
- CDN: 285+ global edge locations
- Max file size: 50 MB (Free), 500 GB (Pro/Team/Enterprise), via multipart upload
- Image transformations: resize, crop, format conversion (WebP, AVIF)
- Authorization: Postgres RLS policies on storage.objects table

## Links

- Documentation: https://supabase.com/docs/guides/storage
- API Reference: https://supabase.com/docs/reference/javascript/storage-from-upload
- Dashboard: https://supabase.com/dashboard
