import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import { last, partition } from 'lodash'
import { Box, Code, FileText, MessageCircleMore, Plus, WandSparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Message as MessageType } from 'ai/react'
import { useChat } from 'ai/react'
import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import OptInToOpenAIToggle from 'components/interfaces/Organization/GeneralSettings/OptInToOpenAIToggle'
import { MessageWithDebug } from 'components/interfaces/SQLEditor/AiAssistantPanel'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useCheckOpenAIKeyQuery } from 'data/ai/check-api-key-query'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useEntityDefinitionQuery } from 'data/database/entity-definition-query'
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
  Heading,
  SheetHeader,
  SheetSection,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { Admonition, AssistantChatForm } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { DocsButton } from '../DocsButton'
import { ASSISTANT_SUPPORT_ENTITIES } from './AiAssistant.constants'
import { SupportedAssistantEntities, SupportedAssistantQuickPromptTypes } from './AIAssistant.types'
import { generatePrompt, retrieveDocsUrl } from './AIAssistant.utils'
import { ContextBadge } from './ContextBadge'
import { EntitiesDropdownMenu } from './EntitiesDropdownMenu'
import { Message } from './Message'
import { SchemasDropdownMenu } from './SchemasDropdownMenu'
import { SQL_TEMPLATES } from 'components/interfaces/SQLEditor/SQLEditor.queries'
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

  const [templates, quickStart] = partition(SQL_TEMPLATES, { type: 'template' })

  const disablePrompts = useFlag('disableAssistantPrompts')
  const { aiAssistantPanel } = useAppStateSnapshot()
  const { editor, entity } = aiAssistantPanel

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

  const { data: check } = useCheckOpenAIKeyQuery()
  const isApiKeySet = IS_PLATFORM || !!check?.hasKey

  const { data: existingDefinition } = useEntityDefinitionQuery({
    id: entity?.id,
    type: editor,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data } = useEntityDefinitionsQuery(
    {
      schemas: selectedSchemas,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const tableDefinitions =
    selectedTables.length === 0
      ? (data?.map((def) => def.sql.trim()) ?? [])
      : (data
          ?.filter((def) => {
            return selectedTables.some((table) => {
              return def.sql.startsWith(`CREATE  TABLE ${table.schema}.${table.name}`)
            })
          })
          .map((def) => def.sql.trim()) ?? [])
  const entityDefinitions = includeSchemaMetadata ? tableDefinitions : undefined

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
    api: `${BASE_PATH}/api/ai/sql/generate-v2`,
    body: { entityDefinitions, context: selectedDatabaseEntity, existingSql: existingDefinition },
    onError: (error) => setAssistantError(JSON.parse(error.message).error),
  })

  console.log('messages:', chatMessages)

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

  const renderedMessages = useMemo(() => {
    return messages.map((m, index) => {
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
    })
  }, [messages, contextHistory, includeSchemaMetadata, selectedSchemas.length, onDiff])

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
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex items-center justify-between gap-x-2 py-3 px-6 border-b ">
          <div className="text-sm">Assistant</div>
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
        </div>

        <div className={cn('flex-grow overflow-auto flex-col')}>
          {hasMessages && (
            <motion.div className="w-full overflow-auto flex-1 p-5 flex flex-col gap-4">
              {renderedMessages}
              <div ref={bottomRef} className="h-1" />
            </motion.div>
          )}
          {!hasMessages && (
            <div
              className={cn(
                'w-full px-content py-content flex flex-col gap-y-4',
                hasMessages ? 'sticky flex-0' : 'flex flex-col gap-y-4'
              )}
            >
              <AnimatePresence>
                {!hasMessages && (
                  <motion.div
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 100 }}
                    transition={{ duration: ANIMATION_DURATION }}
                  >
                    <p className="text-base mb-4">
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
                    <div className="mb-4">
                      <h3 className="text-foreground-light font-mono text-sm uppercase w-full mb-2">
                        Quick start
                      </h3>
                      <div className="-mx-3">
                        {quickStart.map((template) => (
                          <Button
                            key={template.title}
                            size="small"
                            icon={<Box strokeWidth={1.5} size={16} />}
                            type={'text'}
                            className="w-full justify-start py-1 h-auto"
                          >
                            {template.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-foreground-light font-mono text-sm uppercase w-full mb-2">
                        Templates
                      </h3>
                      <div className="-mx-3">
                        {templates.map((template) => (
                          <Button
                            key={template.title}
                            size="small"
                            type={'text'}
                            className="w-full justify-start py-1 h-auto"
                            onClick={() =>
                              setMessages([
                                {
                                  id: crypto.randomUUID(),
                                  createdAt: new Date(Date.now() - 3000),
                                  role: 'user',
                                  content: `Help me to ${template.title}`,
                                },
                                {
                                  id: crypto.randomUUID(),
                                  role: 'assistant',
                                  createdAt: new Date(),
                                  content: [
                                    'Absolutely! Here is an example snippet. How would you like to customize it?:\n',
                                    '```sql',
                                    template.sql,
                                    '```',
                                  ].join('\n'),
                                },
                              ])
                            }
                          >
                            {template.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-foreground-light font-mono text-sm uppercase w-full mb-2">
                        Functions
                      </h3>
                      <div className="-mx-3">
                        <Button
                          size="small"
                          type={'text'}
                          className="w-full justify-start py-1 h-auto"
                        >
                          Create a new function
                        </Button>
                        <Button
                          size="small"
                          type={'text'}
                          className="w-full justify-start py-1 h-auto"
                        >
                          Suggest some functions to create
                        </Button>
                        <Button
                          size="small"
                          type={'text'}
                          className="w-full justify-start py-1 h-auto"
                        >
                          View some examples
                        </Button>
                      </div>
                    </div>
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
                {!isApiKeySet && (
                  <Admonition
                    type="warning"
                    title="OpenAI API key not set"
                    description={
                      <Markdown
                        content={
                          'Add your `OPENAI_API_KEY` to `./docker/.env` to use the AI Assistant.'
                        }
                      />
                    }
                  />
                )}

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
                        {docsUrl !== undefined && <DocsButton href={docsUrl} />}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
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
                  Improve the output quality of the assistant by giving it context about what you
                  need help with
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
            disabled={!isApiKeySet || disablePrompts || isLoading}
            placeholder={hasMessages ? 'Reply to the assistant...' : 'How can we help you today?'}
            value={value}
            onValueChange={(e) => setValue(e.target.value)}
            onSubmit={(event) => {
              event.preventDefault()
              sendMessageToAssistant(value)
            }}
          />
          {!hasMessages && IS_PLATFORM && (
            <div className="text-xs text-foreground-lighter text-opacity-60 bg-control px-3 pb-2">
              The Assistant is in Alpha and your prompts might be rate limited
            </div>
          )}
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
