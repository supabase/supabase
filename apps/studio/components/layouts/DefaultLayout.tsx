import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Sidebar } from 'components/interfaces/Sidebar'
import { useShowLayoutHeader } from 'hooks/misc/useShowLayoutHeader'
import { SidebarProvider } from 'ui'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'

export interface DefaultLayoutProps {
  headerTitle?: string
  showProductMenu?: boolean
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
 * @param showProductMenu - (Mobile only) Show button to toggle visiblity of product menu (Default: true)
 */
const DefaultLayout = ({
  children,
  headerTitle,
  showProductMenu = true,
}: PropsWithChildren<DefaultLayoutProps>) => {
  const newLayoutPreview = useNewLayout()
  const showLayoutHeader = useShowLayoutHeader()

  const { ref } = useParams()

  return (
    <SidebarProvider defaultOpen={false}>
      <ProjectContextProvider projectRef={ref}>
        <AppBannerContextProvider>
          <div className="flex flex-col h-screen w-screen">
            {/* Top Banner */}
            <AppBannerWrapper />
            <div className="flex-shrink-0">
              <MobileNavigationBar />
              {newLayoutPreview || showLayoutHeader ? (
                <LayoutHeader showProductMenu={showProductMenu} headerTitle={headerTitle} />
              ) : null}
            </div>
            {/* Main Content Area */}
            <div className="flex flex-1 w-full overflow-y-hidden">
              {/* Sidebar */}
              <Sidebar />
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
