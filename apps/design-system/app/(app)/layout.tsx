import { SiteFooter } from '@/components/site-footer'
import TopNavigation from '@/components/top-navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <TopNavigation />
      <main className="flex-1 max-w-site mx-auto w-full border-l border-r">{children}</main>
      <SiteFooter />
    </>
  )
}
