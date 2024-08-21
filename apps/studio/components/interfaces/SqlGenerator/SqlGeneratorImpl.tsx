import { AlertTriangle, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEffectOnce } from 'react-use'
import { format } from 'sql-formatter'

import { IS_PLATFORM } from 'common'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AiIconAnimation,
  Button,
  CodeBlock,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  Input_Shadcn_,
  Modal,
  StatusIcon,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import {
  BadgeExperimental,
  generateCommandClassNames,
  useHistoryKeys,
  useQuery,
  useSetQuery,
} from 'ui-patterns/CommandMenu'
import type { UseAiChatOptions } from 'ui-patterns/CommandMenu/prepackaged/ai'
import {
  AiWarning,
  MessageRole,
  MessageStatus,
  useAiChat,
} from 'ui-patterns/CommandMenu/prepackaged/ai'
import type { AiMetadataSkipReason } from './SqlGenerator.Alerts'
import { ExcludeSchemaAlert, IncludeSchemaAlert } from './SqlGenerator.Alerts'
import { SAMPLE_QUERIES, generatePrompt } from './SqlGenerator.utils'
import { SQLOutputActions } from './SqlOutputActions'

function useSchemaMetadataForAi() {
  const isOptedInToAI = useOrgOptedIntoAi()
  const project = useSelectedProject()

  const [schemas] = useSchemasForAi(project?.ref!)
  const includeMetadata = (isOptedInToAI || !IS_PLATFORM) && schemas.length > 0 && !!project

  const metadataSkipReason: AiMetadataSkipReason = !project ? 'no_project' : 'forbidden'

  const { data } = useEntityDefinitionsQuery(
    {
      schemas: schemas,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: includeMetadata }
  )

  const api = useMemo(
    () =>
      includeMetadata
        ? {
            includeMetadata,
            data,
          }
        : { includeMetadata, metadataSkipReason },
    [includeMetadata, data, metadataSkipReason]
  )

  return api
}

function useAiSqlGeneration() {
  const { showGenerateSqlModal } = useAppStateSnapshot()

  const schemaMetadata = useSchemaMetadataForAi()
  const definitions = useMemo(
    () => (schemaMetadata.data ?? []).map((def) => def.sql.trim()).join('\n\n'),
    [schemaMetadata]
  )

  const query = useQuery()
  const setQuery = useSetQuery()
  const [isLoading, setIsLoading] = useState(false)

  const messageTemplate = useCallback<NonNullable<UseAiChatOptions['messageTemplate']>>(
    (message) => generatePrompt(message, schemaMetadata.includeMetadata ? definitions : undefined),
    [schemaMetadata, definitions]
  )
  const { submit, reset, messages, isResponding, hasError } = useAiChat({
    messageTemplate,
    setIsLoading,
  })

  useHistoryKeys({
    enable: showGenerateSqlModal && !isResponding,
    stack: messages.filter(({ role }) => role === MessageRole.User).map(({ content }) => content),
  })

  const handleSubmit = useCallback(
    (message: string) => {
      setQuery('')
      submit(message)
    },
    [setQuery, submit]
  )

  const handleReset = useCallback(() => {
    setQuery('')
    reset()
  }, [setQuery, reset])

  useEffectOnce(() => {
    if (query) handleSubmit(query)
  })

  return {
    query,
    setQuery,
    isLoading,
    isResponding,
    hasError,
    messages,
    handleSubmit,
    handleReset,
    usesMetadata: schemaMetadata.includeMetadata,
    metadataSkipReason: schemaMetadata.metadataSkipReason,
  }
}

