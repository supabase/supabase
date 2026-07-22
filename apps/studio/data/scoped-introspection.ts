import { useFlag } from 'common'
import { useEffect } from 'react'

import { PG_META_SCOPED_INTROSPECTION_FLAG } from '@/data/table-editor/table-editor-query'

/**
 * Imperative, module-level accessor for the `pgMetaScopedIntrospection` rollout
 * flag (see PG_META_SCOPED_INTROSPECTION_FLAG in
 * `@/data/table-editor/table-editor-query`).
 *
 * Query hooks that only opt into `scoped` pg-meta introspection (rather than
 * threading `scoped` through their own React Query key, the way PR #47894
 * threads it for the table-editor query) read the flag's current value from
 * here instead of taking it as a prop/param.
 *
 * `setScopedIntrospection` is synced by `useSyncScopedIntrospection`, called
 * once from `DefaultLayout` (see `components/layouts/DefaultLayout.tsx`)
 * rather than from a provider mounted in `pages/_app.tsx`: Studio has two
 * parallel root trees (the Next.js pages router in `pages/_app.tsx`, and the
 * TanStack Router migration in `routes/__root.tsx`), each mounting its own
 * `FeatureFlagProviderWithOrgContext`. `DefaultLayout` is the first shared
 * component rendered inside that provider in both trees, and every consumer
 * of `isScopedIntrospection()` is project-scoped (table/type/privilege
 * introspection), so hydrating from there covers all of them without
 * duplicating the sync logic per tree.
 *
 * Accepted tradeoff (decided in review): because `scoped` is not part of
 * these queries' cache keys, a flag flip mid-session can serve stale-keyed
 * cached data (fetched under the previous decision) until the query next
 * refetches (staleTime elapsing, remount, manual invalidation, etc). This is
 * acceptable because `pgMetaScopedIntrospection` is a session-stable rollout
 * flag, not something expected to flip while a user is actively using the
 * app.
 */
let scopedIntrospection = false

export const setScopedIntrospection = (value: boolean) => {
  scopedIntrospection = value
}

export const isScopedIntrospection = () => scopedIntrospection

/**
 * Syncs the `pgMetaScopedIntrospection` flag's current value into the
 * imperative `isScopedIntrospection()` accessor above. Call once, near the
 * root of the component tree, from a component mounted under
 * `FeatureFlagProviderWithOrgContext` (currently `DefaultLayout`).
 */
export const useSyncScopedIntrospection = () => {
  const scoped = !!useFlag(PG_META_SCOPED_INTROSPECTION_FLAG)

  useEffect(() => {
    setScopedIntrospection(scoped)
  }, [scoped])
}
