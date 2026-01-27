'use client'

import { useRouter } from 'next/navigation'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { Button } from '@/registry/default/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/example/password-based-auth/auth/login')
  }

  return <Button onClick={logout}>Logout</Button>
}
