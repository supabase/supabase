import dynamic from 'next/dynamic'
import { useUser } from 'common'
import { PropsWithChildren } from 'react'

// Dynamically import VercelToolbar to load it only when required
const VercelToolbar = dynamic(
  () => import('@vercel/toolbar/next').then((mod) => mod.VercelToolbar),
  {
    ssr: false, // Disable SSR for this component
  }
)

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
