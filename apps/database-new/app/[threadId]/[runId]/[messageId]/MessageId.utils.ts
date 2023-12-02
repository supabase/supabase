'use server'

import OpenAI from 'openai'

import { AssistantMessage } from '@/lib/types'
import { compact, sortBy } from 'lodash'

const openai = new OpenAI()

async function getThread({
  threadId,
  runId,
  messageId,
}: {
  threadId: string
  runId: string
  messageId: string
}) {
  const [run, { data: _messages }] = await Promise.all([
    openai.beta.threads.runs.retrieve(threadId, runId),
    openai.beta.threads.messages.list(threadId),
  ])

  let messages = compact(
    await Promise.all(
      _messages.map(async (m) => {
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

  messages = sortBy(messages, (m) => m.created_at)

  const userMessages = messages.filter((m) => m.role === 'user')

  const selectedMessageIdx = messages.findIndex((m) => m.id === messageId)
  const selectedMessageReply = (
    selectedMessageIdx !== -1 ? messages[selectedMessageIdx + 1] : undefined
  ) as AssistantMessage | undefined

  const content = selectedMessageReply?.sql.replaceAll('```sql', '').replaceAll('```', '') || ''

  return content
}

export { getThread }
