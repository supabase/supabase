import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import { last, partition } from 'lodash'
import { Box, Code, FileText, MessageCircleMore, WandSparkles, ChevronLeft } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { toast } from 'sonner'
import { useAppStateSnapshot } from 'state/app-state'
import type { Message as MessageType } from 'ai/react'
import { useChat } from 'ai/react'
import OptInToOpenAIToggle from 'components/interfaces/Organization/GeneralSettings/OptInToOpenAIToggle'
import { useCheckOpenAIKeyQuery } from 'data/ai/check-api-key-query'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { useTablesQuery } from 'data/tables/tables-query'
import { constructHeaders } from 'data/fetchers'
import {
  BASE_PATH,
  IS_PLATFORM,
  OPT_IN_TAGS,
  TELEMETRY_ACTIONS,
  TELEMETRY_CATEGORIES,
  TELEMETRY_LABELS,
} from 'lib/constants'
import { Button, cn } from 'ui'
import { Admonition, AssistantChatForm } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ASSISTANT_SUPPORT_ENTITIES } from './AiAssistant.constants'
import { Message } from './Message'
const ANIMATION_DURATION = 0.3
import { Loading } from 'ui'
import CollapsibleCodeBlock from './CollapsibleCodeBlock'

const MemoizedMessage = memo(({ message, isFirstUserMessage, includeSchemaMetadata }) => {
  const [isConfirmOptInModalOpen, setIsConfirmOptInModalOpen] = useState(false)

  return (
    <Message
      key={message.id}
      name={message.name}
      role={message.role}
      content={message.content}
      createdAt={new Date(message.createdAt || new Date()).getTime()}
      readOnly={message.role === 'user'}
    >
      {isFirstUserMessage && !includeSchemaMetadata && (
        <Admonition
          type="default"
          title="Project metadata is not shared with the Assistant"
          description="The Assistant can improve the quality of the answers if you send project metadata along with your prompts. Opt into sending anonymous data to share your schema and table definitions."
          className="mb-4"
        >
          <Button type="default" className="w-fit" onClick={() => setIsConfirmOptInModalOpen(true)}>
            Update AI settings
          </Button>
        </Admonition>
      )}
    </Message>
  )
})

MemoizedMessage.displayName = 'MemoizedMessage'

interface AIAssistantProps {
  id: string
  className?: string
  onResetConversation: () => void
  initialMessages?: MessageType[]
  sqlSnippets?: string[]
  initialInput?: string
}

