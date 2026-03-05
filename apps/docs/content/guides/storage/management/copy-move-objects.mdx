---
id: 'storage-management'
title: 'Copy Objects'
description: 'Learn how to copy and move objects'
subtitle: 'Learn how to copy and move objects'
sidebar_label: 'Copy / Move Objects'
---

## Copy objects

You can copy objects between buckets or within the same bucket. Currently only objects up to 5 GB can be copied using the API.

When making a copy of an object, the owner of the new object will be the user who initiated the copy operation.

### Copying objects within the same bucket

To copy an object within the same bucket, use the `copy` method.

```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
await supabase.storage.from('avatars').copy('public/avatar1.png', 'private/avatar2.png')
```

### Copying objects across buckets

To copy an object across buckets, use the `copy` method and specify the destination bucket.

```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
await supabase.storage.from('avatars').copy('public/avatar1.png', 'private/avatar2.png', {
  destinationBucket: 'avatars2',
})
```

## Move objects

You can move objects between buckets or within the same bucket. Currently only objects up to 5GB can be moved using the API.

When moving an object, the owner of the new object will be the user who initiated the move operation. Once the object is moved, the original object will no longer exist.

### Moving objects within the same bucket

To move an object within the same bucket, you can use the `move` method.

```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
const { data, error } = await supabase.storage
  .from('avatars')
  .move('public/avatar1.png', 'private/avatar2.png')
```

### Moving objects across buckets

To move an object across buckets, use the `move` method and specify the destination bucket.

```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
await supabase.storage.from('avatars').move('public/avatar1.png', 'private/avatar2.png', {
  destinationBucket: 'avatars2',
})
```

## Permissions

To **copy** objects, users need `select` permission on the source object and `insert` permission on the destination object. If the user also has `update` permission, the copy can be performed as an upsert, which will overwrite the destination object if it already exists.

To **move** objects, users need `select` and `update` permissions on the object.

For example:

```sql
create policy "User can select their own objects (in any buckets)"
on storage.objects
for select
to authenticated
using (
    owner_id = (select auth.uid())
);

create policy "User can insert in their own folders (in any buckets)"
on storage.objects
for insert
to authenticated
with check (
    (storage.folder(name))[1] = (select auth.uid())
);

create policy "User can update their own objects (in any buckets)"
on storage.objects
for update
to authenticated
using (
    owner_id = (select auth.uid())
);
```
