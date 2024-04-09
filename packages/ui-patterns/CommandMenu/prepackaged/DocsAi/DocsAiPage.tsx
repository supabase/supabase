import { AlertTriangle, CornerDownLeft, User } from 'lucide-react'
import type OpenAI from 'openai'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SSE } from 'sse.js'

import {
  AiIconAnimation,
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  Input,
  cn,
  markdownComponents,
} from 'ui'

import { AiWarning } from '../AiWarning'

import { CommandWrapper } from '../../api/CommandMenu'
import { useQuery, useSetQuery } from '../../api/hooks/queryHooks'
import { useHistoryKeys } from '../../api/hooks/useHistoryKeys'
import { useSetCommandMenuSize } from '../../api/hooks/viewHooks'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

export enum MessageStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Complete = 'complete',
}

export interface Message {
  role: MessageRole
  content: string
  status: MessageStatus
}

interface NewMessageAction {
  type: 'new'
  message: Message
}

interface UpdateMessageAction {
  type: 'update'
  index: number
  message: Partial<Message>
}

interface AppendContentAction {
  type: 'append-content'
  index: number
  content: string
}

interface ResetAction {
  type: 'reset'
}

type MessageAction = NewMessageAction | UpdateMessageAction | AppendContentAction | ResetAction

function messageReducer(state: Message[], messageAction: MessageAction) {
  let current = [...state]
  const { type } = messageAction

  switch (type) {
    case 'new': {
      const { message } = messageAction
      current.push(message)
      break
    }
    case 'update': {
      const { index, message } = messageAction
      if (current[index]) {
        Object.assign(current[index], message)
      }
      break
    }
    case 'append-content': {
      const { index, content } = messageAction
      if (current[index]) {
        current[index].content += content
      }
      break
    }
    case 'reset': {
      current = []
      break
    }
    default: {
      throw new Error(`Unknown message action '${type}'`)
    }
  }

  return current
}

export interface UseAiChatOptions {
  messageTemplate?: (message: string) => string
  setIsLoading?: Dispatch<SetStateAction<boolean>>
}

export function useAiChat({
  messageTemplate = (message) => message,
  setIsLoading,
}: UseAiChatOptions) {
  const eventSourceRef = useRef<SSE>()

  const [isResponding, setIsResponding] = useState(false)
  const [hasError, setHasError] = useState(false)

  const [currentMessageIndex, setCurrentMessageIndex] = useState(1)
  const [messages, dispatchMessage] = useReducer(messageReducer, [])

  const submit = useCallback(
    async (query: string) => {
      dispatchMessage({
        type: 'new',
        message: {
          status: MessageStatus.Complete,
          role: MessageRole.User,
          content: query,
        },
      })
      dispatchMessage({
        type: 'new',
        message: {
          status: MessageStatus.Pending,
          role: MessageRole.Assistant,
          content: '',
        },
      })
      setIsResponding(false)
      setHasError(false)
      setIsLoading?.(true)

      const eventSource = new SSE(`${BASE_PATH}/api/ai/docs`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          messages: messages
            .filter(({ status }) => status === MessageStatus.Complete)
            .map(({ role, content }) => ({ role, content }))
            .concat({ role: MessageRole.User, content: messageTemplate(query) }),
        }),
      })

      function handleError<T>(err: T) {
        setIsLoading?.(false)
        setIsResponding(false)
        setHasError(true)
        console.error(err)
      }

      eventSource.addEventListener('error', handleError)
      eventSource.addEventListener('message', (e: MessageEvent) => {
        try {
          setIsLoading?.(false)

          if (e.data === '[DONE]') {
            setIsResponding(false)
            dispatchMessage({
              type: 'update',
              index: currentMessageIndex,
              message: {
                status: MessageStatus.Complete,
              },
            })
            setCurrentMessageIndex((x) => x + 2)
            return
          }

          dispatchMessage({
            type: 'update',
            index: currentMessageIndex,
            message: {
              status: MessageStatus.InProgress,
            },
          })

          setIsResponding(true)

          const completionChunk: OpenAI.Chat.Completions.ChatCompletionChunk = JSON.parse(e.data)
          const [
            {
              delta: { content },
            },
          ] = completionChunk.choices

          if (content) {
            dispatchMessage({
              type: 'append-content',
              index: currentMessageIndex,
              content,
            })
          }
        } catch (err) {
          handleError(err)
        }
      })

      eventSource.stream()

      eventSourceRef.current = eventSource

      setIsLoading?.(true)
    },
    [currentMessageIndex, messages, messageTemplate]
  )

  function reset() {
    eventSourceRef.current?.close()
    eventSourceRef.current = undefined
    setIsResponding(false)
    setHasError(false)
    dispatchMessage({
      type: 'reset',
    })
  }

  return {
    submit,
    reset,
    messages,
    isResponding,
    hasError,
  }
}

/**
 * Perform a one-off query to AI based on a snapshot of messages
 */
