import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const getMessages = cache(async (thread_id: string) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  return await supabase.from('messages').select().eq('thread_id', thread_id).order('created_at')
})
