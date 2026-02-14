import { UIMessage as VercelMessage } from '@ai-sdk/react'
import { useState } from 'react'
import { toast } from 'sonner'

import { cn } from 'ui'
import { DeleteMessageConfirmModal } from './DeleteMessageConfirmModal'
import { MessageActions } from './Message.Actions'
import type { AddToolResult, MessageInfo } from './Message.Context'
import { MessageDisplay } from './Message.Display'
import { MessageProvider, useMessageActionsContext, useMessageInfoContext } from './Message.Context'

function AssistantMessage({ message }: { message: VercelMessage }) {
  const { id, variant, state, isLastMessage, readOnly, rating, isLoading } = useMessageInfoContext()
  const { onCancelEdit, onRate } = useMessageActionsContext()

  const handleRate = (newRating: 'positive' | 'negative', reason?: string) => {
    onRate?.(id, newRating, reason)
  }

  return (
    <MessageDisplay.Container
      className={cn(
        variant === 'warning' && 'bg-warning-200',
        state === 'predecessor-editing' && 'opacity-50 transition-opacity cursor-pointer'
      )}
      onClick={state === 'predecessor-editing' ? onCancelEdit : undefined}
    >
      <MessageDisplay.MainArea>
        <MessageDisplay.Content message={message} />
      </MessageDisplay.MainArea>
      {!readOnly && isLastMessage && onRate && !isLoading && (
        <MessageActions alwaysShow>
          <MessageActions.ThumbsUp
            onClick={() => handleRate('positive')}
            isActive={rating === 'positive'}
            disabled={!!rating}
          />
          <MessageActions.ThumbsDown
            onClick={(reason) => handleRate('negative', reason)}
            isActive={rating === 'negative'}
            disabled={!!rating}
          />
        </MessageActions>
      )}
    </MessageDisplay.Container>
  )
}

function UserMessage({ message }: { message: VercelMessage }) {
  const { id, variant, state } = useMessageInfoContext()
  const { onCancelEdit, onEdit, onDelete } = useMessageActionsContext()
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)

  return (
    <>
      <MessageDisplay.Container
        className={cn(
          'mt-6 text-foreground',
          variant === 'warning' && 'bg-warning-200',
          state === 'predecessor-editing' && 'opacity-50 transition-opacity cursor-pointer'
        )}
        onClick={state === 'predecessor-editing' ? onCancelEdit : undefined}
      >
        <MessageDisplay.MainArea>
          <MessageDisplay.ProfileImage />
          <MessageDisplay.Content message={message} />
        </MessageDisplay.MainArea>
        <MessageActions>
          <MessageActions.Edit
            onClick={state === 'idle' ? () => onEdit(id) : onCancelEdit}
            tooltip={state === 'idle' ? 'Edit message' : 'Cancel editing'}
          />
          <MessageActions.Delete onClick={() => setShowDeleteConfirmModal(true)} />
        </MessageActions>
      </MessageDisplay.Container>
      <DeleteMessageConfirmModal
        visible={showDeleteConfirmModal}
        onConfirm={() => {
          onDelete(id)
          setShowDeleteConfirmModal(false)
          toast.success('Message deleted successfully')
        }}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </>
  )
}

interface MessageProps {
  id: string
  message: VercelMessage
  isLoading: boolean
  readOnly?: boolean
  variant?: 'default' | 'warning'
  addToolResult?: AddToolResult
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  isAfterEditedMessage: boolean
  isBeingEdited: boolean
  onCancelEdit: () => void
  isLastMessage?: boolean
  onRate?: (id: string, rating: 'positive' | 'negative', reason?: string) => void
  rating?: 'positive' | 'negative' | null
}

export function Message(props: MessageProps) {
  const message = props.message
  const { role } = message
  const isUserMessage = role === 'user'

  const messageInfo = {
    id: props.id,
    isLoading: props.isLoading,
    readOnly: props.readOnly,
    variant: props.variant,
    state: props.isBeingEdited
      ? 'editing'
      : props.isAfterEditedMessage
        ? 'predecessor-editing'
        : 'idle',
    isLastMessage: props.isLastMessage,
    rating: props.rating,
  } satisfies MessageInfo

  const messageActions = {
    addToolResult: props.addToolResult,
    onDelete: props.onDelete,
    onEdit: props.onEdit,
    onCancelEdit: props.onCancelEdit,
    onRate: props.onRate,
  }

  return (
    <MessageProvider messageInfo={messageInfo} messageActions={messageActions}>
      {isUserMessage ? <UserMessage message={message} /> : <AssistantMessage message={message} />}
    </MessageProvider>
  )
}
