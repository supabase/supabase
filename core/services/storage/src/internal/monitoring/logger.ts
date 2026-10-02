import { resolve } from 'node:path'
import { normalizeRawError } from '@internal/errors'
import fastJson from 'fast-json-stringify'
import fastQuerystring from 'fast-querystring'
import type { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import pino, { Logger } from 'pino'
import { getConfig } from '../../config'

const serializedRequestLogSymbol: unique symbol = Symbol('SerializedRequestLog')
const serializedReplyLogSymbol: unique symbol = Symbol('SerializedReplyLog')

export type SafeLogHeaders = Record<string, string>

interface SerializedRequestLogShape {
  region: string
  traceId: string
  method: string
  url: string
  headers: SafeLogHeaders
  hostname: string
  remoteAddress: string
  remotePort?: number
}

export interface SerializedRequestLog extends SerializedRequestLogShape {
  readonly [serializedRequestLogSymbol]: true
}

interface SerializedReplyLogShape {
  statusCode: number
  headers: SafeLogHeaders
}

export interface SerializedReplyLog extends SerializedReplyLogShape {
  readonly [serializedReplyLogSymbol]: true
}

const safeHeadersSchema = {
  type: 'object',
  additionalProperties: { type: 'string' },
} as const

// JSON schemas for the structured payloads that appear on every request log.
// They are compiled into fast-json-stringify serializers and wired into pino as
// per-key stringifiers (see registerLogStringifiers), so the hot path avoids
// pino's generic stringify for these objects.
export const serializeRequestLogToJson = fastJson({
  type: 'object',
  properties: {
    region: { type: 'string' },
    traceId: { type: 'string' },
    method: { type: 'string' },
    url: { type: 'string' },
    headers: safeHeadersSchema,
    hostname: { type: 'string' },
    remoteAddress: { type: 'string' },
    remotePort: { type: 'integer' },
  },
  additionalProperties: false,
})

export const serializeReplyLogToJson = fastJson({
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    headers: safeHeadersSchema,
  },
  additionalProperties: false,
})

const {
  logLevel,
  logflareApiKey,
  logflareSourceToken,
  logflareEnabled,
  logflareBatchSize,
  region,
  version: appVersion,
} = getConfig()

export const baseLogger = pino({
  transport: buildTransport(),
  serializers: {
    error(error) {
      return normalizeRawError(error, logLevel)
    },
    // doRequestLog passes branded values from serializeRequestLog/serializeReplyLog,
    // so the common path is a passthrough. If Fastify's auto-logger ever emits raw
    // FastifyRequest/Reply values, fall back to the safe serializers.
    req: serializeRequestLogValue,
    res: serializeReplyLogValue,
  },
  level: logLevel,
  timestamp: pino.stdTimeFunctions.epochTime,
})

registerLogStringifiers(baseLogger)

export let logger = baseLogger.child({ region, appVersion })

export function setLogger(newLogger: Logger) {
  logger = newLogger
}

type LogStringifier = (value: unknown) => string

/**
 * Wires the schema-compiled serializers into pino as per-key stringifiers.
 *
 * pino applies the `req`/`res` serializers first to normalize the values, then
 * hands the result to the matching stringifier to produce the embedded JSON.
 * Child loggers inherit the stringifiers through the prototype chain, so the
 * whole logger tree benefits without re-registration.
 */
function registerLogStringifiers(target: Logger) {
  const stringifiersSym = pino.symbols?.stringifiersSym
  if (!stringifiersSym) {
    return
  }

  const stringifiers = (target as unknown as Record<symbol, Record<string, LogStringifier>>)[
    stringifiersSym
  ]
  if (!stringifiers) {
    return
  }

  stringifiers.req = serializeRequestLogToJson as LogStringifier
  stringifiers.res = serializeReplyLogToJson as LogStringifier
}

export interface RequestLogContext {
  tenantId?: string
  project?: string
  reqId?: string
  sbReqId?: string
}

