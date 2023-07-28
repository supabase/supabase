import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '../database.types'
import AccountForm from './account-form'

export default async function Account() {
  const iechor = createServerComponentClient<Database>({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <AccountForm session={session} />
}
