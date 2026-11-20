import { Metadata } from 'next'

import { BaseInjector } from './../base-injector'

export const metadata: Metadata = {
  title: 'Password Based Auth Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaseInjector />
      <div className="preview relative flex min-h-svh w-full items-center justify-center overflow-hidden p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(oklch(from_var(--foreground-default)_l_c_h_/_0.05)_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="relative w-full max-w-sm">{children}</div>
      </div>
    </>
  )
}
