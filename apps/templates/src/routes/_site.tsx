import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ConsentToaster } from '@/components/site/ConsentToaster'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'

// Site shell for every page.
// Same structure as apps/kb/src/layouts/Layout.astro.
export const Route = createFileRoute('/_site')({
  component: SiteLayout,
})

function SiteLayout() {
  return (
    <>
      <div className="sticky top-0 z-40">
        <Header />
      </div>
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
      <ConsentToaster />
    </>
  )
}
