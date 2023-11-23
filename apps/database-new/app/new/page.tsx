import ChatInput from '@/components/Chat/ChatInput'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const NewThread = async () => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="h-full flex items-center justify-center w-full flex-col gap-y-4">
      <ChatInput userID={user?.id} />
    </div>
  )
}

export default NewThread
