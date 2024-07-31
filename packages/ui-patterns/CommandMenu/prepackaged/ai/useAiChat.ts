import type OpenAI from 'openai'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useReducer, useRef, useState } from 'react'
import { SSE } from 'sse.js'

import { BASE_PATH } from '../shared/constants'
import type { Message, MessageAction } from './utils'
import { MessageRole, MessageStatus } from './utils'

const messageReducer = (state: Message[], messageAction: MessageAction) => {
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
        current[index] = Object.assign({}, current[index], message)
      }
      break
    }
    case 'append-content': {
      const { index, content, idempotencyKey } = messageAction

      const messageToEdit = current[index]
      if (!messageToEdit || messageToEdit.idempotencyKey === idempotencyKey) {
        break
      }
      messageToEdit.idempotencyKey = idempotencyKey

      current[index] = Object.assign({}, messageToEdit, {
        content: (messageToEdit.content += content),
      })
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

interface UseAiChatOptions {
  messageTemplate?: (message: string) => string
  setIsLoading?: Dispatch<SetStateAction<boolean>>
}

const useAiChat = ({ messageTemplate = (message) => message, setIsLoading }: UseAiChatOptions) => {
  const eventSourceRef = useRef<SSE>()
  const messageIdempotencyKey = useRef(0)

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

      function handleMessage(e: MessageEvent) {
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
              idempotencyKey: messageIdempotencyKey.current++,
              content,
            })
          }
        } catch (err) {
          handleError(err)
        }
      }

      eventSource.addEventListener('error', handleError)
      eventSource.addEventListener('message', handleMessage)

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

export { useAiChat }
export type { Message, UseAiChatOptions }
