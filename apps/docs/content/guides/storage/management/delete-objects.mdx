---
id: 'storage-management'
title: 'Delete Objects'
description: 'Learn about deleting objects'
subtitle: 'Learn about deleting objects'
sidebar_label: 'Delete Objects'
---

When you delete one or more objects from a bucket, the files are permanently removed and not recoverable. You can delete a single object or multiple objects at once.

<Admonition type="note">

Deleting objects should always be done via the **Storage API** and NOT via a **SQL query**. Deleting objects via a SQL query will not remove the object from the bucket and will result in the object being orphaned.

</Admonition>

## Delete objects

To delete one or more objects, use the `remove` method.

```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
await supabase.storage.from('bucket').remove(['object-path-2', 'folder/avatar2.png'])
```

<Admonition type="note">

When deleting objects, there is a limit of 1000 objects at a time using the `remove` method.

</Admonition>

## Emptying large buckets

Deleting objects via the Supabase Dashboard or Storage API has a hard limit of 200,000 objects per bucket. If a bucket contains more than 200,000 objects, the empty bucket operation will fail.

The recommended approach for emptying large buckets is to use the AWS CLI with Supabase's S3 protocol support. You can delete all objects by using the `sync` command to sync your bucket with an empty local directory, which will safely delete all objects.

1. **Install the AWS CLI**: Follow the [AWS CLI installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) for your operating system.

2. **Set up S3 credentials in Supabase**: Generate your S3 access credentials by following the [Supabase S3 authentication guide](/docs/guides/storage/s3/authentication?queryGroups=language&language=credentials).

3. **Configure an AWS profile**: Run the following command and paste in the credentials you created in Supabase. The profile name `supabase-s3` can be anything you want, as long as it matches the value you use in the sync command.

```bash
aws configure --profile supabase-s3
```

4. **Create an empty directory and sync it to your bucket**:

```bash
# Create a local empty directory
mkdir empty-dir

# Sync the empty directory to your bucket with --delete enabled
# This will delete all objects in the bucket
aws s3 sync empty-dir/ s3://your-bucket-name --delete --profile supabase-s3 --endpoint-url https://<project-ref>.supabase.co/storage/v1/s3 --region <your-region>
```

Replace `your-bucket-name`, `<project-ref>`, and `<your-region>` with your actual values. This operation may take a while for large buckets, but it will not leave any orphaned objects behind.

<Admonition type="note">

The `--profile` value must match the profile name you configured in Step 3. The correct endpoint URL and region can be found in your project's [Storage Settings](/dashboard/project/_/storage/settings).

</Admonition>

## RLS

To delete an object, the user must have the `delete` permission on the object. For example:

```sql
create policy "User can delete their own objects"
on storage.objects
for delete
TO authenticated
USING (
    owner = (select auth.uid()::text)
);
```
