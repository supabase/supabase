import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { sortBy } from 'lodash'
import OpenAI from 'openai'
import UserChat from './UserChat'

dayjs.extend(relativeTime)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function Messages({ params }: { params: { threadId: string; runId: string } }) {
  const [run, { data: messages }] = await Promise.all([
    openai.beta.threads.runs.retrieve(params.threadId, params.runId),
    openai.beta.threads.messages.list(params.threadId),
  ])

  const messagesSorted = sortBy(messages, (m) => m.created_at)

  const userMessages = messagesSorted.filter((message) => message.role === 'user')

  return (
    <div className="flex flex-col py-2 xl:py-6">
      {userMessages.map((message, idx) => {
        const index = messages.indexOf(message)

        const reply = messages[index + 1]
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
            message={message}
            run={run}
            isLatest={isLatest}
            times={times}
          />
        )
      })}
    </div>
  )
}

export { Messages }
