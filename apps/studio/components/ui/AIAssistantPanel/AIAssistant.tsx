import type { UIMessage as MessageType } from '@ai-sdk/react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { AnimatePresence, motion } from 'framer-motion'
import { Eraser, Info, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { useParams, useSearchParamsShallow } from 'common/hooks'
import { Markdown } from 'components/interfaces/Markdown'
import { useCheckOpenAIKeyQuery } from 'data/ai/check-api-key-query'
import { useRateMessageMutation } from 'data/ai/rate-message-mutation'
import { constructHeaders } from 'data/fetchers'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useHotKey } from 'hooks/ui/useHotKey'
import { prepareMessagesForAPI } from 'lib/ai/message-utils'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import uuidv4 from 'lib/uuid'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { Button, cn, KeyboardShortcut } from 'ui'
import { Admonition } from 'ui-patterns'
import { ButtonTooltip } from '../ButtonTooltip'
import { ErrorBoundary } from '../ErrorBoundary'
import type { SqlSnippet } from './AIAssistant.types'
import { onErrorChat } from './AIAssistant.utils'
import { AIAssistantHeader } from './AIAssistantHeader'
import { AIOnboarding } from './AIOnboarding'
import { AssistantChatForm } from './AssistantChatForm'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './elements/Conversation'
import { Message } from './Message'

interface AIAssistantProps {
  initialMessages?: MessageType[] | undefined
  className?: string
}

