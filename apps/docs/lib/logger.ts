import pino from 'pino'
import { IS_CI, IS_DEV, LOGFLARE_INGESTION_API_KEY, LOGFLARE_SOURCE_TOKEN } from './constants'
import { isPlainObject } from '~/features/helpers.misc'

export const LOGGING_CODES = {
  CONTENT_API_REQUEST_RECEIVED: 'content_api_request_received',
} as const

const LOGFLARE_ENDPOINT = `https://api.logflare.app/api/logs?source=${LOGFLARE_SOURCE_TOKEN}`

interface LogflareMessage {
  message: string
  metadata?: Record<string, unknown>
}

function sendLogflare(messages: LogflareMessage | LogflareMessage[]) {
  const body = Array.isArray(messages) ? { batch: messages } : messages
  const stringifiedBody = JSON.stringify(body)

  fetch(LOGFLARE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOGFLARE_INGESTION_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: stringifiedBody,
  })
}

export const logger = pino({
  enabled: !IS_CI && !IS_DEV,
  level: IS_DEV ? 'debug' : 'info',
  browser: {
    transmit: {
      level: 'info',
      send: function (_level, logEvent) {
        // [Charis 2025-07-21] Surprisingly not filtered by enabled
        if (IS_CI || IS_DEV) return

        const { messages } = logEvent
        const remappedMessages: Partial<LogflareMessage>[] = []

        let currentMessage: Record<string, unknown> | null = null
        for (const message of messages) {
          if (isPlainObject(message)) {
            if ('message' in message && typeof message.message === 'string') {
              const eventMessage = message.message
              const metadata = { ...message }
              delete metadata.message
              remappedMessages.push({
                message: eventMessage,
                metadata,
              })
            } else {
              currentMessage = message
            }
          } else if (typeof message === 'string') {
            if (currentMessage) {
              remappedMessages.push({
                message,
                metadata: currentMessage,
              })
              currentMessage = null
            } else {
              remappedMessages.push({ message })
            }
          }
        }

        if (remappedMessages.length > 0) {
          sendLogflare(remappedMessages as LogflareMessage[])
        }
      },
    },
  },
})
