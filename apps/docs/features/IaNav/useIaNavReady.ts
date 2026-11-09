'use client'

import { useSyncExternalStore } from 'react'

import { useIaNavRouteVariant } from './IaNavRouteProvider'

const subscribeToNothing = () => () => {}

/**
 * Returns true after hydration. Until then, put `IA_NAV_PENDING_CLASS` on the nav. The class hides
 * the nav only when the head script marked the page for option-1. After hydration, the nav renders
 * the known variant, so a stale marker from an earlier url hides nothing.
 * A route that forces the variant is ready on the server, because its HTML already has that nav.
 */
export function useIaNavReady(): boolean {
  const routeVariant = useIaNavRouteVariant()
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )

  return Boolean(routeVariant) || isHydrated
}
