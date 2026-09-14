import { TelemetryWrapper } from './telemetry-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <SiteHeader />
      <div className="border-b">
        <div id="main-content" tabIndex={-1} className="mx-auto min-h-screen w-full max-w-site">
          {children}
        </div>
      </div>
      <SiteFooter />
      <TelemetryWrapper />
    </>
  )
}
