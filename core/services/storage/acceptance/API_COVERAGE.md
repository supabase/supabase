# Acceptance API Coverage

The acceptance suite is black-box by design. Tests only use public HTTP, S3, TUS, and admin
surfaces so the same contracts can be run against the current TypeScript service or a future
Go/Rust rewrite.

## Core Coverage

These run in `smoke` / `core` profiles and are included in the default local CI `full` profile:

| Area                   | Covered APIs / behavior                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health                 | `/status`, `/version`                                                                                                                                                                                                                                                                                                                                                                    |
| Auth/error contracts   | malformed JWT rejection and missing protected-route authorization mapped to explicit auth errors                                                                                                                                                                                                                                                                                         |
| REST buckets           | create, duplicate create rejection, get, list/search, update, empty, empty already-empty bucket, delete, deletion blocked when non-empty                                                                                                                                                                                                                                                 |
| REST objects           | upload, update, duplicate protection, bucket file-size limit and MIME policy rejection, user metadata, authenticated read/head/info with ETag/length checks, public read/head/info, public missing-key info/head, special-character key read/list, single delete, missing-key info/head behavior                                                                                         |
| REST object operations | empty bucket list-v1/list-v2, list-v1 search/offset, list-v2 delimiter/cursor/sort, signed URL, batch signed URLs, signed upload URL, invalid signed upload token, copy, copy metadata/cache-control overwrite, copy without upsert when destination exists, same-bucket and cross-bucket move, move conflict, bulk delete                                                               |
| DB adapter pinning     | LIKE-wildcard escaping for bucket search and list-v2 prefix, list-v2 cursor pagination with sortBy on `created_at`/`updated_at`, list-v2 delimiter common-prefix walk, literal-underscore keys                                                                                                                                                                                           |
| S3 buckets             | CreateBucket, duplicate CreateBucket conflict, HeadBucket, ListBuckets, GetBucketLocation, GetBucketVersioning, DeleteBucket, DeleteBucket non-empty conflict                                                                                                                                                                                                                            |
| S3 objects             | PutObject metadata/cache-control, presigned POST form upload, HeadObject, HeadObject missing-key 404, GetObject metadata, GetObjectTagging empty tag-set contract, conditional GetObject (`If-None-Match`, `If-Modified-Since`), response header overrides, Range GetObject (suffix/last-N/out-of-range), basic CopyObject, CopyObject metadata replacement, DeleteObject, DeleteObjects |
| S3 listing             | ListObjectsV2 continuation/start-after, ListObjectsV2 with delimiter + continuation/start-after, ListObjects V1 with delimiter/common prefixes                                                                                                                                                                                                                                           |
| S3 multipart           | CreateMultipartUpload metadata, multi-part UploadPart/CompleteMultipartUpload, ListParts (with PartNumberMarker), CompleteMultipartUpload metadata, UploadPartCopy, AbortMultipartUpload, ListMultipartUploads KeyMarker pagination                                                                                                                                                      |
| TUS                    | OPTIONS, POST create, creation-with-upload data, HEAD offset, HEAD missing-upload error, PATCH resume, PATCH incorrect-offset conflict, DELETE termination, missing-bucket and bucket-size-limit errors, full upload through `tus-js-client`, signed TUS upload                                                                                                                          |

## Wire Profile Coverage

These run in the `wire` profile in addition to smoke coverage:

| Area       | Covered APIs / behavior                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Wire/SigV4 | raw `aws-chunked` PutObject and UploadPart, trailer-signature rejection |

## CDN Edge Coverage

These assert real Cloudflare edge cache behavior (`cf-cache-status` MISS/HIT, ETag/304, purge
propagation) rather than the storage API's own request handling. There's no local equivalent -
`cf-cache-status` is only ever set on responses that pass through the deployed edge - so this
coverage only runs against a real remote target with CDN enabled (the `CDN Edge` capability below).

| Area             | Covered APIs / behavior                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cache MISS/HIT   | MISS then HIT across public, authenticated, and signed access; signed invalid-token and authenticated anon-key denial still bypass the cache correctly                  |
| Conditional GET  | ETag `If-None-Match` returns 304 on a cache HIT                                                                                                                         |
| Object write ops | UPSERT, MOVE, and COPY create fresh cache entries without disturbing unrelated entries (old MOVE path, COPY source); DELETE invalidates the cache entry                 |
| Transformations  | distinct transform dimensions cache independently of each other and of the base object                                                                                  |
| Cache Purge      | object, bucket, and tenant purge only invalidate their own scope; object/bucket/tenant transformation purge invalidates the transform but leaves the base object cached |

## Capability-Gated Coverage

These require target-specific capabilities. They run when the capability is enabled or derived from
the configured target, and the selected profile includes the spec:

| Capability | Enable with                                                                             | Covered APIs / behavior                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin      | `ACCEPTANCE_ENABLE_ADMIN=true` plus admin URL/API key                                   | admin status, API key protection, tenant read/create/patch/upsert/delete/health, tenant migration run/reset-current/jobs, queue migration enabled/disabled contract, queue/migration validation, JWKS validation/add/deactivate/status, JWKS standby key generation and swap continuity for signed URLs, public well-known jwks contract, orphan scan/sync validation, S3 credential create/authenticate/list/delete |
| CDN        | `ACCEPTANCE_ENABLE_CDN=true`                                                            | `/cdn/:bucket/*` and `/cdn` cache purge for objects, buckets, the tenant, and their transformations; purge succeeds even when the target object no longer exists                                                                                                                                                                                                                                                     |
| CDN Edge   | Derived from `ACCEPTANCE_ENABLE_CDN=true` and `ACCEPTANCE_TARGET=remote`                | Real Cloudflare edge cache behavior - see [CDN Edge Coverage](#cdn-edge-coverage) above                                                                                                                                                                                                                                                                                                                              |
| Render     | `ACCEPTANCE_ENABLE_RENDER=true`                                                         | public, authenticated, and signed image transformation routes, `webp` output format, non-image input errors, invalid transformation validation                                                                                                                                                                                                                                                                       |
| RLS        | `ACCEPTANCE_ENABLE_RLS_SETUP=true` plus anon/authenticated keys and RLS resource config | authenticated allow and anon deny for read/write on configured policies                                                                                                                                                                                                                                                                                                                                              |
| Path edges | Derived from `ACCEPTANCE_TARGET` and `STORAGE_BACKEND`                                  | list-v2 preservation for object names with empty path segments; local S3/RustFS backends skip this case directly                                                                                                                                                                                                                                                                                                     |
| Vector     | `ACCEPTANCE_ENABLE_VECTOR=true` with local pgvector or S3 Vectors configured            | vector bucket pagination, index pagination, vector list pagination, provider-specific query limits (pgvector 100, S3 10,000), metadata filter keys, non-filterable metadata rejection, default distance omission, cosine and euclidean query behavior, put/get/list/query/delete lifecycle                                                                                                                           |
| Iceberg    | `ACCEPTANCE_ENABLE_ICEBERG=true`                                                        | analytics bucket, catalog config, namespace (create/list/load/head/drop, missing load/drop, upsert on re-create, drop blocked when non-empty), table create/list/page-size/load/head/drop, missing load/drop, commit success/conflict                                                                                                                                                                                |

## Intentionally Gated

Remote runs should set `ACCEPTANCE_TARGET=remote`. Destructive tests are blocked on remote targets
unless `ACCEPTANCE_ALLOW_DESTRUCTIVE=true` is set. Admin, CDN, render, vector, Iceberg, and RLS
tests are capability-gated because they depend on tenant features or credentials that are not
universally available.
