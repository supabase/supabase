---
id: 'storage-schema'
title: 'Storage Helper Functions'
description: 'Learn the storage schema'
subtitle: 'Learn the storage schema'
sidebar_label: 'Schema'
---

Supabase Storage provides SQL helper functions which you can use to write RLS policies.

### `storage.filename()`

Returns the name of a file. For example, if your file is stored in `public/subfolder/avatar.png` it would return: `'avatar.png'`

**Usage**

This example demonstrates how you would allow any user to download a file called `favicon.ico`:

```sql
create policy "Allow public downloads"
on storage.objects
for select
to public
using (
  storage.filename(name) = 'favicon.ico'
);
```

### `storage.foldername()`

Returns an array path, with all of the subfolders that a file belongs to. For example, if your file is stored in `public/subfolder/avatar.png` it would return: `[ 'public', 'subfolder' ]`

**Usage**

This example demonstrates how you would allow authenticated users to upload files to a folder called `private`:

```sql
create policy "Allow authenticated uploads"
on storage.objects
for insert
to authenticated
with check (
  (storage.foldername(name))[1] = 'private'
);
```

### `storage.extension()`

Returns the extension of a file. For example, if your file is stored in `public/subfolder/avatar.png` it would return: `'png'`

**Usage**

This example demonstrates how you would allow restrict uploads to only PNG files inside a bucket called `cats`:

```sql
create policy "Only allow PNG uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cats' and storage.extension(name) = 'png'
);
```

### `storage.allow_only_operation()`

Returns `true` when the current Storage API operation exactly matches the provided operation name.

This is useful when a single SQL privilege such as `SELECT` is used by multiple Storage actions, but you want a policy to apply to only one of them, such as object listing versus object download.

The current operation names are defined in [`src/http/routes/operations.ts`](https://github.com/supabase/storage/blob/master/src/http/routes/operations.ts).

Storage normalizes operation names before comparing them, so both of the following forms are treated as equivalent:

- `storage.object.list`
- `object.list`

The comparison remains exact after normalization. Partial values such as `object` do not match `object.list`. If the current operation is not set, or the input is empty, the function returns `false`.

**Usage**

This example demonstrates how you would allow authenticated users to list only their own objects:

```sql
create policy "Allow users to list their own objects"
on storage.objects
for select
to authenticated
using (
  storage.allow_only_operation('object.list')
  and owner_id = (select auth.uid()::text)
);
```

### `storage.allow_any_operation()`

Returns `true` when the current Storage API operation exactly matches any operation in the provided array.

Use this when the same policy should apply to a small set of Storage actions.

**Usage**

This example demonstrates how you would allow authenticated users to list their own objects and read their own authenticated objects:

```sql
create policy "Allow users to list and read their own authenticated objects"
on storage.objects
for select
to authenticated
using (
  storage.allow_any_operation(ARRAY[
    'object.list',
    'storage.object.get_authenticated'
  ])
  and owner_id = (select auth.uid()::text)
);
```
