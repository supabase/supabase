import { AppBannerWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { PropsWithChildren, ReactNode } from 'react'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import NavigationBar from './ProjectLayout/NavigationBar/NavigationBar'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import { ProjectContextProvider } from './ProjectLayout/ProjectContext'
import { useParams } from 'common'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
  hasProductMenu?: boolean
  // Shows header in the top left of the page
  headerTitle?: string
  showProductMenu?: boolean
}

const DefaultLayout = ({ children, showProductMenu }: PropsWithChildren<DefaultLayoutProps>) => {
  const { ref } = useParams()
  return (
    <>
      <ProjectContextProvider projectRef={ref}>
        <AppBannerContextProvider>
          <div className="flex flex-col h-screen w-screen">
            {/* Top Banner */}
            <AppBannerWrapper />
            <div className="flex-shrink-0">
              <MobileNavigationBar />
              <LayoutHeader showProductMenu={showProductMenu} />
            </div>
            {/* Main Content Area */}
            <div className="flex flex-1 w-full overflow-y-hidden">
              {/* Sidebar */}
              <NavigationBar />
              {/* Main Content */}
              <div className="flex-grow h-full overflow-y-auto">{children}</div>
            </div>
          </div>
        </AppBannerContextProvider>
      </ProjectContextProvider>
    </>
  )
}

export default DefaultLayout
