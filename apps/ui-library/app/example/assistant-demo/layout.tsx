import type { Metadata } from 'next'
import { BaseInjector } from './../base-injector'

export const metadata: Metadata = {
  title: 'Assistant Widget Demo',
  description: 'Demo for the Supabase AI Assistant block.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaseInjector />
      <div>
        <div>{children}</div>
      </div>
    </>
  )
}
