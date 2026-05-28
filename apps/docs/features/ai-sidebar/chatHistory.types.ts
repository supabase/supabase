import type { Message } from 'ui-patterns/CommandMenu/prepackaged/ai'
import { MessageRole, MessageStatus } from 'ui-patterns/CommandMenu/prepackaged/ai'

import type { CodeContext } from './types'

interface DocsAiChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  codeContext: CodeContext | null
  isCodeContextEnabled: boolean
}

interface DocsAiChatHistory {
  activeChatId: string
  sessions: DocsAiChatSession[]
}

function createChatSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createEmptyChatSession(): DocsAiChatSession {
  const now = Date.now()

  return {
    id: createChatSessionId(),
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
    codeContext: null,
    isCodeContextEnabled: true,
  }
}

function getChatTitle(messages: Message[]) {
  const firstUserMessage = messages.find(
    (message) => message.role === MessageRole.User && message.content.trim()
  )

  if (!firstUserMessage) return 'New chat'

  const text = firstUserMessage.content.trim().replace(/\s+/g, ' ')
  return text.length > 52 ? `${text.slice(0, 52)}…` : text
}

function getPersistableMessages(messages: Message[]) {
  return messages
    .filter((message) => message.status === MessageStatus.Complete && message.content.trim())
    .map(({ role, content, status, sources }) => ({
      role,
      content,
      status,
      sources,
    }))
}

function isSessionSnapshotEqual(a: DocsAiChatSession, b: DocsAiChatSession) {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.isCodeContextEnabled === b.isCodeContextEnabled &&
    JSON.stringify(a.messages) === JSON.stringify(b.messages) &&
    JSON.stringify(a.codeContext) === JSON.stringify(b.codeContext)
  )
}

export {
  createChatSessionId,
  createEmptyChatSession,
  getChatTitle,
  getPersistableMessages,
  isSessionSnapshotEqual,
}
export type { DocsAiChatHistory, DocsAiChatSession }
