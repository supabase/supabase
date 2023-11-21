import dayjs from 'dayjs'
import { AssistantMessage, UserMessage } from '@/lib/types'
import { cn } from 'ui'

interface UserChatProps {
  message: UserMessage
  reply?: AssistantMessage
  isLatest: boolean
  isSelected: boolean
  isLoading: boolean
  onSelect: (messageId: string, replyId: string) => void
}

const UserChat = ({ message, reply, isLatest, isSelected, isLoading, onSelect }: UserChatProps) => {
  const hoursFromNow = dayjs().diff(dayjs(message.created_at * 1000), 'hours')
  const formattedTimeFromNow = dayjs(message.created_at * 1000).fromNow()
  const formattedCreatedAt = dayjs(message.created_at * 1000).format('DD MMM YYYY, HH:mm')

  const replyDuration = reply !== undefined ? reply.created_at - message.created_at : undefined

  return (
    <div className="flex w-full gap-x-5">
      <div className="flex flex-col justify-between items-center">
        <div
          className={cn(
            'transition w-3 h-3 rounded-full border border-foreground-lighter',
            isSelected ? 'bg-brand' : 'bg-surface-300'
          )}
        />
        {!isLatest && <div className="border-l-2 border-dashed flex-grow" />}
      </div>

      <div className="flex w-full flex-col gap-y-2 pb-3 mt-1">
        <div className="group relative">
          <span className="z-10 absolute top-0 -left-[8px]">
            <svg viewBox="0 0 8 13" height="13" width="8">
              <path
                className={
                  isSelected
                    ? 'fill-background-surface-300'
                    : 'transition fill-background-surface-100 group-hover:fill-background-surface-200'
                }
                d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"
              />
            </svg>
          </span>
          <div
            className={cn(
              'cursor-pointer transition relative overflow-hidden',
              'w-full rounded-lg rounded-tl-none',
              isSelected ? 'bg-surface-300' : 'bg-surface-100 group-hover:bg-surface-200'
            )}
            onClick={() => (reply !== undefined ? onSelect(message.id, reply?.id) : () => {})}
          >
            <p className="p-4 text-sm">{message.text}</p>
            {isLoading && <div className="chat-shimmering-loader w-full h-0.5 absolute bottom-0" />}
          </div>
        </div>
        <p className="text-xs text-foreground-light">
          Sent {hoursFromNow > 6 ? `on ${formattedCreatedAt}` : formattedTimeFromNow}
          {replyDuration !== undefined
            ? ` with ${replyDuration}s response`
            : isLoading
            ? ', generating response...'
            : ''}
        </p>
      </div>
    </div>
  )
}

export default UserChat
