import { SSE } from 'sse.js'
import { format } from 'sql-formatter'
import type { CreateCompletionResponse } from 'openai'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  Button,
  CodeBlock,
  IconAlertTriangle,
  IconCornerDownLeft,
  IconUser,
  Input,
  Toggle,
} from 'ui'

import { cn } from '../../../utils/cn'
import { AiIcon, AiIconChat } from '../Command.icons'
import { CommandItem } from '../Command.utils'
import { useCommandMenu } from '../CommandMenuProvider'
import { SAMPLE_QUERIES } from '../Command.constants'
import SQLOutputActions from './SQLOutputActions'
import { getEdgeFunctionUrl, promptDataReducer, generatePrompt } from './GenerateSQL.utils'

const GenerateSQL = () => {
  const [promptIndex, setPromptIndex] = useState(0)
  const [_, setAnswer] = useState<string | undefined>('')
  const [isResponding, setIsResponding] = useState(false)
  const [hasClippyError, setHasClippyError] = useState(false)
  const [includeSchemaMetadata, setIncludeSchemaMetadata] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(SAMPLE_QUERIES[0].category)

  const eventSourceRef = useRef<SSE>()
  const [promptData, dispatchPromptData] = useReducer(promptDataReducer, [])
  const { isLoading, setIsLoading, search, setSearch, isOptedInToAI, metadata, project } =
    useCommandMenu()

  const { flags } = metadata || {}
  const allowSendingSchemaMetadata =
    project?.ref !== undefined && flags?.allowCMDKDataOptIn && isOptedInToAI

  const handleConfirm = useCallback(
    async (query: string) => {
      const edgeFunctionUrl = getEdgeFunctionUrl()

      if (!edgeFunctionUrl) {
        return console.error('No edge function url')
      }

      setAnswer(undefined)
      setSearch('')
      dispatchPromptData({ index: promptIndex, answer: undefined, query })
      setIsResponding(false)
      setHasClippyError(false)
      setIsLoading(true)

      const queryToSend = generatePrompt(
        query,
        isOptedInToAI && includeSchemaMetadata ? metadata : undefined
      )
      const eventSource = new SSE(`${edgeFunctionUrl}/clippy-search`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({ query: queryToSend, context: promptData }),
      })

      function handleError<T>(err: T) {
        setIsLoading(false)
        setIsResponding(false)
        setHasClippyError(true)
        console.error(err)
      }

      eventSource.addEventListener('error', handleError)
      eventSource.addEventListener('message', (e: any) => {
        try {
          setIsLoading(false)
          if (e.data === '[DONE]') {
            setIsResponding(false)
            setAnswer(undefined)
            setPromptIndex((x) => {
              return x + 1
            })
            return
          }
          setIsResponding(true)

          const completionResponse: CreateCompletionResponse = JSON.parse(e.data)
          const [{ text: content }] = completionResponse.choices
          const text = content ?? ''

          setAnswer((answer) => {
            const currentAnswer = answer ?? ''
            dispatchPromptData({ index: promptIndex, answer: currentAnswer + text })
            return (answer ?? '') + text
          })
        } catch (err) {
          handleError(err)
        }
      })

      eventSource.stream()
      eventSourceRef.current = eventSource
      setIsLoading(true)
    },
    [promptIndex, promptData]
  )

  function handleResetPrompt() {
    eventSourceRef.current?.close()
    eventSourceRef.current = undefined
    setSearch('')
    setAnswer(undefined)
    setIsResponding(false)
    setHasClippyError(false)
  }

  useEffect(() => {
    if (search) {
      handleConfirm(search)
    }
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

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div
        className={cn(
          'relative py-4 max-h-[720px] overflow-auto',
          allowSendingSchemaMetadata ? 'mb-[83px]' : 'mb-[42px]'
        )}
      >
        {promptData.map((prompt, i) => {
          if (!prompt.query) return <></>

          const formattedPromptAnwswer = (prompt?.answer ?? '')
            .replace(/`/g, '')
            .replace(/sql\n/g, '')
            .trim()
          const promptAnswer = isResponding
            ? formattedPromptAnwswer
            : formatAnswer(formattedPromptAnwswer)

          const cantHelp = (prompt?.answer ?? '').includes(
            "Sorry, I don't know how to help with that."
          )

          return (
            <>
              {prompt.query && (
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
                    {prompt.query}
                  </div>
                </div>
              )}

              <div className="px-4 [overflow-anchor:none] mb-6">
                <div className="flex gap-6 [overflow-anchor:none] mb-6">
                  <div>
                    <AiIconChat />
                  </div>
                  <>
                    {isLoading && promptIndex === i ? (
                      <div className="bg-scale-700 h-[21px] w-[13px] mt-1 animate-bounce"></div>
                    ) : (
                      <div className="space-y-2 flex-grow max-w-[93%]">
                        <CodeBlock
                          hideCopy
                          language="sql"
                          className="relative prose dark:prose-dark bg-scale-300 max-w-none"
                        >
                          {promptAnswer}
                        </CodeBlock>

                        {!isResponding && !cantHelp && <SQLOutputActions answer={prompt.answer} />}
                      </div>
                    )}
                  </>
                </div>
              </div>
            </>
          )
        })}
        {promptData.length === 0 && !hasClippyError && (
          <div>
            <div className="px-10">
              <h3>Example queries</h3>
              <p className="text-sm text-scale-1100">
                Use these example queries to help get your project started quickly.
              </p>
            </div>
            <div className="flex mt-4 border-t pt-2">
              <div className="w-1/3 py-4 px-6">
                <ul className="space-y-2">
                  {SAMPLE_QUERIES.map((item, index) => (
                    <li
                      key={index}
                      onClick={() => setSelectedCategory(item.category)}
                      className={cn(
                        'px-4 py-1 cursor-pointer text-sm hover:bg-slate-300 rounded-md',
                        selectedCategory === item.category && 'bg-slate-400 '
                      )}
                    >
                      {item.category}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-2/3 py-4 px-6">
                <ul>
                  {SAMPLE_QUERIES.find((item) => item.category === selectedCategory)?.queries.map(
                    (query) => (
                      <CommandItem
                        type="command"
                        onSelect={() => {
                          if (!search) handleConfirm(query)
                        }}
                        forceMount
                        key={query.replace(/\s+/g, '_')}
                      >
                        <div className="flex">
                          <div>
                            <AiIcon />
                          </div>
                          <p>{query}</p>
                        </div>
                      </CommandItem>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {hasClippyError && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4">
            <IconAlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
            <p className="text-lg text-scale-1200 text-center">
              Sorry, looks like Clippy is having a hard time!
            </p>
            <p className="text-sm text-scale-900 text-center">Please try again in a bit.</p>
            <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
              Try again?
            </Button>
          </div>
        )}

        <div className="[overflow-anchor:auto] h-px w-full"></div>
      </div>
      <div className="absolute bottom-0 w-full bg-scale-200 py-3">
        {allowSendingSchemaMetadata && (
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <p className="text-sm">
                Include table names, column names and their corresponding data types in prompt
              </p>
              <p className="text-sm text-scale-1100">
                This will generate answers that are more relevant to your project's schema
              </p>
            </div>
            <Toggle
              disabled={!isOptedInToAI}
              checked={includeSchemaMetadata}
              onChange={() => setIncludeSchemaMetadata(!includeSchemaMetadata)}
            />
          </div>
        )}
        <Input
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
                return handleConfirm(search)
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
