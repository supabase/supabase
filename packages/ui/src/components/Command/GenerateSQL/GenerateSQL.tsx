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
  MessageRole,
  MessageStatus,
  useAiChat,
} from 'ui'

import { cn } from '../../../utils/cn'
import { AiIcon, AiIconChat } from '../Command.icons'
import { CommandItem } from '../Command.utils'
import { useCommandMenu } from '../CommandMenuProvider'
import { SAMPLE_QUERIES } from '../Command.constants'
import SQLOutputActions from './SQLOutputActions'
import { generatePrompt } from './GenerateSQL.utils'

const GenerateSQL = () => {
  // [Joshen] Temp hack to ensure that generatePrompt receives updated value
  // of includeSchemaMetadata, needs to be fixed
  const includeSchemaMetadataRef = useRef<any>()

  const [includeSchemaMetadata, setIncludeSchemaMetadata] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(SAMPLE_QUERIES[0].category)

  const { isLoading, setIsLoading, search, setSearch, isOptedInToAI, metadata, project } =
    useCommandMenu()

  const { flags, definitions } = metadata || {}
  const allowSendingSchemaMetadata =
    project?.ref !== undefined && flags?.allowCMDKDataOptIn && isOptedInToAI

  const { submit, reset, messages, isResponding, hasError } = useAiChat({
    messageTemplate: (message) => {
      // [Joshen] Only pass the schema metadata at the start of the conversation if opted in
      // Since the prompts are contextualized to the conversation, no need to keep sending it
      return generatePrompt(
        message,
        isOptedInToAI && includeSchemaMetadataRef.current && messages.length === 0
          ? definitions
          : undefined
      )
    },
    setIsLoading,
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
    includeSchemaMetadataRef.current = includeSchemaMetadata
  }, [])

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

  const handleKeypress = (e, category) => {
    //it triggers by pressing the enter key
    if (e.keyCode === 13) {
      setSelectedCategory(category)
      // focus on the first item in the list after selecting a category
      const firstItem = document.querySelector('.command-menu-item')
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div
        className={cn(
          'relative py-4 max-h-[550px] overflow-auto',
          allowSendingSchemaMetadata ? 'mb-[83px]' : 'mb-[42px]'
        )}
      >
        {messages.map((message, i) => {
          switch (message.role) {
            case MessageRole.User:
              return (
                <div className="flex gap-6 mx-4 [overflow-anchor:none] mb-6">
                  <div
                    className="
                      w-7 h-7 bg-scale-200 rounded-full border border-scale-400 flex items-center justify-center text-scale-1000 first-letter:
                      ring-scale-200 ring-1 shadow-sm
                    "
                  >
                    <IconUser strokeWidth={1.5} size={16} />
                  </div>
                  <div className="flex items-center prose text-scale-1100 text-sm">
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
              const cantHelp = answer === "Sorry, I don't know how to help with that."

              return (
                <div className="px-4 [overflow-anchor:none] mb-6">
                  <div className="flex gap-6 [overflow-anchor:none] mb-6">
                    <div>
                      <AiIconChat />
                    </div>
                    <>
                      {message.status === MessageStatus.Pending ? (
                        <div className="bg-scale-700 h-[21px] w-[13px] mt-1 animate-bounce"></div>
                      ) : cantHelp ? (
                        <div className="p-6 flex flex-col flex-grow items-center gap-6 mt-4">
                          <IconAlertTriangle
                            className="text-amber-900"
                            strokeWidth={1.5}
                            size={21}
                          />
                          <p className="text-lg text-scale-1200 text-center">
                            Sorry, I don't know how to help with that.
                          </p>
                          <Button size="tiny" type="secondary" onClick={handleReset}>
                            Try again?
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-grow max-w-[93%]">
                          <CodeBlock
                            hideCopy
                            language="sql"
                            className="relative prose dark:prose-dark bg-scale-300 max-w-none"
                          >
                            {answer}
                          </CodeBlock>
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
            <div className="px-10">
              <h3>
                Describe what you need and Supabase AI will try to generate the relevant SQL
                statements
              </h3>
              <p className="text-sm mt-1 text-scale-1100">
                Here are some example prompts to try out.
              </p>
            </div>
            <div className="flex mt-4 border-t pt-2">
              <div className="w-1/3 py-4 px-6">
                <ul className="space-y-2">
                  {SAMPLE_QUERIES.map((item, index) => (
                    <li key={index}>
                      <button
                        className={cn(
                          'px-4 py-1 cursor-pointer text-sm hover:bg-slate-300 rounded-md block w-full text-left',
                          selectedCategory === item.category && 'bg-slate-400 '
                        )}
                        type="button"
                        onClick={() => setSelectedCategory(item.category)}
                        onKeyDown={(e) => handleKeypress(e, item.category)}
                      >
                        {item.category}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-2/3 py-4 px-6">
                <ul>
                  {SAMPLE_QUERIES.find((item) => item.category === selectedCategory)?.queries.map(
                    (query, index) => (
                      <button
                        onClick={() => {
                          if (!search) {
                            handleSubmit(query)
                          }
                        }}
                        key={query.replace(/\s+/g, '_')}
                        type="button"
                      >
                        <div className="flex">
                          <div>
                            <AiIcon />
                          </div>
                          {query}
                        </div>
                      </button>
                      // <CommandItem
                      //   type="command"
                      //   onSelect={() => {
                      //     if (!search) {
                      //       handleSubmit(query)
                      //     }
                      //   }}
                      //   forceMount
                      //   key={query.replace(/\s+/g, '_')}
                      // >
                      //   <div className="flex">
                      //     <div>
                      //       <AiIcon />
                      //     </div>
                      //     <p>
                      //       <button type="button">{query}</button>
                      //     </p>
                      //   </div>
                      // </CommandItem>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {hasError && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4">
            <IconAlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
            <p className="text-lg text-scale-1200 text-center">
              Sorry, looks like Clippy is having a hard time!
            </p>
            <p className="text-sm text-scale-900 text-center">Please try again in a bit.</p>
            <Button size="tiny" type="secondary" onClick={handleReset}>
              Try again?
            </Button>
          </div>
        )}

        <div className="[overflow-anchor:auto] h-px w-full"></div>
      </div>

      <div className="absolute bottom-0 w-full bg-scale-200 py-3">
        {allowSendingSchemaMetadata && (
          <>
            {messages.length === 0 ? (
              <div className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm">
                    Include table names, column names and their corresponding data types in
                    conversation
                  </p>
                  <p className="text-sm text-scale-1100">
                    This will generate answers that are more relevant to your project during the
                    current conversation
                  </p>
                </div>
                <Toggle
                  disabled={!isOptedInToAI || isLoading || isResponding}
                  checked={includeSchemaMetadata}
                  onChange={() =>
                    setIncludeSchemaMetadata((prev) => {
                      includeSchemaMetadataRef.current = !prev
                      return !prev
                    })
                  }
                />
              </div>
            ) : (
              <div className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm">
                    Table names, column names and their corresponding data types{' '}
                    <span
                      className={cn(includeSchemaMetadata ? 'text-brand-900' : 'text-amber-900')}
                    >
                      {includeSchemaMetadata ? 'are' : 'are not'} included
                    </span>{' '}
                    in this conversation
                  </p>
                  <p className="text-sm text-scale-1100">
                    Start a new conversation to change this configuration
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        <Input
          inputRef={(inputElement) => {
            if (inputElement) {
              // We need to delay the focus until the end of the call stack
              // due to order of operations
              setTimeout(() => {
                inputElement.focus()
              }, 0)
            }
          }}
          className="bg-scale-100 rounded mx-3"
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
                  <span className="text-scale-1100">Submit message</span>
                  <div className="hidden text-scale-1100 md:flex items-center justify-center h-6 w-6 rounded bg-scale-500">
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
          onKeyDown={(e) => {
            switch (e.key) {
              case 'Enter':
                if (!search || isLoading || isResponding) return
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
