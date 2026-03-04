---
title: 'Configure S3 Storage'
description: 'Enable S3-compatible client endpoint and set up an S3 backend for self-hosted Supabase Storage.'
subtitle: 'Enable S3-compatible client endpoint and set up an S3 backend for self-hosted Supabase Storage.'
---

Self-hosted Supabase Storage has two independent S3-related features:
{/* supa-mdx-lint-disable-next-line Rule003Spelling */}

- **S3 protocol endpoint** - an S3-compatible API that Storage exposes at `/storage/v1/s3`. This allows standard S3 tools like `rclone` and the AWS CLI to interact with your Storage instance.
  {/* supa-mdx-lint-disable-next-line Rule003Spelling */}
- **S3 backend** - where Storage keeps data. By default, files are stored on the local filesystem. You can switch to an S3-compatible service (AWS S3, MinIO, etc.) for durability, scalability, or to use existing infrastructure.

You can configure either feature independently. For example, you can enable the S3 protocol endpoint to use `rclone` while keeping the default file-based storage, or switch to an S3 backend without enabling the S3 protocol endpoint.

## Enable the S3 protocol endpoint

The S3 protocol endpoint at `/storage/v1/s3` allows standard S3 clients to interact with your self-hosted Storage instance. It works with any storage backend, including the default file-based storage - you do not need to configure an S3 backend first. The Supabase REST API and SDK do not use the S3 protocol.

Make sure to check that `REGION`, `S3_PROTOCOL_ACCESS_KEY_ID` and `S3_PROTOCOL_ACCESS_KEY_SECRET` are properly configured in you `.env` file. Read more about the secrets and passwords in [Configuring and securing Supabase](/docs/guides/self-hosting/docker#configuring-and-securing-supabase).

```yaml
storage:
  environment:
    # ... existing variables ...
    REGION: ${REGION}
    S3_PROTOCOL_ACCESS_KEY_ID: ${S3_PROTOCOL_ACCESS_KEY_ID}
    S3_PROTOCOL_ACCESS_KEY_SECRET: ${S3_PROTOCOL_ACCESS_KEY_SECRET}
```

### Test with the AWS CLI

```bash
( set -a && \
source .env > /dev/null 2>&1 && \
echo "" && \
AWS_ACCESS_KEY_ID=$S3_PROTOCOL_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$S3_PROTOCOL_ACCESS_KEY_SECRET \
aws s3 ls \
--endpoint-url http://localhost:8000/storage/v1/s3 \
--region $REGION \
s3://your-storage-bucket )
```

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}

### Test with rclone

```bash
( set -a && \
source .env > /dev/null 2>&1 && \
echo "" && \
rclone ls \
--s3-endpoint http://localhost:8000/storage/v1/s3 \
--s3-region $REGION \
--s3-provider Other \
--s3-access-key-id "$S3_PROTOCOL_ACCESS_KEY_ID" \
--s3-secret-access-key "$S3_PROTOCOL_ACCESS_KEY_SECRET" \
:s3:your-storage-bucket )
```

Use `aws login` and `rclone config` for persistent configuration.

## How to configure an S3 backend

In general, the following configuration variables define S3 backend configuration for Storage in `docker-compose.yml`:

```yaml
storage:
  environment:
    # ... existing variables ...
    STORAGE_BACKEND: s3
    GLOBAL_S3_BUCKET: your-s3-bucket-or-dirname
    GLOBAL_S3_ENDPOINT: https://your-s3-endpoint
    GLOBAL_S3_PROTOCOL: https
    GLOBAL_S3_FORCE_PATH_STYLE: 'true'
    AWS_ACCESS_KEY_ID: your-access-key-id
    AWS_SECRET_ACCESS_KEY: your-secret-access-key
    REGION: your-region
```

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
Depending on your setup, you may need to adjust these values - for example, to use a local S3-compatible service like MinIO or a cloud provider like AWS.

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}
{/* supa-mdx-lint-disable-next-line Rule003Spelling */}

### Using MinIO

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
An overlay `docker-compose.s3.yml` configuration can be added to enable MinIO container and provide an S3-compatible API for Storage backend:

```bash
docker compose -f docker-compose.yml -f docker-compose.s3.yml up -d
```

Make sure to review the Storage section in your `.env` file for related configuration options.

### Using AWS S3

Create an S3 bucket and an IAM user with access to it. Then configure the storage service:

```yaml docker-compose.yml
storage:
  environment:
    # ... existing variables ...
    STORAGE_BACKEND: s3
    GLOBAL_S3_BUCKET: your-aws-bucket-name
    AWS_ACCESS_KEY_ID: your-aws-access-key
    AWS_SECRET_ACCESS_KEY: your-aws-secret-key
    REGION: your-aws-region
```

For AWS S3, you do not need `GLOBAL_S3_ENDPOINT` or `GLOBAL_S3_FORCE_PATH_STYLE` - the Storage S3 client automatically resolves the endpoint from the region and uses virtual-hosted-style URLs, which is what AWS S3 expects. These variables are only needed for non-AWS S3-compatible providers.

### S3-compatible providers

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
Use the same configuration as MinIO, but point to your provider's endpoint, e.g.:

```yaml
storage:
  environment:
    # ... existing variables ...
    STORAGE_BACKEND: s3
    GLOBAL_S3_BUCKET: your-bucket-name
    GLOBAL_S3_ENDPOINT: https://your-account-id.r2.cloudflarestorage.com
```

## Verify

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}

- Open Studio and upload a file to a bucket. List the file using the AWS CLI or `rclone` to confirm the S3 endpoint works.
- If using an S3 backend: confirm the file appears in your S3 provider's console.

## Troubleshooting

### Signature mismatch errors

S3 clients sign requests using the access key ID and secret. If you see `SignatureDoesNotMatch`, verify that the `REGION`, `S3_PROTOCOL_ACCESS_KEY_ID` and `S3_PROTOCOL_ACCESS_KEY_SECRET` in your `.env` file match what your S3 client is using.

### TUS upload errors on Cloudflare R2

If resumable (TUS) uploads fail with HTTP 500 and a message about `x-amz-tagging`, add `TUS_ALLOW_S3_TAGS: "false"` to the storage service environment. Cloudflare R2 does not implement this S3 feature.

### Permission denied on uploads

Setting a bucket to "Public" only allows unauthenticated **downloads**. Uploads are always blocked unless you create an RLS policy on the `storage.objects` table. Go to **Storage** > **Files** > **Policies** in Studio and create a policy that allows `INSERT` for the appropriate roles.

### Upload URLs point to localhost

If uploads from a browser fail (CORS or mixed content errors), check that `API_EXTERNAL_URL` and `SUPABASE_PUBLIC_URL` in your `.env` file match your actual domain and protocol - not `http://localhost:8000`.

### Additional resources

- [Storage repository `.env.sample`](https://github.com/supabase/storage/blob/master/.env.sample)
- [S3 Authentication](/docs/guides/storage/s3/authentication)
