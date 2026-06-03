'use client'

import Footer from '~/components/Footer'
import Nav from '~/components/Nav'
import { useForceDeepDark } from 'lib/theme.utils'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  useForceDeepDark()

  return (
    <>
      <Nav hideNavbar={false} />
      <div className="relative w-full [--container-max-w:75rem]">
        <main className="relative min-h-screen">{children}</main>
      </div>
      <Footer />
    </>
  )
}
