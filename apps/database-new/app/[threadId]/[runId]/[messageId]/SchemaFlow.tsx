import { format } from 'sql-formatter'

import { getThread } from './MessageId.utils'

import { parseTables } from '@/lib/utils'
import SchemaFlowHandler from './SchemaFlowHandler'

import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

import { cookies } from 'next/headers'

const openai = new OpenAI()

async function waitForRunCompletion(params: {
  threadId: string
  runId: string
  messageId: string
}) {
  console.log('Waiting for run completion')
  let realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)

  if (realRun.status !== 'in_progress') {
    console.log('Run is not in progress. Exiting without running anything.')

    // Check if it exists in Supabase DB
    try {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)

      const { data, error } = await supabase
        .from('responses_ai')
        .select('*')
        .eq('message_id', params.messageId)

      if (error) throw error

      if (data.length > 0) {
        return { newMessage: false }
      }
    } catch (error) {
      console.error('The error is', error)
    }
  }

  while (realRun.status === 'in_progress') {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    realRun = await openai.beta.threads.runs.retrieve(params.threadId, params.runId)
  }

  console.log('Run completed:', realRun.status)
  return { newMessage: true }
}

export async function SchemaFlow({ params }: { params: any }) {
  //console.log('schemaFlow refetching')

  const { threadId, runId, messageId } = params

  // keep polling until the run is completed
  const { newMessage } = await waitForRunCompletion(params)

  const content = await getThread({ threadId, runId, messageId })

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (!user) return
  if (!newMessage) return

  try {
    const { error } = await supabase.from('responses_ai').insert({
      message_id: messageId,
      thread_id: threadId,
      text: content,
      run_id: runId,
      user_id: user.id,
    })
    if (error) throw error
  } catch (error) {
    console.error(error)
  }
  console.log({ content })
  //const code = format(content, { language: 'postgresql' })

  //const tables = await parseTables(content)

  // useEffect(() => {
  //   snap.setSelectedCode(code)
  // }, [code])

  return <SchemaFlowHandler content={content} />
}