export function queryAi(messages: Message[], timeout = 0) {
  return new Promise<string>((resolve, reject) => {
    const eventSource = new SSE(`${BASE_PATH}/api/ai/docs`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
      }),
    })

    let timeoutId: number | undefined

    function handleError<T>(err: T) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      console.error(err)
      reject(err)
    }

    if (timeout > 0) {
      timeoutId = window.setTimeout(() => {
        handleError(new Error('AI query timed out'))
      }, timeout)
    }

    let answer = ''

    eventSource.addEventListener('error', handleError)
    eventSource.addEventListener('message', (e: MessageEvent) => {
      try {
        if (e.data === '[DONE]') {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          resolve(answer)
          return
        }

        const completionChunk: OpenAI.Chat.Completions.ChatCompletionChunk = JSON.parse(e.data)
        const [
          {
            delta: { content },
          },
        ] = completionChunk.choices

        if (content) {
          answer += content
        }
      } catch (err) {
        handleError(err)
      }
    })

    eventSource.stream()
  })
}

const DocsAiPage = () => {
  const query = useQuery()
  const setQuery = useSetQuery()

  /**
   * Interface for AI interaction is larger to allow more reading space.
   */
  useSetCommandMenuSize('xlarge')

  const [isLoading, setIsLoading] = useState(false)

  const { submit, reset, messages, isResponding, hasError } = useAiChat({
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
    [submit]
  )

  const handleReset = useCallback(() => {
    setQuery('')
    reset()
  }, [reset])

  useEffect(() => {
    if (query) {
      handleSubmit(query)
    }
  }, [])

  // Detect an IME composition (so that we can ignore Enter keypress)
  const [isImeComposing, setIsImeComposing] = useState(false)

  return (
    <CommandWrapper>
      <div className={cn('h-[min(720px,50dvh)] max-h-[min(720px,50dvh)] py-4 overflow-y-auto')}>
        {!hasError &&
          messages.map((message, index) => {
            switch (message.role) {
              case MessageRole.User:
                return (
                  <div key={index} className="flex gap-6 mx-4 [overflow-anchor:none] mb-6">
                    <div
                      className="
                  w-7 h-7 bg-background rounded-full border border-muted flex items-center justify-center text-foreground-lighter first-letter:
                  ring-background
                  ring-1
                  shadow-sm
              "
                    >
                      <User strokeWidth={1.5} size={16} />
                    </div>
                    <div className="prose text-foreground-lighter">{message.content}</div>
                  </div>
                )
              case MessageRole.Assistant:
                return (
                  <div key={index} className="px-4 [overflow-anchor:none]">
                    <div className="flex gap-6 [overflow-anchor:none] mb-6">
                      <AiIconAnimation
                        className="ml-0.5"
                        loading={
                          message.status === MessageStatus.Pending ||
                          message.status === MessageStatus.InProgress
                        }
                        allowHoverEffect
                      />

                      <>
                        {message.status === MessageStatus.Pending ? (
                          <div className="bg-border-strong h-[21px] w-[13px] mt-1 animate-pulse animate-bounce"></div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                            linkTarget="_blank"
                            className="prose dark:prose-dark"
                            transformLinkUri={(href) => {
                              const supabaseUrl = new URL('https://supabase.com')
                              const linkUrl = new URL(href, 'https://supabase.com')

                              if (linkUrl.origin === supabaseUrl.origin) {
                                return linkUrl.toString()
                              }

                              return href
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </>
                    </div>
                  </div>
                )
            }
          })}

        {messages.length === 0 && !hasError && (
          <CommandGroup_Shadcn_
            heading="Examples"
            className="overflow-hidden py-3 px-2 text-border-strong [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-muted"
          >
            {questions.map((question) => {
              const key = question.replace(/\s+/g, '_')
              return (
                <CommandItem_Shadcn_
                  className={cn(
                    'cursor-default',
                    'select-none',
                    'items-center',
                    'rounded-md',
                    'text-sm',
                    'group',
                    'py-3',
                    'text-foreground-light',
                    'relative',
                    'flex gap-2',
                    'px-2',
                    'aria-selected:bg-overlay-hover/80 aria-selected:backdrop-filter aria-selected:backdrop-blur-md',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  )}
                  onSelect={() => {
                    if (!query) {
                      handleSubmit(question)
                    }
                  }}
                  key={key}
                >
                  <AiIconAnimation />
                  {question}
                </CommandItem_Shadcn_>
              )
            })}
          </CommandGroup_Shadcn_>
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
      <div className="flex flex-col gap-3 p-3 bg-background">
        {messages.length > 0 && !hasError && <AiWarning />}
        <Input
          autoFocus
          className="bg-alternative rounded [&_input]:pr-32 md:[&_input]:pr-40"
          placeholder={
            isLoading || isResponding ? 'Waiting on an answer...' : 'Ask Supabase AI a question...'
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

export { DocsAiPage }
