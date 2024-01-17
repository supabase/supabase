'use client'
import { Message } from 'ai/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import UserChat from './UserChat'

dayjs.extend(relativeTime)

function Messages({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col py-2 xl:py-6">
      {messages.map((message, idx) => {
        const createdAtTimestamp = dayjs(message.createdAt)
        const isLatest = Array.isArray(messages) && idx === messages.length - 1

        const hoursFromNow = dayjs().diff(createdAtTimestamp, 'hour')
        const formattedTimeFromNow = dayjs(createdAtTimestamp).fromNow()

        const formattedCreatedAt = dayjs(createdAtTimestamp).format('DD MMM YYYY, HH:mm')

        // const replyDuration =
        //   reply !== undefined ? reply.created_at - message.created_at : undefined

        const times = {
          hoursFromNow,
          formattedTimeFromNow,
          formattedCreatedAt,
          replyDuration: 5, // not sure what this is yet so hardcoding for now
        }

        return <UserChat key={message.id} message={message} isLatest={isLatest} times={times} />
      })}
    </div>
  )
}

export { Messages }
