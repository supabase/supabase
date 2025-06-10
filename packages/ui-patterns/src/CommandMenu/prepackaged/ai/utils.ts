enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

enum MessageStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Complete = 'complete',
}

interface Message {
  role: MessageRole
  content: string
  status: MessageStatus
  idempotencyKey?: number
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

type MessageAction = NewMessageAction | UpdateMessageAction | AppendContentAction | ResetAction

export { MessageRole, MessageStatus }
export type { Message, MessageAction }
