import { defaultPreparePayload } from 'pino-logflare'

type PayloadMeta = Parameters<typeof defaultPreparePayload>[1]

interface LogflareNetworkError extends Error {
  response?: {
    status?: number
  }
  data?: unknown
}

export function onPreparePayload(payload: Record<string, unknown>, meta: PayloadMeta) {
  const item = defaultPreparePayload(payload, meta)
  item.project = payload.project
  item.request_id = payload.sbReqId
  item.trace_id = payload.traceId
  item.span_id = payload.spanId
  return item
}

export function onError(payload: Record<string, unknown>, err: Error) {
  console.error(
    `[Logflare][Error] ${err.message}${formatErrorDetails(payload, err)} - ${err.stack}`
  )
}

function formatErrorDetails(payload: Record<string, unknown>, err: Error): string {
  const details: string[] = []
  const networkError = err as LogflareNetworkError

  if (networkError.response?.status !== undefined) {
    details.push(`status=${networkError.response.status}`)
  }

  if (networkError.data !== undefined) {
    details.push(`data=${stringifyLogflareData(networkError.data)}`)
  }

  if (Array.isArray(payload.batch)) {
    details.push(`batchSize=${payload.batch.length}`)

    const batchTypes = getBatchTypes(payload.batch)
    if (batchTypes.length > 0) {
      details.push(`batchTypes=${batchTypes.join(',')}`)
    }
  }

  return details.length > 0 ? ` (${details.join(' ')})` : ''
}

function stringifyLogflareData(data: unknown): string {
  try {
    return JSON.stringify(data)
  } catch {
    return '[unserializable]'
  }
}

function getBatchTypes(batch: unknown[]): string[] {
  const types = new Set<string>()

  for (const item of batch) {
    const type = (item as { metadata?: { context?: { type?: unknown } } } | null)?.metadata?.context
      ?.type
    if (typeof type === 'string' && type) {
      types.add(type)
    }
  }

  return Array.from(types)
}
