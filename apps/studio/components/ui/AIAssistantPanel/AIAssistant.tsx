import type { Message as MessageType } from '@ai-sdk/react'
import { useChat } from '@ai-sdk/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, Info, RefreshCw, Settings, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams, useSearchParamsShallow } from 'common/hooks'
import { Markdown } from 'components/interfaces/Markdown'
import { useCheckOpenAIKeyQuery } from 'data/ai/check-api-key-query'
import { constructHeaders } from 'data/fetchers'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import uuidv4 from 'lib/uuid'
import type { AssistantMessageType } from 'state/ai-assistant-state'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { AiIconAnimation, Button, cn } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { ButtonTooltip } from '../ButtonTooltip'
import { ErrorBoundary } from '../ErrorBoundary'
import { type SqlSnippet } from './AIAssistant.types'
import { onErrorChat } from './AIAssistant.utils'
import { AIAssistantChatSelector } from './AIAssistantChatSelector'
import { AIOnboarding } from './AIOnboarding'
import { AIOptInModal } from './AIOptInModal'
import { AssistantChatForm } from './AssistantChatForm'
import { Message } from './Message'
import { useAutoScroll } from './hooks'

const MemoizedMessage = memo(
  ({
    message,
    isLoading,
    onResults,
  }: {
    message: MessageType
    isLoading: boolean
    onResults: ({
      messageId,
      resultId,
      results,
    }: {
      messageId: string
      resultId?: string
      results: any[]
    }) => void
  }) => {
    return (
      <Message
        key={message.id}
        id={message.id}
        message={message}
        readOnly={message.role === 'user'}
        isLoading={isLoading}
        onResults={onResults}
      />
    )
  }
)

MemoizedMessage.displayName = 'MemoizedMessage'

interface AIAssistantProps {
  initialMessages?: MessageType[] | undefined
  className?: string
}

