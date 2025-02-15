import { useParams } from 'common'
import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { Sidebar } from 'components/interfaces/Sidebar'
import { PropsWithChildren } from 'react'
import { SidebarProvider } from 'ui'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
  hasProductMenu?: boolean
  // Shows header in the top left of the page
  headerTitle?: string
  showProductMenu?: boolean
}

const DefaultLayout = ({
  children,
  headerTitle,
  showProductMenu,
}: PropsWithChildren<DefaultLayoutProps>) => {
  const { ref } = useParams()
  return (
    <>
      <SidebarProvider defaultOpen={false}>
        <ProjectContextProvider projectRef={ref}>
          <AppBannerContextProvider>
            <div className="flex flex-col h-screen w-screen">
              {/* Top Banner */}
              <AppBannerWrapper />
              <div className="flex-shrink-0">
                <MobileNavigationBar />
                <LayoutHeader headerTitle={headerTitle} />
              </div>
              {/* Main Content Area */}
              <div className="flex flex-1 w-full overflow-y-hidden">
                {/* Sidebar */}
                {/* <NavigationBar /> */}
                <Sidebar />
                {/* Main Content */}
                <div className="flex-grow h-full overflow-y-auto">{children}</div>
              </div>
            </div>
          </AppBannerContextProvider>
        </ProjectContextProvider>
      </SidebarProvider>
    </>
  )
}

export default DefaultLayout