export default function SqlGeneratorImpl() {
  const { showGenerateSqlModal, setShowGenerateSqlModal } = useAppStateSnapshot()
  const inputRef = useRef<HTMLInputElement>(null)

  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timeoutHandle.current), [])

  const {
    query,
    setQuery,
    isLoading,
    isResponding,
    hasError,
    messages,
    handleSubmit,
    handleReset,
    usesMetadata,
    metadataSkipReason,
  } = useAiSqlGeneration()

  return (
    <Modal
      header={
        <span className="flex items-center justify-between gap-2">
          Generate SQL
          <BadgeExperimental className="w-fit" />
        </span>
      }
      hideClose
      hideFooter
      visible={showGenerateSqlModal}
      onOpenAutoFocus={() => {
        timeoutHandle.current = setTimeout(() => inputRef.current?.focus())
      }}
      onCancel={() => {
        if (messages.length > 0) {
          handleReset()
          timeoutHandle.current = setTimeout(() => inputRef.current?.focus())
        } else {
          setShowGenerateSqlModal(false)
        }
      }}
      className="w-11/12 !max-w-3xl h-4/5 max-h-[800px] grid-rows-[min-content,_1fr] bg-overlay"
    >
      <Command_Shadcn_ className="p-4">
        <div className="flex-grow overflow-auto">
          {messages.length > 0 && <Messages messages={messages} handleReset={handleReset} />}
          {messages.length === 0 && !hasError && (
            <EmptyState query={query} handleSubmit={handleSubmit} />
          )}
          {hasError && <ErrorMessage handleReset={handleReset} />}
        </div>
        <div className="flex flex-col gap-4">
          {usesMetadata ? (
            <IncludeSchemaAlert />
          ) : (
            <ExcludeSchemaAlert metadataSkipReason={metadataSkipReason} />
          )}
          <Input_Shadcn_
            ref={inputRef}
            className="bg-alternative rounded [&_input]:pr-32 md:[&_input]:pr-40"
            placeholder={
              isLoading || isResponding
                ? 'Waiting on an answer...'
                : 'Describe what you need and Supabase AI will try to generate the relevant SQL statements'
            }
            value={query}
            onChange={(e) => {
              if (!isLoading || !isResponding) {
                setQuery(e.target.value)
              }
            }}
            onKeyDown={(e) => {
              switch (e.key) {
                case 'Enter':
                  if (!query || isLoading || isResponding) {
                    return
                  }
                  return handleSubmit(query)
                default:
                  return
              }
            }}
          />
        </div>
      </Command_Shadcn_>
    </Modal>
  )
}

function Messages({
  messages,
  handleReset,
}: {
  messages: ReturnType<typeof useAiChat>['messages']
  handleReset: () => void
}) {
  function formatAnswer(answer: string) {
    try {
      return format(answer, {
        language: 'postgresql',
        keywordCase: 'lower',
      })
    } catch {
      return answer
    }
  }

  const X_PADDING = 'px-4'

  const UserAvatar = useCallback(() => {
    return (
      <div
        className={cn(
          'w-7 h-7',
          'bg-background rounded-full',
          'border border-muted',
          'flex items-center justify-center',
          'text-foreground-lighter',
          'shadow-sm'
        )}
      >
        <User strokeWidth={1.5} size={16} />
      </div>
    )
  }, [])

  return messages.map((message, i) => {
    switch (message.role) {
      case MessageRole.User:
        return (
          <div className={cn('w-full', 'flex gap-6 mb-6', X_PADDING, '[overflow-anchor:none]')}>
            <UserAvatar />
            <div className="prose text-foreground-light text-sm">{message.content}</div>
          </div>
        )
      case MessageRole.Assistant:
        const unformattedAnswer = message.content
          .replace(/```sql/g, '')
          .replace(/```.*/gs, '')
          .replace(/-- End of SQL query\.*/g, '')
          .trim()

        const answer =
          message.status === MessageStatus.Complete
            ? formatAnswer(unformattedAnswer)
            : unformattedAnswer
        const cantHelp = answer.replace(/^-- /, '') === "Sorry, I don't know how to help with that."

        return (
          <div className={cn('w-full', X_PADDING, '[overflow-anchor:none]')}>
            <div className={cn('w-full', 'flex gap-6 mb-6', '[overflow-anchor:none]')}>
              <AiIconAnimation
                allowHoverEffect
                loading={
                  message.status === MessageStatus.Pending ||
                  message.status === MessageStatus.InProgress
                }
              />
              {message.status === MessageStatus.Pending ? (
                <div className="bg-border-strong h-[21px] w-[13px] mt-1 animate-bounce"></div>
              ) : cantHelp ? (
                <div className="py-6 flex flex-col flex-grow items-center gap-6">
                  <AlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
                  <p className="text-lg text-foreground text-center">
                    Sorry, I don't know how to help with that.
                  </p>
                  <Button size="tiny" type="secondary" onClick={handleReset}>
                    Try again?
                  </Button>
                </div>
              ) : (
                <div className="min-w-0 flex-grow flex flex-col">
                  <CodeBlock
                    hideCopy
                    language="sql"
                    className={cn(
                      'relative',
                      'prose max-w-[initial]',
                      '!mb-0 !rounded-b-none',
                      'bg-surface-100'
                    )}
                  >
                    {answer}
                  </CodeBlock>
                  <AiWarning className="!rounded-t-none border-muted" />
                  {message.status === MessageStatus.Complete && (
                    <SQLOutputActions answer={answer} messages={messages} className="mt-2" />
                  )}
                </div>
              )}
            </div>
          </div>
        )
    }
  })
}

