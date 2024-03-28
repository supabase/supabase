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

import { SSE } from 'sse.js'

import {
  AiIconAnimation,
  Button,
  IconAlertTriangle,
  IconCornerDownLeft,
  IconUser,
  Input,
  markdownComponents,
} from 'ui'
import { AiIconChat } from './Command.icons'
import { CommandGroup, CommandItem, useAutoInputFocus, useHistoryKeys } from './Command.utils'

import { AiWarning } from './Command.alerts'
import { useCommandMenu } from './CommandMenuProvider'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from './../../lib/utils'
import { useRouter } from 'next/router'
import Telemetry from 'lib/telemetry'
import { useTelemetryProps } from 'common'

const defaultQuestions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

const supportQuestions = [
  "Hello! Before connecting you with support, could you tell me what the issue is? Let's see if we can find a solution together.",
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
  supportFirstPrompt?: boolean
  supportSecondPrompt?: boolean
}

interface NewMessageAction {
  type: 'new'
  message: Message
}

interface UpdateMessageAction {
  type: 'update'
  message: Partial<Message>
}

interface AppendContentAction {
  type: 'append-content'
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
      const { message } = messageAction
      Object.assign(current[current.length - 1], message)

      break
    }
    case 'append-content': {
      const { content } = messageAction
      current[current.length - 1].content += content
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
  aiVariant,
}: UseAiChatOptions & { aiVariant: string }) {
  const eventSourceRef = useRef<SSE>()

  const [isResponding, setIsResponding] = useState(false)
  const [hasError, setHasError] = useState(false)

  const initialMessagesState = aiVariant === 'support' ? [{
    role: MessageRole.Assistant,
    content: supportQuestions[0],
    status: MessageStatus.Complete,
  }] : [];

  const [messages, dispatchMessage] = useReducer(messageReducer, initialMessagesState);


  const router = useRouter()

  const projectRef = router.query.ref

  const [isInputDisabled, setIsInputDisabled] = useState(false)
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean | null>(null)

  const telemetryProps = useTelemetryProps()

  useEffect(() => {

    const isFeedbackSectionShown = messages.some(
      (message) =>
        message.supportFirstPrompt === true ||
        message.supportSecondPrompt === true ||
        message.status === MessageStatus.Pending
    )


    if (isFeedbackSectionShown) {
      setIsInputDisabled(isFeedbackSectionShown)
    } 
  }, [messages])

  const answerIsHelpful = (feedback: true | false) => {
    dispatchMessage({
      type: 'update',
      message: {
        supportFirstPrompt: false,
      },
    })

    if (feedback === false) {
      dispatchMessage({
        type: 'update',
        message: {
          supportSecondPrompt: true,
        },
      })
    } else {
      setIsInputDisabled(true)
      dispatchMessage({
        type: 'new',
        message: {
          status: MessageStatus.Complete,
          role: MessageRole.Assistant,
          supportSecondPrompt: false,
          content: 'Great to hear I could help you resolve your issue!',
        },
      })
    }

    Telemetry.sendEvent(
      {
        category: 'support_ai_agent',
        action: 'first_prompt_clicked',
        label: feedback,
      },
      telemetryProps,
      router
    )
  }

  const showSupportForm = (submittedFeedback: true | false) => {
    dispatchMessage({
      type: 'update',
      message: {
        supportFirstPrompt: false,
        supportSecondPrompt: false,
      },
    })

    if (submittedFeedback === true) {
      setIsInputDisabled(true)
      dispatchMessage({
        type: 'new',
        message: {
          status: MessageStatus.Complete,
          role: MessageRole.Assistant,
          content: 'Redirecting you to the support form. Please wait...',
        },
      })

      const userFirstReply = messages.find(({ role }) => role === MessageRole.User)?.content || ''

      setTimeout(() => {
        const queryParams = projectRef
          ? `?ref=${projectRef}&firstReply=${userFirstReply}`
          : `?firstReply=${userFirstReply}`
        window.open(`/dashboard/support/new${queryParams}`, '_blank') 
      }, 1000)
    } else {
      setIsInputDisabled(false)
      dispatchMessage({
        type: 'new',
        message: {
          status: MessageStatus.Complete,
          role: MessageRole.Assistant,
          content: 'Kindly provide all the necessary details so I can assist you more effectively!',
        },
      })
    }

    Telemetry.sendEvent(
      {
        category: 'support_ai_agent',
        action: 'second_prompt_clicked',
        label: submittedFeedback,
      },
      telemetryProps,
      router
    )
  }

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
            setIsInputDisabled(false)
            dispatchMessage({
              type: 'update',
              message: {
                supportFirstPrompt: aiVariant === 'support' ? true : false,
                status: MessageStatus.Complete,
              },
            })
            return
          }

          dispatchMessage({
            type: 'update',
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
    [messages, messageTemplate]
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
    answerIsHelpful,
    submittedFeedback,
    showSupportForm,
    isInputDisabled,
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

const AiCommand = () => {
  const { isLoading, setIsLoading, search, setSearch, aiVariant } = useCommandMenu()

  const {
    submit,
    reset,
    messages,
    isResponding,
    hasError,
    answerIsHelpful,
    submittedFeedback,
    showSupportForm,
    isInputDisabled,
  } = useAiChat({
    setIsLoading,
    aiVariant,
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
    if (search) {
      handleSubmit(search)
    }
  }, [])

  // Detect an IME composition (so that we can ignore Enter keypress)
  const [isImeComposing, setIsImeComposing] = useState(false)

  const questions = aiVariant === 'support' ? supportQuestions : defaultQuestions

  const bottomRef = useRef<HTMLDivElement>(null)
  // try to scroll on each rerender to the bottom

  useEffect(() => {
    if (isResponding == true) {
      if (bottomRef.current) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 777)
      }
    }
  })

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className={cn('relative mb-[145px] py-4')}>
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
                      <IconUser strokeWidth={1.5} size={16} />
                    </div>
                    <div className="prose max-w-none text-foreground-lighter">
                      {message.content}
                    </div>
                  </div>
                )
              case MessageRole.Assistant:
                return (
                  <div key={index} className="px-4 [overflow-anchor:none] mb-[25px]">
                    <div className="flex gap-6 [overflow-anchor:none] mb-6">
                      <AiIconChat
                        loading={
                          message.status === MessageStatus.Pending ||
                          message.status === MessageStatus.InProgress
                        }
                      />
                      <>
                        {message.status === MessageStatus.Pending ? (
                          <div className="bg-border-strong h-[21px] w-[13px] mt-1 animate-pulse animate-bounce"></div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                            linkTarget="_blank"
                            className="prose max-w-none dark:prose-dark"
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

                    {message.status === MessageStatus.Complete &&
                      message.supportFirstPrompt === true &&
                      aiVariant === 'support' && (
                        <div className="flex items-center justify-center mt-4 space-x-2">
                          <p className="prose dark:prose-dark">Was this answer helpful?</p>
                          <Button size="tiny" type="default" onClick={() => answerIsHelpful(true)}>
                            Yes
                          </Button>
                          <Button size="tiny" type="default" onClick={() => answerIsHelpful(false)}>
                            No
                          </Button>
                        </div>
                      )}

                    {message.status === MessageStatus.Complete &&
                      message.supportFirstPrompt === false &&
                      message.supportSecondPrompt === true &&
                      aiVariant === 'support' && (
                        <div className="flex items-center justify-center mt-4 space-x-2">
                          <p className="prose dark:prose-dark">I'm sorry to hear that.</p>
                          <Button size="tiny" type="default" onClick={() => showSupportForm(false)}>
                            Ask another question
                          </Button>
                          <Button size="tiny" type="default" onClick={() => showSupportForm(true)}>
                            Contact Support
                          </Button>
                        </div>
                      )}
                  </div>
                )
            }
          })}

        {messages.length === 0 && !hasError && (
          <CommandGroup heading={aiVariant !== 'support' ? 'Examples' : 'Support AI Agent'}>
            {questions.map((question) => {
              const key = question.replace(/\s+/g, '_')

              return (
                <CommandItem
                  type="command"
                  onSelect={() => {
                    if (!search && question !== supportQuestions[0]) {
                      handleSubmit(question)
                    }
                  }}
                  key={key}
                >
                  <AiIconAnimation />
                  {question}
                </CommandItem>
              )
            })}
          </CommandGroup>
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
        <div ref={bottomRef} className="h-1" />

        <div className="[overflow-anchor:auto] h-px w-full"></div>
      </div>
      <div className="absolute bottom-0 w-full bg-background py-3">
        {messages.length > 0 && !hasError && <AiWarning className="mb-3 mx-3" />}
        <Input
          className="bg-alternative rounded mx-3 [&_input]:pr-32 md:[&_input]:pr-40"
          inputRef={inputRef}
          placeholder={
            isLoading || isResponding ? 'Waiting on an answer...' : 'Ask Supabase AI a question...'
          }
          value={search}
          disabled={isInputDisabled}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
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

export default AiCommand