export const AIAssistant = ({ className }: AIAssistantProps) => {
  const router = useRouter()
  const project = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const { ref, id: entityId } = useParams()
  const searchParams = useSearchParamsShallow()

  const disablePrompts = useFlag('disableAssistantPrompts')
  const { snippets } = useSqlEditorV2StateSnapshot()
  const snap = useAiAssistantStateSnapshot()

  const [updatedOptInSinceMCP] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AI_ASSISTANT_MCP_OPT_IN,
    false
  )

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { ref: scrollContainerRef, isSticky, scrollToEnd } = useAutoScroll()

  const { aiOptInLevel, isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  const showMetadataWarning =
    IS_PLATFORM &&
    !!selectedOrganization &&
    (aiOptInLevel === 'disabled' || aiOptInLevel === 'schema')

  // Add a ref to store the last user message
  const lastUserMessageRef = useRef<MessageType | null>(null)

  const [value, setValue] = useState<string>(snap.initialInput || '')
  const [isConfirmOptInModalOpen, setIsConfirmOptInModalOpen] = useState(false)

  const { data: check, isSuccess } = useCheckOpenAIKeyQuery()
  const isApiKeySet = IS_PLATFORM || !!check?.hasKey

  const isInSQLEditor = router.pathname.includes('/sql/[id]')
  const snippet = snippets[entityId ?? '']
  const snippetContent = snippet?.snippet?.content?.sql

  const { data: tables, isLoading: isLoadingTables } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: 'public',
    },
    { enabled: isApiKeySet }
  )

  const currentTable = tables?.find((t) => t.id.toString() === entityId)
  const currentSchema = searchParams?.get('schema') ?? 'public'
  const currentChat = snap.activeChat?.name

  const { mutate: sendEvent } = useSendEventMutation()

  // Handle completion of the assistant's response
  const handleChatFinish = useCallback(
    (message: MessageType, options: { finishReason: string }) => {
      if (lastUserMessageRef.current) {
        snap.saveMessage([lastUserMessageRef.current, message])
        lastUserMessageRef.current = null
      } else {
        snap.saveMessage(message)
      }
    },
    [snap]
  )

  // TODO(refactor): This useChat hook should be moved down into each chat session.
  // That way we won't have to disable switching chats while the chat is loading,
  // and don't run the risk of messages getting mixed up between chats.
  const {
    messages: chatMessages,
    isLoading: isChatLoading,
    append,
    setMessages,
    error,
    reload,
  } = useChat({
    id: snap.activeChatId,
    api: `${BASE_PATH}/api/ai/sql/generate-v4`,
    maxSteps: 5,
    // [Alaister] typecast is needed here because valtio returns readonly arrays
    // and useChat expects a mutable array
    initialMessages: snap.activeChat?.messages as unknown as MessageType[] | undefined,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'rename_chat') {
        const { newName } = toolCall.args as { newName: string }
        if (snap.activeChatId && newName?.trim()) {
          snap.renameChat(snap.activeChatId, newName.trim())
          return `Chat renamed to "${newName.trim()}"`
        }
        return 'Failed to rename chat: Invalid chat or name'
      }
    },
    experimental_prepareRequestBody: ({ messages }) => {
      // [Joshen] Specifically limiting the chat history that get's sent to reduce the
      // size of the context that goes into the model. This should always be an odd number
      // as much as possible so that the first message is always the user's
      const MAX_CHAT_HISTORY = 5

      const slicedMessages = messages.slice(-MAX_CHAT_HISTORY)

      // Filter out results from messages before sending to the model
      const cleanedMessages = slicedMessages.map((message) => {
        const cleanedMessage = { ...message } as AssistantMessageType
        if (message.role === 'assistant' && (message as AssistantMessageType).results) {
          delete cleanedMessage.results
        }
        return cleanedMessage
      })

      return JSON.stringify({
        messages: cleanedMessages,
        aiOptInLevel,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schema: currentSchema,
        table: currentTable?.name,
        chatName: currentChat,
        orgSlug: selectedOrganization?.slug,
      })
    },
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = await constructHeaders()
      const existingHeaders = new Headers(init?.headers)
      for (const [key, value] of headers.entries()) {
        existingHeaders.set(key, value)
      }
      return fetch(input, { ...init, headers: existingHeaders })
    },
    onError: onErrorChat,
    onFinish: handleChatFinish,
  })

  const updateMessage = useCallback(
    ({
      messageId,
      resultId,
      results,
    }: {
      messageId: string
      resultId?: string
      results: any[]
    }) => {
      snap.updateMessage({ id: messageId, resultId, results })
    },
    [snap]
  )

  const renderedMessages = useMemo(
    () =>
      chatMessages.map((message) => {
        return (
          <MemoizedMessage
            key={message.id}
            message={message}
            isLoading={isChatLoading && message.id === chatMessages[chatMessages.length - 1].id}
            onResults={updateMessage}
          />
        )
      }),
    [chatMessages, isChatLoading]
  )

  const hasMessages = chatMessages.length > 0
  const isShowingOnboarding = !hasMessages && isApiKeySet

  const sendMessageToAssistant = (finalContent: string) => {
    const payload = {
      role: 'user',
      createdAt: new Date(),
      content: finalContent,
      id: uuidv4(),
    } as MessageType

    snap.clearSqlSnippets()
    lastUserMessageRef.current = payload
    append(payload)
    setValue('')

    if (finalContent.includes('Help me to debug')) {
      sendEvent({
        action: 'assistant_debug_submitted',
        groups: {
          project: ref ?? 'Unknown',
          organization: selectedOrganization?.slug ?? 'Unknown',
        },
      })
    } else {
      sendEvent({
        action: 'assistant_prompt_submitted',
        groups: {
          project: ref ?? 'Unknown',
          organization: selectedOrganization?.slug ?? 'Unknown',
        },
      })
    }
  }

  const handleClearMessages = () => {
    snap.clearMessages()
    setMessages([])
    lastUserMessageRef.current = null
  }

  // Update scroll behavior for new messages
  useEffect(() => {
    if (!isChatLoading) {
      if (inputRef.current) inputRef.current.focus()
    }

    if (isSticky) {
      setTimeout(scrollToEnd, 0)
    }
  }, [isChatLoading, isSticky, scrollToEnd])

  useEffect(() => {
    setValue(snap.initialInput || '')
    if (inputRef.current && snap.initialInput) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(snap.initialInput.length, snap.initialInput.length)
    }
  }, [snap.initialInput])

  useEffect(() => {
    if (snap.open && isInSQLEditor && !!snippetContent) {
      snap.setSqlSnippets([{ label: 'Current Query', content: snippetContent }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.open, isInSQLEditor, snippetContent])

  return (
    <ErrorBoundary
      message="Something went wrong with the AI Assistant"
      sentryContext={{
        component: 'AIAssistant',
        feature: 'AI Assistant Panel',
        projectRef: project?.ref,
        organizationSlug: selectedOrganization?.slug,
      }}
      actions={[
        {
          label: 'Clear messages and refresh',
          onClick: () => {
            handleClearMessages()
            window.location.reload()
          },
        },
      ]}
    >
      <div className={cn('flex flex-col h-full', className)}>
        <div ref={scrollContainerRef} className={cn('flex-grow overflow-auto flex flex-col')}>
          <div className="z-30 sticky top-0">
            <div className="border-b border-b-muted flex items-center bg gap-x-4 px-3 h-[46px]">
              <div className="text-sm flex-1 flex items-center">
                <AiIconAnimation size={20} allowHoverEffect={false} />
                <span className="text-border-stronger dark:text-border-strong ml-3">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    shapeRendering="geometricPrecision"
                  >
                    <path d="M16 3.549L7.12 20.600"></path>
                  </svg>
                </span>
                <AIAssistantChatSelector disabled={isChatLoading} />
              </div>
              <div className="flex items-center gap-x-4">
                <div className="flex items-center">
                  <ButtonTooltip
                    type="text"
                    size="tiny"
                    icon={<Settings strokeWidth={1.5} size={14} />}
                    onClick={() => setIsConfirmOptInModalOpen(true)}
                    className="h-7 w-7 p-0"
                    disabled={isChatLoading}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: 'Permission settings',
                      },
                    }}
                  />
                  <ButtonTooltip
                    type="text"
                    size="tiny"
                    icon={<RefreshCw strokeWidth={1.5} size={14} />}
                    onClick={handleClearMessages}
                    className="h-7 w-7 p-0"
                    disabled={isChatLoading}
                    tooltip={{ content: { side: 'bottom', text: 'Clear messages' } }}
                  />
                  <ButtonTooltip
                    type="text"
                    className="w-7 h-7"
                    onClick={snap.closeAssistant}
                    icon={<X strokeWidth={1.5} size={14} />}
                    tooltip={{ content: { side: 'bottom', text: 'Close assistant' } }}
                  />
                </div>
              </div>
            </div>
            {showMetadataWarning && (
              <Admonition
                type="default"
                title={
                  !updatedOptInSinceMCP
                    ? 'The Assistant has just been updated to help you better!'
                    : isHipaaProjectDisallowed
                      ? 'Project metadata is not shared due to HIPAA'
                      : aiOptInLevel === 'disabled'
                        ? 'Project metadata is currently not shared'
                        : 'Limited metadata is shared to the Assistant'
                }
                description={
                  !updatedOptInSinceMCP
                    ? 'You may now opt-in to share schema metadata and even logs for better results'
                    : isHipaaProjectDisallowed
                      ? 'Your organization has the HIPAA addon and will not send project metadata with your prompts for projects marked as HIPAA.'
                      : aiOptInLevel === 'disabled'
                        ? 'The Assistant can provide better answers if you opt-in to share schema metadata.'
                        : aiOptInLevel === 'schema'
                          ? 'Sharing query data in addition to schema can further improve responses. Update AI settings to enable this.'
                          : ''
                }
                className="border-0 border-b rounded-none bg-background mb-0"
              >
                {!isHipaaProjectDisallowed && (
                  <Button
                    type="default"
                    className="w-fit mt-4"
                    onClick={() => setIsConfirmOptInModalOpen(true)}
                  >
                    Update AI settings
                  </Button>
                )}
              </Admonition>
            )}
          </div>
          {hasMessages ? (
            <div className="w-full px-7 py-8 space-y-6">
              {renderedMessages}
              {error && (
                <div className="border rounded-md pl-2 pr-1 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground-light text-sm">
                    <Info size={16} />
                    <p>Sorry, I'm having trouble responding right now</p>
                  </div>
                  <Button type="text" size="tiny" onClick={() => reload()} className="text-xs">
                    Retry
                  </Button>
                </div>
              )}
              <AnimatePresence>
                {isChatLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4 w-auto overflow-hidden"
                  >
                    <div className="text-foreground-lighter text-sm flex gap-1.5 items-center">
                      <span>Thinking</span>
                      <div className="flex gap-1">
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        >
                          .
                        </motion.span>
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        >
                          .
                        </motion.span>
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        >
                          .
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : isLoadingTables && isApiKeySet ? (
            <div className="w-full h-full flex-1 flex flex-col justify-center items-center p-5">
              <GenericSkeletonLoader className="w-4/5 flex flex-col items-center" />
            </div>
          ) : isShowingOnboarding ? (
            <AIOnboarding
              onMessageSend={sendMessageToAssistant}
              value={value}
              onValueChange={setValue}
              sqlSnippets={snap.sqlSnippets as SqlSnippet[] | undefined}
              onRemoveSnippet={(index) => {
                const newSnippets = [...(snap.sqlSnippets ?? [])]
                newSnippets.splice(index, 1)
                snap.setSqlSnippets(newSnippets)
              }}
              suggestions={
                snap.suggestions as
                  | { title?: string; prompts?: { label: string; description: string }[] }
                  | undefined
              }
            />
          ) : null}
        </div>

        <AnimatePresence>
          {!isSticky && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none z-10 -mt-24"
              >
                <div className="h-24 w-full bg-gradient-to-t from-background to-transparent relative">
                  <motion.div
                    className="absolute z-20 bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
                    variants={{
                      hidden: { y: 5, opacity: 0 },
                      show: { y: 0, opacity: 1 },
                    }}
                    transition={{ duration: 0.1 }}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                  >
                    <Button
                      type="default"
                      className="rounded-full w-8 h-8 p-1.5"
                      onClick={() => {
                        scrollToEnd()
                        if (inputRef.current) inputRef.current.focus()
                      }}
                    >
                      <ArrowDown size={16} />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {!isShowingOnboarding && (
          <div className="px-3 pb-3 z-20 relative">
            {disablePrompts && (
              <Admonition
                showIcon={false}
                type="default"
                title="Assistant has been temporarily disabled"
                description="We're currently looking into getting it back online"
              />
            )}

            {isSuccess && !isApiKeySet && (
              <Admonition
                type="default"
                title="OpenAI API key not set"
                description={
                  <Markdown
                    content={
                      'Add your `OPENAI_API_KEY` to your environment variables to use the AI Assistant.'
                    }
                  />
                }
              />
            )}

            <AssistantChatForm
              textAreaRef={inputRef}
              className={cn(
                'z-20 [&>form>textarea]:text-base [&>form>textarea]:md:text-sm [&>form>textarea]:border-1 [&>form>textarea]:rounded-md [&>form>textarea]:!outline-none [&>form>textarea]:!ring-offset-0 [&>form>textarea]:!ring-0'
              )}
              loading={isChatLoading}
              disabled={!isApiKeySet || disablePrompts || isChatLoading}
              placeholder={
                hasMessages
                  ? 'Ask a follow up question...'
                  : (snap.sqlSnippets ?? [])?.length > 0
                    ? 'Ask a question or make a change...'
                    : 'Chat to Postgres...'
              }
              value={value}
              onValueChange={(e) => setValue(e.target.value)}
              onSubmit={(finalMessage) => {
                sendMessageToAssistant(finalMessage)
                scrollToEnd()
              }}
              sqlSnippets={snap.sqlSnippets as SqlSnippet[] | undefined}
              onRemoveSnippet={(index) => {
                const newSnippets = [...(snap.sqlSnippets ?? [])]
                newSnippets.splice(index, 1)
                snap.setSqlSnippets(newSnippets)
              }}
              includeSnippetsInMessage={aiOptInLevel !== 'disabled'}
            />
          </div>
        )}
      </div>

      <AIOptInModal
        visible={isConfirmOptInModalOpen}
        onCancel={() => setIsConfirmOptInModalOpen(false)}
      />
    </ErrorBoundary>
  )
}
