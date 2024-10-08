import { useSchemasQuery } from 'data/database/schemas-query'
import { AnimatePresence, motion } from 'framer-motion'
import { last } from 'lodash'
import { Check, Plus, WandSparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useChat } from 'ai/react'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AiIconAnimation,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { AssistantChatForm } from 'ui-patterns'
import { Message } from './Message'

const ASSISTANT_SUPPORT_ENTITIES = [
  { id: 'rls-policies', label: 'RLS Policies', name: 'RLS policy' },
  { id: 'functions', label: 'Functions', name: 'database function' },
]
const ANIMATION_DURATION = 0.5

interface AIAssistantProps {
  className?: string
  showEditor: boolean
}

// [Joshen] For some reason I'm having issues working with dropdown menu and scroll area

export const AIAssistant = ({ className, showEditor }: AIAssistantProps) => {
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { open, editor } = aiAssistantPanel

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [chatId, setChatId] = useState(uuidv4())
  const [value, setValue] = useState<string>('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [selectedSchemas, setSelectedSchemas] = useSchemasForAi(project?.ref!)

  const entityContext = ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === selectedEntity)
  const noContextAdded = selectedEntity.length === 0 && selectedSchemas.length === 0

  const { data } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const schemas = (data || []).sort((a, b) => a.name.localeCompare(b.name))

  const {
    messages: chatMessages,
    append,
    isLoading,
  } = useChat({
    id: chatId,
    api: `${BASE_PATH}/api/ai/sql/suggest`,
    body: {
      entityDefinitions: isOptedInToAI || !IS_PLATFORM ? undefined : undefined,
    },
  })

  const messages = useMemo(() => {
    const merged = [...chatMessages.map((m) => ({ ...m, isDebug: false }))]

    return merged.sort(
      (a, b) =>
        (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
        a.role.localeCompare(b.role)
    )
  }, [chatMessages])

  const hasMessages = messages.length > 0
  const pendingReply = isLoading && last(messages)?.role === 'user'

  const toggleSchema = (schema: string) => {
    if (selectedSchemas.includes(schema)) {
      setSelectedSchemas(selectedSchemas.filter((s) => s !== schema))
    } else {
      const newSelectedSchemas = [...selectedSchemas, schema].sort((a, b) => a.localeCompare(b))
      setSelectedSchemas(newSelectedSchemas)
    }
  }

  useEffect(() => {
    if (editor) {
      const mode = ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === editor)
      if (mode) setSelectedEntity(mode.id)
    }
  }, [editor])

  useEffect(() => {
    if (!isLoading) {
      setValue('')
      if (inputRef.current) inputRef.current.focus()
    }

    // Try to scroll on each rerender to the bottom
    setTimeout(
      () => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      },
      isLoading ? 100 : 500
    )
  }, [isLoading])

  return (
    <div className={cn('flex flex-col', className)}>
      <SheetHeader className="flex items-center gap-x-2 py-3">
        <AiIconAnimation
          allowHoverEffect
          className="[&>div>div]:border-black dark:[&>div>div]:border-white"
        />
        <p>Assistant</p>
      </SheetHeader>

      <SheetSection
        className={cn(
          'flex-grow flex flex-col items-center !p-0',
          hasMessages ? 'justify-between' : 'justify-center'
        )}
      >
        {hasMessages && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: ANIMATION_DURATION }}
            className="w-full"
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
                  // isSelected={selectedMessage === m.id}
                  // onDiff={(diffType, sql) => onDiff({ id: m.id, diffType, sql })}
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
            {pendingReply && <Message key="thinking" role="assistant" content="Thinking..." />}
            <div ref={bottomRef} className="h-1" />
          </motion.div>
        )}

        <div className="w-full px-content py-content flex flex-col gap-y-2">
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                exit={{ opacity: 0 }}
                initial={{ opacity: 100 }}
                transition={{ duration: ANIMATION_DURATION }}
              >
                <p className="text-center text-sm text-foreground-light">
                  What
                  {!!entityContext ? (
                    <span className="text-foreground"> {entityContext.name} </span>
                  ) : (
                    ' '
                  )}
                  would you like to create?
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-full border rounded">
            <div className="py-2 px-3 border-b flex gap-x-2">
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
                    <TooltipContent_Shadcn_ side="bottom">
                      Add context for the assistant
                    </TooltipContent_Shadcn_>
                  </Tooltip_Shadcn_>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={showEditor ? 'start' : 'center'} className="w-[310px]">
                  <DropdownMenuLabel>
                    Improve the output quality of the assistant by giving it context about what you
                    need help with
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
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
                        value={selectedEntity}
                        onValueChange={setSelectedEntity}
                      >
                        {ASSISTANT_SUPPORT_ENTITIES.map((x) => (
                          <DropdownMenuRadioItem key={x.id} value={x.id}>
                            {x.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-x-2">
                      <div className="flex flex-col gap-y-1">
                        <p>Schemas</p>
                        <p className="text-foreground-lighter">
                          Share table definitions in the selected schemas
                        </p>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-0">
                      {schemas.map((schema) => (
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
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              {!!entityContext && (
                <div className="border bg-surface-200 rounded px-2 flex items-center justify-between gap-x-2">
                  <div className="flex items-center gap-x-1">
                    <span className="text-foreground-lighter text-xs">Entity</span>
                    <span className="text-xs">{entityContext.label}</span>
                  </div>
                  <X
                    size={12}
                    className="text-foreground-light hover:text-foreground transition cursor-pointer"
                    onClick={() => setSelectedEntity('')}
                  />
                </div>
              )}

              {selectedSchemas.length > 0 && (
                <div className="border bg-surface-200 rounded px-2 flex items-center justify-between gap-x-2">
                  <div className="flex items-center gap-x-1">
                    <span className="text-foreground-lighter text-xs">Schemas</span>
                    <span className="text-xs">{selectedSchemas.join(', ')}</span>
                  </div>
                  <X
                    size={12}
                    className="text-foreground-light hover:text-foreground transition cursor-pointer"
                    onClick={() => setSelectedSchemas([])}
                  />
                </div>
              )}
            </div>

            <AssistantChatForm
              textAreaRef={inputRef}
              className={cn('[&>textarea]:rounded-none [&>textarea]:border-0')}
              loading={isLoading}
              disabled={isLoading}
              placeholder="Some placeholder here"
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
                className="w-full flex items-center gap-x-2"
              >
                <Button type="default" icon={<WandSparkles />}>
                  Suggest
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetSection>
    </div>
  )
}
