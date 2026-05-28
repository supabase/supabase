'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { useAiChat } from 'ui-patterns/CommandMenu/prepackaged/ai'

import { buildMessageTemplate } from './buildMessageTemplate'
import {
  createEmptyChatSession,
  getChatTitle,
  getPersistableMessages,
  isSessionSnapshotEqual,
  type DocsAiChatSession,
} from './chatHistory.types'
import { readChatHistory, upsertChatSession, writeChatHistory } from './chatHistoryStorage'
import { DocsAiSidebarContext } from './DocsAiSidebarContext'
import { DocsAiSidebarShortcut } from './DocsAiSidebarShortcut'
import {
  DOCS_AI_SIDEBAR_WIDTH_MAX_PX,
  getDefaultSidebarWidth,
  type CodeContext,
} from './types'
import { useInitialSidebarWidth, useSidebarResize } from './useSidebarResize'

function DocsAiSidebarProvider({ children }: PropsWithChildren) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const initialSidebarWidth = useInitialSidebarWidth()
  const { sidebarWidth, setSidebarWidth, startResize, isResizing } =
    useSidebarResize(initialSidebarWidth)
  const preMaximizeWidthRef = useRef<number | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [codeContext, setCodeContext] = useState<CodeContext | null>(null)
  const [isCodeContextEnabled, setIsCodeContextEnabled] = useState(true)
  const [codeContextRevision, setCodeContextRevision] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [initialHistory] = useState(readChatHistory)
  const [activeChatId, setActiveChatId] = useState(initialHistory.activeChatId)
  const [chatSessions, setChatSessions] = useState(initialHistory.sessions)
  const hasHydratedRef = useRef(false)

  const messageTemplate = useMemo(
    () => buildMessageTemplate(codeContext, isCodeContextEnabled),
    [codeContext, isCodeContextEnabled]
  )

  const { submit, reset, hydrateMessages, stopStreaming, messages, isResponding, hasError } =
    useAiChat({
      messageTemplate,
      setIsLoading,
    })

  const activeSession = useMemo(
    () => chatSessions.find((session) => session.id === activeChatId) ?? chatSessions[0],
    [activeChatId, chatSessions]
  )

  const buildSessionSnapshot = useCallback((): DocsAiChatSession | null => {
    if (!activeSession) return null

    const persistableMessages = getPersistableMessages(messages)
    const now = Date.now()

    return {
      ...activeSession,
      title: getChatTitle(persistableMessages),
      updatedAt: now,
      messages: persistableMessages,
      codeContext,
      isCodeContextEnabled,
    }
  }, [activeSession, codeContext, isCodeContextEnabled, messages])

  const persistHistory = useCallback(
    (nextActiveChatId: string, nextSessions: DocsAiChatSession[]) => {
      writeChatHistory({
        activeChatId: nextActiveChatId,
        sessions: nextSessions,
      })
      setActiveChatId(nextActiveChatId)
      setChatSessions(nextSessions)
    },
    []
  )

  const isSidebarMaximized = sidebarWidth >= DOCS_AI_SIDEBAR_WIDTH_MAX_PX - 1

  const toggleSidebarMaximize = useCallback(() => {
    setSidebarWidth((currentWidth) => {
      if (currentWidth >= DOCS_AI_SIDEBAR_WIDTH_MAX_PX - 1) {
        const restoredWidth =
          preMaximizeWidthRef.current ??
          getDefaultSidebarWidth(typeof window !== 'undefined' ? window.innerWidth : 1280)
        preMaximizeWidthRef.current = null
        return restoredWidth
      }

      preMaximizeWidthRef.current = currentWidth
      return DOCS_AI_SIDEBAR_WIDTH_MAX_PX
    })
  }, [setSidebarWidth])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty(
      '--docs-ai-sidebar-width',
      isOpen ? `${sidebarWidth}px` : '0px'
    )
    return () => {
      root.style.removeProperty('--docs-ai-sidebar-width')
    }
  }, [isOpen, sidebarWidth])

  useEffect(() => {
    if (hasHydratedRef.current || !activeSession) return

    hydrateMessages(activeSession.messages)
    setCodeContext(activeSession.codeContext)
    setIsCodeContextEnabled(activeSession.isCodeContextEnabled)
    setCodeContextRevision((revision) => revision + 1)
    hasHydratedRef.current = true
  }, [activeSession, hydrateMessages])

  useEffect(() => {
    if (!hasHydratedRef.current || isLoading || isResponding) return

    const snapshot = buildSessionSnapshot()
    if (!snapshot) return

    const hasContent =
      snapshot.messages.length > 0 || snapshot.codeContext !== null || snapshot.title !== 'New chat'

    if (!hasContent && chatSessions.length === 1) return

    setChatSessions((currentSessions) => {
      const existing = currentSessions.find((session) => session.id === snapshot.id)
      if (existing && isSessionSnapshotEqual(existing, snapshot)) {
        return currentSessions
      }

      const nextSessions = upsertChatSession(currentSessions, snapshot)
      writeChatHistory({
        activeChatId,
        sessions: nextSessions,
      })
      return nextSessions
    })
  }, [
    activeChatId,
    chatSessions.length,
    isLoading,
    isResponding,
    messages,
    codeContext,
    isCodeContextEnabled,
  ])

  const openWithContext = useCallback(
    (context: CodeContext) => {
      setCodeContext(context)
      setIsCodeContextEnabled(true)
      setCodeContextRevision((revision) => revision + 1)
      setIsOpen(true)
      sendTelemetryEvent({
        action: 'code_block_ai_clicked',
        properties: {
          language: context.language,
          page_path: context.pagePath,
          line_count: context.lineCount,
        },
      })
    },
    [sendTelemetryEvent]
  )

  const open = useCallback(() => {
    setCodeContext(null)
    setIsCodeContextEnabled(false)
    setCodeContextRevision((revision) => revision + 1)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const setCodeContextEnabled = useCallback((enabled: boolean) => {
    setIsCodeContextEnabled(enabled)
  }, [])

  const selectChat = useCallback(
    (chatId: string) => {
      if (chatId === activeChatId || isLoading || isResponding) return

      const snapshot = buildSessionSnapshot()
      let nextSessions = chatSessions

      if (snapshot) {
        nextSessions = upsertChatSession(chatSessions, snapshot)
      }

      const selectedSession = nextSessions.find((session) => session.id === chatId)
      if (!selectedSession) return

      const refreshedSession = {
        ...selectedSession,
        updatedAt: Date.now(),
      }
      nextSessions = upsertChatSession(nextSessions, refreshedSession)

      stopStreaming()
      hydrateMessages(refreshedSession.messages)
      setCodeContext(refreshedSession.codeContext)
      setIsCodeContextEnabled(refreshedSession.isCodeContextEnabled)
      setCodeContextRevision((revision) => revision + 1)
      persistHistory(chatId, nextSessions)
    },
    [
      activeChatId,
      buildSessionSnapshot,
      chatSessions,
      hydrateMessages,
      isLoading,
      isResponding,
      persistHistory,
      stopStreaming,
    ]
  )

  const resetChat = useCallback(() => {
    if (isLoading || isResponding) return

    const snapshot = buildSessionSnapshot()
    let nextSessions = chatSessions

    if (snapshot && getPersistableMessages(messages).length > 0) {
      nextSessions = upsertChatSession(chatSessions, snapshot)
    }

    const nextSession = createEmptyChatSession()
    nextSessions = upsertChatSession(nextSessions, nextSession)

    reset()
    setCodeContext(null)
    setIsCodeContextEnabled(true)
    setCodeContextRevision((revision) => revision + 1)
    persistHistory(nextSession.id, nextSessions)
  }, [
    buildSessionSnapshot,
    chatSessions,
    isLoading,
    isResponding,
    messages,
    persistHistory,
    reset,
  ])

  const clearChatHistory = useCallback(() => {
    if (isLoading || isResponding) return

    const nextSession = createEmptyChatSession()

    stopStreaming()
    reset()
    setCodeContext(null)
    setIsCodeContextEnabled(true)
    setCodeContextRevision((revision) => revision + 1)
    persistHistory(nextSession.id, [nextSession])
  }, [isLoading, isResponding, persistHistory, reset, stopStreaming])

  const value = useMemo(
    () => ({
      isOpen,
      codeContext,
      isCodeContextEnabled,
      codeContextRevision,
      sidebarWidth,
      isResizingSidebar: isResizing,
      isSidebarMaximized,
      startSidebarResize: startResize,
      toggleSidebarMaximize,
      messages,
      isLoading,
      isResponding,
      hasError,
      chatSessions,
      activeChatId,
      openWithContext,
      open,
      close,
      setCodeContextEnabled,
      submit,
      resetChat,
      selectChat,
      clearChatHistory,
    }),
    [
      isOpen,
      codeContext,
      isCodeContextEnabled,
      codeContextRevision,
      sidebarWidth,
      isResizing,
      isSidebarMaximized,
      startResize,
      toggleSidebarMaximize,
      messages,
      isLoading,
      isResponding,
      hasError,
      chatSessions,
      activeChatId,
      openWithContext,
      open,
      close,
      setCodeContextEnabled,
      submit,
      resetChat,
      selectChat,
      clearChatHistory,
    ]
  )

  return (
    <DocsAiSidebarContext value={value}>
      <DocsAiSidebarShortcut />
      {children}
    </DocsAiSidebarContext>
  )
}

export { DocsAiSidebarProvider }
