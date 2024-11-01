import dynamic from 'next/dynamic'
import { useUser } from 'common'
import { PropsWithChildren } from 'react'

// Dynamically load VercelToolbar
const VercelToolbar = dynamic<any>(() => import('@vercel/toolbar'), {
  ssr: false, // Disable SSR for the toolbar
})

export default function VercelToolbarProvider({ children }: PropsWithChildren<{}>) {
  const user = useUser()

  const isSupabaseTeam =
    user?.email?.includes('@supabase.com') || user?.email?.includes('@supabase.io')

  return (
    <>
      {children}
      {isSupabaseTeam ? <VercelToolbar /> : null}
    </>
  )
}
