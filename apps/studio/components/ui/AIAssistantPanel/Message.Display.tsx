import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { type PropsWithChildren } from 'react'
import { cn } from 'ui'

import { useMessageInfoContext } from './Message.Context'
import { MessagePartSwitcher, MessagePartToolGroup } from './Message.Parts'
import { groupMessageParts } from './Message.Parts.utils'
import { MessageMarkdown } from './MessageMarkdown'
import { ProfileImage as ProfileImageDisplay } from '@/components/ui/ProfileImage'
import { useProfileNameAndPicture } from '@/lib/profile'

function MessageDisplayProfileImage() {
  const { username, avatarUrl } = useProfileNameAndPicture()
  return (
    <ProfileImageDisplay
      alt={username}
      src={avatarUrl}
      className="w-5 h-5 shrink-0 rounded-full translate-y-0.5"
    />
  )
}

function MessageDisplayContainer({
  children,
  onClick,
  className,
}: PropsWithChildren<{ onClick?: () => void; className?: string }>) {
  return (
    <div
      className={cn('group text-foreground-light text-sm first:mt-0', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function MessageDisplayMainArea({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('flex gap-4 w-auto overflow-hidden group', className)}>{children}</div>
}

function MessageDisplayContent({ message }: { message: VercelMessage }) {
  const { id, isLoading, isLastMessage, readOnly } = useMessageInfoContext()

  const messageParts = message.parts
  const content =
    ('content' in message && typeof message.content === 'string' && message.content.trim()) ||
    undefined

  const items = groupMessageParts(messageParts ?? [])
  const isStreaming = isLoading && !!isLastMessage

  return (
    <div className="flex-1 min-w-0">
      {messageParts?.length > 0
        ? items.map((item, idx) => {
            if (item.type === 'part') {
              return <MessagePartSwitcher key={item.partIndex} part={item.part} />
            }
            return (
              <MessagePartToolGroup
                key={`tool-group-${item.groupIndex}`}
                parts={item.parts}
                // Only the trailing group can still grow while the response streams
                isRunning={isStreaming && idx === items.length - 1}
              />
            )
          })
        : content && (
            <div className="w-full max-w-3xl mx-auto">
              <MessageDisplayTextMessage id={id} isLoading={isLoading} readOnly={readOnly}>
                {content}
              </MessageDisplayTextMessage>
            </div>
          )}
    </div>
  )
}

function MessageDisplayTextMessage({
  id,
  isLoading,
  readOnly,
  children,
}: PropsWithChildren<{ id: string; isLoading: boolean; readOnly?: boolean }>) {
  return (
    <MessageMarkdown
      id={id}
      isLoading={isLoading}
      readOnly={readOnly}
      className="prose prose-sm max-w-none wrap-break-word prose-h2:font-medium"
    >
      {children}
    </MessageMarkdown>
  )
}

export const MessageDisplay = {
  Container: MessageDisplayContainer,
  Content: MessageDisplayContent,
  MainArea: MessageDisplayMainArea,
  ProfileImage: MessageDisplayProfileImage,
}
