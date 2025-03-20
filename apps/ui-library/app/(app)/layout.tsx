import SideNavigation from '@/components/side-navigation'
import { SiteFooter } from '@/components/site-footer'
// import ThemeSettings from '@/components/theme-settings'
import TopNavigation from '@/components/top-navigation'
import { ScrollArea } from 'ui'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <TopNavigation />
      {/* main container */}
      <div className="">
        {/* main content */}
        <main className="flex-1 max-w-site mx-auto w-full border-l border-r">
          {/* {children} */}
          <div className="border-b">
            <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              <aside className="fixed top-10 z-30 hidden h-[calc(100vh-3rem)] w-full shrink-0 md:sticky md:block border-r">
                <ScrollArea className="h-full py-6 lg:py-8">
                  <SideNavigation />
                </ScrollArea>
              </aside>
              {children}
            </div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  )
}
