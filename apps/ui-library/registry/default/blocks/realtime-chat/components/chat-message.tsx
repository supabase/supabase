import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/registry/default/blocks/realtime-chat/hooks/use-realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn('max-w-[70%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div className="flex items-center gap-2 text-xs">
            <span className={'font-medium'}>{message.user.name}</span>
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            'py-1 px-2 rounded-xl text-sm w-fit',
            isOwnMessage ? 'bg-accent-foreground text-background' : 'bg-secondary text-foreground'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}