export interface RequestLog extends RequestLogContext {
  type: 'request'
  traceId: string
  spanId: string
  req: SerializedRequestLog
  res?: SerializedReplyLog
  reqMetadata: string
  responseTime: number
  executionTime?: number
  error?: Error | unknown
  role?: string
  owner?: string
  operation?: string
  resources?: string[]
  serverTimes?: { spanName: string; duration: number }[]
}

export interface EventLog extends RequestLogContext {
  jobId: string
  type: 'event'
  event: string
  payload: string
  objectPath: string
  resources?: string[]
}

interface ErrorLog extends RequestLogContext {
  type: string
  error?: Error | unknown
  metadata?: string
}

interface InfoLog extends RequestLogContext {
  type: string
  metadata?: string
}

export const logSchema = {
  info: (logger: FastifyBaseLogger, message: string, log: InfoLog) => logger.info(log, message),
  warning: (logger: FastifyBaseLogger, message: string, log: InfoLog | ErrorLog) =>
    logger.warn(log, message),
  request: (logger: FastifyBaseLogger, message: string, log: RequestLog) => {
    if (!log.res) {
      logger.warn(log, message)
      return
    }

    const is4xxResponse = statusOfType(log.res.statusCode, 400)
    const is5xxResponse = statusOfType(log.res.statusCode, 500)

    const logLevel = is4xxResponse ? 'warn' : is5xxResponse ? 'error' : 'info'
    logger[logLevel](log, message)
  },
  error: (logger: FastifyBaseLogger, message: string, log: ErrorLog) => logger.error(log, message),
  event: (logger: FastifyBaseLogger, message: string, log: EventLog) => logger.info(log, message),
}

export function buildTransport(): pino.TransportMultiOptions {
  const stdOutTarget = {
    level: logLevel || 'info',
    target: 'pino/file',
    // omitting options.destination logs to stdout using a worker thread
    options: {},
  }

  if (!logflareEnabled) {
    return { targets: [stdOutTarget] }
  }

  if (!logflareApiKey) {
    throw new Error('must provide a logflare api key')
  }

  if (!logflareSourceToken) {
    throw new Error('must provider a logflare source token')
  }

  const logflareModulePath = resolve(__dirname, 'logflare')

  return {
    targets: [
      stdOutTarget,
      {
        level: logLevel || 'info',
        target: 'pino-logflare',
        options: {
          apiKey: logflareApiKey,
          sourceToken: logflareSourceToken,
          batchSize: logflareBatchSize,
          onPreparePayload: { module: logflareModulePath, method: 'onPreparePayload' },
          onError: { module: logflareModulePath, method: 'onError' },
        },
      },
    ],
  }
}

const allowlistedHeaderKeys = new Map<string, string>(
  [
    'accept',
    'cf-connecting-ip',
    'cf-ipcountry',
    'host',
    'user-agent',
    'x-forwarded-proto',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-forwarded-prefix',
    'referer',
    'content-length',
    'x-real-ip',
    'x-client-info',
    'x-forwarded-user-agent',
    'x-client-trace-id',
    'x-upsert',
    'content-type',
    'if-none-match',
    'if-modified-since',
    'if-match',
    'if-unmodified-since',
    'upload-metadata',
    'upload-length',
    'upload-offset',
    'tus-resumable',
    'range',
    'cf-cache-status',
    'cf-ray',
    'location',
    'cache-control',
    'content-location',
    'content-range',
    'date',
    'transfer-encoding',
    'x-kong-proxy-latency',
    'x-kong-upstream-latency',
    'sb-request-id',
    'sb-gateway-mode',
    'sb-gateway-version',
    'x-transformations',
    'expires',
    'etag',
    'content-disposition',
    'last-modified',
  ].map((header) => [header, header.replaceAll('-', '_')])
)

const redactedQueryParams = ['token', 'X-Amz-Credential', 'X-Amz-Signature', 'X-Amz-Security-Token']

