---
name: studio-queries
description: React Query conventions for data fetching in Supabase Studio. Use when
  writing or reviewing query hooks, mutation hooks, or query keys in apps/studio/data/
  — including adding the first fetch or mutation for a new API endpoint or resource.
  Covers queryOptions pattern, keys.ts structure, mutation hook template, and imperative
  fetching.
---

# Studio Queries & Mutations (React Query)

Follow the patterns in `apps/studio/data/`. Reference examples:

- Query options: `apps/studio/data/table-editor/table-editor-query.ts`
- Mutation hook: `apps/studio/data/edge-functions/edge-functions-update-mutation.ts`
- Keys: `apps/studio/data/edge-functions/keys.ts`

## Query Keys

Define a `keys.ts` per domain. Export `*Keys` helpers using array keys with `as const`. Never inline query keys in components.

```ts
export const edgeFunctionsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'edge-functions'] as const,
  detail: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'detail'] as const,
}
```

## Query Options (preferred pattern)

Use `queryOptions` from `@tanstack/react-query`. This gives type safety and works with both `useQuery()` and `queryClient.fetchQuery()`.

Rules:

- Export `XVariables`, `XData`, and `XError` types (prefixed with the domain name)
- Implement a **private** `getX(variables, signal?)` function:
  - Throws if required variables are missing
  - Passes `signal` for cancellation
  - Calls `handleError(error)` on failure (which throws); returns `data` on success
  - Not exported — use `queryClient.fetchQuery(xQueryOptions(...))` for imperative fetching
- Export `xQueryOptions()` using `queryOptions`
- Gate with `enabled` so the query doesn't run until required variables exist
- Platform-only queries: include `IS_PLATFORM` from `lib/constants` in `enabled`
- Don't add extra params to `xQueryOptions` — callers override by destructuring: `{ ...xQueryOptions(vars), enabled: true }`. Exception: grant-gated queries (see below)

```ts
import { queryOptions } from '@tanstack/react-query'

import { xKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

export type XVariables = { projectRef?: string }
export type XError = StudioError

async function getX({ projectRef }: XVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')
  const { data, error } = await get('/v1/projects/{ref}/x', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type XData = Awaited<ReturnType<typeof getX>>

export const xQueryOptions = ({ projectRef }: XVariables) =>
  queryOptions({
    queryKey: xKeys.list(projectRef),
    queryFn: ({ signal }) => getX({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
```

## Grant-gated queries

Query options that take a `grant` (see `lib/grants.ts`) are an exception to the spread-and-override guidance. Build them with `grantedQueryOptions` from `@/data/granted-query-options`, and let callers pass their options as the **second argument**. Never spread them.

```ts
export const xQueryOptions = <TData = XData>(
  { projectRef, grant }: XVariables,
  options?: GrantedQueryCallerOptions<XData, XError, TData, ReturnType<typeof xKeys.list>>
) =>
  grantedQueryOptions(
    {
      queryKey: xKeys.list(projectRef),
      queryFn:
        projectRef && grant ? ({ signal }) => getX({ projectRef, grant }, signal) : undefined,
    },
    options
  )

// Caller
useQuery(xQueryOptions({ projectRef, grant: xGrant.grant }, { select, enabled: open }))
```

Why: TanStack keeps one options object per cache entry, overwritten by whichever observer rendered last, and invalidation refetches with it. A missing grant yields `queryFn: undefined` and `enabled: false` (not `skipToken`, which would make invalidation fail with `Missing queryFn` if a grant-less observer rendered last). The helper owns `queryKey`, `queryFn`, and the `enabled` gate, so a caller can't override the grant check. `grantedQueryOptions` brands its return type (a type-only `__grantedQueryOptions` property), and the type-aware `fga/no-spread-granted-query-options` lint rule reports any object spread or `Object.assign` of a branded value, however it was obtained (variable, wrapper, renamed import).

## Using Query Options in Components

```ts
import { useQuery } from '@tanstack/react-query'

import { xQueryOptions } from '@/data/x/x-query'

const { data, isPending, isError } = useQuery(xQueryOptions({ projectRef: project?.ref }))
```

## Imperative Fetching (outside React or in callbacks)

```ts
const queryClient = useQueryClient()
const { data: project } = useSelectedProjectQuery()

const handleClick = useCallback(
  async (id: number) => {
    const data = await queryClient.fetchQuery(xQueryOptions({ id, projectRef: project?.ref }))
    // use data...
  },
  [project?.ref, queryClient]
)
```

## Mutation Hook

- Export a `Variables` type with `projectRef`, identifiers, and `payload`
- Implement a private `updateX(vars)` function with required variable validation and `handleError`
- Wrap in `useXMutation()`:
  - Accepts `UseMutationOptions` (omit `mutationFn`)
  - Invalidates `list()` + `detail()` keys in `onSuccess` with `await Promise.all([...])`
  - Defaults to `toast.error(...)` when `onError` isn't provided

```ts
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { xKeys } from './keys'

type XUpdateVariables = { projectRef: string; slug: string; payload: XPayload }

export const useXUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<XData, XError, XUpdateVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateX,
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: xKeys.detail(variables.projectRef, variables.slug),
        }),
        queryClient.invalidateQueries({ queryKey: xKeys.list(variables.projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
```

## Component Usage

- Use React Query v5 flags: `isPending` for initial load, `isFetching` for background refetches
- Render states explicitly in order: pending → error → success
