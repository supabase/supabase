import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

import { useFlag, useParams } from 'common'
import { useUnifiedLogsPreview } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useRecentRoutes } from 'hooks/misc/useRecentRoutes'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStaticEffectEvent } from 'hooks/useStaticEffectEvent'

/**
 * Hook to track recent route visits for the command menu.
 * Should be called once in the ProjectLayout.
 */
export const useTrackRecentRoutes = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { trackRoute } = useRecentRoutes()
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()
  const showReports = useIsFeatureEnabled('reports:all')

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_edge_function:all',
    'project_storage:all',
    'realtime:all',
  ])

  const authOverviewPageEnabled = useFlag('authOverviewPage')

  // Generate all routes (memoized to prevent unnecessary recomputation)
  const toolRoutes = useMemo(() => generateToolRoutes(ref, project), [ref, project])
  const productRoutes = useMemo(
    () =>
      generateProductRoutes(ref, project, {
        auth: authEnabled,
        edgeFunctions: edgeFunctionsEnabled,
        storage: storageEnabled,
        realtime: realtimeEnabled,
        authOverviewPage: authOverviewPageEnabled,
      }),
    [
      ref,
      project,
      authEnabled,
      edgeFunctionsEnabled,
      storageEnabled,
      realtimeEnabled,
      authOverviewPageEnabled,
    ]
  )
  const otherRoutes = useMemo(
    () =>
      generateOtherRoutes(ref, project, {
        unifiedLogs: isUnifiedLogsEnabled,
        showReports,
      }),
    [ref, project, isUnifiedLogsEnabled, showReports]
  )
  const settingsRoutes = useMemo(() => generateSettingsRoutes(ref, project), [ref, project])

  // Get route keys from pathname
  const activeRoute = router.pathname.split('/')[3]
  const childRouteKey = router.pathname.split('/')[4]

  // Create a map of parent routes by key
  const parentRoutesMap = useMemo(() => {
    const routes = [...toolRoutes, ...productRoutes, ...otherRoutes, ...settingsRoutes]
    return routes.reduce(
      (acc, route) => {
        acc[route.key] = route
        return acc
      },
      {} as Record<string, (typeof routes)[0]>
    )
  }, [toolRoutes, productRoutes, otherRoutes, settingsRoutes])

  // Create a flat map of all child routes with their parent info
  const childRoutesMap = useMemo(() => {
    const map: Record<
      string,
      {
        childKey: string
        childName: string
        childUrl: string
        parentKey: string
        parentLabel: string
        pages?: string[]
      }
    > = {}

    const allParentRoutes = [...toolRoutes, ...productRoutes, ...otherRoutes, ...settingsRoutes]

    for (const parentRoute of allParentRoutes) {
      if (parentRoute.items) {
        for (const group of parentRoute.items) {
          const items = group.items || []
          for (const item of items) {
            const uniqueKey = `${parentRoute.key}-${item.key}`
            map[uniqueKey] = {
              childKey: item.key,
              childName: item.name,
              childUrl: item.url,
              parentKey: parentRoute.key,
              parentLabel: parentRoute.label,
              pages: item.pages,
            }
            // Also map by just the child key for lookup during tracking
            if (!map[item.key]) {
              map[item.key] = map[uniqueKey]
            }
            // Map alternative page keys if they exist
            if (item.pages) {
              for (const page of item.pages) {
                if (!map[page]) {
                  map[page] = map[uniqueKey]
                }
              }
            }
          }
        }
      }
    }

    return map
  }, [toolRoutes, productRoutes, otherRoutes, settingsRoutes])

  // Create stable event readers to avoid stale closures
  const getTrackRoute = useStaticEffectEvent(() => trackRoute)
  const getChildRoutesMap = useStaticEffectEvent(() => childRoutesMap)
  const getParentRoutesMap = useStaticEffectEvent(() => parentRoutesMap)

  // Track route visits when activeRoute or childRouteKey changes
  useEffect(() => {
    if (!activeRoute || !ref) return

    const trackRoute = getTrackRoute()
    const childRoutesMap = getChildRoutesMap()
    const parentRoutesMap = getParentRoutesMap()

    // First check if there's a child route
    if (childRouteKey) {
      const childRoute = childRoutesMap[childRouteKey]
      if (childRoute && childRoute.parentKey === activeRoute) {
        const uniqueKey = `${childRoute.parentKey}-${childRoute.childKey}`
        trackRoute({
          key: uniqueKey,
          childName: childRoute.childName,
          parentLabel: childRoute.parentLabel,
          link: childRoute.childUrl,
          parentKey: childRoute.parentKey,
          childKey: childRoute.childKey,
        })
        return
      }
    }

    // Fall back to tracking the parent route if no child route or it doesn't have children
    const parentRoute = parentRoutesMap[activeRoute]
    if (parentRoute && parentRoute.link) {
      const hasChildRoutes = parentRoute.items && parentRoute.items.length > 0
      if (!hasChildRoutes) {
        trackRoute({
          key: parentRoute.key,
          childName: parentRoute.label,
          parentLabel: '',
          link: parentRoute.link,
          parentKey: parentRoute.key,
        })
      }
    }
  }, [activeRoute, childRouteKey, ref, getTrackRoute, getChildRoutesMap, getParentRoutesMap])
}
