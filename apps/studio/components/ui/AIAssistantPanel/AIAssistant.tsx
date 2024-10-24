import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import { last } from 'lodash'
import { ExternalLink, FileText, MessageCircleMore, Plus, WandSparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Message as MessageType } from 'ai/react'
import { useChat } from 'ai/react'
import { useParams } from 'common'
import OptInToOpenAIToggle from 'components/interfaces/Organization/GeneralSettings/OptInToOpenAIToggle'
import { MessageWithDebug } from 'components/interfaces/SQLEditor/AiAssistantPanel'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import {
  BASE_PATH,
  IS_PLATFORM,
  OPT_IN_TAGS,
  TELEMETRY_ACTIONS,
  TELEMETRY_CATEGORIES,
  TELEMETRY_LABELS,
} from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AiIconAnimation,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  SheetHeader,
  SheetSection,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { Admonition, AssistantChatForm } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ASSISTANT_SUPPORT_ENTITIES } from './AiAssistant.constants'
import { SupportedAssistantEntities, SupportedAssistantQuickPromptTypes } from './AIAssistant.types'
import { generatePrompt, retrieveDocsUrl } from './AIAssistant.utils'
import { ContextBadge } from './ContextBadge'
import { EntitiesDropdownMenu } from './EntitiesDropdownMenu'
import { Message } from './Message'
import { SchemasDropdownMenu } from './SchemasDropdownMenu'

const ANIMATION_DURATION = 0.3

interface AIAssistantProps {
  id: string
  className?: string
  debugThread: MessageWithDebug[]
  onDiff: ({ id, diffType, sql }: { id: string; diffType: DiffType; sql: string }) => void
  onResetConversation: () => void
}

// [Joshen] For some reason I'm having issues working with dropdown menu and scroll area

