import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import { AppBannerWrapper } from 'components/interfaces/App/AppBannerWrapper'
import MobileNavigationBar from 'components/layouts/Navigation/NavigationBar/MobileNavigationBar'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { DefaultLayoutProviders } from '../DefaultLayoutProviders'
import { AppSidebarV2 } from './AppSidebar'
import { RightRailLayout } from './RightIconRail'

export interface DefaultLayoutV2Props {
  headerTitle?: string
  hideMobileMenu?: boolean
}

const leftSidebarMinSize = 180
const leftSidebarMaxSize = 450
const leftSidebarDefaultSize = '250px'

/**
 * New three-column layout for the dashboard (V2 navigation).
 *
 * Layout structure:
 * 1. Left sidebar - navigation with groups (Database, Platform, Observability, Integrations)
 * 2. Main content area - page content (no secondary nav bar)
 * 3. Right icon rail - AI, SQL, Alerts, Help panels
 *
 * This replaces DefaultLayout + ProjectLayout + feature-specific layouts (AuthLayout, DatabaseLayout, etc.)
 * when the navigation V2 feature flag is enabled. The key difference is that there is no longer a
 * secondary product menu sidebar - all navigation is handled in the primary sidebar with collapsible groups.
 */
export const DefaultLayoutV2 = ({
  children,
  hideMobileMenu,
}: PropsWithChildren<DefaultLayoutV2Props>) => {
  const router = useRouter()
  const isMobile = useBreakpoint('md')
  const appSnap = useAppStateSnapshot()
  const scope = router.pathname.startsWith('/project') ? 'project' : 'organization'
  const showLeftSidebar = !isMobile && !router.pathname.startsWith('/account')

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const backToDashboardURL = router.pathname.startsWith('/account')
    ? appSnap.lastRouteBeforeVisitingAccountPage.length > 0
      ? appSnap.lastRouteBeforeVisitingAccountPage
      : lastVisitedOrganization
        ? `/org/${lastVisitedOrganization}`
        : '/organizations'
    : undefined

  return (
    <DefaultLayoutProviders>
      <div className="flex flex-col h-screen w-screen">
        <AppBannerWrapper />
        <div className="flex-shrink-0">
          <MobileNavigationBar
            hideMobileMenu={hideMobileMenu}
            backToDashboardURL={backToDashboardURL}
          />
        </div>
        <RightRailLayout>
          {showLeftSidebar ? (
            <ResizablePanelGroup
              orientation="horizontal"
              autoSaveId="default-layout-v2-left-sidebar"
              className="h-full w-full overflow-hidden"
            >
              <ResizablePanel
                id="panel-v2-left-sidebar"
                minSize={leftSidebarMinSize}
                maxSize={leftSidebarMaxSize}
                defaultSize={leftSidebarDefaultSize}
                className="h-full min-h-0 overflow-hidden"
              >
                <AppSidebarV2 scope={scope} />
              </ResizablePanel>
              <ResizableHandle withHandle className="hidden md:flex bg-background" />
              <ResizablePanel
                id="panel-v2-main-content"
                className="h-full min-h-0 min-w-0 overflow-hidden"
              >
                <div className="flex h-full min-h-0 flex-1 overflow-hidden">{children}</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex h-full min-h-0 flex-1 overflow-hidden">{children}</div>
          )}
        </RightRailLayout>
      </div>
    </DefaultLayoutProviders>
  )
}

export default DefaultLayoutV2
