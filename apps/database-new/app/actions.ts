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

export async function createThread(prevState: any, formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  let redirectUrl = ''

  try {
    const schema = z.object({
      value: z.string(),
    })

    const data = schema.parse({
      value: formData.get('value'),
    })

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

    const thread = await openai.beta.threads.create()

    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: data.value,
    })

    const createRun = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: 'asst_oLWrK8lScZVNEpfjwUIvBAnq',
    })

    const [run, { data: messages }] = await Promise.all([
      openai.beta.threads.runs.retrieve(thread.id, createRun.id),
      openai.beta.threads.messages.list(thread.id),
    ])

    const threadTitle = messages
      .filter((m) => m.role === 'user' && m.content[0]?.type === 'text')
      .map((m) => {
        if (m.content[0]?.type === 'text') {
          return m.content[0]?.text?.value
        }
        return undefined
      })
      .find((text) => text !== undefined)

    try {
      const { error } = await supabase.from('threads').insert({
        thread_id: thread.id,
        run_id: run.id,
        user_id: user.id,
        thread_title: threadTitle as string,
      })
      revalidatePath('/profile')
      if (error) throw error
    } catch (error) {
      console.error(error)
    }

    redirectUrl = `/${thread.id}/${run.id}/${message.id}`
    // return {
    //   success: true,
    //   message: 'Managed to run action',
    //   data: {
    //     messageId: message.id,
    //     runId: run.id,
    //     threadId: thread.id,
    //   },
    // }
  } catch (error: any) {
    console.error(error)
    return {
      success: false,
      message: 'Failed to update title to update title',
      data: undefined,
    }
  }

  redirect(redirectUrl)
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
