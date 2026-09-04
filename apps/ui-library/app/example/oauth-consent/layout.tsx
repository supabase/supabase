import { Metadata } from 'next'

import { BaseInjector } from './../base-injector'

export const metadata: Metadata = {
  title: 'OAuth Consent Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaseInjector />
      <div className="relative flex h-screen w-full items-center justify-center bg-studio p-6 preview md:p-10">
        <div className="pointer-events-none absolute z-0 h-full w-full bg-[radial-gradient(oklch(from_var(--foreground-default)_l_c_h_/_0.02)_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="z-10 w-full max-w-lg">{children}</div>
      </div>
    </>
  )
}
