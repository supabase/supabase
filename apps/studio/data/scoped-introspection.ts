import { useFeatureFlags, useFlag } from 'common'
import { useEffect } from 'react'

import { PG_META_SCOPED_INTROSPECTION_FLAG } from '@/data/table-editor/table-editor-query'
import { IS_PLATFORM } from '@/lib/constants'

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
 *
 * Cold-load race: `useFlag` (and this module) start out reading `false` until
 * ConfigCat's flag store has loaded (see `useFlag` in
 * `packages/common/feature-flags.tsx`, and `hasLoaded` on
 * `FeatureFlagContextType`). On a cold load -- e.g. a deep link straight into
 * the table editor -- the table/type/privilege queries below can fire before
 * `useSyncScopedIntrospection` has observed a loaded flag store, run the
 * legacy (unscoped) SQL, and -- because `scoped` isn't part of their query
 * key -- never refetch once the flag does resolve. Callers that need the
 * fully-resolved decision (not just whatever's currently in the accessor)
 * should `await scopedIntrospectionReady()` first; it resolves the first time
 * `useSyncScopedIntrospection` observes `hasLoaded` (or immediately when
 * running self-hosted, where flags are disabled and never load), with a 5s
 * timeout fallback in case the flag store never loads (ConfigCat outage,
 * etc.) so awaiting callers can't hang indefinitely.
 */
let scopedIntrospection = false

export const setScopedIntrospection = (value: boolean) => {
  scopedIntrospection = value
}

export const isScopedIntrospection = () => scopedIntrospection

const READY_TIMEOUT_MS = 5_000

let isReadySettled = false
let resolveReady: () => void = () => {}
const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve
})

const markScopedIntrospectionReady = () => {
  if (isReadySettled) return
  isReadySettled = true
  resolveReady()
}

// Safety net: if the flag store never reports as loaded (ConfigCat outage,
// `useSyncScopedIntrospection` never mounting, ...), don't leave awaiting
// callers hanging forever -- fall back to whatever `isScopedIntrospection()`
// currently holds (default: legacy/unscoped SQL).
setTimeout(markScopedIntrospectionReady, READY_TIMEOUT_MS)

/**
 * Resolves once the `pgMetaScopedIntrospection` flag's value is known to be
 * fully resolved (flag store loaded, or flags are disabled/self-hosted), or
 * after a fixed timeout as a safety net. Await this before reading
 * `isScopedIntrospection()` from a codepath that can run on a cold load,
 * before `useSyncScopedIntrospection` has had a chance to sync the real
 * value.
 */
export const scopedIntrospectionReady = (): Promise<void> => readyPromise

/**
 * Syncs the `pgMetaScopedIntrospection` flag's current value into the
 * imperative `isScopedIntrospection()` accessor above. Call once, near the
 * root of the component tree, from a component mounted under
 * `FeatureFlagProviderWithOrgContext` (currently `DefaultLayout`).
 */
export const useSyncScopedIntrospection = () => {
  const { hasLoaded } = useFeatureFlags()
  const scoped = !!useFlag(PG_META_SCOPED_INTROSPECTION_FLAG)

  useEffect(() => {
    setScopedIntrospection(scoped)

    // Self-hosted instances disable the flag provider entirely (see
    // `enabled={IS_PLATFORM}` in pages/_app.tsx and routes/__root.tsx), which
    // means the flag store's `hasLoaded` never flips true -- there's nothing
    // to wait for, so resolve immediately instead of relying on the timeout.
    if (hasLoaded || !IS_PLATFORM) {
      markScopedIntrospectionReady()
    }
  }, [scoped, hasLoaded])
}
