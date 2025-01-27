import { AppBannerWrapper } from 'components/interfaces/App'
import { AppDefaultNavigation } from 'components/interfaces/app-default-navigation'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { PropsWithChildren } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { SidebarProvider } from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'
import { LayoutHeader } from './ProjectLayout/LayoutHeader'
import MobileViewNav from './ProjectLayout/NavigationBar/MobileViewNav'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
  hasProductMenu?: boolean
  // Shows header in the top left of the page
  headerTitle?: string
}

const DefaultLayout = ({
  children,
  hasProductMenu,
  product,
  headerTitle,
}: PropsWithChildren<DefaultLayoutProps>) => {
  const { mobileMenuOpen, setMobileMenuOpen } = useAppStateSnapshot()

  return (
    <>
      <AppBannerContextProvider>
        <SidebarProvider>
          <div className="flex flex-col h-screen w-screen">
            {/* Top Banner */}
            <AppBannerWrapper />
            <div className="flex-shrink-0">
              <LayoutHeader hasProductMenu={hasProductMenu} headerTitle={headerTitle} />
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
