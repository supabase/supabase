import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import NewThreadInput from './new-thread-input'

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
      {/* <ChatInput userID={user?.id} /> */}
      <div className="flex items-center gap-x-1.5 font-mono font-bold text-xl">
        <span>database</span>
        <div className="w-1.5 h-1.5 rounded-full bg-purple-900"></div>
        <span>design</span>
      </div>
      <NewThreadInput />
    </div>
  )
}

export default NewThread
