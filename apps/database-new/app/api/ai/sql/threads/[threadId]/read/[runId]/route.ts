// import { parseTables } from '@/lib/utils'
import { compact } from 'lodash'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function GET(
  req: Request,
  { params }: { params: { threadId: string; runId: string } }
) {
  const [run, { data: messages }] = await Promise.all([
    openai.beta.threads.runs.retrieve(params.threadId, params.runId),
    openai.beta.threads.messages.list(params.threadId),
  ])

  const mappedMessages = compact(
    await Promise.all(
      messages.map(async (m) => {
        if (m.role === 'user' && m.content[0].type === 'text') {
          return {
            id: m.id,
            role: 'user' as const,
            created_at: m.created_at,
            text: m.content[0].text.value,
          }
        }

        if (m.content.length >= 1 && m.content[0].type === 'text') {
          let sql = ''
          if (m.content[0].type === 'text') {
            sql = m.content[0].text.value.replaceAll('\n', '')
          }
          return {
            id: m.id,
            role: 'assistant' as const,
            created_at: m.created_at,
            sql,
          }
        }
      })
    )
  )
  const result = {
    id: params.threadId,
    status: run.status === 'completed' ? 'completed' : 'loading',
    messages: mappedMessages,
  }

  return Response.json(result)
}
