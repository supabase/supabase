import { AppBannerWrapper } from 'components/interfaces/App'
import { AppDefaultNavigation } from 'components/interfaces/app-default-navigation'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { SidebarOpenTopBanner } from 'components/interfaces/sidebar-open-top-banner'
import { PropsWithChildren } from 'react'
import { SidebarProvider } from 'ui'

export interface DefaultLayoutProps {
  title?: string
  product?: string
  selectedTable?: string
}

const DefaultLayout = ({ children }: PropsWithChildren<DefaultLayoutProps>) => {
  return (
    <>
      <AppBannerContextProvider>
        <SidebarProvider>
          <div className="flex flex-col h-screen w-screen">
            {/* Top Banner */}
            <div className="flex-shrink-0">
              <AppBannerWrapper />
              <SidebarOpenTopBanner />
            </div>
            {/* Main Content Area */}
            <div className="flex flex-1 w-full overflow-hidden">
              {/* Sidebar */}
              <AppDefaultNavigation />
              {/* Main Content */}
              <div className="flex-grow h-full overflow-y-auto">{children}</div>
            </div>
          </div>
        </SidebarProvider>
      </AppBannerContextProvider>
    </>
  )
}

export default DefaultLayout
