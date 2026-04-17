---
title: 'Supabase Storage: major performance, security, and reliability updates'
description: 'Storage ships a rewritten object listing system, path traversal prevention, idempotent migrations, OpenTelemetry metrics, and fixes for the most common reliability issues.'
author: fabrizio
date: '2026-03-05'
categories:
  - product
tags:
  - storage
  - postgres
  - performance
  - security
imgSocial: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=platform&layout=icon-text&copy=Storage&icon=icon-storage.svg'
imgThumb: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=platform&layout=icon-only&copy=Storage&icon=icon-storage.svg'
toc_depth: 3
---

Today, we're shipping a large set of updates to Supabase Storage that improve performance at scale, close security vulnerabilities, and reduce the most common causes of support issues. These changes affect every project using Storage, and they are live in all regions now.

Storage has grown a lot. Projects now hold tens of millions of objects, and that scale exposed real problems: write performance degraded under concurrent uploads, certain SQL patterns could accidentally orphan objects, and a path traversal vulnerability existed in the file backend. We knew about these problems from support tickets and our own benchmarks. This release fixes all of them.

The biggest change is a full rewrite of how Storage lists objects. The old system used a prefixes table with six triggers and twelve helper functions to keep folder structure in sync. On large buckets, those triggers slowed down every write. We replaced the entire system with a hybrid skip-scan algorithm that derives folder structure on-the-fly from the objects table. We also replaced OFFSET-based pagination with cursor-based pagination, which runs in constant time regardless of how deep you page. On a table with 60 million rows, deep pagination is up to 14.8 times faster. There is no write penalty. The prefixes table, level column, and two indexes have been dropped entirely.

These changes are already live. The Storage API handles everything automatically. If you are not using the listV2 endpoint, we recommend that you switch to it to get even more performance benefits!

## Security

### Path traversal prevention

The file backend can no longer read or write files outside the configured storage path. Previously, a crafted path could escape the storage root. This is now closed. [GitHub](https://github.com/supabase/storage/pull/818)

### Preventing accidental deletes via direct SQL

Running `DELETE FROM storage.objects` directly in SQL was the most common cause of orphan objects, where the database row was removed but the file in S3 or the file backend was not. A new statement-level trigger now rejects `DELETE` on Storage schema tables unless the session variable `storage.allow_delete_query` is set to `true`. The Storage API sets this flag automatically, so normal operations are unaffected. Direct SQL deletes are blocked by default. [GitHub](https://github.com/supabase/storage/pull/817)

## Performance

### Object listing rewrite

The old prefixes table required a write on every object insert, update, and delete to keep folder structure in sync. At high concurrency and large object counts, this became a bottleneck. Enterprise customers with 60 million or more objects were hitting real limits on write throughput.

The new skip-scan algorithm removes all of that. Folder structure is computed at read time from the objects table. Pagination uses a cursor instead of OFFSET, so page 1,000 is just as fast as page 1.

Benchmark on 60 million rows: up to 14.8x faster for deep pagination.

### Query cancellation and statement timeouts

When a client disconnects, in-flight Postgres queries are now cancelled using the native Postgres cancel protocol. This works with pgBouncer. A configurable 30-second query statement timeout has also been added via the `DB_STATEMENT_TIMEOUT` environment variable. [GitHub](https://github.com/supabase/storage/pull/841)

## Reliability

### Idempotent migrations

All Storage migrations are now fully idempotent. You can clear the `storage.migrations` table and safely replay the entire chain without errors. CI now runs the full migration suite twice and compares `pg_dump` output to verify. This should eliminate the class of support tickets around stuck migrations. [GitHub](https://github.com/supabase/storage/pull/805)

### TUS zombie lock fix

A race condition in the S3 locker for TUS resumable uploads could leave an orphaned lock that never expired. This happened when a lock was released during a renewal cycle, between the S3 GET and PUT. The renewal now checks whether the lock was already released before completing. This race condition is now closed. [GitHub](https://github.com/supabase/storage/pull/812)

### Orphan object scanner improvements

The orphan object scanner has been updated with several fixes: it now uses a trailing slash in S3 prefixes to prevent false-positive matches (for example, `images` no longer matches `images2`), supports multiple buckets via comma-delimited IDs, and adds a configurable `DELETE_LIMIT` for batch control. [GitHub](https://github.com/supabase/storage/pull/830)

## Observability

### OpenTelemetry metrics

Storage now uses OpenTelemetry for metrics instead of prom-client. Metrics can be pushed to any OTel-compatible backend. Prometheus scraping is still available at `/metrics` via the OTel Prometheus exporter. This release also includes a revamped Grafana dashboard and an OTel Collector config. [GitHub](https://github.com/supabase/storage/pull/819)

### Server execution time in logs

Request logs now include server-side execution time. [GitHub](https://github.com/supabase/storage/pull/831)

## Bug fixes

- **Duplicate slash in TUS upload URLs:** TUS resumable upload URLs were generated with a double slash. This is fixed. [GitHub](https://github.com/supabase/storage/pull/801)
- **PutVector body limit:** The body size limit for the PutVector endpoint has been raised from 1.6 MB to 20 MB. [GitHub](https://github.com/supabase/storage/pull/820)
- **Invalid S3 response header overrides:** Invalid values in `response-content-type` and similar overrides no longer crash requests. They are silently dropped. [GitHub](https://github.com/supabase/storage/pull/839)
- **Missing content-type fallback:** When S3 returned no Content-Type, the adapter was returning the misspelled `application/octa-stream`. It now correctly falls back to `application/octet-stream`. [GitHub](https://github.com/supabase/storage/pull/840)
- **Linux file backend xattr collision:** On Linux, the file backend was using the same extended attribute for both content-type and etag. Multipart uploads were overwriting the content-type with the ETag value. Each property now uses a distinct xattr name. [GitHub](https://github.com/supabase/storage/pull/842)
- **Migration type ordering:** Generated `migration_types.ts` now always sorts migrations by ID. [GitHub](https://github.com/supabase/storage/pull/845)
- **AWS stream buffer fix:** Fixes a stream buffering issue in the S3 adapter during multipart uploads, required for the AWS SDK upgrade. [GitHub](https://github.com/supabase/storage/pull/850)
- **Case preservation in list v1:** A regression introduced in the search optimization was returning all prefixes in lower case. Original case is now preserved. [GitHub](https://github.com/supabase/storage/pull/851)

## Get started

These changes are live for all projects. No code changes are required.

- [Storage documentation](https://supabase.com/docs/guides/storage)
- [Start a new project](https://supabase.com/dashboard)
- [Self-hosting Storage](https://supabase.com/docs/guides/self-hosting/storage)
