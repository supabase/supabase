import { VercelToolbar } from '@vercel/toolbar/next'
import { useUser } from 'common'

export function VercelToolbarProvider() {
  const user = useUser()

  const isSupabaseTeam =
    user?.email?.includes('@supabase.com') || user?.email?.includes('@supabase.io')
  return isSupabaseTeam ? <VercelToolbar /> : null
}
