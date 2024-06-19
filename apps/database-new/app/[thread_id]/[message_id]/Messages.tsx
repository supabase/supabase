import { ScrollArea } from 'ui'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { BottomMarker } from './BottomMarker'
import { getMessages } from './getMessages'

import MessageItem from './MessageItem'

dayjs.extend(relativeTime)

export const Messages = async ({ threadId }: { threadId: string }) => {
  const { data: messages, error } = await getMessages(threadId)

  if (error) {
    return <>Error happened</>
  }

  const initialMessages = messages.flatMap((m) => [
    {
      id: m.message_id,
      content: m.message_input,
      role: 'user' as const,
      createdAt: new Date(m.created_at),
    },
    {
      id: m.message_id,
      content: m.message_content,
      role: 'assistant' as const,
      createdAt: new Date(m.created_at),
    },
  ])

  const userMessages = initialMessages.filter((m) => m.role === 'user')

  return (
    <ScrollArea className="grow h-px">
      <div className="flex flex-col mb-6 xl:mb-12">
        {userMessages.map((message, idx) => {
          const createdAtTimestamp = dayjs(message.createdAt)
          const isLatest = Array.isArray(messages) && idx === messages.length - 1

          const hoursFromNow = dayjs().diff(createdAtTimestamp, 'hour')
          const formattedTimeFromNow = dayjs(createdAtTimestamp).fromNow()

          const formattedCreatedAt = dayjs(createdAtTimestamp).format('DD MMM YYYY, HH:mm')

          const times = {
            hoursFromNow,
            formattedTimeFromNow,
            formattedCreatedAt,
          }

          return (
            <MessageItem key={message.id} message={message} isLatest={isLatest} times={times} />
          )
        })}
      </div>
      <BottomMarker />
    </ScrollArea>
  )
}
