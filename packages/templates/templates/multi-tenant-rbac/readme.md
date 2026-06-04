# Multi-tenant RBAC template

Organization-scoped authorization for SaaS applications. Membership in an organization assigns a role, roles grant permissions, and RLS policies call `authorize(organization_id, permission)`.

Use this template when users can belong to more than one organization and their permissions should be different in each organization.

## Includes

- Organizations and organization memberships
- Organization-scoped roles and permissions
- `create_organization()` bootstrap helper
- `authorize()` helper for tenant-aware RLS policies
- Example `projects` table with scalable tenant policies

## How it works

Every tenant-owned row stores an `organization_id`. The current user's role for that organization is stored in `organization_members`, and each role receives permissions through `role_permissions`.

RLS policies should check both tenant membership and the requested action by calling:

```sql
public.authorize(organization_id, 'resource.action')
```

That helper returns `true` only when the signed-in user is a member of the row's organization and their role grants the requested permission.

## Getting started

Create an organization from your app after the user signs in:

```sql
select public.create_organization('Acme Inc', 'acme');
```

The creator is automatically inserted into `organization_members` as the `owner`.

Invite another user by inserting a membership row:

```sql
insert into public.organization_members (organization_id, user_id, role)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'member');
```

The insert is allowed only if the current user has `members.invite` for that organization. Assigning elevated roles such as `admin` or `owner` requires `members.update`.

## Default roles

The seed file grants these permissions:

| Role     | Intended use                                                       |
| -------- | ------------------------------------------------------------------ |
| `owner`  | Full organization, membership, and project control.                |
| `admin`  | Manage organization settings, invite members, and manage projects. |
| `member` | Read organization and membership data, and create/update projects. |

Adjust `supabase/seed.sql` before production if your app needs a stricter default. For example, remove `projects.create` or `projects.update` from `member` for read-only members.

## Writing RLS policies

For tenant-owned tables, add an `organization_id` column and enable RLS:

```sql
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations on delete cascade not null,
  title text not null,
  body text,
  created_at timestamptz default now()
);

create index documents_organization_id_idx
on public.documents (organization_id);

alter table public.documents enable row level security;
```

Add permissions for the new resource:

```sql
alter type public.app_permission add value 'documents.read';
alter type public.app_permission add value 'documents.create';
alter type public.app_permission add value 'documents.update';
alter type public.app_permission add value 'documents.delete';

insert into public.role_permissions (role, permission)
values
  ('owner', 'documents.read'),
  ('owner', 'documents.create'),
  ('owner', 'documents.update'),
  ('owner', 'documents.delete'),
  ('admin', 'documents.read'),
  ('admin', 'documents.create'),
  ('admin', 'documents.update'),
  ('admin', 'documents.delete'),
  ('member', 'documents.read')
on conflict do nothing;
```

Then write one policy per operation:

```sql
create policy "Authorized members can read documents"
on public.documents
for select
to authenticated
using ((select public.authorize(organization_id, 'documents.read')));

create policy "Authorized members can create documents"
on public.documents
for insert
to authenticated
with check ((select public.authorize(organization_id, 'documents.create')));

create policy "Authorized members can update documents"
on public.documents
for update
to authenticated
using ((select public.authorize(organization_id, 'documents.update')))
with check ((select public.authorize(organization_id, 'documents.update')));

create policy "Authorized members can delete documents"
on public.documents
for delete
to authenticated
using ((select public.authorize(organization_id, 'documents.delete')));
```

Use `with check` on inserts and updates so users cannot create or move rows into organizations where they do not have permission.

## Common policy patterns

Read access for any organization member:

```sql
using ((select public.authorize(organization_id, 'documents.read')))
```

Write access for admins and owners only:

```sql
with check ((select public.authorize(organization_id, 'documents.create')))
```

Owner-only access can be modeled as a permission that only `owner` receives:

```sql
alter type public.app_permission add value 'billing.manage';

insert into public.role_permissions (role, permission)
values ('owner', 'billing.manage')
on conflict do nothing;
```

Then use it in a policy:

```sql
using ((select public.authorize(organization_id, 'billing.manage')))
```

## Choosing permissions

Prefer permissions that describe product actions rather than database internals:

```text
projects.read
projects.create
projects.update
projects.delete
members.invite
billing.manage
```

This keeps policies stable when the schema changes and makes it easier to map UI actions to backend access.

## Notes

This template does not rely on JWT custom claims for authorization. The database checks the current user's organization membership at query time, so a user can safely have different roles in different organizations.

## Edge Functions

For shared TypeScript helpers that call `authorize()` from Edge Functions, add the **Edge RBAC Helpers** template. It adds `supabase/functions/_shared` helpers without creating a new function node in the composer diagram.

## Dependencies

Requires **database** and **auth**.
