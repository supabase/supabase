import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import { last } from 'lodash'
import { FileText, Info } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Message as MessageType } from 'ai/react'
import { useChat } from 'ai/react'
import { useParams, useSearchParamsShallow } from 'common/hooks'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { Markdown } from 'components/interfaces/Markdown'
import OptInToOpenAIToggle from 'components/interfaces/Organization/GeneralSettings/OptInToOpenAIToggle'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
import { useCheckOpenAIKeyQuery } from 'data/ai/check-api-key-query'
import { constructHeaders } from 'data/fetchers'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { BASE_PATH, IS_PLATFORM, OPT_IN_TAGS } from 'lib/constants'
import { TELEMETRY_EVENTS, TELEMETRY_VALUES } from 'lib/constants/telemetry'
import uuidv4 from 'lib/uuid'
import { useRouter } from 'next/router'
import { useAppStateSnapshot } from 'state/app-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  AiIconAnimation,
  Button,
  cn,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipProvider_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { Admonition, AssistantChatForm, GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import AIOnboarding from './AIOnboarding'
import CollapsibleCodeBlock from './CollapsibleCodeBlock'
import { Message } from './Message'
import DotGrid from '../DotGrid'

const MemoizedMessage = memo(
  ({ message, isLoading }: { message: MessageType; isLoading: boolean }) => {
    return (
      <Message
        key={message.id}
        id={message.id}
        role={message.role}
        content={message.content}
        readOnly={message.role === 'user'}
        isLoading={isLoading}
      />
    )
  }
)

MemoizedMessage.displayName = 'MemoizedMessage'

interface AIAssistantProps {
  id: string
  initialMessages?: MessageType[] | undefined
  className?: string
  onResetConversation: () => void
}

export const AIAssistant = ({
  id,
  initialMessages,
  className,
  onResetConversation,
}: AIAssistantProps) => {
  const router = useRouter()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const selectedOrganization = useSelectedOrganization()
  const { id: entityId } = useParams()
  const searchParams = useSearchParamsShallow()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const disablePrompts = useFlag('disableAssistantPrompts')
  const { snippets } = useSqlEditorV2StateSnapshot()
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { open, initialInput, sqlSnippets, suggestions } = aiAssistantPanel

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [value, setValue] = useState<string>(initialInput)
  const [assistantError, setAssistantError] = useState<string>()
  const [lastSentMessage, setLastSentMessage] = useState<MessageType>()
  const [isConfirmOptInModalOpen, setIsConfirmOptInModalOpen] = useState(false)
  const [showFade, setShowFade] = useState(false)

  const { data: check } = useCheckOpenAIKeyQuery()
  const isApiKeySet = IS_PLATFORM || !!check?.hasKey

  const isInSQLEditor = router.pathname.includes('/sql/[id]')
  const snippet = snippets[entityId ?? '']
  const snippetContent = snippet?.snippet?.content?.sql

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { data: tables, isLoading: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'public',
  })

  const currentTable = tables?.find((t) => t.id.toString() === entityId)
  const currentSchema = searchParams?.get('schema') ?? 'public'

  const { mutate: sendEvent } = useSendEventMutation()
  const sendTelemetryEvent = (value: string) => {
    sendEvent({
      value,
      action: TELEMETRY_EVENTS.AI_ASSISTANT_V2,
      ...((sqlSnippets ?? []).length > 0 ? { label: 'context-added' } : {}),
    })
  }

  const {
    messages: chatMessages,
    isLoading: isChatLoading,
    append,
    setMessages,
  } = useChat({
    id,
    api: `${BASE_PATH}/api/ai/sql/generate-v3`,
    maxSteps: 5,
    // [Joshen] Not currently used atm, but initialMessages will be for...
    initialMessages,
    body: {
      includeSchemaMetadata,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: currentSchema,
      table: currentTable?.name,
    },
  })

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const messages = useMemo(() => {
    const merged = [
      ...chatMessages,
      ...(assistantError !== undefined && lastSentMessage !== undefined ? [lastSentMessage] : []),
    ]

    return merged.sort(
      (a, b) =>
        (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
        a.role.localeCompare(b.role)
    )
  }, [chatMessages, assistantError, lastSentMessage])

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => {
        return (
          <MemoizedMessage
            key={message.id}
            message={message}
            isLoading={isChatLoading && message === messages[messages.length - 1]}
          />
        )
      }),
    [messages, isChatLoading]
  )

  const hasMessages = messages.length > 0

  const sendMessageToAssistant = async (content: string) => {
    const payload = { role: 'user', createdAt: new Date(), content } as MessageType
    const headerData = await constructHeaders()
    append(payload, {
      headers: { Authorization: headerData.get('Authorization') ?? '' },
    })

    setAiAssistantPanel({ sqlSnippets: undefined })
    setValue('')
    setAssistantError(undefined)
    setLastSentMessage(payload)

    if (content.includes('Help me to debug')) {
      sendTelemetryEvent(TELEMETRY_VALUES.DEBUG_SUBMITTED)
    } else {
      sendTelemetryEvent(TELEMETRY_VALUES.PROMPT_SUBMITTED)
    }
  }

  const confirmOptInToShareSchemaData = async () => {
    if (!canUpdateOrganization) {
      return toast.error('You do not have the required permissions to update this organization')
    }

    if (!selectedOrganization?.slug) return console.error('Organization slug is required')

    const existingOptInTags = selectedOrganization?.opt_in_tags ?? []

    const updatedOptInTags = existingOptInTags.includes(OPT_IN_TAGS.AI_SQL)
      ? existingOptInTags
      : [...existingOptInTags, OPT_IN_TAGS.AI_SQL]

    updateOrganization(
      { slug: selectedOrganization?.slug, opt_in_tags: updatedOptInTags },
      {
        onSuccess: () => {
          toast.success('Successfully opted-in')
          setIsConfirmOptInModalOpen(false)
        },
      }
    )
  }

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollPercentage =
        (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100
      const isScrollable = container.scrollHeight > container.clientHeight
      const isAtBottom = scrollPercentage >= 100

      setShowFade(isScrollable && !isAtBottom)
    }
  }

  // Add useEffect to set up scroll listener
  useEffect(() => {
    // Use a small delay to ensure container is mounted and has content
    const timeoutId = setTimeout(() => {
      const container = scrollContainerRef.current
      if (container) {
        container.addEventListener('scroll', handleScroll)
        handleScroll()
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      const container = scrollContainerRef.current
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  useEffect(() => {
    setValue(initialInput)
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(initialInput.length, initialInput.length)
    }
  }, [initialInput])

  useEffect(() => {
    if (!isChatLoading) {
      if (inputRef.current) inputRef.current.focus()
    }

    setTimeout(
      () => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
      },
      isChatLoading ? 100 : 500
    )
  }, [isChatLoading])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    handleScroll()
    // Load messages into state
    if (!isChatLoading) {
      setAiAssistantPanel({
        messages,
      })
    }
  }, [messages, isChatLoading, setAiAssistantPanel])

  // Remove suggestions if sqlSnippets were removed
  useEffect(() => {
    if (!sqlSnippets || sqlSnippets.length === 0) {
      setAiAssistantPanel({ suggestions: undefined })
    }
  }, [sqlSnippets, suggestions, setAiAssistantPanel])

  useEffect(() => {
    if (open && isInSQLEditor && !!snippetContent) {
      setAiAssistantPanel({ sqlSnippets: [snippetContent] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isInSQLEditor, snippetContent])

  return (
    <>
      <div className={cn('flex flex-col h-full', className)}>
        <div
          ref={scrollContainerRef}
          className={cn('flex-grow overflow-auto flex flex-col')}
          onScroll={handleScroll}
        >
          <div className="z-30 sticky top-0">
            <div className="border-b flex items-center bg gap-x-3 px-5 h-[46px]">
              <AiIconAnimation allowHoverEffect />

              <div className="text-sm flex-1">Assistant</div>
              <div className="flex gap-4 items-center">
                <Tooltip_Shadcn_ delayDuration={100}>
                  <TooltipTrigger_Shadcn_ asChild>
                    <Info size={14} className="text-foreground-light" />
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ className="w-80">
                    The Assistant is in Alpha and your prompts might be rate limited.{' '}
                    {includeSchemaMetadata
                      ? 'Project metadata is being shared to improve Assistant responses.'
                      : 'Project metadata is not being shared. Opt in to improve Assistant responses.'}
                  </TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>

                {(hasMessages || suggestions || sqlSnippets) && (
                  <Button type="default" disabled={isChatLoading} onClick={onResetConversation}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
            {!includeSchemaMetadata && (
              <Admonition
                type="default"
                title="Project metadata is not shared"
                description={
                  hasHipaaAddon
                    ? 'Your organization has the HIPAA addon and will not send any project metadata with your prompts.'
                    : 'The Assistant can improve the quality of the answers if you send project metadata along with your prompts. Opt into sending anonymous data to share your schema and table definitions.'
                }
                className="border-0 border-b rounded-none"
              >
                {!hasHipaaAddon && (
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
          {!hasMessages && (
            <div className="h-48 flex-0 m-8">
              <DotGrid rows={10} columns={10} count={33} />
            </div>
          )}
          {hasMessages ? (
            <motion.div className="w-full p-5">
              {renderedMessages}
              {(last(messages)?.role === 'user' || last(messages)?.content?.length === 0) && (
                <div className="flex gap-4 w-auto overflow-hidden">
                  <AiIconAnimation size={20} className="text-foreground-muted shrink-0" />
                  <motion.div className="text-foreground-lighter text-sm flex gap-1.5 items-center">
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
                  </motion.div>
                </div>
              )}
              <div ref={bottomRef} className="h-1" />
            </motion.div>
          ) : suggestions ? (
            <div className="w-full h-full px-8 py-0 flex flex-col flex-1 justify-end">
              <h3 className="text-foreground-light font-mono text-sm uppercase mb-3">
                Suggestions
              </h3>
              {suggestions.title && <p>{suggestions.title}</p>}
              <div className="-mx-3 mt-4 mb-12">
                {suggestions?.prompts?.map((prompt, idx) => (
                  <Button
                    key={`suggestion-${idx}`}
                    size="small"
                    icon={<FileText strokeWidth={1.5} size={16} />}
                    type="text"
                    className="w-full justify-start py-1 h-auto"
                    onClick={() => {
                      setValue(prompt)
                      if (inputRef.current) {
                        inputRef.current.focus()
                        inputRef.current.setSelectionRange(initialInput.length, initialInput.length)
                      }
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : isLoadingTables ? (
            <div className="w-full h-full flex-1 flex flex-col justify-end items-start p-5">
              {/* [Joshen] We could try play around with a custom loader for the assistant here */}
              <GenericSkeletonLoader className="w-4/5" />
            </div>
          ) : (tables ?? [])?.length > 0 ? (
            <AIOnboarding setMessages={setMessages} onSendMessage={sendMessageToAssistant} />
          ) : (
            <div className="w-full flex flex-col justify-end flex-1 h-full p-5">
              <h2 className="text-base mb-2">Welcome to Supabase!</h2>
              <p className="text-sm text-foreground-lighter mb-6">
                This is the Supabase assistant which will help you create, debug and modify tables,
                policies, functions and more. You can even use it to query your data using just your
                words. It looks like we have a blank canvas though, so what are you looking to
                build? Here are some ideas.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setValue('Generate a database schema for ...')}
                  className="rounded-full"
                >
                  Generate a ...
                </Button>
                {SQL_TEMPLATES.filter((t) => t.type === 'quickstart').map((qs) => (
                  <TooltipProvider_Shadcn_>
                    <Tooltip_Shadcn_>
                      <TooltipTrigger_Shadcn_ asChild>
                        <Button
                          type="outline"
                          className="rounded-full"
                          onClick={() => {
                            setMessages([
                              {
                                id: uuidv4(),
                                role: 'user',
                                createdAt: new Date(Date.now() - 3000),
                                content: qs.description,
                              },
                              {
                                id: uuidv4(),
                                role: 'assistant',
                                createdAt: new Date(),
                                content: `Sure! I can help you with that. Here is a starting point you can run directly or customize further. Would you like to make any changes?  \n\n\`\`\`sql\n-- props: {"title": "${qs.title}"}\n${qs.sql}\n\`\`\``,
                              },
                            ])
                          }}
                        >
                          {qs.title}
                        </Button>
                      </TooltipTrigger_Shadcn_>
                      <TooltipContent_Shadcn_>
                        <p>{qs.description}</p>
                      </TooltipContent_Shadcn_>
                    </Tooltip_Shadcn_>
                  </TooltipProvider_Shadcn_>
                ))}
              </div>
            </div>
          )}
        </div>
        <AnimatePresence>
          {showFade && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none z-10 -mt-24"
            >
              <div className="h-24 w-full bg-gradient-to-t from-background muted to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-5 pt-0 z-20 relative">
          {sqlSnippets && sqlSnippets.length > 0 && (
            <div className="mb-2">
              {sqlSnippets.map((snippet, index) => (
                <CollapsibleCodeBlock
                  key={index}
                  hideLineNumbers
                  value={snippet}
                  onRemove={() => {
                    const newSnippets = [...sqlSnippets]
                    newSnippets.splice(index, 1)
                    setAiAssistantPanel({ sqlSnippets: newSnippets })
                  }}
                  className="text-xs"
                />
              ))}
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

          {!isApiKeySet && (
            <Admonition
              type="default"
              title="OpenAI API key not set"
              description={
                <Markdown
                  content={'Add your `OPENAI_API_KEY` to `./docker/.env` to use the AI Assistant.'}
                />
              }
            />
          )}

          <AssistantChatForm
            textAreaRef={inputRef}
            className={cn(
              'z-20 [&>textarea]:border-1 [&>textarea]:rounded-md [&>textarea]:!outline-none [&>textarea]:!ring-offset-0 [&>textarea]:!ring-0'
            )}
            loading={isChatLoading}
            disabled={!isApiKeySet || disablePrompts || isChatLoading}
            placeholder={
              hasMessages
                ? 'Reply to the assistant...'
                : (sqlSnippets ?? [])?.length > 0
                  ? 'Ask a question or make a change...'
                  : 'Chat to Postgres...'
            }
            value={value}
            onValueChange={(e) => setValue(e.target.value)}
            onSubmit={(event) => {
              event.preventDefault()
              if (includeSchemaMetadata) {
                const sqlSnippetsString =
                  sqlSnippets?.map((snippet) => '```sql\n' + snippet + '\n```').join('\n') || ''
                const valueWithSnippets = [value, sqlSnippetsString].filter(Boolean).join('\n\n')
                sendMessageToAssistant(valueWithSnippets)
              } else {
                sendMessageToAssistant(value)
              }
            }}
          />
        </div>
      </div>

      <ConfirmationModal
        visible={isConfirmOptInModalOpen}
        size="large"
        title="Confirm sending anonymous data to OpenAI"
        confirmLabel="Confirm"
        onCancel={() => setIsConfirmOptInModalOpen(false)}
        onConfirm={confirmOptInToShareSchemaData}
        loading={isUpdating}
      >
        <p className="text-sm text-foreground-light">
          By opting into sending anonymous data, Supabase AI can improve the answers it shows you.
          This is an organization-wide setting, and affects all projects in your organization.
        </p>

        <OptInToOpenAIToggle />
      </ConfirmationModal>
    </>
  )
}
