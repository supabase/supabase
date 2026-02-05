---
description: 'Studio: data fetching conventions for queries/mutations (React Query hooks)'
globs:
  - apps/studio/data/**/*.{ts,tsx}
  - apps/studio/pages/**/*.{ts,tsx}
  - apps/studio/components/**/*.{ts,tsx}
alwaysApply: false
---

# Studio queries & mutations (React Query)

Follow the `apps/studio/data/` patterns:

- Query options: `apps/studio/data/table-editor/table-editor-query.ts`
- Mutation hook: `apps/studio/data/edge-functions/edge-functions-update-mutation.ts`
- Keys: `apps/studio/data/edge-functions/keys.ts`
- Page usage: `apps/studio/pages/project/[ref]/database/tables/[id].tsx`

## Organize query keys

- Define a `keys.ts` per domain and export `*Keys` helpers (use array keys with `as const`).
- Do not inline query keys in components.

Example:

```ts
export const edgeFunctionsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'edge-functions'] as const,
  detail: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'detail'] as const,
}
```

## Write query options (preferred pattern)

Use `queryOptions` from `@tanstack/react-query` to define reusable query configurations. This pattern:

- Provides type safety for query keys and data
- Can be used with `useQuery()` in components
- Can be used with `queryClient.fetchQuery()` for imperative fetching

Guidelines:

- Export `XVariables`, `XData`, and `XError` types from the file (prefixed with the domain name).
- Implement a private `getX(variables, signal?)` function that:
  - throws if required variables are missing
  - passes the `signal` through to the fetcher for cancellation
  - calls `handleError(error)` on failure (which throws) — the function returns `data` on success
  - this function should NOT be exported. For imperative fetching, use `queryClient.fetchQuery(xQueryOptions(...))`
- Export `xQueryOptions()` using `queryOptions` from `@tanstack/react-query`.
- Gate with `enabled` so the query doesn't run until required variables exist (and platform-only queries should include `IS_PLATFORM` from `lib/constants`).
- When migrating away from exporting `useQuery`, move all options into the `xQueryOptions` as default values.
- No extra options should be added as params, if the user wants to overwrite the options, they can do by destructuring the query options. For example, `{ ...xQueryOptions(vars), enabled: true }`.

Template:

```ts
import { queryOptions } from '@tanstack/react-query'

import { xKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import { ResponseError } from '@/types'

export type XVariables = { projectRef?: string }
export type XError = ResponseError

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

export const xQueryOptions = ({ projectRef }: XVariables) => {
  return queryOptions({
    queryKey: xKeys.list(projectRef),
    queryFn: ({ signal }) => getX({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
}
```

## Using query options in components

Use `useQuery` directly with the query options:

```ts
import { useQuery } from '@tanstack/react-query'

import { xQueryOptions } from '@/data/x/x-query'

// In component:
const { data, isPending, isError } = useQuery(
  xQueryOptions({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
)
```

## Imperative fetching (outside React or in callbacks)

Use `queryClient.fetchQuery()` with the query options:

```ts
import { useQueryClient } from '@tanstack/react-query'

import { xQueryOptions } from '@/data/x/x-query'

// In component:
const queryClient = useQueryClient()

const handleClick = useCallback(
  async (id: number) => {
    const data = await queryClient.fetchQuery(
      xQueryOptions({
        id,
        projectRef,
        connectionString: project?.connectionString,
      })
    )
    // use data...
  },
  [project?.connectionString, projectRef, queryClient]
)
```

## Write a mutation hook

- Export a `Variables` type that includes `projectRef`, identifiers (e.g. `slug`), and `payload`.
- Implement an `updateX(vars)` function that validates required variables and uses `handleError`.
- Prefer a `useXMutation()` wrapper that:
  - accepts `UseCustomMutationOptions` (omit `mutationFn`)
  - invalidates the relevant `list()` + `detail()` keys in `onSuccess` and `await`s them via `Promise.all`
  - defaults to a `toast.error(...)` when `onError` isn't provided

Template:

```ts
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { xKeys } from './keys'
import type { UseCustomMutationOptions } from '@/data/custom-mutation'

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

## Component usage

- Prefer React Query's v5 flags:
  - `isPending` for initial load (often aliased to `isLoading`)
  - `isFetching` for background refetches
- Render states explicitly (pending → error → success), like `apps/studio/pages/project/[ref]/database/tables/[id].tsx`.
