import type { UIMessage as MessageType } from '@ai-sdk/react'
import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { useParams, useSearchParamsShallow } from 'common/hooks'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Eraser, Pencil, X } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, cn, KeyboardShortcut } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AlertError } from '../AlertError'
import { ButtonTooltip } from '../ButtonTooltip'
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'
import { InlineLinkClassName } from '../InlineLink'
import { ASSISTANT_ERRORS } from './AiAssistant.constants'
import {
  containsLogsSnippets,
  hasPendingToolApproval,
  onErrorChat,
  resolvePendingToolApprovalsAsDenied,
} from './AIAssistant.utils'
import { AIOnboarding } from './AIOnboarding'
import { AssistantChatForm } from './AssistantChatForm'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './elements/Conversation'
import { Message } from './Message'
import { Markdown } from '@/components/interfaces/Markdown'
import { useMessageFeedbackMutation } from '@/data/ai-assistant/message-feedback-mutation'
import { useCheckOpenAIKeyQuery } from '@/data/ai/check-api-key-query'
import { useRateMessageMutation } from '@/data/ai/rate-message-mutation'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useOrgAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useAssistantSupabaseBackend } from '@/lib/ai/assistant-backend'
import { startAssistantOAuth } from '@/lib/ai/assistant-client'
import {
  assistantApiOrigin,
  readAssistantOAuthCompleteMessage,
} from '@/lib/ai/assistant-oauth'
import type { AssistantMessageMetadata } from '@/lib/ai/assistant-message-metadata'
import { getParallelApprovalIdsToReject } from '@/lib/ai/message-utils'
import { IS_PLATFORM } from '@/lib/constants'
import { uuidv4 } from '@/lib/helpers'
import { useTrack } from '@/lib/telemetry/track'
import type { SqlSnippet } from '@/state/ai-assistant-state'
import { useAiAssistantState, useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export interface AssistantChatHeaderProps {
  isChatLoading: boolean
  showMetadataWarning: boolean
  updatedOptInSinceMCP: boolean
  isHipaaProjectDisallowed: boolean
  aiOptInLevel: 'disabled' | 'schema' | 'full' | string | undefined
}

export interface AssistantChatComposerContext {
  initialInput?: string
  sqlSnippets?: SqlSnippet[]
  suggestions?: { title?: string; prompts?: { label: string; description: string }[] }
  onSetSqlSnippets?: (snippets: SqlSnippet[]) => void
  onClearSqlSnippets?: () => void
}

interface AssistantChatProps {
  className?: string
  chatId: string
  shortcutsEnabled?: boolean
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onBranchChat: (messageId: string) => void
  composerContext?: AssistantChatComposerContext
  renderHeader?: (props: AssistantChatHeaderProps) => ReactNode
  onInputChange?: (value: string) => void
}

export const AssistantChat = ({
  className,
  chatId,
  shortcutsEnabled = true,
  onNewChat,
  onSelectChat,
  onBranchChat,
  composerContext,
  renderHeader,
  onInputChange,
}: AssistantChatProps) => {
  const { id: entityId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const searchParams = useSearchParamsShallow()

  const { data: selectedOrganization, isPending: isLoadingOrganization } =
    useSelectedOrganizationQuery()

  const disablePrompts = useFlag('disableAssistantPrompts')
  const useAssistantBackend = useAssistantSupabaseBackend()
  const shouldReduceMotion = useReducedMotion()
  const snap = useAiAssistantStateSnapshot()
  const state = useAiAssistantState()
  const currentChat = snap.chats[chatId]

  useShortcut(SHORTCUT_IDS.AI_ASSISTANT_CANCEL_EDIT, () => cancelEdit(), {
    enabled: shortcutsEnabled,
  })

  const [updatedOptInSinceMCP] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AI_ASSISTANT_MCP_OPT_IN,
    false
  )

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { aiOptInLevel, isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  // Whether attached queries are sent at all. One definition, shared by the chat form
  // (which folds them into the message text) and the message metadata (which states
  // whether any of them was a logs query), so the two can't disagree.
  const includeSnippetsInMessage = aiOptInLevel !== 'disabled'
  const showMetadataWarning =
    IS_PLATFORM &&
    !!selectedOrganization &&
    (aiOptInLevel === 'disabled' || aiOptInLevel === 'schema')

  // Add a ref to store the last user message
  const lastUserMessageRef = useRef<MessageType | null>(null)

  const [value, setValue] = useState<string>(composerContext?.initialInput || '')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [isResubmitting, setIsResubmitting] = useState(false)
  const [messageRatings, setMessageRatings] = useState<Record<string, 'positive' | 'negative'>>({})

  const { data: check, isSuccess } = useCheckOpenAIKeyQuery()
  const isApiKeySet = !!check?.hasKey

  const { mutateAsync: rateMessage } = useRateMessageMutation()
  const { mutateAsync: submitAssistantFeedback } = useMessageFeedbackMutation({
    onError: (feedbackError) => {
      console.error('Failed to rate message:', feedbackError)
    },
  })

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

  // Update context in state
  useEffect(() => {
    state.setContext({
      projectRef: project?.ref,
      orgSlug: selectedOrganization?.slug,
      connectionString: project?.connectionString ?? '',
    })
  }, [project?.ref, project?.connectionString, selectedOrganization?.slug, state])

  const track = useTrack()

  useEffect(() => {
    state.ensureChatInstance(chatId)
  }, [chatId, state])

  const chatInstance = snap.chatInstances[chatId]

  const {
    messages: chatMessages,
    status: chatStatus,
    error,
    sendMessage,
    setMessages,
    addToolApprovalResponse,
    stop,
    regenerate,
  } = useChat<MessageType>({
    id: chatId,
    ...(chatInstance ? { chat: chatInstance } : {}),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: onErrorChat,
  })

  const isChatLoading = chatStatus === 'submitted' || chatStatus === 'streaming'
  const hasPendingApproval = hasPendingToolApproval(chatMessages)
  const supportMetadata = currentChat?.supportMetadata
  const isSupportChat = !!supportMetadata?.isSupportChat
  const isSupportChatClosed = isSupportChat && supportMetadata.lifecycleStatus !== 'bot_active'
  const supportConversationId = supportMetadata?.frontConversationId
  const isChatInputDisabled =
    !isApiKeySet || disablePrompts || isLoadingOrganization || isSupportChatClosed

  const branchedFrom = currentChat?.branchedFrom
  const branchedConversation = branchedFrom ? snap.chats[branchedFrom.chatId] : undefined

  const deleteMessageFromHere = useCallback(
    (messageId: string) => {
      // Find the message index in current chatMessages
      const messageIndex = chatMessages.findIndex((msg) => msg.id === messageId)
      if (messageIndex === -1) return

      if (isChatLoading) stop()

      snap.deleteMessagesAfter(messageId, { includeSelf: true, chatId })

      const updatedMessages = chatMessages.slice(0, messageIndex)
      setMessages(updatedMessages)
    },
    [snap, setMessages, chatMessages, isChatLoading, stop, chatId]
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
        if (useAssistantBackend) {
          await submitAssistantFeedback({ conversationId: chatId, messageId, rating, reason })
          track('assistant_message_rating_submitted', {
            rating,
            category: 'other',
            ...(reason && { reason }),
            chatId,
          })
        } else {
          const result = await rateMessage({
            rating,
            messages: chatMessages,
            messageId,
            projectRef: project.ref,
            orgSlug: selectedOrganization.slug,
            reason,
            spanId: state.messageSpanIds[messageId],
          })

          track('assistant_message_rating_submitted', {
            rating,
            category: result.category,
            ...(reason && { reason }),
            chatId,
          })
        }
      } catch (error) {
        console.error('Failed to rate message:', error)
        // Rollback on error
        setMessageRatings((prev) => {
          const { [messageId]: _, ...rest } = prev
          return rest
        })
      }
    },
    [
      chatMessages,
      project?.ref,
      selectedOrganization?.slug,
      rateMessage,
      submitAssistantFeedback,
      useAssistantBackend,
      track,
      state,
      chatId,
    ]
  )

  const isContextExceededError =
    error &&
    (error.message?.includes('context_length_exceeded') ||
      error.message?.includes('exceeds the context window'))

  const isOAuthRequired =
    !!snap.oauthRequiredOrgSlug || (!!error?.message && error.message.includes('oauth_required'))

  useEffect(() => {
    if (!useAssistantBackend) return

    const expectedOrigin = assistantApiOrigin()
    const onMessage = (event: MessageEvent) => {
      const payload = readAssistantOAuthCompleteMessage(event, expectedOrigin)
      if (!payload) return
      const requiredOrg = state.oauthRequiredOrgSlug ?? state.context.orgSlug
      if (requiredOrg && payload.org_slug !== requiredOrg) return
      state.oauthRequiredOrgSlug = undefined
      chatInstance?.clearError()
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [useAssistantBackend, state, chatInstance])

  const handleConnectOrganization = async () => {
    const orgSlug = snap.oauthRequiredOrgSlug ?? snap.context.orgSlug
    if (!orgSlug) return
    try {
      const url = await startAssistantOAuth(orgSlug, window.location.href)
      const popup = window.open(url, 'Connect organization', 'popup,width=600,height=800')
      if (!popup) {
        toast.error("Couldn't open the connection window. Allow popups and try again.")
      }
    } catch (connectError) {
      toast.error(
        connectError instanceof Error
          ? connectError.message
          : "Couldn't start the connection. Try again."
      )
    }
  }

  const renderedMessages = useMemo(
    () =>
      chatMessages.map((message, index) => {
        const isBeingEdited = editingMessageId === message.id
        const isAfterEditedMessage = editingMessageId
          ? chatMessages.findIndex((m) => m.id === editingMessageId) < index
          : false
        const isLastMessage = index === chatMessages.length - 1

        return (
          <Fragment key={message.id}>
            <Message
              id={message.id}
              message={message}
              isLoading={chatStatus === 'submitted' || chatStatus === 'streaming'}
              readOnly={message.role === 'user'}
              addToolApprovalResponse={addToolApprovalResponse}
              onDelete={deleteMessageFromHere}
              onEdit={editMessage}
              isAfterEditedMessage={isAfterEditedMessage}
              isBeingEdited={isBeingEdited}
              onCancelEdit={cancelEdit}
              isLastMessage={isLastMessage}
              onRate={handleRateMessage}
              rating={messageRatings[message.id] ?? null}
              onBranch={onBranchChat}
            />
            {branchedConversation && branchedFrom?.messageId === message.id && (
              <div className="flex items-center gap-2 mt-6">
                <div className="flex-1 border-t border-strong" />
                <div className="flex items-center gap-1 max-w-[80%] text-xs text-foreground-lighter">
                  <span className="shrink-0">Branched from</span>
                  <button
                    tabIndex={0}
                    className={cn(InlineLinkClassName, 'cursor-pointer truncate min-w-0')}
                    onClick={() => onSelectChat(branchedConversation.id)}
                  >
                    {branchedConversation.name}
                  </button>
                </div>
                <div className="flex-1 border-t border-strong" />
              </div>
            )}
          </Fragment>
        )
      }),
    [
      chatMessages,
      deleteMessageFromHere,
      editMessage,
      cancelEdit,
      editingMessageId,
      chatStatus,
      addToolApprovalResponse,
      handleRateMessage,
      messageRatings,
      branchedConversation,
      branchedFrom,
      onSelectChat,
      onBranchChat,
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

    // Read off the attachments this message actually carries, so detaching the
    // "Current Query" chip also drops the claim. Gated on the same condition that
    // decides whether attachments make it into the text at all: with AI opt-in
    // disabled the chip is shown but no query is sent, and claiming otherwise would
    // have the server prepend ClickHouse context for a message holding no query.
    // Rides on the message rather than the request, so a Retry reproduces the context
    // the message was asked in.
    const metadata: AssistantMessageMetadata = {
      containsLogsSnippets:
        includeSnippetsInMessage && containsLogsSnippets(composerContext?.sqlSnippets),
    }

    const payload = {
      role: 'user',
      createdAt: new Date(),
      parts: [{ type: 'text', text: finalContent }],
      id: uuidv4(),
      metadata,
    } as MessageType

    composerContext?.onClearSqlSnippets?.()
    lastUserMessageRef.current = payload
    if (hasPendingApproval && !editingMessageId) {
      setMessages(resolvePendingToolApprovalsAsDenied(chatMessages))
    }
    sendMessage(payload, {
      body: {
        schema: currentSchema,
        table: currentTable?.name,
      },
    })
    setValue('')

    if (finalContent.includes('Help me to debug')) {
      track('assistant_debug_submitted', { chatId })
    } else {
      track('assistant_prompt_submitted', { chatId })
    }
  }

  const handleClearMessages = () => {
    if (isChatLoading) stop()
    snap.clearMessages(chatId)
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
    // Approval-required tools can't run in parallel. Auto-deny extras so the model reissues them sequentially.
    for (const id of getParallelApprovalIdsToReject(chatMessages)) {
      addToolApprovalResponse?.({
        id,
        approved: false,
        reason:
          'Only one approval-required tool call is allowed per turn. Please reissue this tool call after the current one completes.',
      })
    }
  }, [chatMessages, addToolApprovalResponse])

  useEffect(() => {
    setValue(composerContext?.initialInput || '')
    if (inputRef.current && composerContext?.initialInput) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(
        composerContext.initialInput.length,
        composerContext.initialInput.length
      )
    }
  }, [composerContext?.initialInput])

  let placeholder: string
  if (hasMessages && isSupportChat) {
    placeholder = 'Share details so the assistant can help with your support request...'
  } else if (hasMessages) {
    placeholder = 'Ask a follow up question...'
  } else if ((composerContext?.sqlSnippets ?? []).length > 0) {
    placeholder = 'Ask a question or make a change...'
  } else if (isSupportChat) {
    placeholder = 'Describe your support issue...'
  } else {
    placeholder = 'Chat to Postgres...'
  }

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
      <div className={cn('flex bg-card flex-col h-full w-full md:h-full max-h-dvh', className)}>
        {renderHeader?.({
          isChatLoading,
          showMetadataWarning,
          updatedOptInSinceMCP,
          isHipaaProjectDisallowed,
          aiOptInLevel,
        })}
        {hasMessages ? (
          <Conversation className={cn('flex-1')}>
            <ConversationContent className="w-full px-7 py-8 mb-10">
              {renderedMessages}
              <div className="w-full max-w-3xl mx-auto">
                {error && (
                  <AlertError
                    error={
                      isContextExceededError
                        ? ASSISTANT_ERRORS['context-exceeded']
                        : IS_PLATFORM
                          ? ASSISTANT_ERRORS['default']
                          : error
                    }
                    showErrorPrefix={false}
                    showInstructions={false}
                    subject="Sorry, I'm having trouble responding right now."
                    additionalActions={
                      <div className="flex items-center gap-x-2 mr-auto">
                        {isContextExceededError ? (
                          <Button
                            variant="default"
                            size="tiny"
                            onClick={onNewChat}
                            className="text-xs"
                          >
                            New chat
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="default"
                              size="tiny"
                              onClick={() => regenerate()}
                              className="text-xs"
                            >
                              Retry
                            </Button>
                            <ButtonTooltip
                              variant="default"
                              size="tiny"
                              onClick={handleClearMessages}
                              className="w-7 h-7"
                              icon={<Eraser />}
                              tooltip={{ content: { side: 'bottom', text: 'Clear messages' } }}
                            />
                          </>
                        )}
                      </div>
                    }
                  />
                )}
                {isChatLoading && (
                  <motion.span
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [1, 0] }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 1, repeat: Infinity, ease: 'linear' }
                    }
                    className="inline-block w-1.5 h-4 bg-foreground-lighter mt-4"
                  />
                )}

                <p className="text-center text-xs text-foreground-muted mt-6">
                  The Assistant can make mistakes. Double check responses.
                </p>
              </div>
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        ) : (
          <AIOnboarding
            key={chatId}
            sqlSnippets={composerContext?.sqlSnippets}
            suggestions={composerContext?.suggestions}
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
              <div className="h-24 w-full bg-linear-to-t from-background to-transparent relative">
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
                      variant="outline"
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

        <div className="relative z-20 w-full px-7 pb-3">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-y-3">
            {isSupportChat && !isSupportChatClosed && (
              <div>
                <div className="mb-3 border-t" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="tiny"
                    disabled={!supportConversationId}
                    onClick={() => state.setSupportLifecycleStatus(chatId, 'escalated')}
                  >
                    Escalate to human
                  </Button>
                  <Button
                    variant="outline"
                    size="tiny"
                    disabled={!supportConversationId}
                    onClick={() => state.setSupportLifecycleStatus(chatId, 'user_resolved')}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            )}
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

            {isOAuthRequired && (
              <Admonition
                type="caution"
                title="Connect this organization so the assistant can query the project."
                actions={
                  <Button size="tiny" onClick={handleConnectOrganization}>
                    Connect organization
                  </Button>
                }
              />
            )}

            <AssistantChatForm
              textAreaRef={inputRef}
              className="z-20"
              loading={isChatLoading}
              isEditing={!!editingMessageId}
              disabled={isChatInputDisabled}
              placeholder={placeholder}
              value={value}
              onValueChange={(e) => {
                setValue(e.target.value)
                onInputChange?.(e.target.value)
              }}
              onSubmit={(finalMessage) => {
                sendMessageToAssistant(finalMessage)
              }}
              onStop={() => {
                stop()
                // to save partial responses from the AI
                const lastMessage = chatMessages[chatMessages.length - 1]
                if (lastMessage && lastMessage.role === 'assistant') {
                  state.updateMessage(lastMessage, chatId)
                }
              }}
              sqlSnippets={composerContext?.sqlSnippets}
              onRemoveSnippet={(index) => {
                const newSnippets = [...(composerContext?.sqlSnippets ?? [])]
                newSnippets.splice(index, 1)
                composerContext?.onSetSqlSnippets?.(newSnippets)
              }}
              includeSnippetsInMessage={includeSnippetsInMessage}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