const whitelistHeaders = (headers: Record<string, unknown>): SafeLogHeaders => {
  const responseMetadata: SafeLogHeaders = {}

  for (const header in headers) {
    const safeKey = allowlistedHeaderKeys.get(header)
    if (safeKey !== undefined) {
      responseMetadata[safeKey] = `${headers[header]}`
    }
  }

  return responseMetadata
}

export function serializeRequestLog(req: FastifyRequest): SerializedRequestLog {
  const log: SerializedRequestLogShape = {
    region,
    traceId: req.id,
    method: req.method,
    url: redactLogUrl(req.url, req.query),
    headers: whitelistHeaders(req.headers),
    hostname: req.hostname,
    remoteAddress: req.ip,
    remotePort: req.socket?.remotePort,
  }
  return markSerializedRequestLog(log)
}

export function serializeReplyLog(reply: FastifyReply | undefined): SerializedReplyLog | undefined {
  if (!reply) {
    return undefined
  }

  const log: SerializedReplyLogShape = {
    statusCode: reply.statusCode,
    headers: whitelistHeaders(reply.getHeaders()),
  }
  return markSerializedReplyLog(log)
}

function serializeRequestLogValue(request: unknown) {
  if (isRecord(request) && request[serializedRequestLogSymbol] === true) {
    return request
  }

  if (isFastifyRequestLogValue(request)) {
    return serializeRequestLog(request)
  }
}

function serializeReplyLogValue(reply: unknown) {
  if (isRecord(reply) && reply[serializedReplyLogSymbol] === true) {
    return reply
  }

  if (isFastifyReplyLogValue(reply)) {
    return serializeReplyLog(reply)
  }

  if (isPartialReplyLogValue(reply)) {
    return markSerializedReplyLog({
      statusCode: reply.statusCode,
      headers: {},
    })
  }
}

function isFastifyRequestLogValue(request: unknown): request is FastifyRequest {
  return (
    isRecord(request) &&
    typeof request.id === 'string' &&
    typeof request.method === 'string' &&
    typeof request.url === 'string' &&
    isRecord(request.headers) &&
    typeof request.hostname === 'string' &&
    typeof request.ip === 'string' &&
    typeof request.protocol === 'string'
  )
}

function isFastifyReplyLogValue(reply: unknown): reply is FastifyReply {
  return (
    isRecord(reply) &&
    typeof reply.statusCode === 'number' &&
    typeof reply.getHeaders === 'function'
  )
}

function isPartialReplyLogValue(reply: unknown): reply is { statusCode: number } {
  return isRecord(reply) && typeof reply.statusCode === 'number'
}

function markSerializedRequestLog(log: SerializedRequestLogShape): SerializedRequestLog {
  Object.defineProperty(log, serializedRequestLogSymbol, { value: true })
  return log as SerializedRequestLog
}

function markSerializedReplyLog(log: SerializedReplyLogShape): SerializedReplyLog {
  Object.defineProperty(log, serializedReplyLogSymbol, { value: true })
  return log as SerializedReplyLog
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null
}

function redactLogUrl(url: string, query?: unknown): string {
  const qIdx = url.indexOf('?')

  // Fast path: no query string, nothing to redact
  if (qIdx === -1) return url

  // Reuse the query Fastify already parsed (and percent-decoded) during routing;
  // only parse here when it is unavailable, e.g. raw non-Fastify log values. A key
  // sent as `to%6Ben` is decoded to `token`, so encoded secrets are still matched.
  const parsed = isRecord(query) ? query : fastQuerystring.parse(url.slice(qIdx + 1))

  // Redact only when a sensitive key is present, cloning lazily so the request's
  // own query object is never mutated. When nothing is sensitive, return the URL
  // untouched and do no extra work.
  let redacted: Record<string, unknown> | undefined
  for (const param of redactedQueryParams) {
    if (param in parsed) {
      redacted ??= { ...parsed }
      redacted[param] = 'redacted'
    }
  }
  if (redacted === undefined) return url

  return `${url.slice(0, qIdx)}?${fastQuerystring.stringify(redacted)}`
}

function statusOfType(statusCode: number, ofType: number) {
  return statusCode >= ofType && statusCode < ofType + 100
}
