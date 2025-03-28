import type { ChatMessage } from './realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage }: ChatMessageItemProps) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwnMessage ? 'bg-blue-800 text-white' : 'bg-slate-100'
        }`}
      >
        <div className="text-sm font-semibold mb-1">{message.user.name}</div>
        <div>{message.content}</div>
      </div>
    </div>
  )
}
