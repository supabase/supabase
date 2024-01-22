import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'

const openai = new OpenAI()

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  if (!req.body) {
    return Response.error()
  }

  const { prompt, userID } = await req.json()

  const thread = await openai.beta.threads.create()

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: prompt,
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
      user_id: userID,
      thread_title: threadTitle as string,
    })
    if (error) throw error
  } catch (error) {
    console.error(error)
  }

  revalidatePath('/profile')

  return Response.json({ threadId: thread.id, runId: run.id })
}
