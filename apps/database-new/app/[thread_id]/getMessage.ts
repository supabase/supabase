import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const getMessage = cache(async (message_id: string) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  console.log(message_id)

  const { data: message, error } = await supabase
    .from('messages')
    .select('message_content')
    .eq('message_id', message_id)
    .single()
  if (error) {
    console.log(error)
    throw new Error('Failed to fetch message')
  }

  return message.message_content
})
