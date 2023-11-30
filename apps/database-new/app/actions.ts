'use server'
import { last, sortBy } from 'lodash'

import { AssistantMessage } from '@/lib/types'
import { parseTables } from '@/lib/utils'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI()

export async function logout() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.log('Error logging out:', error.message)
    return
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function deleteThread(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const schema = z.object({
      thread_id: z.string(),
    })

    const data = schema.parse({
      thread_id: formData.get('thread_id'),
    })

    await supabase.from('threads').delete().eq('thread_id', data.thread_id)
    await openai.beta.threads.del(data.thread_id)

    revalidatePath('/profile')

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error(error)
    return {
      success: false,
      message: 'Failed to delete the thread',
      data: undefined,
    }
  }
}

export async function updateThreadName(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const schema = z.object({
      thread_title: z.string(),
      row_id: z.string(),
    })

    const data = schema.parse({
      thread_title: formData.get('thread_title'),
      row_id: formData.get('row_id'),
    })

    const { error } = await supabase
      .from('threads')
      .update({ thread_title: data.thread_title })
      .eq('id', data.row_id)
    if (error) {
      throw error
    }
    revalidatePath('/profile')

    return {
      message: 'Thread name updated to ' + data.thread_title,
      success: true,
      data,
    }
  } catch (error: any) {
    console.error(error)
    return {
      success: false,
      message: 'Failed to update title to update title',
      data: undefined,
    }
  }
}

export async function getThreadData(threadId: string, runId: string, messageId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/sql/threads/${threadId}/read/${runId}`,
    {
      method: 'GET',
    }
  )
  const data = await response.json()
  const messages = sortBy(data.messages, (m) => m.created_at)

  const userMessages = messages.filter((m) => m.role === 'user')

  const selectedMessageIdx = messages.findIndex((m) => m.id === messageId)
  const selectedMessageReply = (
    selectedMessageIdx !== -1 ? messages[selectedMessageIdx + 1] : undefined
  ) as AssistantMessage | undefined

  const content = selectedMessageReply?.sql.replaceAll('```sql', '').replaceAll('```', '') || ''

  const tables = await parseTables(content)
  const latestMessage = last(userMessages)
  //if (latestMessage) redirect(`/${threadId}/${runId}/${latestMessage.id}`)

  return { content, tables }
}
