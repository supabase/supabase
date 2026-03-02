'use client'

import { useFlag, useParams } from 'common'
import {
  useIsAPIDocsSidePanelEnabled,
  useUnifiedLogsPreview,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateSettingsRoutes,
  generateToolRoutes,
} from 'components/layouts/ProjectLayout/NavigationBar/NavigationBar.utils'
import type { Route } from 'components/ui/ui.types'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Home } from 'icons'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  Button,
  cn,
  Separator,
  SidebarGroup,
  SidebarMenu,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
} from 'ui'

import { getProductMenuComponent } from './mobileProductMenuRegistry'

/** Tool routes navigate directly at top level; section/product menu is shown only when already in that section */
const TOP_LEVEL_DIRECT_LINK_KEYS = ['editor', 'sql'] as const

function isDirectLinkAtTopLevel(route: Route): boolean {
  return TOP_LEVEL_DIRECT_LINK_KEYS.includes(
    route.key as (typeof TOP_LEVEL_DIRECT_LINK_KEYS)[number]
  )
}

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
  const pathname = router.asPath?.split('?')[0] ?? router.pathname
  const activeRoute = pathname.split('/')[3]

  const [viewLevel, setViewLevel] = useState<'top' | 'section'>(
    currentProductMenu && currentSectionKey ? 'section' : 'top'
  )
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null)

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
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
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
        apiDocsSidePanel: isNewAPIDocsEnabled,
      }),
    [ref, project, isUnifiedLogsEnabled, showReports, isNewAPIDocsEnabled]
  )
  const settingsRoutes = useMemo(() => generateSettingsRoutes(ref, project), [ref, project])

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

  const hasSubmenu = useCallback((route: Route) => {
    if (route.items && Array.isArray(route.items) && route.items.length > 0) return true
    const component = getProductMenuComponent(route.key)
    return component !== null
  }, [])

  const handleTopLevelClick = useCallback(
    (route: Route) => {
      if (route.disabled) return
      if (isDirectLinkAtTopLevel(route) && route.link) {
        router.push(route.link)
        onCloseSheet?.()
        return
      }
      if (hasSubmenu(route)) {
        setSelectedSectionKey(route.key)
        setViewLevel('section')
        return
      }
      if (route.link) {
        router.push(route.link)
        onCloseSheet?.()
      }
    },
    [hasSubmenu, router, onCloseSheet]
  )

  const handleBackToTop = useCallback(() => {
    setViewLevel('top')
    setSelectedSectionKey(null)
  }, [])

  const sectionKeyToShow = viewLevel === 'section' ? selectedSectionKey ?? currentSectionKey : null
  const sectionLabel =
    sectionKeyToShow &&
    (sectionKeyToShow === currentSectionKey
      ? currentProduct
      : allTopLevelRoutes.find((r) => r.key === sectionKeyToShow)?.label ?? sectionKeyToShow)

  const SectionMenuContent = sectionKeyToShow ? getProductMenuComponent(sectionKeyToShow) : null
  const pageSegment = pathname.split('/')[4]

  const renderTopLevelRoute = useCallback(
    (route: Route, isActive: boolean) => {
      const hasItems = hasSubmenu(route) && !isDirectLinkAtTopLevel(route)
      const content = (
        <>
          {route.icon && (
            <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:shrink-0">
              {route.icon}
            </span>
          )}
          <span className="truncate">{route.label}</span>
        </>
      )
      const menuButtonClass = cn(
        sidebarMenuButtonVariants({ size: 'default', hasIcon: !!route.icon }),
        route.disabled && 'opacity-50 pointer-events-none'
      )
      return (
        <SidebarMenuItem key={route.key}>
          {hasItems ? (
            <button
              type="button"
              data-active={isActive}
              onClick={() => handleTopLevelClick(route)}
              disabled={route.disabled}
              className={menuButtonClass}
            >
              {content}
            </button>
          ) : route.link ? (
            <Link
              href={route.link}
              onClick={onCloseSheet}
              data-active={isActive}
              className={menuButtonClass}
            >
              {content}
            </Link>
          ) : (
            <span data-active={false} className={cn(menuButtonClass, 'cursor-default')}>
              {content}
            </span>
          )}
        </SidebarMenuItem>
      )
    },
    [hasSubmenu, handleTopLevelClick, onCloseSheet]
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
                  renderTopLevelRoute(
                    route,
                    activeRoute === route.key || (route.key === 'HOME' && !activeRoute)
                  )
                )}
              </SidebarGroup>
              <Separator className="mx-2 w-auto bg-sidebar-border" />
              <SidebarGroup className="gap-0.5">
                {productRoutes.map((route) =>
                  renderTopLevelRoute(route, activeRoute === route.key)
                )}
              </SidebarGroup>
              <Separator className="mx-2 w-auto bg-sidebar-border" />
              <SidebarGroup className="gap-0.5">
                {otherRoutes.map((route) => renderTopLevelRoute(route, activeRoute === route.key))}
              </SidebarGroup>
              <Separator className="mx-2 w-auto bg-sidebar-border" />
              <SidebarGroup className="gap-0.5">
                {settingsRoutes.map((route) =>
                  renderTopLevelRoute(route, activeRoute === route.key)
                )}
              </SidebarGroup>
            </SidebarMenu>
          </nav>
        )}
        {viewLevel === 'section' && sectionKeyToShow && (
          <div className="p-1">
            {sectionKeyToShow === currentSectionKey && currentProductMenu ? (
              currentProductMenu
            ) : SectionMenuContent ? (
              <React.Suspense
                fallback={<div className="py-4 text-sm text-foreground-muted">Loading...</div>}
              >
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
