import { AlertTriangle, CornerDownLeft, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'sql-formatter'

import { useParams } from 'common'
import {
  AiIconAnimation,
  Button,
  CodeBlock,
  CommandItem_Shadcn_,
  Input,
  Tabs,
  Toggle,
  cn,
} from 'ui'
import {
  CommandWrapper,
  generateCommandClassNames,
  useHistoryKeys,
  useQuery,
  useSetQuery,
} from 'ui-patterns/CommandMenu'
import {
  AiWarning,
  MessageRole,
  MessageStatus,
  type UseAiChatOptions,
  useAiChat,
} from 'ui-patterns/CommandMenu/prepackaged/ai'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useSelectedOrganization } from 'hooks'
import { OPT_IN_TAGS } from 'lib/constants'
import { ExcludeSchemaAlert, IncludeSchemaAlert } from '../Alerts'
import { SAMPLE_QUERIES, generatePrompt } from './GenerateSql.utils'
import { SQLOutputActions } from './SqlOutputActions'

const GenerateSql = () => {
  const { ref } = useParams()

  const selectedOrganization = useSelectedOrganization()
  const opt_in_tags = selectedOrganization?.opt_in_tags
  const isOptedInToAI = opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const { project: selectedProject } = useProjectContext()
  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: isOptedInToAI }
  )
  const definitions = (data ?? []).map((def) => def.sql.trim()).join('\n\n')

  const query = useQuery()
  const setQuery = useSetQuery()

  const [isLoading, setIsLoading] = useState(false)
  const [includeSchemaMetadata, setIncludeSchemaMetadata] = useState(false)

  const allowSendingSchemaMetadata = ref !== undefined && flags?.allowCMDKDataOptIn && isOptedInToAI

  const messageTemplate = useCallback<NonNullable<UseAiChatOptions['messageTemplate']>>(
    (message) =>
      generatePrompt(message, isOptedInToAI && includeSchemaMetadata ? definitions : undefined),
    [isOptedInToAI, includeSchemaMetadata, definitions]
  )

  const { submit, reset, messages, isResponding, hasError } = useAiChat({
    messageTemplate,
    setIsLoading,
  })

  useHistoryKeys({
    enable: !isResponding,
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

  useEffect(() => {
    if (query) handleSubmit(query)
  }, [])

  // Detect an IME composition (so that we can ignore Enter keypress)
  const [isImeComposing, setIsImeComposing] = useState(false)

  const formatAnswer = (answer: string) => {
    try {
      return format(answer, {
        language: 'postgresql',
        keywordCase: 'lower',
      })
    } catch (error: any) {
      return answer
    }
  }

  return (
    <CommandWrapper>
      <div
        className={cn(
          'relative py-4 max-h-[420px] overflow-auto',
          allowSendingSchemaMetadata ? 'mb-[155px]' : 'mb-[64px]'
        )}
      >
        {messages.map((message, i) => {
          switch (message.role) {
            case MessageRole.User:
              return (
                <div className="flex gap-6 mx-4 [overflow-anchor:none] mb-6">
                  <div
                    className="
                      w-7 h-7 bg-background rounded-full border border-muted flex items-center justify-center text-foreground-lighter first-letter:
                      ring-background ring-1 shadow-sm
                    "
                  >
                    <User strokeWidth={1.5} size={16} />
                  </div>
                  <div className="flex items-center prose text-foreground-light text-sm">
                    {message.content}
                  </div>
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
              const cantHelp =
                answer.replace(/^-- /, '') === "Sorry, I don't know how to help with that."

              return (
                <div className="px-4 [overflow-anchor:none] mb-[150px]">
                  <div className="flex gap-6 [overflow-anchor:none] mb-6">
                    <div>
                      <AiIconAnimation
                        allowHoverEffect
                        loading={
                          message.status === MessageStatus.Pending ||
                          message.status === MessageStatus.InProgress
                        }
                      />
                    </div>
                    <>
                      {message.status === MessageStatus.Pending ? (
                        <div className="bg-border-strong h-[21px] w-[13px] mt-1 animate-bounce"></div>
                      ) : cantHelp ? (
                        <div className="p-6 flex flex-col flex-grow items-center gap-6 mt-4">
                          <AlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
                          <p className="text-lg text-foreground text-center">
                            Sorry, I don't know how to help with that.
                          </p>
                          <Button size="tiny" type="secondary" onClick={handleReset}>
                            Try again?
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-grow max-w-[93%]">
                          <div className="-space-y-px">
                            <CodeBlock
                              hideCopy
                              language="sql"
                              className="
                                relative prose bg-surface-100 max-w-none !mb-0
                                !rounded-b-none
                                
                              "
                            >
                              {answer}
                            </CodeBlock>
                            <AiWarning className="!rounded-t-none border-muted" />
                          </div>
                          {message.status === MessageStatus.Complete && (
                            <SQLOutputActions answer={answer} messages={messages.slice(0, i + 1)} />
                          )}
                        </div>
                      )}
                    </>
                  </div>
                </div>
              )
          }
        })}
        {messages.length === 0 && !hasError && (
          <div>
            <div className="px-4">
              <h3 className="text-base text-foreground-light">
                Describe what you need and Supabase AI will try to generate the relevant SQL
                statements
              </h3>
              <p className="text-sm mt-1 text-foreground-light">
                Here are some example prompts to try out:
              </p>
            </div>
            <div className="mt-4 border-t pt-4 ml-4">
              <Tabs type="rounded-pills" size="small">
                {SAMPLE_QUERIES.map((sample) => (
                  <Tabs.Panel
                    key={sample.category}
                    id={sample.category}
                    label={sample.category}
                    className="mt-4"
                  >
                    <div className="mr-8">
                      {SAMPLE_QUERIES.find(
                        (item) => item.category === sample.category
                      )?.queries.map((query) => (
                        <CommandItem_Shadcn_
                          className={generateCommandClassNames(false)}
                          onSelect={() => {
                            if (!query) {
                              handleSubmit(query)
                            }
                          }}
                          onKeyDown={(e) => {
                            switch (e.key) {
                              case 'Enter':
                                if (!query || isLoading || isResponding || isImeComposing) {
                                  return
                                }
                                return handleSubmit(query)
                              default:
                                return
                            }
                          }}
                          key={query.replace(/\s+/g, '_')}
                        >
                          <div className="flex flex-row gap-2">
                            <AiIconAnimation allowHoverEffect />
                            <p>{query}</p>
                          </div>
                        </CommandItem_Shadcn_>
                      ))}
                    </div>
                  </Tabs.Panel>
                ))}
              </Tabs>
            </div>
          </div>
        )}
        {hasError && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4">
            <AlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
            <p className="text-lg text-foreground text-center">
              Sorry, looks like Clippy is having a hard time!
            </p>
            <p className="text-sm text-foreground-muted text-center">Please try again in a bit.</p>
            <Button size="tiny" type="secondary" onClick={handleReset}>
              Try again?
            </Button>
          </div>
        )}
        <div className="[overflow-anchor:auto] h-px w-full"></div>
      </div>

      <div className="absolute bottom-0 w-full bg-background pt-4">
        {/* {messages.length > 0 && !hasError && <AiWarning className="mb-4 mx-4" />} */}
        {allowSendingSchemaMetadata && (
          <div className="mb-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm">
                    Include table names, column names and their corresponding data types in
                    conversation
                  </p>
                  <p className="text-sm text-foreground-light">
                    This will generate answers that are more relevant to your project during the
                    current conversation
                  </p>
                </div>
                <Toggle
                  disabled={!isOptedInToAI || isLoading || isResponding}
                  checked={includeSchemaMetadata}
                  onChange={() => setIncludeSchemaMetadata((prev) => !prev)}
                />
              </div>
            ) : includeSchemaMetadata ? (
              <IncludeSchemaAlert />
            ) : (
              <ExcludeSchemaAlert />
            )}
          </div>
        )}
        <Input
          autoFocus
          className="bg-alternative rounded mx-3 mb-4 [&_input]:pr-32 md:[&_input]:pr-40"
          placeholder={
            isLoading || isResponding
              ? 'Waiting on an answer...'
              : 'Describe what you need and Supabase AI will try to generate the relevant SQL statements'
          }
          value={query}
          actions={
            <>
              {!isLoading && !isResponding ? (
                <div
                  className={`flex items-center gap-3 mr-3 transition-opacity duration-700 ${
                    query ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span className="text-foreground-light">Submit message</span>
                  <div className="hidden text-foreground-light md:flex items-center justify-center h-6 w-6 rounded bg-overlay-hover">
                    <CornerDownLeft size={12} strokeWidth={1.5} />
                  </div>
                </div>
              ) : null}
            </>
          }
          onChange={(e) => {
            if (!isLoading || !isResponding) {
              setQuery(e.target.value)
            }
          }}
          onCompositionStart={() => setIsImeComposing(true)}
          onCompositionEnd={() => setIsImeComposing(false)}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'Enter':
                if (!query || isLoading || isResponding || isImeComposing) {
                  return
                }
                return handleSubmit(query)
              default:
                return
            }
          }}
        />
      </div>
    </CommandWrapper>
  )
}

export { GenerateSql }
