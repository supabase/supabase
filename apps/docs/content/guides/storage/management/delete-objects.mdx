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
