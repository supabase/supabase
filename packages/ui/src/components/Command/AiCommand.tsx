import type {
  ChatCompletionResponseMessage,
  CreateChatCompletionResponse,
  CreateChatCompletionResponseChoicesInner,
} from 'openai'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SSE } from 'sse.js'

import { Button, IconAlertCircle, IconAlertTriangle, IconLoader, IconUser, Input } from 'ui'
import { AiIcon, AiIconChat } from './Command.icons'
import { CommandGroup, CommandItem } from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

type CreateChatCompletionResponseChoicesInnerDelta = Omit<
  CreateChatCompletionResponseChoicesInner,
  'message'
> & {
  delta: Partial<ChatCompletionResponseMessage>
}

function getEdgeFunctionUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')

  if (!supabaseUrl) {
    throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL')
  }

  // https://github.com/supabase/supabase-js/blob/10d3423506cbd56345f7f6ab2ec2093c8db629d4/src/SupabaseClient.ts#L96
  const isPlatform = supabaseUrl.match(/(supabase\.co)|(supabase\.in)/)

  if (isPlatform) {
    const [schemeAndProjectId, domain, tld] = supabaseUrl.split('.')
    return `${schemeAndProjectId}.functions.${domain}.${tld}`
  } else {
    return `${supabaseUrl}/functions/v1`
  }
}

const edgeFunctionUrl = getEdgeFunctionUrl()

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

const AiCommand = () => {
  const [answer, setAnswer] = useState<string | undefined>('')
  const [isResponding, setIsResponding] = useState(false)
  const [hasClippyError, setHasClippyError] = useState(false)
  const eventSourceRef = useRef<SSE>()
  const { isLoading, setIsLoading, currentPage, search, setSearch } = useCommandMenu()

  const [promptIndex, setPromptIndex] = useState(0)
  const [promptData, dispatchPromptData] = useReducer(promptDataReducer, [])

  const cantHelp = answer?.trim() === "Sorry, I don't know how to help with that."
  const status = isLoading
    ? 'Clippy is searching...'
    : isResponding
    ? 'Clippy is responding...'
    : cantHelp || hasClippyError
    ? 'Clippy has failed you'
    : undefined

  const handleConfirm = useCallback(
    async (query: string) => {
      setAnswer(undefined)
      setSearch('')
      dispatchPromptData({ index: promptIndex, answer: undefined, query })
      setIsResponding(false)
      setHasClippyError(false)
      setIsLoading(true)

      const eventSource = new SSE(`${edgeFunctionUrl}/clippy-search`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({ query }),
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

          const completionResponse: CreateChatCompletionResponse = JSON.parse(e.data)
          const [
            {
              delta: { content },
            },
          ] = completionResponse.choices as CreateChatCompletionResponseChoicesInnerDelta[]

          const text = content ?? ''

          setAnswer((answer) => {
            const currentAnswer = answer ?? ''

            dispatchPromptData({
              index: promptIndex,
              answer: currentAnswer + text,
            })

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

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="relative mb-[70px] py-4 overflow-y-auto overflow-hidden max-h-[720px]">
        <div className="flex flex-col gap-6">
          {promptData.map((prompt, i) => {
            if (!prompt.query) return <></>

            return (
              <>
                {prompt.query && (
                  <div className="flex gap-6 mx-4">
                    <div className="w-7 h-7 bg-brand-900 rounded-full border border-brand-800 flex items-center justify-center text-brand-1200">
                      <IconUser strokeWidth={2} size={16} />
                    </div>
                    <div className="prose text-scale-1000">{prompt.query}</div>
                  </div>
                )}

                <div className="px-4">
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
                    <div className="flex gap-6">
                      <AiIconChat />
                      <div className="w-full">
                        {isLoading && promptIndex === i ? (
                          <div className="bg-scale-700 h-[21px] w-[13px] mt-1 animate-pulse animate-bounce"></div>
                        ) : (
                          // TODO: pull in markdown components from docs for better styling (code blocks, etc)
                          <ReactMarkdown
                            linkTarget="_blank"
                            className="prose dark:prose-dark"
                            remarkPlugins={[remarkGfm]}
                            transformLinkUri={(href) => {
                              const supabaseUrl = new URL('https://supabase.com')
                              const linkUrl = new URL(href, 'https://supabase.com')

                              if (linkUrl.origin === supabaseUrl.origin) {
                                return linkUrl.toString()
                              }

                              return href
                            }}
                          >
                            {prompt.answer}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )
          })}
        </div>

        {promptData.length === 0 && !hasClippyError && (
          <CommandGroup heading="Examples" forceMount>
            {questions.map((question) => {
              const key = question.replace(/\s+/g, '_')
              return (
                <CommandItem
                  type="command"
                  onSelect={() => {
                    if (!search) {
                      handleConfirm(question)
                    }
                  }}
                  forceMount
                  key={key}
                >
                  <AiIcon />
                  {question}
                </CommandItem>
              )
            })}
          </CommandGroup>
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
      </div>
      <div className="absolute bottom-0 w-full bg-scale-200">
        <Input
          className="bg-scale-100 rounded mx-3"
          autoFocus
          type="textarea"
          placeholder="Ask a question"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'Enter':
                if (!search) {
                  return
                }
                handleConfirm(search)
                return
              default:
                return
            }
          }}
        />
        <div className="text-scale-1100 px-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1 py-2 text-scale-800">
              <span>Powered by OpenAI.</span>
            </div>
            <div className="flex items-center gap-6 py-1">
              {status && (
                <span className="bg-scale-400 rounded-lg py-1 px-2 items-center gap-2 hidden md:flex">
                  {(isLoading || isResponding) && <IconLoader size={14} className="animate-spin" />}
                  {status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiCommand
