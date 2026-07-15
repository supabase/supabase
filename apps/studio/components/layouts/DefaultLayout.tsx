import { useBreakpoint, useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'
import { ResizablePanel, ResizablePanelGroup, SidebarProvider, usePanelRef } from 'ui'

import { BannerStack } from '../ui/BannerStack/BannerStack'
import { LayoutHeader } from './Navigation/LayoutHeader/LayoutHeader'
import MobileNavigationBar from './Navigation/NavigationBar/MobileNavigationBar'
import { MobileSheetProvider } from './Navigation/NavigationBar/MobileSheetContext'
import { StudioMobileSheetNav } from './Navigation/NavigationBar/StudioMobileSheetNav'
import { LayoutSidebar } from './ProjectLayout/LayoutSidebar'
import {
  LayoutSidebarProvider,
  SIDEBAR_KEYS,
} from './ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'
import { AppBannerWrapper } from '@/components/interfaces/App/AppBannerWrapper'
import { Sidebar } from '@/components/interfaces/Sidebar'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useCheckLatestDeploy } from '@/hooks/use-check-latest-deploy'
import { IS_PLATFORM } from '@/lib/constants'
import { useAppStateSnapshot } from '@/state/app-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export interface DefaultLayoutProps {
  headerTitle?: string
  hideMobileMenu?: boolean
}

/**
 * Base layout for all project pages in the dashboard, rendered as the first child on all page files within a project.
 *
 * A second layout as the child to this is required, and the layout depends on which section of the dashboard the page is on. (e.g Auth - AuthLayout)
 *
 * The base layout handles rendering the following UI components:
 * - App banner (e.g for notices or incidents)
 * - Mobile navigation bar
 * - First level side navigation bar (e.g For navigating to Table Editor, SQL Editor, Database page, etc)
 */
export const DefaultLayout = ({
  children,
  headerTitle,
  hideMobileMenu,
}: PropsWithChildren<DefaultLayoutProps>) => {
  useCheckLatestDeploy()

  const { ref } = useParams()
  const router = useRouter()
  const panelRef = usePanelRef()
  const isMobile = useBreakpoint('md')
  const appSnap = useAppStateSnapshot()
  const { isMaximised, activeSidebar } = useSidebarManagerSnapshot()
  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const [isMounted, setIsMounted] = useState(false)

  const backToDashboardURL = router.pathname.startsWith('/account')
    ? appSnap.lastRouteBeforeVisitingAccountPage.length > 0
      ? appSnap.lastRouteBeforeVisitingAccountPage
      : IS_PLATFORM && !!lastVisitedOrganization
        ? `/org/${lastVisitedOrganization}`
        : IS_PLATFORM
          ? '/organizations'
          : '/project/default'
    : undefined

  const contentMinSizePercentage = 50
  const contentMaxSizePercentage = 70

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !panelRef.current || !activeSidebar) return
    if (isMaximised) {
      panelRef.current.collapse()
    } else {
      panelRef.current.resize(`${contentMaxSizePercentage}%`)
    }
  }, [isMounted, isMaximised, panelRef, activeSidebar])

  // This is required to prevent layout shift when rendering resizable panels (they initially render at 50%, then shift
  // to whatever is specified).
  if (!isMounted) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutSidebarProvider>
        <ProjectContextProvider projectRef={ref}>
          <MobileSheetProvider>
            <div className="flex flex-col h-screen w-screen">
              <a className="sr-only" href="#main" tabIndex={0}>
                Skip to content
              </a>
              {/* Top Banner */}
              <AppBannerWrapper />
              <div className="shrink-0">
                {isMobile && (
                  <MobileNavigationBar
                    hideMobileMenu={hideMobileMenu}
                    backToDashboardURL={backToDashboardURL}
                  />
                )}
                <LayoutHeader headerTitle={headerTitle} backToDashboardURL={backToDashboardURL} />
              </div>
              {/* Main Content Area */}
              <div className="flex flex-1 w-full overflow-y-hidden">
                {/* Sidebar - Only show for project pages, not account pages */}
                {!router.pathname.startsWith('/account') && <Sidebar />}
                {/* Main Content with Layout Sidebar */}
                <ResizablePanelGroup
                  orientation="horizontal"
                  className="h-full w-full overflow-x-hidden flex-1 flex flex-row gap-0"
                  autoSaveId="default-layout-content"
                >
                  <ResizablePanel
                    id="panel-content"
                    className="w-full"
                    panelRef={panelRef}
                    collapsible={activeSidebar?.id === SIDEBAR_KEYS.AI_ASSISTANT}
                    minSize={`${contentMinSizePercentage}`}
                    maxSize={`${contentMaxSizePercentage}`}
                    defaultSize={`${contentMaxSizePercentage}`}
                  >
                    <main id="main" className="h-full overflow-y-auto">
                      {children}
                    </main>
                  </ResizablePanel>
                  <LayoutSidebar
                    minSize={`${100 - contentMaxSizePercentage}`}
                    maxSize="100"
                    defaultSize={`${100 - contentMaxSizePercentage}`}
                  />
                </ResizablePanelGroup>
              </div>
            </div>

            <BannerStack />
            <StudioMobileSheetNav />
          </MobileSheetProvider>
        </ProjectContextProvider>
      </LayoutSidebarProvider>
    </SidebarProvider>
  )
}
