import { useUser } from 'common'
import dynamic from 'next/dynamic'
import { PropsWithChildren } from 'react'

const VercelToolbar = dynamic(() => import('./toolbar-wrapper'), {
  loading: () => <></>,
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
