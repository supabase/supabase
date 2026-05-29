---
id: 'storage-schema-design'
title: 'Custom Roles'
description: 'Learn about the storage schema'
subtitle: 'Learn about using custom roles with storage schema'
sidebar_label: 'Schema'
---

In this guide, you will learn how to create and use custom roles with Storage to manage role-based access to objects and buckets. The same approach can be used to use custom roles with any other Supabase service.

Supabase Storage uses the same role-based access control system as any other Supabase service using RLS (Row Level Security).

## Create a custom role

Let's create a custom role `manager` to provide full read access to a specific bucket. For a more advanced setup, see the [RBAC Guide](/docs/guides/api/custom-claims-and-role-based-access-control-rbac#create-auth-hook-to-apply-user-role).

```sql
create role 'manager';

-- Important to grant the role to the authenticator and anon role
grant manager to authenticator;
grant anon to manager;
```

## Create a policy

Let's create a policy that gives full read permissions to all objects in the bucket `teams` for the `manager` role.

```sql
create policy "Manager can view all files in the bucket 'teams'"
on storage.objects
for select
to manager
using (
 bucket_id = 'teams'
);
```

## Test the policy

To impersonate the `manager` role, you will need a valid JWT token with the `manager` role.
You can quickly create one using the `jsonwebtoken` library in Node.js.

<Admonition type="danger">

Signing a new JWT requires your `JWT_SECRET`. You must store this secret securely. Never expose it in frontend code, and do not check it into version control.

</Admonition>

```js
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'your-jwt-secret' // You can find this in your Supabase project settings under API. Store this securely.
const USER_ID = '' // the user id that we want to give the manager role

const token = jwt.sign({ role: 'manager', sub: USER_ID }, JWT_SECRET, {
  expiresIn: '1h',
})
```

Now you can use this token to access the Storage API.

```js
const { StorageClient } = require('@supabase/storage-js')

const PROJECT_URL = 'https://your-project-id.supabase.co/storage/v1'

const storage = new StorageClient(PROJECT_URL, {
  authorization: `Bearer ${token}`,
})

await storage.from('teams').list()
```
