import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import LoginForm from './login-form'

import type { Database } from '@/lib/database.types'

export default async function Login() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <LoginForm session={session} />
}