function EmptyState({
  query,
  handleSubmit,
}: {
  query: string
  handleSubmit: (query: string) => void
}) {
  const [activeTab, setActiveTab] = useState(SAMPLE_QUERIES[0].category)

  useEffect(() => {
    function handleSwitchTab(event: KeyboardEvent) {
      if (query || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
        return
      }

      const activeSampleIndex = SAMPLE_QUERIES.findIndex(
        (samples) => samples.category === activeTab
      )!
      const nextIndex =
        event.key === 'ArrowRight'
          ? Math.min(activeSampleIndex + 1, SAMPLE_QUERIES.length - 1)
          : Math.max(0, activeSampleIndex - 1)
      setActiveTab(SAMPLE_QUERIES[nextIndex].category)
    }

    document.addEventListener('keydown', handleSwitchTab)
    return () => document.removeEventListener('keydown', handleSwitchTab)
  }, [query, activeTab])

  return (
    <>
      <h3 className="text-base text-foreground-light">
        Describe what you need and Supabase AI will try to generate the relevant SQL statements
      </h3>
      <p className="text-sm mt-1 text-foreground-light">
        Here are some example prompts to try out:
      </p>
      <hr className="my-4" />
      <Tabs_Shadcn_
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="focus-visible:ring-0"
      >
        <TabsList_Shadcn_ className="gap-4">
          {SAMPLE_QUERIES.map((samples) => (
            <TabsTrigger_Shadcn_ value={samples.category}>{samples.category}</TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>
        <CommandList_Shadcn_>
          {SAMPLE_QUERIES.map((samples) => (
            <TabsContent_Shadcn_ value={samples.category}>
              {samples.queries.map((sampleQuery) => (
                <CommandItem_Shadcn_
                  key={sampleQuery.replace(/\s+/g, '_')}
                  className={generateCommandClassNames(false)}
                  onSelect={() => {
                    if (!query) {
                      handleSubmit(sampleQuery)
                    }
                  }}
                >
                  <AiIconAnimation allowHoverEffect />
                  {sampleQuery}
                </CommandItem_Shadcn_>
              ))}
            </TabsContent_Shadcn_>
          ))}
        </CommandList_Shadcn_>
      </Tabs_Shadcn_>
    </>
  )
}

function ErrorMessage({ handleReset }: { handleReset: () => void }) {
  return (
    <div className="p-6 flex flex-col items-center gap-6 mt-4">
      <StatusIcon variant="warning" />
      <p className="text-sm text-foreground text-center">
        Sorry, looks like Supabase AI is having a hard time!
      </p>
      <p className="text-sm text-foreground-lighter text-center">Please try again in a bit.</p>
      <Button size="tiny" type="default" onClick={handleReset}>
        Try again?
      </Button>
    </div>
  )
}
