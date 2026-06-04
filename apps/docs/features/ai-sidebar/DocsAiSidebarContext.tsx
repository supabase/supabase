'use client'

import { createContext, useContext, type MouseEvent } from 'react'
import type { Message } from 'ui-patterns/CommandMenu/prepackaged/ai'

import type { CodeContext } from './types'
import type { DocsAiChatSession } from './chatHistory.types'

export interface DocsAiSidebarContextValue {
  isOpen: boolean
  codeContext: CodeContext | null
  messages: Message[]
  isLoading: boolean
  isResponding: boolean
  hasError: boolean
  isCodeContextEnabled: boolean
  codeContextRevision: number
  sidebarWidth: number
  isResizingSidebar: boolean
  isSidebarMaximized: boolean
  startSidebarResize: (event: MouseEvent<HTMLDivElement>) => void
  toggleSidebarMaximize: () => void
  chatSessions: DocsAiChatSession[]
  activeChatId: string
  openWithContext: (context: CodeContext) => void
  open: () => void
  close: () => void
  setCodeContextEnabled: (enabled: boolean) => void
  submit: (query: string) => void
  resetChat: () => void
  selectChat: (chatId: string) => void
  clearChatHistory: () => void
}

const DocsAiSidebarContext = createContext<DocsAiSidebarContextValue | null>(null)

function useDocsAiSidebar() {
  const context = useContext(DocsAiSidebarContext)
  if (!context) {
    throw new Error('useDocsAiSidebar must be used within DocsAiSidebarProvider')
  }
  return context
}

function useDocsAiSidebarOptional() {
  return useContext(DocsAiSidebarContext)
}

export { DocsAiSidebarContext, useDocsAiSidebar, useDocsAiSidebarOptional }
