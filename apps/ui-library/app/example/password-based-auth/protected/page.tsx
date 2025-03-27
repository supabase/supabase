import { redirect } from 'next/navigation'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server'
import { SignOutButton } from './SignOutButton'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <>
      <p>Hello {data.user.email}</p>
      <SignOutButton />
    </>
  )
}
