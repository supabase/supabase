import { ScrollArea } from 'ui'

import { MobileSidebarSheet } from '@/components/mobile-sidebar-sheet'
import { SideNavigation } from '@/components/side-navigation'
import { SiteFooter } from '@/components/site-footer'
import { TopNavigation } from '@/components/top-navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <TopNavigation />
      <MobileSidebarSheet />
      <main className="flex-1 max-w-site mx-auto w-full border-l border-r border-b">
        <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="fixed top-10 z-30 hidden h-[calc(100vh-3rem)] w-full shrink-0 md:sticky md:block border-r">
            <ScrollArea className="h-full">
              <SideNavigation />
            </ScrollArea>
          </aside>
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
