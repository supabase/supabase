import { createContext, type PropsWithChildren, useContext } from 'react'

export type AddToolResult = (args: {
  tool: string
  toolCallId: string
  output: unknown
}) => Promise<void>

export interface MessageInfo {
  id: string

  variant?: 'default' | 'warning'

  isLoading: boolean
  readOnly?: boolean

  isUserMessage?: boolean
  isLastMessage?: boolean

  state: 'idle' | 'editing' | 'predecessor-editing'
  rating?: 'positive' | 'negative' | null
}

export interface MessageActions {
  addToolResult?: AddToolResult

  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onCancelEdit: () => void
  onRate?: (id: string, rating: 'positive' | 'negative', reason?: string) => void
}

const MessageInfoContext = createContext<MessageInfo | null>(null)
const MessageActionsContext = createContext<MessageActions | null>(null)

export function useMessageInfoContext() {
  const ctx = useContext(MessageInfoContext)
  if (!ctx) {
    throw Error('useMessageInfoContext must be used within a MessageProvider')
  }
  return ctx
}

export function useMessageActionsContext() {
  const ctx = useContext(MessageActionsContext)
  if (!ctx) {
    throw Error('useMessageActionsContext must be used within a MessageProvider')
  }
  return ctx
}

export function MessageProvider({
  messageInfo,
  messageActions,
  children,
}: PropsWithChildren<{ messageInfo: MessageInfo; messageActions: MessageActions }>) {
  return (
    <MessageInfoContext.Provider value={messageInfo}>
      <MessageActionsContext.Provider value={messageActions}>
        {children}
      </MessageActionsContext.Provider>
    </MessageInfoContext.Provider>
  )
}
