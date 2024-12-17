import { AppDefaultNavigation } from 'components/interfaces/app-default-navigation'
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
      <SidebarProvider>
        <div className="flex flex-col h-screen w-screen">
          {/* {IS_PLATFORM && <LayoutHeader />} */}
          <SidebarOpenTopBanner />
          <div className="flex h-full w-full flex-row grow overflow-y-auto">
            <AppDefaultNavigation />
            <div className="py-1.5 px-1.5 flex-grow">{children}</div>
          </div>
        </div>
      </SidebarProvider>
    </>
  )
}

export default DefaultLayout
