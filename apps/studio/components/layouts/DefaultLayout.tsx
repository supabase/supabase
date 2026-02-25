import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AppBannerWrapper } from 'components/interfaces/App/AppBannerWrapper'
import { Sidebar } from 'components/interfaces/Sidebar'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useCheckLatestDeploy } from 'hooks/use-check-latest-deploy'
import { useRouter } from 'next/router'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { sidebarManagerState, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { ResizablePanel, ResizablePanelGroup, SidebarProvider } from 'ui'
import { CommandWrapper, MobileSheetNav } from 'ui-patterns'

import { CommandMenuInnerContent } from '../interfaces/App/CommandMenu/CommandMenu'
import { BannerStack } from '../ui/BannerStack/BannerStack'
import { BannerStackProvider } from '../ui/BannerStack/BannerStackProvider'
import { LayoutHeader } from './ProjectLayout/LayoutHeader/LayoutHeader'
import { LayoutSidebar } from './ProjectLayout/LayoutSidebar'
import { LayoutSidebarProvider } from './ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import {
  MobileSidebarSheetProvider,
  useMobileSidebarSheet,
} from './ProjectLayout/LayoutSidebar/MobileSidebarSheetContext'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'

export interface DefaultLayoutProps {
  headerTitle?: string
  hideMobileMenu?: boolean
}

interface DefaultLayoutContentProps extends DefaultLayoutProps {
  showProductMenu: boolean
  backToDashboardURL: string
  contentMinSizePercentage: number
  contentMaxSizePercentage: number
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
  const { ref } = useParams()
  const router = useRouter()
  const appSnap = useAppStateSnapshot()
  const showProductMenu = !!ref && router.pathname !== '/project/[ref]'

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const backToDashboardURL =
    appSnap.lastRouteBeforeVisitingAccountPage.length > 0
      ? appSnap.lastRouteBeforeVisitingAccountPage
      : !!lastVisitedOrganization
        ? `/org/${lastVisitedOrganization}`
        : '/organizations'

  useCheckLatestDeploy()

  const contentMinSizePercentage = 50
  const contentMaxSizePercentage = 70

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // This is required to prevent layout shift when rendering resizable panels (they initially render at 50%, then shift
  // to whatever is specified).
  if (!isMounted) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutSidebarProvider>
        <MobileSidebarSheetProvider>
          <ProjectContextProvider projectRef={ref}>
            <BannerStackProvider>
              <BannerStack />
              <DefaultLayoutContent
                headerTitle={headerTitle}
                hideMobileMenu={hideMobileMenu}
                showProductMenu={showProductMenu}
                backToDashboardURL={backToDashboardURL}
                contentMinSizePercentage={contentMinSizePercentage}
                contentMaxSizePercentage={contentMaxSizePercentage}
              >
                {children}
              </DefaultLayoutContent>
            </BannerStackProvider>
          </ProjectContextProvider>
        </MobileSidebarSheetProvider>
      </LayoutSidebarProvider>
    </SidebarProvider>
  )
}

const DefaultLayoutContent = ({
  children,
  headerTitle,
  hideMobileMenu,
  showProductMenu,
  backToDashboardURL,
  contentMinSizePercentage,
  contentMaxSizePercentage,
}: PropsWithChildren<DefaultLayoutContentProps>) => {
  const router = useRouter()
  const {
    content: mobileSheetContent,
    setContent: setMobileSheetContent,
    menuContent,
  } = useMobileSidebarSheet()
  const { activeSidebar } = useSidebarManagerSnapshot()

  return (
    <>
      <div className="flex flex-col h-screen w-screen">
        {/* Top Banner */}
        <AppBannerWrapper />
        <div className="flex-shrink-0">
          <MobileNavigationBar hideMobileMenu={hideMobileMenu} />
          <LayoutHeader
            showProductMenu={showProductMenu}
            headerTitle={headerTitle}
            backToDashboardURL={
              router.pathname.startsWith('/account') ? backToDashboardURL : undefined
            }
          />
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
              minSize={`${contentMinSizePercentage}`}
              maxSize={`${contentMaxSizePercentage}`}
              defaultSize={`${contentMaxSizePercentage}`}
            >
              <div className="h-full overflow-y-auto">{children}</div>
            </ResizablePanel>
            <LayoutSidebar
              minSize={`${100 - contentMaxSizePercentage}`}
              maxSize={`${100 - contentMinSizePercentage}`}
              defaultSize={`${100 - contentMaxSizePercentage}`}
            />
          </ResizablePanelGroup>
        </div>
      </div>
      <MobileSheetNav
        open={mobileSheetContent !== null}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setMobileSheetContent(null)
            sidebarManagerState.closeActive()
          }
        }}
      >
        {mobileSheetContent === 'search' ? (
          <CommandWrapper className="h-full flex flex-col bg-background">
            <CommandMenuInnerContent />
          </CommandWrapper>
        ) : mobileSheetContent === 'menu' ? (
          menuContent
        ) : (
          activeSidebar?.component?.() ?? null
        )}
      </MobileSheetNav>
    </>
  )
}

export default DefaultLayout
