import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import NewThreadInput from './NewThreadInput'

export const metadata: Metadata = {
  title: 'database.design | Create',
}

const NewThread = async () => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="h-full flex items-center justify-center w-full flex-col gap-y-4">
      <NewThreadInput userID={user?.id} />
    </div>
  )
}

export default NewThread
