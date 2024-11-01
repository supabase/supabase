import { VercelToolbar } from '@vercel/toolbar/next'
import { useUser } from 'common'

import { PropsWithChildren } from 'react'

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
