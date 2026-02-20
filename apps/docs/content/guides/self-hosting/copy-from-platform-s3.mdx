---
title: 'Copy Storage Objects from Platform'
description: 'Copy storage objects from a managed Supabase project to a self-hosted instance using rclone.'
subtitle: 'Copy storage objects from a managed Supabase project to a self-hosted instance using rclone.'
---

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
This guide walks you through copying storage objects from a managed Supabase platform project to a self-hosted instance using [rclone](https://rclone.org/) with S3-to-S3 copy.

<Admonition type="caution">

Direct file copy (e.g., downloading files and placing them into `volumes/storage/`) does not work. Self-hosted Storage uses an internal file structure that differs from what you get when downloading files from the platform. Use the S3 protocol to transfer objects so that Storage creates the correct metadata records.

</Admonition>

## Before you begin

You need:

- A working self-hosted Supabase instance with the S3 protocol endpoint enabled - see [Configure S3 Storage](/docs/guides/self-hosting/self-hosted-s3#enable-the-s3-protocol-endpoint)
- Your platform project's S3 credentials - generated from the [S3 Configuration](/dashboard/project/_/storage/s3) page
- Matching buckets created on your self-hosted instance
  {/* supa-mdx-lint-disable-next-line Rule003Spelling */}
- [rclone](https://rclone.org/install/) installed on the machine running the copy

## Step 1: Get platform S3 credentials

In your managed Supabase project dashboard, go to **Storage** > **S3 Configuration** > **Access keys**. Generate a new access key pair and copy:

- **Endpoint**: `https://<project-ref>.supabase.co/storage/v1/s3`
- **Region**: your project's region (e.g., `us-east-1`)
- **Access Key ID** and **Secret access key**

<Admonition type="note">

For better performance with large files, use the direct storage hostname: `https://<project-ref>.storage.supabase.co/storage/v1/s3`

</Admonition>

## Step 2: Create buckets on self-hosted

Buckets must exist on the destination before you can copy objects into them. You can create them through dashboard UI, or with **SQL Editor**.

<Admonition type="tip">

If you already restored your platform database to self-hosted using the [restore guide](/docs/guides/self-hosting/restore-from-platform), your bucket definitions are already present. You can skip this step.

</Admonition>

To list your platform buckets, connect to your platform database and run:

```sql
select id, name, public from storage.buckets order by name;
```

Then create matching buckets on your self-hosted instance. Connect to your self-hosted database and run:

```sql
insert into storage.buckets (id, name, public)
values
  ('your-storage-bucket', 'your-storage-bucket', false)
on conflict (id) do nothing;
```

Repeat for each bucket, setting `public` to `true` or `false` as appropriate.

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}

## Step 3: Configure rclone

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
Create or edit your rclone configuration file (`~/.config/rclone/rclone.conf`):

```ini rclone.conf
[platform]
type = s3
provider = Other
access_key_id = your-platform-access-key-id
secret_access_key = your-platform-secret-access-key
endpoint = https://your-project-ref.supabase.co/storage/v1/s3
region = your-project-region

[self-hosted]
type = s3
provider = Other
access_key_id = your-self-hosted-access-key-id
secret_access_key = your-self-hosted-secret-access-key
endpoint = http://your-domain:8000/storage/v1/s3
region = your-self-hosted-region
```

Replace the credentials with your actual values. For self-hosted, use the `REGION`, `S3_PROTOCOL_ACCESS_KEY_ID` and `S3_PROTOCOL_ACCESS_KEY_SECRET` you configured in [Configure S3 Storage](/docs/guides/self-hosting/self-hosted-s3#enable-the-s3-protocol-endpoint).

Verify both remotes connect:

```bash
rclone lsd platform:
rclone lsd self-hosted:
```

Both commands should list your buckets.

## Step 4: Copy objects

Copy a single bucket:

```bash
rclone copy platform:your-storage-bucket self-hosted:your-storage-bucket --progress
```

To copy all buckets:

```bash
for bucket in $(rclone lsf platform: | tr -d '/'); do
  echo "Copying bucket: $bucket"
  rclone copy "platform:$bucket" "self-hosted:$bucket" --progress
done
```

<Admonition type="note">

For large migrations, consider adding `--transfers 4` to increase parallelism, or `--checkers 8` to speed up the comparison phase. See the [flags documentation](https://rclone.org/flags/) for all options.

</Admonition>

## Verify

Compare object counts between source and destination:

```bash
rclone size platform:your-storage-bucket && \
rclone size self-hosted:your-storage-bucket
```

Open Studio on your self-hosted instance and browse the storage buckets to confirm files are accessible.

## Troubleshooting

### Signature errors

If you see `SignatureDoesNotMatch` when connecting to either remote:

- **Platform**: Regenerate S3 access keys from your project's Storage Settings. Ensure the endpoint URL includes `/storage/v1/s3`.
  {/* supa-mdx-lint-disable-next-line Rule003Spelling */}
- **Self-hosted**: Verify that `REGION`, `S3_PROTOCOL_ACCESS_KEY_ID` and `S3_PROTOCOL_ACCESS_KEY_SECRET` in `.env` file match your rclone config.

### Bucket not found

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
If rclone reports that a bucket doesn't exist on the self-hosted side, create it first - see [Step 2](#step-2-create-buckets-on-self-hosted). The S3 protocol does not auto-create buckets on copy.

### Timeouts on large files

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
For very large files, increase rclone's timeout:

```bash
rclone copy platform:your-storage-bucket self-hosted:your-storage-bucket --timeout 30m
```

### Empty listing on platform

If `rclone lsd platform:` returns nothing, verify the endpoint URL ends with `/storage/v1/s3` and that the S3 access keys have not expired. Regenerate them from the dashboard if needed.
