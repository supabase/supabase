'use client'

import { useFlag, useParams } from 'common'
import { Home } from 'icons'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { Button, cn, Separator, SidebarGroup, SidebarMenu } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import { resolveSectionDisplay } from './MobileMenuContent.utils'
import { getProductMenuComponent } from './mobileProductMenuRegistry'
import { TopLevelRouteItem } from './TopLevelRouteItem'
import { routeHasSubmenu, useMobileMenuNavigation } from './useMobileMenuNavigation'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@/components/interfaces/Sidebar'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from '@/components/layouts/Navigation/NavigationBar/NavigationBar.utils'
import type { Route } from '@/components/ui/ui.types'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getPathnameWithoutQuery, getPathSegment } from '@/lib/pathname.utils'

export interface MobileMenuContentProps {
  currentProductMenu: React.ReactNode
  currentProduct: string
  currentSectionKey: string | null
  onCloseSheet?: () => void
}

export function MobileMenuContent({
  currentProductMenu,
  currentProduct,
  currentSectionKey,
  onCloseSheet,
}: MobileMenuContentProps) {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const pathname = getPathnameWithoutQuery(router.asPath, router.pathname)
  const activeRoute = getPathSegment(pathname, 3)

  const { viewLevel, selectedSectionKey, handleTopLevelClick, handleBackToTop } =
    useMobileMenuNavigation({
      currentSectionKey,
      hasCurrentProductMenu: !!currentProductMenu,
      onCloseSheet,
    })

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
  const showReports = useIsFeatureEnabled('reports:all')
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

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
  const settingsRoutes = useMemo(() => generateSettingsRoutes(ref), [ref])

  const homeRoute: Route = useMemo(
    () => ({
      key: 'HOME',
      label: 'Project Overview',
      icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref ? `/project/${ref}` : undefined,
    }),
    [ref]
  )

  const allTopLevelRoutes = useMemo(
    () => [homeRoute, ...toolRoutes, ...productRoutes, ...otherRoutes, ...settingsRoutes],
    [homeRoute, toolRoutes, productRoutes, otherRoutes, settingsRoutes]
  )

  const { sectionKey: sectionKeyToShow, sectionLabel } = resolveSectionDisplay({
    viewLevel,
    selectedSectionKey,
    currentSectionKey,
    currentProduct,
    routes: allTopLevelRoutes,
  })

  const SectionMenuContent = sectionKeyToShow ? getProductMenuComponent(sectionKeyToShow) : null
  const pageSegment = getPathSegment(pathname, 4)

  const renderRoute = (route: Route, isActive: boolean) => (
    <TopLevelRouteItem
      key={route.key}
      route={route}
      isActive={isActive}
      hasSubmenu={routeHasSubmenu(route)}
      onTopLevelClick={handleTopLevelClick}
      onCloseSheet={onCloseSheet}
    />
  )

  return (
    <div className="flex flex-col h-full bg-background">
      {viewLevel === 'section' && sectionLabel && (
        <div
          className={cn(
            'flex-shrink-0 flex items-center gap-2 border-b border-default px-3 min-h-[var(--header-height)]'
          )}
        >
          <Button
            type="text"
            className="!p-1 justify-start"
            icon={<ChevronLeft size={20} />}
            onClick={handleBackToTop}
            aria-label="Back to menu"
            block
          >
            <span className="font-medium truncate text-sm">{sectionLabel}</span>
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto pb-8 text-sidebar-foreground">
        {viewLevel === 'top' && (
          <nav className="flex flex-col gap-2 p-1" aria-label="Project menu">
            <SidebarMenu>
              <SidebarGroup className="gap-0.5">
                {[homeRoute, ...toolRoutes].map((route) =>
                  renderRoute(
                    route,
                    activeRoute === route.key || (route.key === 'HOME' && activeRoute === undefined)
                  )
                )}
              </SidebarGroup>
              <Separator className="mx-2 w-auto bg-sidebar-border" />
              <SidebarGroup className="gap-0.5">
                {productRoutes.map((route) => renderRoute(route, activeRoute === route.key))}
              </SidebarGroup>
              <Separator className="mx-2 w-auto bg-sidebar-border" />
              <SidebarGroup className="gap-0.5">
                {otherRoutes.map((route) => renderRoute(route, activeRoute === route.key))}
              </SidebarGroup>
              <Separator className="mx-2 w-auto bg-sidebar-border" />
              <SidebarGroup className="gap-0.5">
                {settingsRoutes.map((route) => renderRoute(route, activeRoute === route.key))}
              </SidebarGroup>
            </SidebarMenu>
          </nav>
        )}
        {viewLevel === 'section' && sectionKeyToShow && (
          <div className="p-1">
            {sectionKeyToShow === currentSectionKey && currentProductMenu ? (
              currentProductMenu
            ) : SectionMenuContent ? (
              <React.Suspense fallback={<GenericSkeletonLoader className="p-4" />}>
                {sectionKeyToShow === 'advisors' ? (
                  <SectionMenuContent
                    {...({ page: pageSegment } as React.ComponentProps<typeof SectionMenuContent>)}
                  />
                ) : (
                  <SectionMenuContent />
                )}
              </React.Suspense>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
