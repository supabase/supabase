import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { Sidebar } from 'components/interfaces/Sidebar'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useCheckLatestDeploy } from 'hooks/use-check-latest-deploy'
import { useAppStateSnapshot } from 'state/app-state'
import { SidebarProvider } from 'ui'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'

export interface DefaultLayoutProps {
  headerTitle?: string
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
const DefaultLayout = ({ children, headerTitle }: PropsWithChildren<DefaultLayoutProps>) => {
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

  return (
    <SidebarProvider defaultOpen={false}>
      <ProjectContextProvider projectRef={ref}>
        <AppBannerContextProvider>
          <div className="flex flex-col h-screen w-screen">
            {/* Top Banner */}
            <AppBannerWrapper />
            <div className="flex-shrink-0">
              <MobileNavigationBar />
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
              {/* Main Content */}
              <div className="flex-grow h-full overflow-y-auto">{children}</div>
            </div>
          </div>
        </AppBannerContextProvider>
      </ProjectContextProvider>
    </SidebarProvider>
  )
}

export default DefaultLayout
