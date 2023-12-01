'use client'

import { useParams } from 'next/navigation'
import { UserMessage } from '@/lib/types'
import { useEffect, useState } from 'react'
import { getThread } from '@/app/[threadId]/[runId]/[messageId]/MessageId.utils'

const CurrentThreadName = () => {
  const { threadId, runId, messageId }: { threadId: string; runId: string; messageId: string } =
    useParams()

  const [selectedMessage, setSelectedMessage] = useState<UserMessage>()

  const isConversation = threadId !== undefined && runId !== undefined

  useEffect(() => {
    async function fetchThread() {
      const { messages } = await getThread({ threadId, runId, messageId })

      if (messages) {
        setSelectedMessage(messages?.find((m: any) => m.id === messageId) as UserMessage)
      }
    }

    fetchThread()
  }, [])

  return isConversation ? (
    <div className="hidden xl:block flex items-center gap-x-4">
      {selectedMessage !== undefined && (
        <p title={selectedMessage.text} className="truncate max-w-[700px] border-l text-sm px-4">
          {selectedMessage.text}
        </p>
      )}
    </div>
  ) : null
}

export default CurrentThreadName
