import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

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

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: 'asst_oLWrK8lScZVNEpfjwUIvBAnq',
  })

  try {
    const { error } = await supabase
      .from('threads')
      .insert({ thread_id: thread.id, run_id: run.id, user_id: userID })
    if (error) throw error
  } catch (error) {
    console.error(error)
  }

  return Response.json({ threadId: thread.id, runId: run.id })
}
