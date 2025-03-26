import { Metadata } from 'next'
import { BaseInjector } from './../base-injector'

export const metadata: Metadata = {
  title: 'Realtime Cursor Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaseInjector />
      <div className="flex w-full items-center justify-center p-6 md:p-10 preview">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </>
  )
}
