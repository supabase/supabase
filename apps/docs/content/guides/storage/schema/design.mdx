---
id: 'storage-schema-design'
title: 'The Storage Schema'
description: 'Learn about the storage schema'
subtitle: 'Learn about the storage schema'
sidebar_label: 'Schema'
---

Storage uses Postgres to store metadata regarding your buckets and objects. Users can use RLS (Row-Level Security) policies for access control. This data is stored in a dedicated schema within your project called `storage`.

<Admonition type="note">

When working with SQL, it's crucial to consider all records in Storage tables as read-only. All operations, including uploading, copying, moving, and deleting, should **exclusively go through the API**.

This is important because the storage schema only stores the metadata and the actual objects are stored in a provider like S3. Deleting the metadata doesn't remove the object in the underlying storage provider. This results in your object being inaccessible, but you'll still be billed for it.

</Admonition>

Here is the schema that represents the Storage service, you have the option to query this table directly to retrieve information about your files in Storage without the need to go through our API.

```mermaid
erDiagram
  buckets ||--o{ objects : "buckets_id:id"
  buckets {
    text id PK
    text name
    timestamptz created_at
    timestamptz updated_at
    boolean public
    bigint file_size_limit
    text[] allowed_mime_types
    text owner_id
  }
  objects {
    uuid id PK
    text bucket_id FK
    text name
    timestamptz created_at
    timestamptz updated_at
    jsonb metadata
    text[] path_tokens
    text version
    text owner_id
  }
  migrations {
    integer id PK
    varchar(100) name
    varchar(40) hash
    timestamp executed_at
  }
```

The schema centers on three tables. Each `buckets` row can own many `objects` rows by a one-to-many relationship that joins `buckets.id` to `objects.bucket_id`. The `buckets` table holds bucket configuration. Its `id` and `name`, whether the bucket is `public`, and constraints such as `file_size_limit` and `allowed_mime_types`. The `objects` table holds per-file metadata: the owning `bucket_id`, the object `name` and `path_tokens`, a `metadata` JSON blob, and version information. The `migrations` table is standalone and tracks the schema migrations applied to the storage service.

## Modifying the schema

We strongly recommend refraining from making any alterations to the `storage` schema and treating it as read-only. This approach is important because any modifications to the schema on your end could potentially clash with our future updates, leading to downtime.

However, we encourage you to add custom indexes as they can significantly improve the performance of the RLS policies you create for enforcing access control.
