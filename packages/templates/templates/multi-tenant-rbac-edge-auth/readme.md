# Edge RBAC Helpers template

Shared helpers for enforcing organization RBAC in Edge Functions, next to your application code. Use this when you want authorization at the application layer instead of relying on Postgres RLS policies.

The helpers use the **multi-tenant-rbac** schema (`public.authorize`) but run checks in your function handler before privileged logic executes. Import them from `../_shared/` to verify the caller's JWT and required permissions.

## Includes

- `supabase/functions/_shared/types.ts` — `AppPermission` and `AppRole` types aligned with the SQL enums
- `supabase/functions/_shared/responses.ts` — small JSON error helpers
- `supabase/functions/_shared/auth.ts` — user-scoped Supabase client and `requireUser`
- `supabase/functions/_shared/authorize.ts` — `hasPermission`, `requirePermission`, and organization header helpers

These files live under `_shared` so they do not appear as deployable Edge Functions in the project diagram. They are still merged into the generated project and visible in the file explorer.

## Example

```ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { requireUser } from '../_shared/auth.ts'
import { getOrganizationId, requirePermission } from '../_shared/authorize.ts'

Deno.serve(async (req) => {
  const authResult = await requireUser(req)
  if ('response' in authResult) return authResult.response

  const organizationId = getOrganizationId(req)
  if (!organizationId) {
    return Response.json({ error: 'missing x-organization-id header' }, { status: 400 })
  }

  const permissionResult = await requirePermission(
    authResult.client,
    organizationId,
    'projects.create'
  )
  if ('response' in permissionResult) return permissionResult.response

  // business logic with authResult.client (RLS-scoped)
  return Response.json({ ok: true })
})
```

Pass the active organization on each request (for example `x-organization-id`) so permission checks target the correct tenant.

## Dependencies

Requires **multi-tenant-rbac** and **functions** (which also pulls in **database**).
