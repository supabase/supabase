import type {
  ChatCompletionResponseMessage,
  CreateChatCompletionResponse,
  CreateChatCompletionResponseChoicesInner,
} from 'openai'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'

import { SSE } from 'sse.js'

import { Button, IconAlertCircle, IconAlertTriangle, IconCornerDownLeft, IconUser, Input } from 'ui'
import { AiIcon, AiIconChat } from './Command.icons'
import { CommandGroup, CommandItem } from './Command.utils'

import { useCommandMenu } from './CommandMenuProvider'

import { cn } from './../../utils/cn'
import { COMMAND_ROUTES } from './Command.constants'

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
    return undefined
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

enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

enum MessageStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Complete = 'complete',
}

interface Message {
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

type MessageAction = NewMessageAction | UpdateMessageAction | AppendContentAction

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
      Object.assign(current[index], message)
      break
    }
    case 'append-content': {
      const { index, content } = messageAction
      current[index].content += content
      break
    }
    default: {
      throw new Error(`Unknown message action '${type}'`)
    }
  }

  return current
}

const AiCommand = () => {
  const [isResponding, setIsResponding] = useState(false)
  const [hasError, setHasError] = useState(false)
  const eventSourceRef = useRef<SSE>()
  const { isLoading, setIsLoading, currentPage, search, setSearch, MarkdownHandler } =
    useCommandMenu()

  const [currentMessageIndex, setCurrentMessageIndex] = useState(1)
  const [messages, dispatchMessage] = useReducer(messageReducer, [])

  const handleConfirm = useCallback(
    async (query: string) => {
      if (!edgeFunctionUrl) {
        return console.error('No edge function url')
      }

      setSearch('')
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
      setIsLoading(true)

      let queryToSend = query

      switch (currentPage) {
        case COMMAND_ROUTES.AI:
          queryToSend = query
          break
        case COMMAND_ROUTES.AI_ASK_ANYTHING:
          queryToSend = query
          break

        case COMMAND_ROUTES.AI_RLS_POLICY:
          queryToSend = `Given this table schema:

          Schema STRIPE has tables:
            CHARGE with columns [ID, AMOUNT, CREATED, CURRENCY, CUSTOMER_ID]
            CUSTOMER with columns [ID, NAME, CREATED, SHIPPING_ADDRESS_STATE]

          \n\nAnswer with only an RLS policy in SQL, no other text: ${query}`
          break
        default:
          break
      }

      const eventSource = new SSE(`${edgeFunctionUrl}/ai-docs`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          messages: messages
            .filter(({ status }) => status === MessageStatus.Complete)
            .map(({ role, content }) => ({ role, content }))
            .concat({ role: MessageRole.User, content: query }),
        }),
      })

      function handleError<T>(err: T) {
        setIsLoading(false)
        setIsResponding(false)
        setHasError(true)
        console.error(err)
      }

      eventSource.addEventListener('error', handleError)
      eventSource.addEventListener('message', (e: any) => {
        try {
          setIsLoading(false)

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

          const completionResponse: CreateChatCompletionResponse = JSON.parse(e.data)
          const [
            {
              delta: { content },
            },
          ] = completionResponse.choices as CreateChatCompletionResponseChoicesInnerDelta[]

          const text = content ?? ''

          dispatchMessage({
            type: 'append-content',
            index: currentMessageIndex,
            content: text,
          })
        } catch (err) {
          handleError(err)
        }
      })

      eventSource.stream()

      eventSourceRef.current = eventSource

      setIsLoading(true)
    },
    [currentMessageIndex, messages]
  )

  function handleResetPrompt() {
    eventSourceRef.current?.close()
    eventSourceRef.current = undefined
    setSearch('')
    setIsResponding(false)
    setHasError(false)
  }

  useEffect(() => {
    if (search) {
      handleConfirm(search)
    }
  }, [])

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className={cn('relative mb-[62px] py-4 max-h-[720px] overflow-auto')}>
        {messages.map((message, index) => {
          switch (message.role) {
            case MessageRole.User:
              return (
                <div key={index} className="flex gap-6 mx-4 [overflow-anchor:none] mb-6">
                  <div
                    className="
                  w-7 h-7 bg-scale-200 rounded-full border border-scale-400 flex items-center justify-center text-scale-1000 first-letter:
                  ring-scale-200
                  ring-1
                  shadow-sm
              "
                  >
                    <IconUser strokeWidth={1.5} size={16} />
                  </div>
                  <div className="prose text-scale-1000">{message.content}</div>
                </div>
              )
            case MessageRole.Assistant:
              return (
                <div key={index} className="px-4 [overflow-anchor:none] mb-6">
                  <div className="flex gap-6 [overflow-anchor:none] mb-6">
                    <AiIconChat />
                    <>
                      {message.status === MessageStatus.Pending ? (
                        <div className="bg-scale-700 h-[21px] w-[13px] mt-1 animate-pulse animate-bounce"></div>
                      ) : (
                        <MarkdownHandler
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
                        </MarkdownHandler>
                      )}
                    </>
                  </div>
                </div>
              )
          }
        })}

        {messages.length === 0 && !hasError && (
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
        {hasError && (
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
            isLoading || isResponding ? 'Waiting on an answer...' : 'Ask Supabase AI a question...'
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

export default AiCommand
