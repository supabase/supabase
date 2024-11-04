import dynamic from 'next/dynamic'
import { useUser } from 'common'

const VercelToolbarComponent = dynamic(
  () => import('./vercel-toolbar-wrapper').then((mod) => mod.VercelToolbarWrapper),
  {
    ssr: false,
  }
)

export function VercelToolbarProvider() {
  const user = useUser()

  const isSupabaseTeam =
    user?.email?.includes('@supabase.com') || user?.email?.includes('@supabase.io')

  return isSupabaseTeam ? <VercelToolbarComponent /> : null
}
