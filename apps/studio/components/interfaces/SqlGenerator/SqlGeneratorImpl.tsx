import { AlertTriangle, CornerDownLeft, User } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useEffectOnce } from 'react-use'
import { format } from 'sql-formatter'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useAllowSendAiSchema } from 'hooks/misc/useAllowSendAiSchema'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AiIconAnimation,
  Button,
  CodeBlock,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  Modal,
  StatusIcon,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  cn,
} from 'ui'
import {
  BadgeExperimental,
  generateCommandClassNames,
  useHistoryKeys,
  useQuery,
  useSetQuery,
} from 'ui-patterns/CommandMenu'
import { InputCheckComposition } from 'ui-patterns/InputCheckComposition'
import type { UseAiChatOptions } from 'ui-patterns/CommandMenu/prepackaged/ai'
import {
  AiWarning,
  MessageRole,
  MessageStatus,
  useAiChat,
} from 'ui-patterns/CommandMenu/prepackaged/ai'
import { ExcludeSchemaAlert, IncludeSchemaAlert } from './SqlGenerator.Alerts'
import { generatePrompt, SAMPLE_QUERIES } from './SqlGenerator.utils'
import { SQLOutputActions } from './SqlOutputActions'

function useSchemaMetadataForAi() {
  const allowed = useAllowSendAiSchema()
  const { project: selectedProject } = useProjectContext()

  const includeMetadata = allowed && !!selectedProject
  const metadataSkipReason = !allowed ? 'forbidden' : ('missing_project' as const)

  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
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
  }
}

export default function SqlGeneratorImpl() {
  const { showGenerateSqlModal, setShowGenerateSqlModal } = useAppStateSnapshot()

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
  } = useAiSqlGeneration()

  return (
    <Modal
      header="Generate SQL"
      hideFooter
      visible={showGenerateSqlModal}
      onCancel={() => setShowGenerateSqlModal(false)}
      className="w-11/12 !max-w-3xl"
    >
      <Command_Shadcn_ className="p-4">
        <BadgeExperimental className="w-fit mb-4" />
        <div className={cn('h-[min(800px,60dvh)] max-h-[min(800px,60dvh)] overflow-auto')}>
          {messages.length > 0 && <Messages messages={messages} handleReset={handleReset} />}
          {messages.length === 0 && !hasError && (
            <EmptyState query={query} handleSubmit={handleSubmit} />
          )}
          {hasError && <ErrorMessage handleReset={handleReset} />}
        </div>
        <div className="flex flex-col gap-4">
          {usesMetadata ? <IncludeSchemaAlert /> : <ExcludeSchemaAlert />}
          <InputCheckComposition
            autoFocus
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
          <div className={cn('flex gap-6 mb-6', X_PADDING, '[overflow-anchor:none]')}>
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
          <div className={cn('mb-[150px]', '[overflow-anchor:none]', X_PADDING)}>
            <div className={cn('flex gap-6 mb-6', '[overflow-anchor: none')}>
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
                <div className="flex-grow gap-y-2">
                  <CodeBlock
                    hideCopy
                    language="sql"
                    className={cn(
                      'relative',
                      'prose max-w-none',
                      '!mb-0 !rounded-b-none',
                      'bg-surface-100'
                    )}
                  >
                    {answer}
                  </CodeBlock>
                  <AiWarning className="!rounded-t-none border-muted" />
                  {message.status === MessageStatus.Complete && (
                    <SQLOutputActions answer={answer} messages={messages} />
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
  const sampleCategories = [...new Set(SAMPLE_QUERIES.map((sample) => sample.category))]

  return (
    <>
      <h3 className="text-base text-foreground-light">
        Describe what you need and Supabase AI will try to generate the relevant SQL statements
      </h3>
      <p className="text-sm mt-1 text-foreground-light">
        Here are some example prompts to try out:
      </p>
      <hr className="my-4" />
      <CommandList_Shadcn_>
        <Tabs_Shadcn_ defaultValue={sampleCategories[0]}>
          <TabsList_Shadcn_>
            {sampleCategories.map((category) => (
              <TabsTrigger_Shadcn_ value={category} />
            ))}
          </TabsList_Shadcn_>
          {sampleCategories.map((category) => (
            <TabsContent_Shadcn_ value={category}>
              {SAMPLE_QUERIES.find((item) => item.category === category)?.queries.map(
                (sampleQuery) => (
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
                )
              )}
            </TabsContent_Shadcn_>
          ))}
        </Tabs_Shadcn_>
      </CommandList_Shadcn_>
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
