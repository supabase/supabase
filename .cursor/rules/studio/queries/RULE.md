---
description: 'Studio: data fetching conventions for queries/mutations (React Query hooks)'
globs:
  - apps/studio/data/**/*.{ts,tsx}
  - apps/studio/pages/**/*.{ts,tsx}
  - apps/studio/components/**/*.{ts,tsx}
alwaysApply: false
---

# Studio queries & mutations (React Query)

Follow the `apps/studio/data/` patterns used by edge functions:

- Query hook: `apps/studio/data/edge-functions/edge-functions-query.ts`
- Mutation hook: `apps/studio/data/edge-functions/edge-functions-update-mutation.ts`
- Keys: `apps/studio/data/edge-functions/keys.ts`
- Page usage: `apps/studio/pages/project/[ref]/functions/index.tsx`

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

## Write a query hook

- Export `Variables`, `Data`, and `Error` types from the file.
- Implement a `getX(variables, signal?)` function that:
  - throws if required variables are missing
  - passes the `signal` through to the fetcher for cancellation
  - calls `handleError(error)` and returns `data`
- Wrap it in `useXQuery()` using `useQuery`, `UseCustomQueryOptions`, and a domain key helper.
- Gate with `enabled` so the query doesn’t run until required variables exist (and platform-only queries should include `IS_PLATFORM`).

Template:

```ts
export type XVariables = { projectRef?: string }
export type XError = ResponseError

export async function getX({ projectRef }: XVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')
  const { data, error } = await get('/v1/projects/{ref}/x', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type XData = Awaited<ReturnType<typeof getX>>

export const useXQuery = <TData = XData>(
  { projectRef }: XVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<XData, XError, TData> = {}
) =>
  useQuery<XData, XError, TData>({
    queryKey: xKeys.list(projectRef),
    queryFn: ({ signal }) => getX({ projectRef }, signal),
    enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined',
    ...options,
  })
```

## Write a mutation hook

- Export a `Variables` type that includes `projectRef`, identifiers (e.g. `slug`), and `payload`.
- Implement an `updateX(vars)` function that validates required variables and uses `handleError`.
- Prefer a `useXMutation()` wrapper that:
  - accepts `UseCustomMutationOptions` (omit `mutationFn`)
  - invalidates the relevant `list()` + `detail()` keys in `onSuccess` and `await`s them via `Promise.all`
  - defaults to a `toast.error(...)` when `onError` isn’t provided

Template:

```ts
export const useXUpdateMutation = ({ onSuccess, onError, ...options } = {}) => {
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

- Prefer React Query’s v5 flags:
  - `isPending` for initial load (often aliased to `isLoading`)
  - `isFetching` for background refetches
- Render states explicitly (pending → error → success), like `apps/studio/pages/project/[ref]/functions/index.tsx`.
