'use client'
import { AssistantChatForm } from '@/components/AssistantChatForm'

interface ChatInputProps {
  params: {
    thread_id: string
  }
}

function ChatInput({ params }: ChatInputProps) {
  const { thread_id } = params

  return (
    <div className="px-4 pb-4">
      {thread_id}
      <AssistantChatForm
        key={`chat-thread-form-${thread_id}`}
        id={`chat-thread-form-${thread_id}`}
        chatContext={'edit'}
        placeholder={'Any changes to make?'}
        threadId={thread_id}
      />

      {/* <Message /> */}
    </div>
  )
}

export { ChatInput }
