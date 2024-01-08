'use server'

import { last, sortBy } from 'lodash'

import { AssistantMessage } from '@/lib/types'
import { parseTables } from '@/lib/utils'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { RedirectType, redirect } from 'next/navigation'

import OpenAI from 'openai'
import { z } from 'zod'
import { MessageContentText } from 'openai/resources/beta/threads/index.mjs'
import { Message } from 'ai'

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

//export async function createThread(prevState: any, formData: FormData) {
export async function createThread(input: string, message: Message, currentThread?: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

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
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

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

export async function updateThread(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  let redirectUrl = ''

  try {
    const schema = z.object({
      value: z.string(),
      threadId: z.string(),
      runId: z.string(),
    })

    const data = schema.parse({
      value: formData.get('value'),
      threadId: formData.get('threadId'),
      runId: formData.get('runId'),
    })

    const message = await openai.beta.threads.messages.create(data.threadId, {
      content: data.value,
      role: 'user',
    })

    revalidatePath(`/${data.threadId}/${data.runId}`, 'layout')

    // insert into supabase

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
    console.log('message.content[0]', message.content[0])
    try {
      const { error } = await supabase.from('messages_user').insert({
        message_id: message.id,
        thread_id: data.threadId,
        text: (message.content[0] as MessageContentText).text.value,
        run_id: data.runId,
        user_id: user.id,
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
    }
    console.log('message.id', message.id)
    // update existing thread with latest messageID
    try {
      const { error } = await supabase
        .from('threads')
        .update({
          latest_message_id: message.id,
        })
        .eq('thread_id', data.threadId)
      if (error) throw error
    } catch (error) {
      console.error('Update error:', error)
    }

    const run = await openai.beta.threads.runs.create(message.thread_id, {
      assistant_id: 'asst_oLWrK8lScZVNEpfjwUIvBAnq',
    })

    revalidatePath(`/${data.threadId}/${data.runId}/${message.id}`, 'layout')

    redirectUrl = `/${message.thread_id}/${run.id}/${message.id}`
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to update schema with new prompt',
      data: undefined,
    }
  }

  revalidatePath(redirectUrl)
  redirect(redirectUrl)
}
