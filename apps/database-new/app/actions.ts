'use server'

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
