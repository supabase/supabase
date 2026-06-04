'use client'

import { User, X, Maximize2, Minimize2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBreakpoint } from 'common'
import {
  AiIconAnimation,
  Button,
  cn,
} from 'ui'
import { markdownComponents, Code } from 'ui-patterns/Markdown'
import {
  Message,
  MessageRole,
  MessageStatus,
} from 'ui-patterns/CommandMenu/prepackaged/ai'
import { StatusIcon } from 'ui/src/components/StatusIcon'

import { useActionKey } from '~/hooks/useActionKey'

import { CopyForIdeButton } from './CopyForIdeButton'
import { CodeContextPreview } from './CodeContextPreview'
import { CodeContextToggle } from './CodeContextToggle'
import { ContextSuggestions } from './ContextSuggestions'
import { DocsAiChatInput } from './DocsAiChatInput'
import { DocsAiListeningOrb } from './DocsAiListeningOrb'
import { DocsAiChatHistory } from './DocsAiChatHistory'
import { DocsAiExperimentalWarning } from './DocsAiExperimentalWarning'
import { DocsAiReasoningPanel } from './DocsAiReasoningPanel'
import { AiSidebarMarkdownPre } from './ShikiCodeBlock'
import { isAiSidebarWarningDismissed } from './docsAiSidebarCookies'
import { useDocsAiSidebar } from './DocsAiSidebarContext'
import { getExampleQuestions, getSuggestionKey, getSuggestionLabel } from './exampleQuestions'
import {
  getPageSectionSuggestions,
  scrollToPageSection,
  type PageSectionSuggestion,
} from './pageSectionQuestions'

