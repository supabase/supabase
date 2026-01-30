import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocalStorageQuery } from './useLocalStorage'

export type RecentRoute = {
  key: string // Unique key for the route (e.g., "database-indexes", "auth-users")
  childName: string // Child route name (e.g., "Indexes")
  parentLabel: string // Parent route label (e.g., "Database")
  link: string // Full URL path
  parentKey: string // Parent route key (e.g., "database", "auth")
  childKey?: string // Child route key if applicable (e.g., "indexes", "users")
  visitedAt: number // Timestamp for ordering
}

const MAX_RECENT_ROUTES = 15
const EXCLUDED_ROUTE_KEYS = ['HOME'] // Don't track Project Overview since it's always visible

const DEFAULT_RECENT_ROUTES: RecentRoute[] = []

export const useRecentRoutes = () => {
  const { ref } = useParams()
  const lastTrackedKeyRef = useRef<string | null>(null)
  const refRef = useRef<string | undefined>(ref)

  // Keep ref in sync
  useEffect(() => {
    refRef.current = ref
  }, [ref])

  // Only use storage when ref is available to prevent data leakage between projects
  const storageKey = ref ? LOCAL_STORAGE_KEYS.RECENT_SIDEBAR_ROUTES(ref) : null

  const [recentRoutes, setRecentRoutes, { isSuccess }] = useLocalStorageQuery<RecentRoute[]>(
    storageKey ?? '',
    DEFAULT_RECENT_ROUTES
  )

  // Stable trackRoute that uses functional updates to avoid race conditions
  const trackRoute = useCallback(
    (route: {
      key: string
      childName: string
      parentLabel: string
      link: string
      parentKey: string
      childKey?: string
    }) => {
      // Don't track if project ref isn't available
      if (!refRef.current) {
        return
      }

      // Don't track excluded routes
      if (EXCLUDED_ROUTE_KEYS.includes(route.parentKey)) {
        return
      }

      // Don't track if no valid link
      if (!route.link) {
        return
      }

      // Skip if we just tracked this route (prevents re-render loops)
      if (lastTrackedKeyRef.current === route.key) {
        return
      }
      lastTrackedKeyRef.current = route.key

      // Use functional update to get current value from query cache (avoids race conditions)
      setRecentRoutes((currentRoutes) => {
        // Check if this route is already at the top - if so, don't update
        if (currentRoutes.length > 0 && currentRoutes[0].key === route.key) {
          return currentRoutes
        }

        const newRoute: RecentRoute = {
          key: route.key,
          childName: route.childName,
          parentLabel: route.parentLabel,
          link: route.link,
          parentKey: route.parentKey,
          childKey: route.childKey,
          visitedAt: Date.now(),
        }

        const filteredRoutes = currentRoutes.filter((r) => r.key !== route.key)
        return [newRoute, ...filteredRoutes].slice(0, MAX_RECENT_ROUTES)
      })
    },
    [setRecentRoutes]
  )

  // Sort by visitedAt descending (most recent first)
  // Return empty array if ref is not available to prevent data leakage
  const sortedRecentRoutes = useMemo(() => {
    if (!ref) return DEFAULT_RECENT_ROUTES
    return [...recentRoutes].sort((a, b) => b.visitedAt - a.visitedAt)
  }, [recentRoutes, ref])

  return {
    recentRoutes: sortedRecentRoutes,
    trackRoute,
    isLoaded: isSuccess && !!ref,
  }
}
