'use client'

import { useSyncExternalStore } from 'react'

const subscribeToNothing = () => () => {}

/**
 * Returns true after hydration. Until then, put `IA_NAV_PENDING_CLASS` on the nav. The class hides
 * the nav only when the head script marked the page for option-1. After hydration, the nav renders
 * the known variant, so a stale marker from an earlier url hides nothing.
 */
export function useIaNavReady(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )
}