function DocsAiSidebarContent({ className }: { className?: string }) {
  const {
    isOpen,
    codeContext,
    isCodeContextEnabled,
    codeContextRevision,
    messages,
    isLoading,
    isResponding,
    hasError,
    chatSessions,
    activeChatId,
    submit,
    resetChat,
    selectChat,
    close,
    isSidebarMaximized,
    toggleSidebarMaximize,
    clearChatHistory,
  } = useDocsAiSidebar()

  const isBelowLg = useBreakpoint('lg')

  const pathname = usePathname()
  const actionKey = useActionKey()
  const modifierKey = actionKey?.[0] ?? '⌘'

  const [inputValue, setInputValue] = useState('')
  const [isImeComposing, setIsImeComposing] = useState(false)
  const [pageSectionSuggestions, setPageSectionSuggestions] = useState<PageSectionSuggestion[]>([])
  const [showExperimentalWarning, setShowExperimentalWarning] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowExperimentalWarning(!isAiSidebarWarningDismissed())
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isResponding])

  useEffect(() => {
    if (!isOpen || (codeContext && isCodeContextEnabled)) {
      setPageSectionSuggestions([])
      return
    }

    const timeoutHandle = setTimeout(() => {
      setPageSectionSuggestions(getPageSectionSuggestions())
    })

    return () => clearTimeout(timeoutHandle)
  }, [isOpen, codeContext, isCodeContextEnabled, pathname, codeContextRevision])

  const pageSectionQuestions = useMemo(
    () => pageSectionSuggestions.map((item) => item.question),
    [pageSectionSuggestions]
  )

  const exampleQuestions = useMemo(
    () => getExampleQuestions(codeContext, isCodeContextEnabled, pageSectionQuestions),
    [codeContext, isCodeContextEnabled, codeContextRevision, pageSectionQuestions]
  )

  const suggestionKey = getSuggestionKey(codeContext, codeContextRevision, pageSectionQuestions)
  const suggestionLabel = getSuggestionLabel(
    codeContext,
    isCodeContextEnabled,
    pageSectionQuestions
  )

  const handleSubmit = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      if (!trimmed || isLoading || isResponding) return
      setInputValue('')
      submit(trimmed)
    },
    [isLoading, isResponding, submit]
  )

  const handleSuggestionSelect = useCallback(
    (question: string) => {
      const pageSection = pageSectionSuggestions.find((item) => item.question === question)
      if (pageSection) {
        scrollToPageSection(pageSection.headingId)
      }

      handleSubmit(question)
    },
    [handleSubmit, pageSectionSuggestions]
  )

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === MessageRole.Assistant)

  const hasStartedStreaming =
    lastAssistantMessage?.status === MessageStatus.InProgress ||
    (!!lastAssistantMessage?.content && lastAssistantMessage.status !== MessageStatus.Pending)

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <AiIconAnimation size={20} />
          <span className="text-sm font-medium">Supabase AI</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button type="text" size="tiny" onClick={resetChat}>
              New chat
            </Button>
          )}
          {!isBelowLg && (
            <Button
              type="text"
              size="tiny"
              icon={
                isSidebarMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />
              }
              onClick={toggleSidebarMaximize}
              aria-label={isSidebarMaximized ? 'Restore sidebar width' : 'Maximize sidebar'}
            />
          )}
          <Button
            type="text"
            size="tiny"
            icon={<X size={16} />}
            onClick={close}
            aria-label="Close AI sidebar"
          />
        </div>
      </header>

      <DocsAiChatHistory
        activeChatId={activeChatId}
        sessions={chatSessions}
        onSelectChat={selectChat}
        onClearHistory={clearChatHistory}
      />

      <div className="shrink-0 border-b px-4 py-3">
        <p className="text-sm text-foreground-light">
          Ask questions about Supabase and get help with your integration.
        </p>
        <p className="mt-1 text-xs text-foreground-lighter">
          Tip: press{' '}
          <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">{modifierKey}K</kbd> to
          search the docs, or open this assistant with{' '}
          <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">{modifierKey}J</kbd>.
        </p>
        {showExperimentalWarning && (
          <DocsAiExperimentalWarning onDismiss={() => setShowExperimentalWarning(false)} />
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mt-auto flex flex-col">
          {!hasError && messages.length > 0 && (
            <SidebarMessages
              messages={messages}
              isLoading={isLoading}
              isResponding={isResponding}
              hasStartedStreaming={hasStartedStreaming}
            />
          )}
          {!hasError && messages.length === 0 && (
            <ContextSuggestions
              key={suggestionKey}
              suggestionKey={suggestionKey}
              label={suggestionLabel}
              questions={exampleQuestions}
              onSelect={handleSuggestionSelect}
            />
          )}
          {hasError && <ErrorState onReset={resetChat} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="relative shrink-0 border-t">
        <DocsAiListeningOrb visible={isListening} />
        <div className="space-y-3 p-4">
        {codeContext && isCodeContextEnabled && (
          <CodeContextPreview content={codeContext.content} language={codeContext.language} />
        )}
        {codeContext && isCodeContextEnabled && messages.length > 0 && (
          <ContextSuggestions
            key={suggestionKey}
            suggestionKey={suggestionKey}
            label={suggestionLabel}
            questions={exampleQuestions}
            onSelect={handleSuggestionSelect}
            compact
          />
        )}
        {codeContext && <CodeContextToggle />}
        <DocsAiChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onListeningChange={setIsListening}
          placeholder={
            isLoading || isResponding
              ? 'Waiting on an answer...'
              : codeContext && isCodeContextEnabled
                ? 'Ask a question about the code snippet'
                : 'Ask Supabase AI a question...'
          }
          disabled={isLoading || isResponding}
          isImeComposing={isImeComposing}
          onCompositionStart={() => setIsImeComposing(true)}
          onCompositionEnd={() => setIsImeComposing(false)}
        />
        </div>
      </div>
    </div>
  )
}

function SidebarMessages({
  messages,
  isLoading,
  isResponding,
  hasStartedStreaming,
}: {
  messages: Message[]
  isLoading: boolean
  isResponding: boolean
  hasStartedStreaming: boolean
}) {
  const lastAssistantIndex = messages.findLastIndex((message) => message.role === MessageRole.Assistant)

  return (
    <div className="space-y-6 p-4">
      {messages.map((message, index) => {
        switch (message.role) {
          case MessageRole.User:
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-foreground-lighter">
                    <User strokeWidth={1.5} size={14} />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-foreground-muted">
                    You
                  </span>
                </div>
                <p className="pl-8 text-sm text-foreground-light">{message.content}</p>
              </div>
            )
          case MessageRole.Assistant: {
            const isLastAssistant = index === lastAssistantIndex
            const isComplete =
              message.status === MessageStatus.Complete && !!message.content.trim()
            const showReasoning =
              isLastAssistant &&
              (isLoading || isResponding || isComplete)

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <AiIconAnimation
                    size={20}
                    loading={
                      message.status === MessageStatus.Pending ||
                      message.status === MessageStatus.InProgress
                    }
                    allowHoverEffect
                  />
                  <span className="font-mono text-xs uppercase tracking-widest text-foreground-muted">
                    Supabase AI
                  </span>
                </div>
                <div className="space-y-3 pl-8">
                  {showReasoning && (
                    <DocsAiReasoningPanel
                      isLoading={isLoading}
                      isResponding={isResponding}
                      hasStartedStreaming={hasStartedStreaming}
                      isComplete={isComplete && !isLoading && !isResponding}
                    />
                  )}
                  {message.status === MessageStatus.Pending && !message.content && !isLoading && !isResponding && (
                    <span className="inline-block h-lh w-[0.8lh] animate-bounce bg-border-strong" />
                  )}
                  {message.content && (
                    <div className="prose prose-sm dark:prose-dark wrap-break-word [&_.shiki]:max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ...markdownComponents,
                          code: Code,
                          pre: AiSidebarMarkdownPre,
                          a: (props) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 border-t border-border-muted pt-3">
                      <p className="mb-1 text-xs text-foreground-muted">Sources:</p>
                      <ul className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <li key={idx}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand hover:underline"
                            >
                              {source.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {isComplete && isLastAssistant && !isLoading && !isResponding && (
                    <CopyForIdeButton className="text-foreground-lighter hover:text-foreground" />
                  )}
                </div>
              </div>
            )
          }
          default:
            return <Fragment key={index} />
        }
      })}
    </div>
  )
}

function ErrorState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 p-6">
      <StatusIcon variant="warning" />
      <p className="text-center text-sm text-foreground">
        Sorry, looks like Supabase AI is having a hard time!
      </p>
      <p className="text-center text-sm text-foreground-lighter">Please try again in a bit.</p>
      <Button size="tiny" type="default" onClick={onReset}>
        Try again?
      </Button>
    </div>
  )
}

export { DocsAiSidebarContent }
