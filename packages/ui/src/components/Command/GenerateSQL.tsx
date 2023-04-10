import { SSE } from 'sse.js'
import { format } from 'sql-formatter'
import type { CreateCompletionResponse } from 'openai'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  Button,
  CodeBlock,
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconClipboard,
  IconCornerDownLeft,
  IconSave,
  IconUser,
  Input,
} from 'ui'

import { cn } from './../../utils/cn'
import { AiIcon, AiIconChat } from './Command.icons'
import { CommandItem } from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'
import CopyToClipboard from 'react-copy-to-clipboard'
import { SAMPLE_QUERIES } from './Command.constants'

function getEdgeFunctionUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

  if (!supabaseUrl) return undefined

  // https://github.com/supabase/supabase-js/blob/10d3423506cbd56345f7f6ab2ec2093c8db629d4/src/SupabaseClient.ts#L96
  const isPlatform = supabaseUrl.match(/(supabase\.co)|(supabase\.in)/)

  if (isPlatform) {
    const [schemeAndProjectId, domain, tld] = supabaseUrl.split('.')
    return `${schemeAndProjectId}.functions.${domain}.${tld}`
  } else {
    return `${supabaseUrl}/functions/v1`
  }
}

function promptDataReducer(
  state: any[],
  action: {
    index?: number
    answer?: string | undefined
    status?: string
    query?: string | undefined
    type?: 'remove-last-item' | string
  }
) {
  // set a standard state to use later
  let current = [...state]

  if (action.type) {
    switch (action.type) {
      case 'remove-last-item':
        current.pop()
        return [...current]
      default:
        break
    }
  }

  // check that an index is present
  if (action.index === undefined) return [...state]

  if (!current[action.index]) {
    current[action.index] = { query: '', answer: '', status: '' }
  }

  current[action.index].answer = action.answer

  if (action.query) {
    current[action.index].query = action.query
  }
  if (action.status) {
    current[action.index].status = action.status
  }

  return [...current]
}

const SQLOutputActions = ({ answer }: { answer: string }) => {
  const [showCopied, setShowCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const { project, onSaveGeneratedSQL } = useCommandMenu()

  const applyCallback = () =>
    onSaveGeneratedSQL !== undefined
      ? new Promise((resolve) => onSaveGeneratedSQL(answer, resolve))
      : {}

  const onSelectSaveSnippet = async () => {
    setIsSaving(true)
    await applyCallback()
    setIsSaved(true)
    setIsSaving(false)
  }

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  useEffect(() => {
    if (!isSaved) return
    const timer = setTimeout(() => setIsSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [isSaved])

  return (
    <div className="flex items-center justify-end space-x-2">
      <CopyToClipboard text={answer?.replace(/```.*/g, '').trim()}>
        <Button
          type="default"
          icon={
            showCopied ? (
              <IconCheck size="tiny" className="text-brand-900" strokeWidth={2} />
            ) : (
              <IconClipboard size="tiny" />
            )
          }
          onClick={() => setShowCopied(true)}
        >
          {showCopied ? 'Copied' : 'Copy SQL'}
        </Button>
      </CopyToClipboard>
      {project?.ref !== undefined && onSaveGeneratedSQL !== undefined && (
        <Button
          type="default"
          loading={isSaving}
          disabled={isSaving}
          icon={
            isSaved ? (
              <IconCheck size="tiny" className="text-brand-900" strokeWidth={2} />
            ) : (
              <IconSave size="tiny" />
            )
          }
          onClick={() => onSelectSaveSnippet()}
        >
          {isSaved ? 'Snippet saved!' : 'Save into new snippet'}
        </Button>
      )}
    </div>
  )
}

const GenerateSQL = () => {
  const [promptIndex, setPromptIndex] = useState(0)
  const [answer, setAnswer] = useState<string | undefined>('')
  const [isResponding, setIsResponding] = useState(false)
  const [hasClippyError, setHasClippyError] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(SAMPLE_QUERIES[0].category)

  const eventSourceRef = useRef<SSE>()
  const [promptData, dispatchPromptData] = useReducer(promptDataReducer, [])
  const { isLoading, setIsLoading, search, setSearch } = useCommandMenu()

  const cantHelp = answer?.trim() === "Sorry, I don't know how to help with that."

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

      // [Joshen] Eventually we need to pass the table data in here as well
      const queryToSend = `
Generate a Postgres SQL query based on the following natural language prompt. For primary keys, always use "integer primary key generated always as identity":
${query}

Postgres SQL query:
`.trim()

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
      <div className={cn('relative mb-[62px] py-4 max-h-[720px] overflow-auto')}>
        {promptData.map((prompt, i) => {
          if (!prompt.query) return <></>

          const formattedPromptAnwswer = (prompt?.answer ?? '')
            .replace(/`/g, '')
            .replace(/sql\n/g, '')
            .trim()
          const promptAnswer = isResponding
            ? formattedPromptAnwswer
            : formatAnswer(formattedPromptAnwswer)

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
                  <div className="prose text-scale-1000">{prompt.query}</div>
                </div>
              )}

              <div className="px-4 [overflow-anchor:none] mb-6">
                {cantHelp ? (
                  <p className="flex flex-col gap-4 items-center p-4">
                    <div className="grid md:flex items-center gap-2 mt-4 text-center justify-items-center">
                      <IconAlertCircle />
                      <p>Sorry, I don&apos;t know how to help with that.</p>
                    </div>
                    <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
                      Try again?
                    </Button>
                  </p>
                ) : (
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
                          {!isResponding && <SQLOutputActions answer={prompt.answer} />}
                        </div>
                      )}
                    </>
                  </div>
                )}
              </div>
            </>
          )
        })}
        {promptData.length === 0 && !hasClippyError && (
          <div>
            <div className="px-10">
              <h3>Example queries</h3>
              <p className="text-sm mt-1 text-scale-1100">
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
                    (query, index) => (
                      <CommandItem
                        type="command"
                        onSelect={() => {
                          if (!search) {
                            handleConfirm(query)
                          }
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
                if (!search) {
                  return
                }
                if (isLoading || isResponding) {
                  return
                }
                handleConfirm(search)
                return
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
