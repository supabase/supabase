import React from 'react'
import { format } from 'sql-formatter'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  CodeBlock,
  IconAlertTriangle,
  IconCornerDownLeft,
  IconUser,
  Input,
  Toggle,
  Tabs,
} from 'ui'
import { MessageRole, MessageStatus, useAiChat, UseAiChatOptions } from './../AiCommand'

import { cn } from 'ui/src/lib/utils'
import { AiIcon, AiIconChat } from '../Command.icons'
import { CommandItem, useAutoInputFocus, useHistoryKeys } from '../Command.utils'
import { useCommandMenu } from '../CommandMenuProvider'
import { SAMPLE_QUERIES } from '../Command.constants'
import SQLOutputActions from './SQLOutputActions'
import { generatePrompt } from './GenerateSQL.utils'
import { ExcludeSchemaAlert, IncludeSchemaAlert, AiWarning } from '../Command.alerts'

const GenerateSQL = () => {
  const [includeSchemaMetadata, setIncludeSchemaMetadata] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(SAMPLE_QUERIES[0].category)

  const { isLoading, setIsLoading, search, setSearch, isOptedInToAI, metadata, project } =
    useCommandMenu()

  const { flags, definitions } = metadata || {}
  const allowSendingSchemaMetadata =
    project?.ref !== undefined && flags?.allowCMDKDataOptIn && isOptedInToAI

  const messageTemplate = useCallback<NonNullable<UseAiChatOptions['messageTemplate']>>(
    (message) =>
      generatePrompt(message, isOptedInToAI && includeSchemaMetadata ? definitions : undefined),
    [isOptedInToAI, includeSchemaMetadata, definitions]
  )

  const { submit, reset, messages, isResponding, hasError } = useAiChat({
    messageTemplate,
    setIsLoading,
  })

  const inputRef = useAutoInputFocus()

  useHistoryKeys({
    enable: !isResponding,
    messages: messages
      .filter(({ role }) => role === MessageRole.User)
      .map(({ content }) => content),
    setPrompt: setSearch,
  })

  const handleSubmit = useCallback(
    (message: string) => {
      setSearch('')
      submit(message)
    },
    [submit]
  )

  const handleReset = useCallback(() => {
    setSearch('')
    reset()
  }, [reset])

  useEffect(() => {
    if (search) handleSubmit(search)
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
    <div onClick={(e) => e.stopPropagation()}>
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
                    <IconUser strokeWidth={1.5} size={16} />
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
                      <AiIconChat
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
                          <IconAlertTriangle
                            className="text-amber-900"
                            strokeWidth={1.5}
                            size={21}
                          />
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
                        <CommandItem
                          type="command"
                          onSelect={() => {
                            if (!search) {
                              handleSubmit(query)
                            }
                          }}
                          onKeyDown={(e) => {
                            switch (e.key) {
                              case 'Enter':
                                if (!search || isLoading || isResponding || isImeComposing) {
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
                            <AiIcon />
                            <p>{query}</p>
                          </div>
                        </CommandItem>
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
            <IconAlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
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
          inputRef={inputRef}
          className="bg-alternative rounded mx-3 mb-4 [&_input]:pr-32 md:[&_input]:pr-40"
          autoFocus
          placeholder={
            isLoading || isResponding
              ? 'Waiting on an answer...'
              : 'Describe what you need and Supabase AI will try to generate the relevant SQL statements'
          }
          value={search}
          actions={
            <>
              {!isLoading && !isResponding ? (
                <div
                  className={`flex items-center gap-3 mr-3 transition-opacity duration-700 ${
                    search ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span className="text-foreground-light">Submit message</span>
                  <div className="hidden text-foreground-light md:flex items-center justify-center h-6 w-6 rounded bg-overlay-hover">
                    <IconCornerDownLeft size={12} strokeWidth={1.5} />
                  </div>
                </div>
              ) : null}
            </>
          }
          onChange={(e) => {
            if (!isLoading || !isResponding) {
              setSearch(e.target.value)
            }
          }}
          onCompositionStart={() => setIsImeComposing(true)}
          onCompositionEnd={() => setIsImeComposing(false)}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'Enter':
                if (!search || isLoading || isResponding || isImeComposing) {
                  return
                }
                return handleSubmit(search)
              default:
                return
            }
          }}
        />
      </div>
    </div>
  )
}

export default GenerateSQL
