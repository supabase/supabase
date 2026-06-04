import type { DocsAiChatHistory, DocsAiChatSession } from './chatHistory.types'
import { createEmptyChatSession } from './chatHistory.types'

const STORAGE_KEY = 'docs-ai-sidebar-chat-history'
const MAX_SESSIONS = 30

function readChatHistory(): DocsAiChatHistory {
  if (typeof window === 'undefined') {
    const session = createEmptyChatSession()
    return { activeChatId: session.id, sessions: [session] }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const session = createEmptyChatSession()
      return { activeChatId: session.id, sessions: [session] }
    }

    const parsed = JSON.parse(raw) as DocsAiChatHistory
    if (!parsed.activeChatId || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) {
      const session = createEmptyChatSession()
      return { activeChatId: session.id, sessions: [session] }
    }

    const activeChatId = parsed.sessions.some((session) => session.id === parsed.activeChatId)
      ? parsed.activeChatId
      : parsed.sessions[0].id

    return {
      activeChatId,
      sessions: parsed.sessions.slice(0, MAX_SESSIONS),
    }
  } catch {
    const session = createEmptyChatSession()
    return { activeChatId: session.id, sessions: [session] }
  }
}

function writeChatHistory(history: DocsAiChatHistory) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeChatId: history.activeChatId,
      sessions: history.sessions.slice(0, MAX_SESSIONS),
    })
  )
}

function upsertChatSession(sessions: DocsAiChatSession[], session: DocsAiChatSession) {
  const nextSessions = sessions.filter((item) => item.id !== session.id)
  nextSessions.unshift(session)
  return nextSessions.slice(0, MAX_SESSIONS)
}

export { readChatHistory, upsertChatSession, writeChatHistory, MAX_SESSIONS }
