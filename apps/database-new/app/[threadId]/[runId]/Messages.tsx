import { AssistantMessage, UserMessage } from '@/lib/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { compact, sortBy } from 'lodash'
import OpenAI from 'openai'
import UserChat from './UserChat'

dayjs.extend(relativeTime)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function Messages({ params }: { params: { threadId: string; runId: string } }) {
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

  const messagesSorted = sortBy(messages, (m) => m.created_at)

  console.log('messagesSorted', messagesSorted)

  const userMessages = messagesSorted.filter((message) => message.role === 'user')

  console.log('userMessages', userMessages)

  return (
    <div className="flex flex-col py-2 xl:py-6">
      {userMessages.map((message, idx) => {
        const index = messages.indexOf(message)
        const reply = messages[index + 1] as AssistantMessage
        const isLatest = idx === userMessages.length - 1

        const hoursFromNow = dayjs().diff(dayjs(message.created_at * 1000), 'hours')
        const formattedTimeFromNow = dayjs(message.created_at * 1000).fromNow()
        const formattedCreatedAt = dayjs(message.created_at * 1000).format('DD MMM YYYY, HH:mm')
        const replyDuration =
          reply !== undefined ? reply.created_at - message.created_at : undefined

        const times = {
          hoursFromNow,
          formattedTimeFromNow,
          formattedCreatedAt,
          replyDuration,
        }

        return (
          <UserChat
            key={message.id}
            message={message as UserMessage}
            reply={reply}
            isLatest={isLatest}
            // isSelected={selectedMessage === message?.id}
            // isLoading={loading && isLatest}
            times={times}
          />
        )
      })}
    </div>
  )
}

export { Messages }