export const AIAssistant = ({ className }: AIAssistantProps) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization, isLoading: isLoadingOrganization } =
    useSelectedOrganizationQuery()
  const { ref, id: entityId } = useParams()
  const searchParams = useSearchParamsShallow()

  useHotKey(() => cancelEdit(), 'Escape')

  const disablePrompts = useFlag('disableAssistantPrompts')
  const { snippets } = useSqlEditorV2StateSnapshot()
  const snap = useAiAssistantStateSnapshot()

  const [updatedOptInSinceMCP] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AI_ASSISTANT_MCP_OPT_IN,
    false
  )

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { aiOptInLevel, isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  const showMetadataWarning =
    IS_PLATFORM &&
    !!selectedOrganization &&
    (aiOptInLevel === 'disabled' || aiOptInLevel === 'schema')

  // Add a ref to store the last user message
  const lastUserMessageRef = useRef<MessageType | null>(null)

  // Keep latest selected organization to avoid stale values in useChat transport
  const selectedOrganizationRef = useRef(selectedOrganization)
  useEffect(() => {
    selectedOrganizationRef.current = selectedOrganization
  }, [selectedOrganization])

  const [value, setValue] = useState<string>(snap.initialInput || '')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [isResubmitting, setIsResubmitting] = useState(false)
  const [messageRatings, setMessageRatings] = useState<Record<string, 'positive' | 'negative'>>({})

  const { data: check, isSuccess } = useCheckOpenAIKeyQuery()
  const isApiKeySet = IS_PLATFORM || !!check?.hasKey

  const { mutateAsync: rateMessage } = useRateMessageMutation()

  const isInSQLEditor = router.pathname.includes('/sql/[id]')
  const snippet = snippets[entityId ?? '']
  const snippetContent = snippet?.snippet?.content?.sql

  const { data: tables } = useTablesQuery(
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

  const updateMessage = useCallback(
    (updatedMessage: MessageType) => {
      snap.updateMessage(updatedMessage)
    },
    [snap]
  )

  // Handle completion of the assistant's response
  const handleChatFinish = useCallback(
    ({ message }: { message: MessageType }) => {
      if (lastUserMessageRef.current) {
        snap.saveMessage([lastUserMessageRef.current, message])
        lastUserMessageRef.current = null
      } else {
        updateMessage(message)
      }
    },
    [snap, updateMessage]
  )

  // TODO(refactor): This useChat hook should be moved down into each chat session.
  // That way we won't have to disable switching chats while the chat is loading,
  // and don't run the risk of messages getting mixed up between chats.
  // Sanitize messages to remove Valtio proxy wrappers that can't be cloned
  const sanitizedMessages = useMemo(() => {
    if (!snap.activeChat?.messages) return undefined

    return snap.activeChat.messages.map((msg: any) => {
      // Convert proxy objects to plain objects
      const plainMessage = JSON.parse(JSON.stringify(msg))
      return plainMessage
    })
  }, [snap.activeChat?.messages])

  const {
    messages: chatMessages,
    status: chatStatus,
    error,
    sendMessage,
    setMessages,
    addToolResult,
    stop,
    regenerate,
  } = useChat({
    id: snap.activeChatId,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    messages: sanitizedMessages,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return
      }

      if (toolCall.toolName === 'rename_chat') {
        const { newName } = toolCall.input as { newName: string }

        if (snap.activeChatId && newName?.trim()) {
          snap.renameChat(snap.activeChatId, newName.trim())

          addToolResult({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            output: 'Chat renamed',
          })
        } else {
          addToolResult({
            tool: toolCall.toolName,
            toolCallId: toolCall.toolCallId,
            output: 'Failed to rename chat: Invalid chat or name',
          })
        }
      }
    },
    transport: new DefaultChatTransport({
      api: `${BASE_PATH}/api/ai/sql/generate-v4`,
      async prepareSendMessagesRequest({ messages, ...options }) {
        const cleanedMessages = prepareMessagesForAPI(messages)

        const headerData = await constructHeaders()
        const authorizationHeader = headerData.get('Authorization')

        return {
          ...options,
          body: {
            messages: cleanedMessages,
            aiOptInLevel,
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            schema: currentSchema,
            table: currentTable?.name,
            chatName: currentChat,
            orgSlug: selectedOrganizationRef.current?.slug,
          },
          headers: { Authorization: authorizationHeader ?? '' },
        }
      },
    }),
    onError: onErrorChat,
    onFinish: handleChatFinish,
  })

  const isChatLoading = chatStatus === 'submitted' || chatStatus === 'streaming'

  const deleteMessageFromHere = useCallback(
    (messageId: string) => {
      // Find the message index in current chatMessages
      const messageIndex = chatMessages.findIndex((msg) => msg.id === messageId)
      if (messageIndex === -1) return

      if (isChatLoading) stop()

      snap.deleteMessagesAfter(messageId, { includeSelf: true })

      const updatedMessages = chatMessages.slice(0, messageIndex)
      setMessages(updatedMessages)
    },
    [snap, setMessages, chatMessages, isChatLoading, stop]
  )

  const editMessage = useCallback(
    (messageId: string) => {
      const messageIndex = chatMessages.findIndex((msg) => msg.id === messageId)
      if (messageIndex === -1) return

      // Target message
      const messageToEdit = chatMessages[messageIndex]

      // Activate editing mode
      setEditingMessageId(messageId)
      const textContent =
        messageToEdit.parts
          ?.filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('') ?? ''
      setValue(textContent)

      setTimeout(() => {
        if (inputRef.current) {
          inputRef?.current?.focus()

          // [Joshen] This is just to make the cursor go to the end of the text when focusing
          const val = inputRef.current.value
          inputRef.current.value = ''
          inputRef.current.value = val
        }
      }, 100)
    },
    [chatMessages, setValue]
  )

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setValue('')
  }, [setValue])

  const handleRateMessage = useCallback(
    async (messageId: string, rating: 'positive' | 'negative', reason?: string) => {
      if (!project?.ref || !selectedOrganization?.slug) return

      // Optimistically update UI
      setMessageRatings((prev) => ({ ...prev, [messageId]: rating }))

      try {
        const result = await rateMessage({
          rating,
          messages: chatMessages,
          messageId,
          projectRef: project.ref,
          orgSlug: selectedOrganization.slug,
          reason,
        })

        sendEvent({
          action: 'assistant_message_rating_submitted',
          properties: {
            rating,
            category: result.category,
            ...(reason && { reason }),
          },
          groups: {
            project: project.ref,
            organization: selectedOrganization.slug,
          },
        })
      } catch (error) {
        console.error('Failed to rate message:', error)
        // Rollback on error
        setMessageRatings((prev) => {
          const { [messageId]: _, ...rest } = prev
          return rest
        })
      }
    },
    [chatMessages, project?.ref, selectedOrganization?.slug, rateMessage, sendEvent]
  )

  const isContextExceededError =
    error &&
    (error.message?.includes('context_length_exceeded') ||
      error.message?.includes('exceeds the context window'))

  const renderedMessages = useMemo(
    () =>
      chatMessages.map((message, index) => {
        const isBeingEdited = editingMessageId === message.id
        const isAfterEditedMessage = editingMessageId
          ? chatMessages.findIndex((m) => m.id === editingMessageId) < index
          : false
        const isLastMessage = index === chatMessages.length - 1

        return (
          <Message
            id={message.id}
            key={message.id}
            message={message}
            isLoading={chatStatus === 'submitted' || chatStatus === 'streaming'}
            readOnly={message.role === 'user'}
            addToolResult={addToolResult}
            onDelete={deleteMessageFromHere}
            onEdit={editMessage}
            isAfterEditedMessage={isAfterEditedMessage}
            isBeingEdited={isBeingEdited}
            onCancelEdit={cancelEdit}
            isLastMessage={isLastMessage}
            onRate={handleRateMessage}
            rating={messageRatings[message.id] ?? null}
          />
        )
      }),
    [
      chatMessages,
      deleteMessageFromHere,
      editMessage,
      cancelEdit,
      editingMessageId,
      chatStatus,
      addToolResult,
      handleRateMessage,
      messageRatings,
    ]
  )

  const hasMessages = chatMessages.length > 0

  const sendMessageToAssistant = (finalContent: string) => {
    if (editingMessageId) {
      // Handling when the user is in edit mode
      // delete the message(s) from the chat just like the delete button
      setIsResubmitting(true)
      deleteMessageFromHere(editingMessageId)
      setEditingMessageId(null)
    }

    const payload = {
      role: 'user',
      createdAt: new Date(),
      parts: [{ type: 'text', text: finalContent }],
      id: uuidv4(),
    } as MessageType

    snap.clearSqlSnippets()
    lastUserMessageRef.current = payload
    sendMessage(payload)
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
    setEditingMessageId(null)
  }

  useEffect(() => {
    // Keep "Thinking" visible while stopping and resubmitting during edit
    // Only clear once the new response actually starts streaming (or errors)
    if (isResubmitting && (chatStatus === 'streaming' || !!error)) {
      setIsResubmitting(false)
    }
  }, [isResubmitting, chatStatus, error])

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
        <AIAssistantHeader
          isChatLoading={isChatLoading}
          onNewChat={snap.newChat}
          onCloseAssistant={snap.closeAssistant}
          showMetadataWarning={showMetadataWarning}
          updatedOptInSinceMCP={updatedOptInSinceMCP}
          isHipaaProjectDisallowed={isHipaaProjectDisallowed as boolean}
          aiOptInLevel={aiOptInLevel}
        />
        {hasMessages ? (
          <Conversation className={cn('flex-1')}>
            <ConversationContent className="w-full px-7 py-8 mb-10">
              {renderedMessages}
              {error && (
                <div className="border rounded-md px-2 py-2 flex items-center justify-between gap-x-4">
                  <div className="flex items-start gap-2 text-foreground-light text-sm">
                    <div>
                      <Info size={16} className="mt-0.5" />
                    </div>
                    <div>
                      {isContextExceededError ? (
                        <p>
                          This conversation has become too long for the Assistant to process. Please
                          start a new chat to continue.
                        </p>
                      ) : (
                        <p>
                          Sorry, I'm having trouble responding right now. If the error persists
                          while retrying, you may try creating a new chat and try again.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-x-2">
                    {isContextExceededError ? (
                      <Button
                        type="default"
                        size="tiny"
                        onClick={() => snap.newChat()}
                        className="text-xs"
                      >
                        New chat
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="default"
                          size="tiny"
                          onClick={() => regenerate()}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                        <ButtonTooltip
                          type="default"
                          size="tiny"
                          onClick={handleClearMessages}
                          className="w-7 h-7"
                          icon={<Eraser />}
                          tooltip={{ content: { side: 'bottom', text: 'Clear messages' } }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
              {isChatLoading && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-1.5 h-4 bg-foreground-lighter mt-4"
                />
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        ) : (
          <AIOnboarding
            sqlSnippets={snap.sqlSnippets as SqlSnippet[] | undefined}
            suggestions={
              snap.suggestions as
                | { title?: string; prompts?: { label: string; description: string }[] }
                | undefined
            }
            onValueChange={(val) => setValue(val)}
            onFocusInput={() => inputRef.current?.focus()}
          />
        )}

        <AnimatePresence>
          {editingMessageId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none z-10 -mt-24"
            >
              <div className="h-24 w-full bg-gradient-to-t from-background to-transparent relative">
                <motion.div
                  className="absolute left-1/2 z-20 bottom-8 pointer-events-auto"
                  variants={{
                    hidden: { y: 5, opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  }}
                  transition={{ duration: 0.1 }}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <div className="-translate-x-1/2 bg-alternative dark:bg-muted border rounded-md px-3 py-2 min-w-[180px] flex items-center justify-between gap-x-2">
                    <div className="flex items-center gap-x-2 text-sm text-foreground">
                      <Pencil size={14} />
                      <span>Editing message</span>
                    </div>
                    <ButtonTooltip
                      type="outline"
                      size="tiny"
                      icon={<X size={14} />}
                      onClick={cancelEdit}
                      className="w-6 h-6 p-0"
                      title="Cancel editing"
                      aria-label="Cancel editing"
                      tooltip={{
                        content: { side: 'top', text: <KeyboardShortcut keys={['Meta', 'Esc']} /> },
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            isEditing={!!editingMessageId}
            disabled={
              !isApiKeySet ||
              disablePrompts ||
              isLoadingOrganization ||
              (isChatLoading && !editingMessageId)
            }
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
            }}
            onStop={() => {
              stop()
              // to save partial responses from the AI
              const lastMessage = chatMessages[chatMessages.length - 1]
              if (lastMessage && lastMessage.role === 'assistant') {
                handleChatFinish({ message: lastMessage })
              }
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
      </div>
    </ErrorBoundary>
  )
}
