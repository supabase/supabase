import { AppBannerWrapper } from 'components/interfaces/App'
import { AppDefaultNavigation } from 'components/interfaces/app-default-navigation'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { SidebarOpenTopBanner } from 'components/interfaces/sidebar-open-top-banner'
import { PropsWithChildren } from 'react'
import { SidebarProvider } from 'ui'
import MobileViewNav from './ProjectLayout/NavigationBar/MobileViewNav'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import MobileNavigationBar from './ProjectLayout/NavigationBar/MobileNavigationBar'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'
import { useAppStateSnapshot } from 'state/app-state'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
  hasProductMenu?: boolean
}

const DefaultLayout = ({
  children,
  hasProductMenu,
  product,
}: PropsWithChildren<DefaultLayoutProps>) => {
  const { mobileMenuOpen, setMobileMenuOpen } = useAppStateSnapshot()
  return (
    <>
      <AppBannerContextProvider>
        <SidebarProvider>
          <div className="flex flex-col h-screen w-screen">
            {/* Top Banner */}
            <div className="flex-shrink-0">
              <AppBannerWrapper />
              {/* <SidebarOpenTopBanner /> */}
              <LayoutHeader hasProductMenu={hasProductMenu} />
              {/* <MobileNavigationBar /> */}
              <MobileViewNav title={product} />
            </div>
            {/* Main Content Area */}
            <div className="flex flex-1 w-full overflow-y-hidden">
              {/* Sidebar */}
              <AppDefaultNavigation />
              {/* Main Content */}
              <div className="flex-grow h-full overflow-y-auto">{children}</div>
            </div>
          </div>
        </SidebarProvider>
        <MobileSheetNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <span>mobile menu here</span>
        </MobileSheetNav>
      </AppBannerContextProvider>
    </>
  )
}

export default DefaultLayout
