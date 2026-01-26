import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useCallback, useMemo, useRef } from 'react'
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

const MAX_RECENT_ROUTES = 5
const EXCLUDED_ROUTE_KEYS = ['HOME'] // Don't track Project Overview since it's always visible

const DEFAULT_RECENT_ROUTES: RecentRoute[] = []

export const useRecentRoutes = () => {
  const { ref } = useParams()
  const lastTrackedKeyRef = useRef<string | null>(null)

  const [recentRoutes, setRecentRoutes, { isSuccess }] = useLocalStorageQuery<RecentRoute[]>(
    LOCAL_STORAGE_KEYS.RECENT_SIDEBAR_ROUTES(ref ?? ''),
    DEFAULT_RECENT_ROUTES
  )

  const trackRoute = useCallback(
    (route: {
      key: string
      childName: string
      parentLabel: string
      link: string
      parentKey: string
      childKey?: string
    }) => {
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

      // Check if this route is already at the top - if so, don't update
      if (recentRoutes.length > 0 && recentRoutes[0].key === route.key) {
        return
      }

      // Remove existing entry with the same key (to update visitedAt)
      const filteredRoutes = recentRoutes.filter((r) => r.key !== route.key)

      // Add new entry at the beginning
      const newRoute: RecentRoute = {
        key: route.key,
        childName: route.childName,
        parentLabel: route.parentLabel,
        link: route.link,
        parentKey: route.parentKey,
        childKey: route.childKey,
        visitedAt: Date.now(),
      }

      // Keep only the most recent MAX_RECENT_ROUTES
      const newRoutes = [newRoute, ...filteredRoutes].slice(0, MAX_RECENT_ROUTES)
      setRecentRoutes(newRoutes)
    },
    [recentRoutes, setRecentRoutes]
  )

  // Sort by visitedAt descending (most recent first)
  const sortedRecentRoutes = useMemo(() => {
    return [...recentRoutes].sort((a, b) => b.visitedAt - a.visitedAt)
  }, [recentRoutes])

  return {
    recentRoutes: sortedRecentRoutes,
    trackRoute,
    isLoaded: isSuccess,
  }
}
