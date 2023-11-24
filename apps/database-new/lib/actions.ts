'use server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'
import { createClient } from './supabase/server'
import { cookies } from 'next/headers'

const openai = new OpenAI()

export async function deleteThread(threadID: string) {
  'use server'
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    await supabase.from('threads').delete().eq('thread_id', threadID)
  } catch (error) {
    if (error) console.error('Error deleting thread: ', error)
  }

  await openai.beta.threads.del(threadID)

  revalidatePath('/profile')
}
