'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import OpenAI from 'openai'

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

  try {
    // @ts-expect-error
    const thread_title: string = formData.get('thread_title')
    // @ts-expect-error
    const row_id: string = formData.get('row_id')

    if (!thread_title) throw new Error('Thread title is required')

    const { data } = await supabase.from('threads').update({ thread_title }).eq('id', row_id)

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
