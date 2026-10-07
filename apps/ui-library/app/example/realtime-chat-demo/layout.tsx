import { Metadata } from 'next'

import { BaseInjector } from './../base-injector'

export const metadata: Metadata = {
  title: 'Realtime Chat Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaseInjector />
      <div className="flex h-screen w-full items-center justify-center p-6 preview md:p-10">
        <div className="w-full max-w-sm flex flex-col gap-4 justify-center items-center">
          {children}
        </div>
      </div>
    </>
  )
}
