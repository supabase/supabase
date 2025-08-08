import { IS_CI, IS_DEV, LOGFLARE_INGESTION_API_KEY, LOGFLARE_SOURCE_TOKEN } from './constants'

export const LOGGING_CODES = {
  CONTENT_API_REQUEST_RECEIVED: 'content_api_request_received',
} as const

const LOGFLARE_ENDPOINT = `https://api.logflare.app/api/logs?source=${LOGFLARE_SOURCE_TOKEN}`

interface LogflareMessage {
  message: string
  metadata?: Record<string, unknown>
}

export function sendToLogflare(message: string, metadata?: Record<string, unknown>) {
  // Skip logging in CI and development environments
  if (IS_CI || IS_DEV) return

  const logMessage: LogflareMessage = {
    message,
  }

  if (metadata) {
    logMessage.metadata = metadata
  }

  fetch(LOGFLARE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOGFLARE_INGESTION_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logMessage),
  })
}
