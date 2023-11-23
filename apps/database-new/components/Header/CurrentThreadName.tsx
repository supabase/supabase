'use client'

import { useParams } from 'next/navigation'
import { useMessagesQuery } from '@/data/messages-query'
import { UserMessage } from '@/lib/types'

const CurrentThreadName = () => {
  const { threadId, runId, messageId }: { threadId: string; runId: string; messageId: string } =
    useParams()

  const isConversation = threadId !== undefined && runId !== undefined

  const { data } = useMessagesQuery({ threadId, runId, enabled: isConversation })
  const selectedMessage = data?.messages.find((m) => m.id === messageId) as UserMessage

  return (
    <div className="flex items-center gap-x-4">
      {selectedMessage !== undefined && (
        <p title={selectedMessage.text} className="truncate border-l text-sm px-4">
          {selectedMessage.text}
        </p>
      )}
    </div>
  )
}

export default CurrentThreadName
