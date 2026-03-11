import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { ProfileImage as ProfileImageDisplay } from 'components/ui/ProfileImage'
import { useProfileNameAndPicture } from 'lib/profile'
import { type PropsWithChildren } from 'react'
import { cn } from 'ui'

import { useMessageInfoContext } from './Message.Context'
import { MessagePartSwitcher } from './Message.Parts'
import { MessageMarkdown } from './MessageMarkdown'

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
  const { id, isLoading, readOnly } = useMessageInfoContext()

  const messageParts = message.parts
  const content =
    ('content' in message && typeof message.content === 'string' && message.content.trim()) ||
    undefined

  return (
    <div className="flex-1 min-w-0">
      {messageParts?.length > 0
        ? messageParts.map((part: NonNullable<VercelMessage['parts'][number]>, idx) => {
            const isLastPart = idx === messageParts.length - 1
            return <MessagePartSwitcher key={idx} part={part} isLastPart={isLastPart} />
          })
        : content && (
            <MessageDisplayTextMessage id={id} isLoading={isLoading} readOnly={readOnly}>
              {content}
            </MessageDisplayTextMessage>
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
      className="prose prose-sm max-w-none break-words prose-h2:font-medium"
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
