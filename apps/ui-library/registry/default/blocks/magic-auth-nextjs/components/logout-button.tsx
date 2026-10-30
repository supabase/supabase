'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { Button } from '@/registry/default/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/magic-link')
  }

  return (
    <Button onClick={handleLogout} variant="outline">
      Sign out
    </Button>
  )
}
