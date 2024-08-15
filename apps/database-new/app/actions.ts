'use server'

import { createClient } from '@/lib/supabase/server'
import { Message } from 'ai'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { z } from 'zod'

export async function logout() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.log('Error logging out:', error.message)
    return
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

//export async function createThread(prevState: any, formData: FormData) {
export async function createThread(input: string, message: Message, currentThread?: string) {
  const supabase = createClient()

  let thread_id = currentThread ?? ''
  let message_id = ''

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        message: 'Failed to get user',
        data: undefined,
      }
    }

    // create a new thread
    if (!thread_id) {
      try {
        const { data, error } = await supabase
          .from('threads')
          .insert({ user_id: user.id, thread_title: input })
          .select()

        if (error) throw error

        if (data) {
          console.log({ data })
          thread_id = data[0].id
          // message_id = data[0].message_id
        }
      } catch (error) {
        console.error(error)
      }
    }

    //insert the message from the completion
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id,
          message_content: message.content,
          message_input: input,
          message_role: 'assistant',
          user_id: user.id,
        })
        .select()

      if (error) throw error
      if (data) {
        message_id = data[0].message_id
      }
    } catch (error) {
      console.error(error)
    }
  } catch (error: any) {
    console.error(error)
    return {
      success: false,
      message: 'Failed to update title to update title',
      data: undefined,
    }
  }
  redirect(`/${thread_id}/${message_id}`)
}

export async function upsertThreadMessage(input: string, currentThread?: string) {
  const supabase = createClient()

  let thread_id = currentThread ?? ''
  let message_id = ''

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        message: 'Failed to get user',
        data: undefined,
      }
    }

    // create a new thread
    if (!thread_id) {
      try {
        const { data, error } = await supabase
          .from('threads')
          .insert({ user_id: user.id, thread_title: input })
          .select()

        if (error) throw error

        if (data) {
          console.log({ data })
          thread_id = data[0].id
          // message_id = data[0].message_id
        }
      } catch (error) {
        console.error(error)
      }
    }

    //insert the message from the completion
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id,
          message_content: '',
          message_input: input,
          message_role: 'assistant',
          user_id: user.id,
        })
        .select()

      if (error) throw error
      if (data) {
        message_id = data[0].message_id
      }
    } catch (error) {
      console.error(error)
    }
  } catch (error: any) {
    console.error(error)
    return {
      success: false,
      message: 'Failed to update title to update title',
      data: undefined,
    }
  }
  redirect(`/${thread_id}/${message_id}`)
}

export async function deleteThread(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const schema = z.object({
      thread_id: z.string(),
    })

    const data = schema.parse({
      thread_id: formData.get('thread_id'),
    })

    await supabase.from('threads').delete().eq('id', data.thread_id)

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
  const supabase = createClient()

  try {
    const schema = z.object({
      thread_title: z.string(),
      thread_id: z.string(),
    })

    const data = schema.parse({
      thread_title: formData.get('thread_title'),
      thread_id: formData.get('thread_id'),
    })

    const { error } = await supabase
      .from('threads')
      .update({ thread_title: data.thread_title })
      .eq('id', data.thread_id)
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
