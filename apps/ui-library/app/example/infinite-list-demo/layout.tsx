import type { Metadata } from 'next'

import { BaseInjector } from './../base-injector'

export const metadata: Metadata = {
  title: 'Infinite Data Table Demo',
  description: 'Demonstration of the Infinite Data Table component.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaseInjector />
      <div className="preview min-h-svh">
        <div>{children}</div>
      </div>
    </>
  )
}
