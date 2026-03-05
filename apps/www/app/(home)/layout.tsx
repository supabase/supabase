'use client'

import Nav from 'components/Nav/index'
import { useForceDeepDark } from 'lib/theme.utils'
import dynamic from 'next/dynamic'

const Footer = dynamic(() => import('components/Footer/index'))

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  useForceDeepDark()

  return (
    <>
      <Nav hideNavbar={false} />
      <div className="relative w-full [--container-max-w:75rem]">
        <main className="relative min-h-screen">{children}</main>

        <div className="pointer-events-none absolute border-x inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--container-max-w)] [mask-image:linear-gradient(to_bottom,black_95%,transparent_100%)]">
          <div className="absolute h-full w-px bg-border left-[20%]" />
          <div className="absolute h-full w-px bg-border right-[20%]" />
        </div>
      </div>
      <Footer />
    </>
  )
}
