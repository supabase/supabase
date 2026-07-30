import { Metadata } from 'next'

import { BaseInjector } from './../base-injector'

export const metadata: Metadata = {
  title: 'Realtime Chat Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaseInjector />
      <div className="flex w-full items-center justify-center p-6 md:p-10 preview bg-surface-100 h-screen">
        <div className="w-full max-w-sm flex flex-col gap-4 justify-center items-center">
          {children}
        </div>
      </div>
    </>
  )
}
