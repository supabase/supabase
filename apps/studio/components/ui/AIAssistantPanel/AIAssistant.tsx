import { useSchemasQuery } from 'data/database/schemas-query'
import { AnimatePresence, motion } from 'framer-motion'
import { last } from 'lodash'
import { Check, ExternalLink, FileText, MessageCircleMore, Plus, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useChat } from 'ai/react'
import { MessageWithDebug } from 'components/interfaces/SQLEditor/AiAssistantPanel'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AiIconAnimation,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
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
  ScrollArea,
  SheetHeader,
  SheetSection,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { AssistantChatForm } from 'ui-patterns'
import { ASSISTANT_SUPPORT_ENTITIES } from './AiAssistant.constants'
import { SupportedAssistantEntities, SupportedAssistantQuickPromptTypes } from './AIAssistant.types'
import { generatePrompt, retrieveDocsUrl } from './AIAssistant.utils'
import { ContextBadge } from './ContextBadge'
import { EntitiesDropdownMenu } from './EntitiesDropdownMenu'
import { Message } from './Message'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'

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
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const { aiAssistantPanel } = useAppStateSnapshot()
  const { editor } = aiAssistantPanel
  const showEditor = !!editor

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

  const docsUrl = retrieveDocsUrl(selectedDatabaseEntity as SupportedAssistantEntities)
  const entityContext = ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === selectedDatabaseEntity)
  const noContextAdded =
    selectedDatabaseEntity.length === 0 &&
    selectedSchemas.length === 0 &&
    selectedTables.length === 0

  const { data: schemaDatas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const schemas = (schemaDatas || []).sort((a, b) => a.name.localeCompare(b.name))

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

  const {
    messages: chatMessages,
    isLoading: isChatLoading,
    append,
  } = useChat({
    id,
    api: `${BASE_PATH}/api/ai/sql/generate-v2`,
    body: { entityDefinitions },
  })

  const { isLoading: isDebugSqlLoading } = useSqlDebugMutation()
  const isLoading = isChatLoading || isDebugSqlLoading

  const messages = useMemo(() => {
    const merged = [...debugThread, ...chatMessages.map((m) => ({ ...m, isDebug: false }))]

    return merged.sort(
      (a, b) =>
        (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
        a.role.localeCompare(b.role)
    )
  }, [chatMessages, debugThread])

  const hasMessages = messages.length > 0
  const lastMessage = last(messages)
  const pendingChatReply = isLoading && lastMessage?.role === 'user'
  const pendingDebugReply =
    lastMessage?.isDebug &&
    lastMessage?.role === 'assistant' &&
    lastMessage.content === 'Thinking...'
  const pendingReply = pendingChatReply || pendingDebugReply

  const toggleSchema = (schema: string) => {
    if (selectedSchemas.includes(schema)) {
      setSelectedSchemas(selectedSchemas.filter((s) => s !== schema))
    } else {
      const newSelectedSchemas = [...selectedSchemas, schema].sort((a, b) => a.localeCompare(b))
      setSelectedSchemas(newSelectedSchemas)
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
      append({ role: 'user', createdAt: new Date(), content: prompt })
    }
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
              <Button
                type="default"
                onClick={() => onResetConversation()}
                className={cn('transition', showEditor ? '' : 'mr-6')}
              >
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
            // animate={{ height: '100%' }}
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
                  isDebug={m.isDebug}
                  context={contextHistory[m.id]}
                  onDiff={(diffType, sql) => onDiff({ id: m.id, diffType, sql })}
                  // isSelected={selectedMessage === m.id}
                >
                  {isFirstUserMessage && !includeSchemaMetadata && true && (
                    <Alert_Shadcn_>
                      <AlertDescription_Shadcn_ className="flex flex-col gap-4">
                        <span>
                          Quick reminder that you're not sending project metadata with your queries.
                          By opting into sending anonymous data, Supabase AI can improve the answers
                          it shows you.
                        </span>
                        <Button
                          type="default"
                          className="w-fit"
                          // onClick={() => setIsConfirmOptInModalOpen(true)}
                        >
                          Update AI settings
                        </Button>
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                  {isFirstUserMessage && includeSchemaMetadata && selectedSchemas.length === 0 && (
                    <Alert_Shadcn_>
                      <AlertDescription_Shadcn_ className="flex flex-col gap-4">
                        <span>
                          We recommend including the schemas for better answers by Supabase AI.
                        </span>
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                </Message>
              )
            })}
            {!isLoading && !pendingReply && (
              <p className="px-content text-xs text-right text-foreground-lighter pb-2">
                Please verify all responses as the Assistant can make mistakes
              </p>
            )}
            {pendingChatReply && <Message key="thinking" role="assistant" content="Thinking..." />}
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
            <div className="w-full border rounded">
              <div className="py-2 px-3 border-b flex gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Tooltip_Shadcn_>
                      <TooltipTrigger_Shadcn_ asChild>
                        <Button
                          type="default"
                          icon={<Plus />}
                          className={noContextAdded ? '' : 'px-1.5 !space-x-0'}
                        >
                          <span className={noContextAdded ? '' : 'sr-only'}>Add context</span>
                        </Button>
                      </TooltipTrigger_Shadcn_>
                      <TooltipContent_Shadcn_ side={hasMessages ? 'top' : 'bottom'}>
                        Add context for the assistant
                      </TooltipContent_Shadcn_>
                    </Tooltip_Shadcn_>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={showEditor ? 'start' : 'center'}
                    className="w-[310px]"
                  >
                    <DropdownMenuLabel>
                      Improve the output quality of the assistant by giving it context about what
                      you need help with
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {editor === undefined && (
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
                        {/* [Joshen] See if you can figure out the scroll issue here */}
                        <Command_Shadcn_>
                          <CommandInput_Shadcn_ autoFocus placeholder="Find schema..." />
                          <CommandList_Shadcn_>
                            <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                            <CommandGroup_Shadcn_>
                              <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                                {schemas?.map((schema) => (
                                  <CommandItem_Shadcn_
                                    key={schema.id}
                                    value={schema.id.toString()}
                                    className="justify-between"
                                    onSelect={() => toggleSchema(schema.name)}
                                    onClick={() => toggleSchema(schema.name)}
                                  >
                                    {schema.name}
                                    {selectedSchemas.includes(schema.name) && (
                                      <Check className="text-brand" strokeWidth={2} size={16} />
                                    )}
                                  </CommandItem_Shadcn_>
                                ))}
                              </ScrollArea>
                            </CommandGroup_Shadcn_>
                          </CommandList_Shadcn_>
                        </Command_Shadcn_>
                        {/* {schemas.map((schema) => (
                        <DropdownMenuItem
                          key={schema.id}
                          className="w-full flex items-center justify-between w-40"
                          onClick={() => toggleSchema(schema.name)}
                        >
                          {schema.name}
                          {selectedSchemas.includes(schema.name) && (
                            <Check className="text-brand" strokeWidth={2} size={16} />
                          )}
                        </DropdownMenuItem>
                      ))} */}
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
                  </DropdownMenuContent>
                </DropdownMenu>

                {!!entityContext && (
                  <ContextBadge
                    label="Entity"
                    value={entityContext.label}
                    onRemove={
                      editor === undefined ? () => setSelectedDatabaseEntity('') : undefined
                    }
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
                disabled={isLoading}
                placeholder={
                  hasMessages ? 'Reply to the assistant...' : 'How can we help you today?'
                }
                value={value}
                onValueChange={(e) => setValue(e.target.value)}
                onSubmit={(event) => {
                  event.preventDefault()
                  append({
                    content: value,
                    role: 'user',
                    createdAt: new Date(),
                  })
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
  )
}
