import { AppBannerWrapper } from 'components/interfaces/App'
// import { AppDefaultNavigation } from 'components/interfaces/app-default-navigation'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { PropsWithChildren, ReactNode } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
// import { SidebarProvider } from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import MobileViewNav from './ProjectLayout/NavigationBar/MobileViewNav'
import NavigationBar from './ProjectLayout/NavigationBar/NavigationBar'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
  hasProductMenu?: boolean
  // Shows header in the top left of the page
  headerTitle?: string
  productMenu?: ReactNode
}

const DefaultLayout = ({
  children,
  hasProductMenu,
  product,
  headerTitle,
  productMenu,
}: PropsWithChildren<DefaultLayoutProps>) => {
  const { mobileMenuOpen, setMobileMenuOpen } = useAppStateSnapshot()

  return (
    <>
      <AppBannerContextProvider>
        <div className="flex flex-col h-screen w-screen">
          {/* Top Banner */}
          <AppBannerWrapper />
          <div className="flex-shrink-0">
            <LayoutHeader />
            <MobileViewNav />
          </div>
          {/* Main Content Area */}
          <div className="flex flex-1 w-full overflow-y-hidden">
            {/* Sidebar */}
            <NavigationBar />
            {/* <AppDefaultNavigation /> */}
            {/* Main Content */}
            <div className="flex-grow h-full overflow-y-auto">{children}</div>
          </div>
        </div>
      </AppBannerContextProvider>
    </>
  )
}

export default DefaultLayout