export const AIAssistant = ({
  id,
  className,
  onResetConversation,
  sqlSnippets: initialSqlSnippets = [],
  initialMessages = [],
  initialInput = '',
}: AIAssistantProps) => {
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const selectedOrganization = useSelectedOrganization()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const [sqlSnippets, setSqlSnippets] = useState(initialSqlSnippets)

  const disablePrompts = useFlag('disableAssistantPrompts')

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [value, setValue] = useState<string>(initialInput)
  const [assistantError, setAssistantError] = useState<string>()
  const [lastSentMessage, setLastSentMessage] = useState<MessageType>()
  const [isConfirmOptInModalOpen, setIsConfirmOptInModalOpen] = useState(false)
  const [headers, setHeaders] = useState<Record<string, string>>({})

  const { data: check } = useCheckOpenAIKeyQuery()
  const isApiKeySet = IS_PLATFORM || !!check?.hasKey

  const { setAiAssistantPanel } = useAppStateSnapshot()

  const { data: tables, isLoading: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'public',
  })

  const { mutate: sendEvent } = useSendEventMutation()
  const sendTelemetryEvent = (action: string) => {
    sendEvent({
      action,
      category: TELEMETRY_CATEGORIES.AI_ASSISTANT,
      label: TELEMETRY_LABELS.QUICK_SQL_EDITOR,
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
    headers: headers,
    maxSteps: 5,
    initialMessages,
    body: {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    onError: (error) => {
      console.log('error:', JSON.stringify(error))
    },
  })

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const isLoading = isChatLoading

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
      messages.map((message, index) => {
        const isFirstUserMessage =
          message.role === 'user' && messages.slice(0, index).every((msg) => msg.role !== 'user')

        return (
          <MemoizedMessage
            key={message.id}
            message={message}
            isFirstUserMessage={isFirstUserMessage}
            includeSchemaMetadata={includeSchemaMetadata}
          />
        )
      }),
    [messages, includeSchemaMetadata]
  )

  const hasMessages = messages.length > 0

  const sendMessageToAssistant = (content: string) => {
    const payload = { role: 'user', createdAt: new Date(), content } as MessageType
    append(payload, {
      headers: {
        Authorization: headers.get('Authorization'),
      },
    })
    setSqlSnippets([])
    setValue('')
    setAssistantError(undefined)
    setLastSentMessage(payload)
    sendTelemetryEvent(TELEMETRY_ACTIONS.PROMPT_SUBMITTED)
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

  useEffect(() => {
    const loadHeaders = async () => {
      const headerData = await constructHeaders()
      setHeaders(headerData)
    }
    loadHeaders()

    return () => {
      setAiAssistantPanel({
        initialInput: '',
        sqlSnippets: [],
      })
    }
  }, [])

  useEffect(() => {
    setValue(initialInput)
    setSqlSnippets(initialSqlSnippets)
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(initialInput.length, initialInput.length)
    }
  }, [initialInput, initialSqlSnippets])

  useEffect(() => {
    if (!isLoading) {
      if (inputRef.current) inputRef.current.focus()
    }

    setTimeout(
      () => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
      },
      isLoading ? 100 : 500
    )
  }, [isLoading])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoadingTables) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Loading active />
      </div>
    )
  }

  return (
    <>
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex items-center gap-x-3 py-3 px-5 border-b">
          <div className="text-sm flex-1">{hasMessages ? 'New chat' : 'Assistant'}</div>
          <div className="flex gap-2">
            {hasMessages && (
              <Button type="default" disabled={isLoading} onClick={onResetConversation}>
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className={cn('flex-grow overflow-auto flex-col')}>
          {hasMessages ? (
            <motion.div className="w-full overflow-auto flex-1 p-5 flex flex-col">
              <div className="text-xs text-foreground-lighter text-center mb-5">
                {new Date(messages[0].createdAt || new Date()).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </div>
              {renderedMessages}
              <div ref={bottomRef} className="h-1" />
            </motion.div>
          ) : tables?.length > 0 ? (
            <div className="w-full px-content py-content flex flex-col justify-end flex-1 h-full">
              <div className="flex-1 w-auto overflow-hidden -mx-5 -mt-5 relative">
                <motion.div
                  initial={{ top: '-200%', bottom: 0 }}
                  animate={{ top: 0, bottom: 0, transition: { duration: 5 } }}
                  className="absolute inset-0 z-20 bg-gradient-to-b from-transparent to-background"
                />
                <div className="h-full w-full relative">
                  <motion.div
                    initial={{ x: 350, rotate: -45 }}
                    animate={{
                      x: 400,
                      rotate: -45,
                      transition: { duration: 5, ease: 'easeInOut' },
                    }}
                    className="absolute -inset-full bg-gradient-to-b from-black/[0.05] dark:from-white/[0.08] to-transparent "
                  />
                  <motion.div
                    initial={{ x: 380, rotate: -45 }}
                    animate={{
                      x: 500,
                      rotate: -45,
                      transition: { duration: 5, ease: 'easeInOut' },
                    }}
                    className="absolute -inset-full bg-gradient-to-b from-black/[0.05] dark:from-white/[0.08] to-transparent "
                  />
                  <motion.div
                    initial={{ x: 410, rotate: -45 }}
                    animate={{
                      x: 600,
                      rotate: -45,
                      transition: { duration: 5, ease: 'easeInOut' },
                    }}
                    className="absolute -inset-full bg-gradient-to-b from-black/[0.05] dark:from-white/[0.08] to-transparent "
                  />
                </div>
              </div>
              <p className="text-base mb-2">How can I help you today?</p>
              <p className="text-sm text-foreground-lighter mb-6">
                I can help you get setup and even generate your entire database schema. Describe
                what you want to build.
              </p>
              {ASSISTANT_SUPPORT_ENTITIES.map((entity) => (
                <div key={entity.id} className="flex flex-col mb-4">
                  <h3 className="mb-2 flex flex-col space-y-2 uppercase font-mono text-sm text-foreground-lighter">
                    {entity.label}
                  </h3>
                  <div className="-mx-3">
                    <Button
                      size="small"
                      icon={<WandSparkles strokeWidth={1.5} size={16} />}
                      type="text"
                      className="w-full justify-start py-1 h-auto"
                      onClick={() =>
                        sendMessageToAssistant(
                          `Suggest some database ${entity.label.toLowerCase()} I can add to my public schema`
                        )
                      }
                    >
                      Suggest{' '}
                      {entity.id === 'rls-policies'
                        ? entity.label
                        : `database ${entity.label.toLowerCase()}`}
                    </Button>

                    <Button
                      size="small"
                      icon={<FileText strokeWidth={1.5} size={16} />}
                      type="text"
                      className="w-full justify-start py-1 h-auto"
                      onClick={() =>
                        sendMessageToAssistant(
                          `Generate some examples of database ${entity.label.toLowerCase()}`
                        )
                      }
                    >
                      Examples of{' '}
                      {entity.id === 'rls-policies'
                        ? entity.label
                        : `database ${entity.label.toLowerCase()}`}
                    </Button>

                    <Button
                      size="small"
                      icon={<MessageCircleMore strokeWidth={1.5} size={16} />}
                      type="text"
                      className="w-full justify-start py-1 h-auto"
                      onClick={() =>
                        sendMessageToAssistant(`What are database ${entity.label.toLowerCase()}`)
                      }
                    >
                      What are{' '}
                      {entity.id === 'rls-policies'
                        ? entity.label
                        : `database ${entity.label.toLowerCase()}`}
                      ?
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full px-content py-content flex flex-col justify-end flex-1 h-full">
              <p className="text-base mb-2">Welcome to Supabase!</p>
              <p className="text-sm text-foreground-lighter mb-6">
                This is the Supabase assistant which can help you create, debug and modify tables,
                policies, functions and more. You can even use it to query your data using just your
                words. It looks like we have a blank canvas though, so what are you looking to
                build?
              </p>
            </div>
          )}
        </div>
        {hasMessages && (
          <div className="pointer-events-none absolute bottom-14 left-0 right-0 z-10">
            <div className="h-24 w-full bg-gradient-to-t from-background muted to-transparent"></div>
          </div>
        )}
        <div className="p-5 pt-0 z-20 relative">
          {sqlSnippets && sqlSnippets.length > 0 && (
            <div className="mb-2">
              {sqlSnippets.map((snippet, index) => (
                <CollapsibleCodeBlock
                  hideLineNumbers
                  key={index}
                  value={snippet}
                  onRemove={() => {
                    const newSnippets = [...sqlSnippets]
                    newSnippets.splice(index, 1)
                    setSqlSnippets(newSnippets)
                  }}
                  className="text-xs"
                />
              ))}
            </div>
          )}

          <AssistantChatForm
            textAreaRef={inputRef}
            className={cn(
              'z-20 [&>textarea]:border-1 [&>textarea]:rounded-md [&>textarea]:!outline-none [&>textarea]:!ring-offset-0 [&>textarea]:!ring-0'
            )}
            loading={isLoading}
            disabled={!isApiKeySet || disablePrompts || isLoading}
            placeholder={
              hasMessages
                ? 'Reply to the assistant...'
                : sqlSnippets?.length > 0
                  ? 'Ask a question or make a change...'
                  : 'How can we help you today?'
            }
            value={value}
            onValueChange={(e) => setValue(e.target.value)}
            onSubmit={(event) => {
              event.preventDefault()
              const sqlSnippetsString = sqlSnippets
                .map((snippet) => '```sql\n' + snippet + '\n```')
                .join('\n')
              const valueWithSnippets = [value, sqlSnippetsString].filter(Boolean).join('\n\n')
              sendMessageToAssistant(valueWithSnippets)
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
