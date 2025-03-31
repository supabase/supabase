import SideNavigation from '@/components/side-navigation'
import Sidebar from '@/components/sidebar'
import { SiteFooter } from '@/components/site-footer'
// import ThemeSettings from '@/components/theme-settings'
import TopNavigation from '@/components/top-navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      {/* <TopNavigation /> */}
      {/* main container */}
      <div className="pt-10 md:pt-0">
        {/* main content */}
        <main className="flex-1 max-w-site mx-auto w-full p-0">
          {/* {children} */}
          <div className="border-b">
            <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
              <Sidebar />
              <div vaul-drawer-wrapper="">
                <div className="relative flex min-h-screen flex-col bg-background">{children}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  )
}
