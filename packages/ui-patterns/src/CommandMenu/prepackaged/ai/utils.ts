enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

enum MessageStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Complete = 'complete',
}

interface SourceLink {
  path: string
  url: string
}

interface Message {
  role: MessageRole
  content: string
  status: MessageStatus
  idempotencyKey?: number
  sources?: SourceLink[]
}

interface NewMessageAction {
  type: 'new'
  message: Message
}

interface UpdateMessageAction {
  type: 'update'
  index: number
  message: Partial<Message>
}

interface AppendContentAction {
  type: 'append-content'
  index: number
  content: string
  idempotencyKey: number
}

interface ResetAction {
  type: 'reset'
}

interface FinalizeWithSourcesAction {
  type: 'finalize-with-sources'
  index: number
}

type MessageAction =
  | NewMessageAction
  | UpdateMessageAction
  | AppendContentAction
  | ResetAction
  | FinalizeWithSourcesAction

export { MessageRole, MessageStatus }
export type { Message, MessageAction, SourceLink }
