import type OpenAI from 'openai'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useReducer, useRef, useState } from 'react'
import { SSE } from 'sse.js'

import { BASE_PATH } from '../shared/constants'
import type { Message, MessageAction, SourceLink } from './utils'
import { MessageRole, MessageStatus } from './utils'

export function parseSourcesFromContent(content: string): {
  cleanedContent: string
  sources: SourceLink[]
} {
  // Only match Sources section at the very end of the message
  const sourcesMatch = content.match(/### Sources\s*(?:\n((?:- [^\n]+\n?)*))?\s*$/)

  let cleanedContent = content
  const sources: SourceLink[] = []

  if (sourcesMatch) {
    // Extract sources
    const sourcesText = sourcesMatch[1] || ''
    const sourceLines = sourcesText.split('\n').filter((line) => line.trim().startsWith('- '))

    for (const sourceLine of sourceLines) {
      const path = sourceLine.replace(/^- /, '').trim()
      // Only include paths that start with '/'
      if (path && path.startsWith('/')) {
        sources.push({
          path,
          url: `https://supabase.com/docs${path}`,
        })
      }
    }

    // Remove sources section from content
    const sourcesIndex = content.lastIndexOf('### Sources')
    if (sourcesIndex !== -1) {
      cleanedContent = content.substring(0, sourcesIndex).trim()
    }
  }

  return { cleanedContent, sources }
}

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
    case 'finalize-with-sources': {
      const { index } = messageAction
      const messageToFinalize = current[index]
      if (messageToFinalize && messageToFinalize.content) {
        const { cleanedContent, sources } = parseSourcesFromContent(messageToFinalize.content)

        current[index] = Object.assign({}, messageToFinalize, {
          status: MessageStatus.Complete,
          content: cleanedContent,
          sources: sources.length > 0 ? sources : undefined,
        })
      } else {
        current[index] = Object.assign({}, messageToFinalize, {
          status: MessageStatus.Complete,
        })
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

interface UseAiChatOptions {
  messageTemplate?: (message: string) => string
  setIsLoading?: Dispatch<SetStateAction<boolean>>
  onAnswerComplete?: (answer: { durationMs: number; sourceCount: number }) => void
  onAnswerError?: (failure: { durationMs: number }) => void
}

const useAiChat = ({
  messageTemplate = (message) => message,
  setIsLoading,
  onAnswerComplete,
  onAnswerError,
}: UseAiChatOptions) => {
  const eventSourceRef = useRef<SSE | undefined>(undefined)
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

      const startTime = performance.now()
      let answer = ''
      // a finished or failed stream stops here, so a late chunk, [DONE] or error cannot advance
      // the index again
      let isFinished = false

      function handleError<T>(err: T) {
        if (isFinished) return
        isFinished = true
        eventSource.close()
        setIsLoading?.(false)
        setIsResponding(false)
        setHasError(true)
        // the next question starts a new pair, so its answer does not stream into this failed one
        setCurrentMessageIndex((index) => index + 2)
        onAnswerError?.({ durationMs: Math.round(performance.now() - startTime) })
        console.error(err)
      }

      function handleMessage(e: MessageEvent) {
        if (isFinished) return
        try {
          setIsLoading?.(false)

          if (e.data === '[DONE]') {
            isFinished = true
            eventSource.close()
            setIsResponding(false)
            // Parse sources from the content and clean the message
            dispatchMessage({
              type: 'finalize-with-sources',
              index: currentMessageIndex,
            })
            setCurrentMessageIndex((x) => x + 2)
            onAnswerComplete?.({
              durationMs: Math.round(performance.now() - startTime),
              sourceCount: parseSourcesFromContent(answer).sources.length,
            })
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

          const data = JSON.parse(e.data)
          const completionChunk: OpenAI.Chat.Completions.ChatCompletionChunk = data
          const [
            {
              delta: { content },
            },
          ] = completionChunk.choices

          if (content) {
            answer += content
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
    [currentMessageIndex, messages, messageTemplate, onAnswerComplete, onAnswerError]
  )

  function reset() {
    eventSourceRef.current?.close()
    eventSourceRef.current = undefined
    setIsResponding(false)
    setHasError(false)
    setCurrentMessageIndex(1)
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
