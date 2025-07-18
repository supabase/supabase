import pino from 'pino'
import { IS_DEV, LOGFLARE_INGESTION_API_KEY, LOGFLARE_SOURCE_TOKEN } from './constants'

export const LOGGING_CODES = {
  CONTENT_API_REQUEST_RECEIVED: 'content_api_request_received',
} as const

export const logger = pino({
  enabled: !process.env.CI,
  level: IS_DEV ? 'debug' : 'info',
  ...(process.env.CI
    ? {}
    : {
        transport: IS_DEV
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : {
              target: 'pino-logflare',
              options: {
                apiKey: LOGFLARE_INGESTION_API_KEY,
                sourceToken: LOGFLARE_SOURCE_TOKEN,
              },
            },
      }),
})
