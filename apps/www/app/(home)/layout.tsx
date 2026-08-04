import Footer from '~/components/Footer'
import Nav from '~/components/Nav'
import { SkipToContent } from 'ui-patterns/SkipToContent'

import { ThemeForcer } from './ThemeForcer'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContent href="#main" />
      <ThemeForcer />
      <Nav hideNavbar={false} />
      <div className="relative w-full">
        <main id="main" tabIndex={-1} className="relative min-h-screen scroll-mt-16 outline-hidden">
          {children}
        </main>
      </div>
      <Footer />
    </>
  )
}
