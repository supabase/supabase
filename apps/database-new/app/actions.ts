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
    // @ts-expect-error
    const thread_id: string = formData.get('thread_id')

    if (!thread_id) throw new Error('thread_id is required')

    const { data } = await supabase.from('threads').delete().eq('thread_id', thread_id)
    await openai.beta.threads.del(thread_id)

    revalidatePath('/profile')

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      error,
    }
  }
}

export async function updateThreadName(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  console.log('running')

  try {
    const schema = z.object({
      thread_title: z.string(),
      row_id: z.string(),
    })

    const data = schema.parse({
      thread_title: formData.get('thread_title'),
      row_id: formData.get('row_id'),
    })

    const { data: supabaseData } = await supabase
      .from('threads')
      .update({ thread_title: data.thread_title })
      .eq('id', data.row_id)

    console.log('supabaseData', supabaseData)

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
