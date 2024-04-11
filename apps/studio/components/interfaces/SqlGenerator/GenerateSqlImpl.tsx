import { AlertTriangle, CornerDownLeft, User } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useEffectOnce } from 'react-use'
import { format } from 'sql-formatter'

import { IS_PLATFORM } from 'common'
import {
  AiIconAnimation,
  Button,
  CodeBlock,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  Input,
  Modal,
  Tabs,
  cn,
} from 'ui'
import {
  BadgeExperimental,
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
import { useLocalStorageQuery, useSelectedOrganization } from 'hooks'
import { LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { ExcludeSchemaAlert, IncludeSchemaAlert } from './GenerateSql.Alerts'
import { SAMPLE_QUERIES, generatePrompt } from './GenerateSql.utils'
import { SQLOutputActions } from './SqlOutputActions'
import { useAppStateSnapshot } from 'state/app-state'

const useSchemaMetadataForAi = () => {
  /**
   * `isOptedInToAI` checks whether the organization has opted into sending
   * schema metadata to AI.
   */
  const selectedOrganization = useSelectedOrganization()
  const opt_in_tags = selectedOrganization?.opt_in_tags
  const isOptedInToAI = opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  /**
   * Only query for the schema metdata if the org is opted into AI.
   */
  // Doesn't work because not provided within the project context
  const { project: selectedProject } = useProjectContext()
  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: isOptedInToAI }
  )

  /**
   * There's also an individual option through the AISettingsModal to opt into
   * AI on a per-user basis. This needs to be combined with the org-level
   * setting to decide whether to send the schema.
   */
  const [hasEnabledAISchema] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA, true)
  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  return {
    includeSchemaMetadata,
    data,
  }
}

const GenerateSql = () => {
  const { showGenerateSqlModal, setShowGenerateSqlModal } = useAppStateSnapshot()

  const { includeSchemaMetadata, data } = useSchemaMetadataForAi()
  const definitions = (data ?? []).map((def) => def.sql.trim()).join('\n\n')

  const query = useQuery()
  const setQuery = useSetQuery()

  const [isLoading, setIsLoading] = useState(false)

  const messageTemplate = useCallback<NonNullable<UseAiChatOptions['messageTemplate']>>(
    (message) => generatePrompt(message, includeSchemaMetadata ? definitions : undefined),
    [includeSchemaMetadata, definitions]
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
    <Modal
      hideFooter
      header="Generate SQL"
      visible={showGenerateSqlModal}
      onCancel={() => setShowGenerateSqlModal(false)}
      className="w-11/12 !max-w-[50rem]"
    >
      <Command_Shadcn_ className="p-4">
        <BadgeExperimental className="w-fit mb-4" />
        <div className={cn('h-[min(720px,45dvh)] max-h-[min(720px,45dvh)] overflow-auto')}>
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
                              <SQLOutputActions
                                answer={answer}
                                messages={messages.slice(0, i + 1)}
                              />
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
            <>
              <h3 className="text-base text-foreground-light">
                Describe what you need and Supabase AI will try to generate the relevant SQL
                statements
              </h3>
              <p className="text-sm mt-1 text-foreground-light">
                Here are some example prompts to try out:
              </p>
              <hr className="my-4" />
              <CommandList_Shadcn_>
                <Tabs type="rounded-pills" size="small">
                  {SAMPLE_QUERIES.map((sample) => (
                    <Tabs.Panel key={sample.category} id={sample.category} label={sample.category}>
                      {SAMPLE_QUERIES.find(
                        (item) => item.category === sample.category
                      )?.queries.map((sampleQuery) => (
                        <CommandItem_Shadcn_
                          className={generateCommandClassNames(false)}
                          onSelect={() => {
                            if (!query) {
                              handleSubmit(sampleQuery)
                            }
                          }}
                          onKeyDown={(e) => {
                            switch (e.key) {
                              case 'Enter':
                                if (query || isLoading || isResponding || isImeComposing) {
                                  return
                                }
                                return handleSubmit(sampleQuery)
                              default:
                                return
                            }
                          }}
                          key={sampleQuery.replace(/\s+/g, '_')}
                        >
                          <AiIconAnimation allowHoverEffect />
                          {sampleQuery}
                        </CommandItem_Shadcn_>
                      ))}
                    </Tabs.Panel>
                  ))}
                </Tabs>
              </CommandList_Shadcn_>
            </>
          )}
          {hasError && (
            <div className="p-6 flex flex-col items-center gap-6 mt-4">
              <AlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
              <p className="text-lg text-foreground text-center">
                Sorry, looks like Clippy is having a hard time!
              </p>
              <p className="text-sm text-foreground-muted text-center">
                Please try again in a bit.
              </p>
              <Button size="tiny" type="secondary" onClick={handleReset}>
                Try again?
              </Button>
            </div>
          )}
          <div className="[overflow-anchor:auto] h-px w-full"></div>
        </div>

        <div className="flex flex-col gap-4">
          {includeSchemaMetadata ? <IncludeSchemaAlert /> : <ExcludeSchemaAlert />}
          <Input
            autoFocus
            className="bg-alternative rounded [&_input]:pr-32 md:[&_input]:pr-40"
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
      </Command_Shadcn_>
    </Modal>
  )
}

export default GenerateSql