export const AIAssistant = ({
  id,
  className,
  debugThread,
  onDiff,
  onResetConversation,
}: AIAssistantProps) => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const selectedOrganization = useSelectedOrganization()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const disablePrompts = useFlag('disableAssistantPrompts')
  const { aiAssistantPanel } = useAppStateSnapshot()
  const { editor } = aiAssistantPanel

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [value, setValue] = useState<string>('')
  const [selectedDatabaseEntity, setSelectedDatabaseEntity] = useState<
    SupportedAssistantEntities | ''
  >('')
  const [selectedSchemas, setSelectedSchemas] = useSchemasForAi(project?.ref!)
  const [selectedTables, setSelectedTables] = useState<{ schema: string; name: string }[]>([])
  const [contextHistory, setContextHistory] = useState<{
    [key: string]: { entity: string; schemas: string[]; tables: string[] }
  }>({})
  // [Joshen] Mainly for error handling on useChat - cause last sent messages will be voided
  const [assistantError, setAssistantError] = useState<string>()
  const [lastSentMessage, setLastSentMessage] = useState<MessageType>()
  const [isConfirmOptInModalOpen, setIsConfirmOptInModalOpen] = useState(false)

  const docsUrl = retrieveDocsUrl(selectedDatabaseEntity as SupportedAssistantEntities)
  const entityContext = ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === selectedDatabaseEntity)
  const noContextAdded =
    selectedDatabaseEntity.length === 0 &&
    selectedSchemas.length === 0 &&
    selectedTables.length === 0

  const { data } = useEntityDefinitionsQuery(
    {
      schemas: selectedSchemas,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata
    ? selectedTables.length === 0
      ? data?.map((def) => def.sql.trim())
      : data
          ?.filter((def) => {
            return selectedTables.some((table) => {
              return def.sql.startsWith(`CREATE  TABLE ${table.schema}.${table.name}`)
            })
          })
          .map((def) => def.sql.trim())
    : undefined

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
  } = useChat({
    id,
    api: `${BASE_PATH}/api/ai/sql/generate-v2`,
    body: { entityDefinitions, context: selectedDatabaseEntity },
    onError: (error) => setAssistantError(JSON.parse(error.message).error),
  })

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const { isLoading: isDebugSqlLoading } = useSqlDebugMutation()
  const isLoading = isChatLoading || isDebugSqlLoading

  const messages = useMemo(() => {
    const merged = [
      ...debugThread,
      ...chatMessages.map((m) => ({ ...m, isDebug: false })),
      ...(assistantError !== undefined && lastSentMessage !== undefined ? [lastSentMessage] : []),
    ]

    return merged.sort(
      (a, b) =>
        (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
        a.role.localeCompare(b.role)
    )
  }, [chatMessages, debugThread, assistantError, lastSentMessage])

  const hasMessages = messages.length > 0
  const lastMessage = last(messages)
  const pendingChatReply = isLoading && lastMessage?.role === 'user'
  const pendingDebugReply =
    (lastMessage as MessageWithDebug)?.isDebug &&
    lastMessage?.role === 'assistant' &&
    lastMessage.content === 'Thinking...'
  const pendingReply = pendingChatReply || pendingDebugReply

  const sendMessageToAssistant = (content: string) => {
    const payload = { role: 'user', createdAt: new Date(), content } as MessageType
    append(payload)
    setAssistantError(undefined)
    setLastSentMessage(payload)
    sendTelemetryEvent(TELEMETRY_ACTIONS.PROMPT_SUBMITTED)
  }

  const toggleSchema = (schema: string) => {
    if (selectedSchemas.includes(schema)) {
      setSelectedSchemas(selectedSchemas.filter((s) => s !== schema))
    } else {
      const newSelectedSchemas = [...selectedSchemas, schema].sort((a, b) => a.localeCompare(b))
      setSelectedSchemas(newSelectedSchemas)
      sendTelemetryEvent(TELEMETRY_ACTIONS.SCHEMA_CONTEXT_ADDED)
    }
  }

  const toggleEntity = ({ schema, name }: { schema: string; name: string }) => {
    const isExisting = selectedTables.find((x) => x.schema === schema && x.name === name)
    if (isExisting) {
      setSelectedTables(selectedTables.filter((x) => !(x.schema === schema && x.name === name)))
    } else {
      const newselectedTables = [...selectedTables, { schema, name }].sort(
        (a, b) => a.schema.localeCompare(b.schema) || a.name.localeCompare(b.name)
      )
      setSelectedTables(newselectedTables)
      sendTelemetryEvent(TELEMETRY_ACTIONS.TABLE_CONTEXT_ADDED)
    }
  }

  const onClickQuickPrompt = (type: SupportedAssistantQuickPromptTypes) => {
    const prompt = generatePrompt({
      type,
      context: selectedDatabaseEntity as any,
      schemas: selectedSchemas,
      tables: selectedTables,
    })
    if (prompt) {
      setValue(prompt)
      sendMessageToAssistant(prompt)
      sendTelemetryEvent(TELEMETRY_ACTIONS.QUICK_PROMPT_SELECTED(type))
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

  useEffect(() => {
    if (editor) {
      const mode = ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === editor)
      if (mode) setSelectedDatabaseEntity(mode.id)
    }
  }, [editor])

  useEffect(() => {
    if (!isLoading) {
      setValue('')
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

  useEffect(() => {
    const lastMessage = last(messages)
    if (lastMessage?.role === 'user') {
      const entity = entityContext?.label ?? selectedDatabaseEntity
      setContextHistory({
        ...contextHistory,
        [lastMessage.id]: {
          entity,
          schemas: selectedSchemas,
          tables: selectedTables.map((x) =>
            selectedSchemas.length > 1 ? `${x.schema}.${x.name}` : x.name
          ),
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  return (
    <>
      <div className={cn('flex flex-col', className)}>
        <SheetHeader className="flex items-center justify-between py-3">
          <div className="flex items-center gap-x-2">
            <AiIconAnimation
              allowHoverEffect
              className="[&>div>div]:border-black dark:[&>div>div]:border-white"
            />
            <p>Assistant</p>
          </div>
          <AnimatePresence>
            {hasMessages && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 100 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button type="default" disabled={isLoading} onClick={() => onResetConversation()}>
                  Reset conversation
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetHeader>

        <SheetSection
          className={cn(
            'flex-grow flex flex-col items-center !p-0',
            hasMessages ? 'justify-between h-[90%]' : 'justify-center h-full'
          )}
        >
          {hasMessages && (
            <motion.div
              initial={{ height: 0 }}
              transition={{ duration: ANIMATION_DURATION }}
              className="w-full overflow-auto flex-1"
            >
              {messages.map((m, index) => {
                const isFirstUserMessage =
                  m.role === 'user' && messages.slice(0, index).every((msg) => msg.role !== 'user')

                return (
                  <Message
                    key={`message-${m.id}`}
                    name={m.name}
                    role={m.role}
                    content={m.content}
                    createdAt={new Date(m.createdAt || new Date()).getTime()}
                    isDebug={(m as MessageWithDebug).isDebug}
                    context={contextHistory[m.id]}
                    onDiff={(diffType, sql) => onDiff({ id: m.id, diffType, sql })}
                  >
                    {isFirstUserMessage && !includeSchemaMetadata && (
                      <Admonition
                        type="default"
                        title="Project metadata is not shared with the Assistant"
                        description="The Assistant can improve the quality of the answers if you send project metadata along with your prompts. Opt into sending anonymous data to share your schema and table definitions."
                      >
                        <Button
                          type="default"
                          className="w-fit"
                          onClick={() => setIsConfirmOptInModalOpen(true)}
                        >
                          Update AI settings
                        </Button>
                      </Admonition>
                    )}
                    {isFirstUserMessage &&
                      includeSchemaMetadata &&
                      selectedSchemas.length === 0 && (
                        <Admonition
                          type="default"
                          title="We recommend including schemas for better answers from the Assistant"
                        />
                      )}
                  </Message>
                )
              })}
              {assistantError !== undefined && (
                <Message
                  key="assistant-error"
                  role="assistant"
                  variant="warning"
                  createdAt={new Date().getTime()}
                  content={`Sorry! We ran into the following error while trying to respond to your message: ${assistantError}. Please try again shortly or reach out to us via support if the issue still persists!`}
                >
                  <Button asChild type="default" className="w-min">
                    <Link
                      target="_blank"
                      rel="noreferrer"
                      href={`/support/new?ref=${ref}&category=dashboard_bug&subject=Error%20with%20assistant%20response&message=Assistant%20error:%20${assistantError}`}
                    >
                      Contact support
                    </Link>
                  </Button>
                </Message>
              )}
              {!isLoading && !pendingReply && assistantError === undefined && (
                <p className="px-content text-xs text-right text-foreground-lighter pb-2">
                  Please verify all responses as the Assistant can make mistakes
                </p>
              )}
              {pendingChatReply && (
                <Message key="thinking" role="assistant" content="Thinking..." />
              )}
              <div ref={bottomRef} className="h-1" />
            </motion.div>
          )}

          <div
            className={cn(
              'w-full px-content py-content',
              hasMessages ? 'sticky flex-0 border-t' : 'flex flex-col gap-y-4'
            )}
          >
            <AnimatePresence>
              {!hasMessages && (
                <motion.div
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 100 }}
                  transition={{ duration: ANIMATION_DURATION }}
                >
                  <p className="text-center text-base text-foreground-light">
                    How can I help you
                    {!!entityContext ? (
                      <>
                        {' '}
                        with{' '}
                        <span className="text-foreground">
                          {entityContext.id === 'rls-policies'
                            ? entityContext.label
                            : `Database ${entityContext.label}`}
                        </span>
                      </>
                    ) : (
                      ' today'
                    )}
                    ?
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-col gap-y-2">
              {disablePrompts && (
                <Admonition
                  type="default"
                  title="Assistant has been temporarily disabled"
                  description="Give us a moment while we work on bringing the Assistant back online"
                />
              )}
              <div className="w-full border rounded">
                <div className="py-2 px-3 border-b flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Tooltip_Shadcn_>
                        <TooltipTrigger_Shadcn_ asChild>
                          <Button
                            type="default"
                            icon={<Plus />}
                            className={cn(noContextAdded ? '' : 'px-1.5 !space-x-0')}
                          >
                            <span className={noContextAdded ? '' : 'sr-only'}>Add context</span>
                          </Button>
                        </TooltipTrigger_Shadcn_>
                        <TooltipContent_Shadcn_ side={hasMessages ? 'top' : 'bottom'}>
                          Add context for the assistant
                        </TooltipContent_Shadcn_>
                      </Tooltip_Shadcn_>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[310px]">
                      <DropdownMenuLabel>
                        Improve the output quality of the assistant by giving it context about what
                        you need help with
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {editor === null && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <div className="flex flex-col gap-y-1">
                              <p>Database Entity</p>
                              <p className="text-foreground-lighter">
                                Inform about what you're working with
                              </p>
                            </div>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={selectedDatabaseEntity}
                              onValueChange={(value) =>
                                setSelectedDatabaseEntity(value as SupportedAssistantEntities)
                              }
                            >
                              {ASSISTANT_SUPPORT_ENTITIES.map((x) => (
                                <DropdownMenuRadioItem key={x.id} value={x.id}>
                                  {x.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                      {includeSchemaMetadata && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-x-2">
                              <div className="flex flex-col gap-y-1">
                                <p>Schemas</p>
                                <p className="text-foreground-lighter">
                                  Share table definitions in the selected schemas
                                </p>
                              </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="p-0 w-52">
                              <SchemasDropdownMenu
                                selectedSchemas={selectedSchemas}
                                onToggleSchema={toggleSchema}
                              />
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          {selectedSchemas.length > 0 && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="gap-x-2">
                                <div className="flex flex-col gap-y-1">
                                  <p>Tables</p>
                                  <p className="text-foreground-lighter">
                                    Select specific tables to share definitions for
                                  </p>
                                </div>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="p-0 w-52">
                                <EntitiesDropdownMenu
                                  selectedSchemas={selectedSchemas}
                                  selectedEntities={selectedTables}
                                  onToggleEntity={toggleEntity}
                                />
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {!!entityContext && (
                    <ContextBadge
                      label="Entity"
                      value={entityContext.label}
                      onRemove={editor === null ? () => setSelectedDatabaseEntity('') : undefined}
                    />
                  )}

                  {selectedSchemas.length > 0 && (
                    <ContextBadge
                      label="Schemas"
                      value={`${selectedSchemas.slice(0, 2).join(', ')}${selectedSchemas.length > 2 ? ` and ${selectedSchemas.length - 2} other${selectedSchemas.length > 3 ? 's' : ''}` : ''}`}
                      onRemove={() => {
                        setSelectedSchemas([])
                        setSelectedTables([])
                      }}
                      tooltip={
                        selectedSchemas.length > 2 ? (
                          <>
                            <p className="text-foreground-light">
                              {selectedSchemas.length} schemas selected:
                            </p>
                            <ul className="list-disc pl-4">
                              {selectedSchemas.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </>
                        ) : undefined
                      }
                    />
                  )}

                  {selectedTables.length > 0 && (
                    <ContextBadge
                      label="Tables"
                      value={`${selectedTables
                        .slice(0, 2)
                        .map((x) => x.name)
                        .join(
                          ', '
                        )}${selectedTables.length > 2 ? ` and ${selectedTables.length - 2} other${selectedTables.length > 3 ? 's' : ''}` : ''}`}
                      onRemove={() => setSelectedTables([])}
                      tooltip={
                        selectedTables.length > 2 ? (
                          <>
                            <p className="text-foreground-light">
                              {selectedTables.length} tables selected:
                            </p>
                            <ul className="list-disc pl-4">
                              {selectedTables.map((x) => (
                                <li key={`${x.schema}.${x.name}`}>
                                  {x.schema}.{x.name}
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : undefined
                      }
                    />
                  )}
                </div>

                <AssistantChatForm
                  textAreaRef={inputRef}
                  className={cn(
                    '[&>textarea]:rounded-none [&>textarea]:border-0 [&>textarea]:!outline-none [&>textarea]:!ring-offset-0 [&>textarea]:!ring-0'
                  )}
                  loading={isLoading}
                  disabled={disablePrompts || isLoading}
                  placeholder={
                    hasMessages ? 'Reply to the assistant...' : 'How can we help you today?'
                  }
                  value={value}
                  onValueChange={(e) => setValue(e.target.value)}
                  onSubmit={(event) => {
                    event.preventDefault()
                    sendMessageToAssistant(value)
                  }}
                />
              </div>

              <AnimatePresence>
                {!hasMessages && (
                  <motion.div
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 100 }}
                    transition={{ duration: ANIMATION_DURATION }}
                    className={cn('w-full')}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-x-2 transition',
                        entityContext !== undefined ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <Tooltip_Shadcn_>
                        <TooltipTrigger_Shadcn_ asChild>
                          <Button
                            type="default"
                            icon={<WandSparkles />}
                            onClick={() => onClickQuickPrompt('suggest')}
                          >
                            Suggest
                          </Button>
                        </TooltipTrigger_Shadcn_>
                        <TooltipContent_Shadcn_ side="bottom">
                          Suggest some{' '}
                          {entityContext?.id === 'rls-policies'
                            ? entityContext.label
                            : `database ${entityContext?.label.toLowerCase()}`}
                        </TooltipContent_Shadcn_>
                      </Tooltip_Shadcn_>
                      <Tooltip_Shadcn_>
                        <TooltipTrigger_Shadcn_ asChild>
                          <Button
                            type="default"
                            icon={<FileText />}
                            onClick={() => onClickQuickPrompt('examples')}
                          >
                            Examples
                          </Button>
                        </TooltipTrigger_Shadcn_>
                        <TooltipContent_Shadcn_ side="bottom">
                          Provide some examples of{' '}
                          {entityContext?.id === 'rls-policies'
                            ? entityContext.label
                            : `database ${entityContext?.label.toLowerCase()}`}
                        </TooltipContent_Shadcn_>
                      </Tooltip_Shadcn_>
                      <Tooltip_Shadcn_>
                        <TooltipTrigger_Shadcn_ asChild>
                          <Button
                            type="default"
                            icon={<MessageCircleMore />}
                            onClick={() => onClickQuickPrompt('ask')}
                          >
                            Ask
                          </Button>
                        </TooltipTrigger_Shadcn_>
                        <TooltipContent_Shadcn_ side="bottom">
                          What are{' '}
                          {entityContext?.id === 'rls-policies'
                            ? entityContext.label
                            : `database ${entityContext?.label.toLowerCase()}`}
                          ?
                        </TooltipContent_Shadcn_>
                      </Tooltip_Shadcn_>
                      {docsUrl !== undefined && (
                        <Button asChild type="default" icon={<ExternalLink />}>
                          <a href={docsUrl} target="_blank" rel="noreferrer">
                            Documentation
                          </a>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SheetSection>
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
