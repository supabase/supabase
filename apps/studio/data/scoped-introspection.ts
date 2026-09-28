import { useFeatureFlags, useFlag } from 'common'
import { useEffect } from 'react'

import { PG_META_SCOPED_INTROSPECTION_FLAG } from '@/data/table-editor/table-editor-query'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Imperative accessor for the `pgMetaScopedIntrospection` flag, read by query
 * fns that opt into scoped pg-meta SQL without threading `scoped` through
 * their React Query key (accepted tradeoff: a mid-session flag flip can serve
 * stale-keyed cached data until the query's next natural refetch). Hydrated
 * by `useSyncScopedIntrospection`, called from `DefaultLayout` -- the first
 * component both of Studio's root trees (pages/_app.tsx, routes/__root.tsx)
 * render inside `FeatureFlagProviderWithOrgContext`.
 */
let scopedIntrospection = false

export const setScopedIntrospection = (value: boolean) => {
  scopedIntrospection = value
}

export const isScopedIntrospection = () => scopedIntrospection

const READY_TIMEOUT_MS = 5_000

let isReadySettled = false
let isTimeoutArmed = false
let resolveReady: () => void = () => {}
const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve
})

const markScopedIntrospectionReady = () => {
  if (isReadySettled) return
  isReadySettled = true
  resolveReady()
}

/**
 * Resolves once `useSyncScopedIntrospection` has hydrated the accessor from a
 * loaded flag store (or immediately if self-hosted) -- never before, by
 * construction (see that hook). Arms a 5s fallback timer on its *first call*
 * rather than at module load, so a query firing long after boot isn't bound
 * by a timer that already expired before hydration got a chance to run.
 */
export const scopedIntrospectionReady = (): Promise<void> => {
  if (!isTimeoutArmed) {
    isTimeoutArmed = true
    setTimeout(markScopedIntrospectionReady, READY_TIMEOUT_MS)
  }
  return readyPromise
}

/**
 * Syncs the flag's current value into `isScopedIntrospection()`. Call once
 * near the root, under `FeatureFlagProviderWithOrgContext` (currently
 * `DefaultLayout`).
 */
export const useSyncScopedIntrospection = () => {
  const { hasLoaded } = useFeatureFlags()
  const scoped = !!useFlag(PG_META_SCOPED_INTROSPECTION_FLAG)

  useEffect(() => {
    setScopedIntrospection(scoped)

    // Self-hosted disables the flag provider (enabled={IS_PLATFORM}), so
    // hasLoaded never flips true -- there's nothing to wait for there.
    if (hasLoaded || !IS_PLATFORM) {
      markScopedIntrospectionReady()
    }
  }, [scoped, hasLoaded])
}
