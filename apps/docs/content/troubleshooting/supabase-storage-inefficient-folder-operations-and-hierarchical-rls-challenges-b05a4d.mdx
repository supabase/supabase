---
title = "'Supabase Storage: Inefficient folder operations and hierarchical RLS challenges'"
topics = [ "functions", "storage" ]
keywords = []
database_id = "3b52daf2-d78d-4630-8e9f-8bf5d90208bf"
---

Supabase Storage lacks native folder concepts or APIs for batch folder operations, which can lead to inefficient folder operations (move, rename, delete) and difficulties in implementing hierarchical access controls for objects.

## Why does this happen?

Storage buckets treat "folders" purely as key prefixes. This means file system-like folder behavior and inherited permissions are not built-in features of Supabase Storage.

## How to address these challenges

To overcome these limitations and implement robust folder management with hierarchical RLS, consider the following approach:

- **Model your folder hierarchy in a custom Postgres table.** This table should manage folder metadata such as folder IDs, parent IDs, paths, and permissions.
- **Reference `storage.objects` within your custom metadata.** Store a reference to `storage.objects.id` in your custom table to link files to their respective folders.
- **Implement RLS policies on `storage.objects`.** These policies must `JOIN` with your custom metadata table to enforce hierarchical access permissions based on your defined folder structure.
- **Handle batch folder operations via your metadata table.** For operations like moving or renaming folders, update the relevant entries in your custom metadata table. Note that actual file paths in Storage are not directly altered by these operations.
- **Optimize RLS policies for performance.** `JOIN`s in RLS policies can lead to performance degradation, especially with large datasets. Ensure proper indexing on your custom metadata table and consider using `SECURITY DEFINER` functions to optimize policy execution.

## Alternative approach: Using the S3 protocol for bulk operations

Supabase Storage also supports an S3-compatible API. This allows you to use tools like the AWS CLI to perform bulk file operations such as downloading, moving, or reorganizing objects more efficiently.

Install the AWS CLI by following the [AWS CLI installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

Create S3 credentials in Supabase using the [Supabase S3 authentication guide](/docs/guides/storage/s3/authentication?queryGroups=language&language=credentials).

Configure an AWS CLI profile using the credentials you generated in Supabase. The profile name can be anything, but it must match the value used in the following commands.

```shell
aws configure --profile supabase-s3
```

Download files from a bucket or prefix:

```shell
aws s3 cp s3://bucket-name/folder-name ./download-target
--profile supabase-s3
--endpoint-url https://<project-ref>.supabase.co/storage/v1/s3
--recursive
--region <region>
```

- Replace `bucket-name` with your bucket name.
- Replace `folder-name` with the prefix you want to download, or omit it to download the entire bucket.
- Replace `<project-ref>` with your Supabase project reference.
- Replace `<region>` with your project's region (for example `eu-central-1`).
- `./download-target` is the local directory where files will be saved.

Move or rename files using the `mv` command. Because folders in Supabase Storage are implemented as prefixes, renaming a folder is effectively moving objects from one prefix to another.

```shell
aws s3 mv s3://bucket-name-one/folder-name-one s3://bucket-name-two/folder-name-two
--profile supabase-s3
--endpoint-url https://<project-ref>.supabase.co/storage/v1/s3
--recursive
--region <region>
```

This method is useful for large-scale downloads, migrations, or reorganizing files within a bucket.
