'use client'

import { Button } from '@/registry/default/components/ui/button'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  return (
    <Button
      variant="outline"
      onClick={() => {
        supabase.auth.signOut()
        router.push('/example/password-based-auth/login')
      }}
    >
      Sign out
    </Button>
  )
}
