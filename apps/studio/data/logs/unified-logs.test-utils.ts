import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { createLoader } from 'nuqs/server'
import { z } from 'zod'

import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { addAPIMock } from '@/tests/lib/msw'

export const now = new Date('2026-09-30T12:00:00.000Z')
export const search = createLoader(SEARCH_PARAMS_PARSER)(new URLSearchParams())

export const createRow = (id: string, timestamp: number | string = now.getTime() * 1000) => ({
  id,
  timestamp,
  log_type: 'edge',
  status: 200,
  level: 'success',
  pathname: '/',
  event_message: id,
  method: 'GET',
  log_count: null,
  logs: null,
})

const requestBodySchema = z.object({
  iso_timestamp_start: z.string(),
  iso_timestamp_end: z.string(),
  sql: z.string(),
})
type RequestBody = z.infer<typeof requestBodySchema>

const timestampToNanos = (timestamp: number | string) => {
  if (!/[T-]/.test(String(timestamp))) return BigInt(timestamp) * 1000n
  const fractionalNanos =
    String(timestamp)
      .match(/\.(\d+)/)?.[1]
      .padEnd(9, '0')
      .slice(3, 9) ?? '0'
  const isoTimestamp = String(timestamp).endsWith('Z') ? String(timestamp) : `${timestamp}Z`
  return BigInt(Date.parse(isoTimestamp)) * 1_000_000n + BigInt(fractionalNanos)
}

export const compareRows = (a: ReturnType<typeof createRow>, b: ReturnType<typeof createRow>) => {
  const timestampA = timestampToNanos(a.timestamp)
  const timestampB = timestampToNanos(b.timestamp)
  if (timestampA !== timestampB) return timestampA > timestampB ? -1 : 1
  if (a.id === b.id) return 0
  return a.id > b.id ? -1 : 1
}

export const mockLogs = (
  rows: ReturnType<typeof createRow>[],
  useOtel = false,
  onRequest?: (requestNumber: number) => void
) => {
  const requests: RequestBody[] = []
  addAPIMock({
    method: 'post',
    path: useOtel
      ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
      : '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: async ({ request }) => {
      const body = requestBodySchema.parse(await request.json())
      requests.push(body)
      onRequest?.(requests.length)
      const numericCursor = body.sql.match(
        /timestamp < (?:TIMESTAMP_MICROS|fromUnixTimestamp64Micro)\((\d+)\)/
      )?.[1]
      const isoCursor = body.sql.match(
        /timestamp < (?:CAST|parseDateTime64BestEffort)\('([^']+)'/
      )?.[1]
      const cursorTimestamp = numericCursor ?? isoCursor
      const cursorId = body.sql.match(/(?:id|toString\(id\)) < '([^']+)'/)?.[1]
      const boundaryTimestamp =
        body.sql.match(/timestamp > (?:TIMESTAMP_MICROS|fromUnixTimestamp64Micro)\((\d+)\)/)?.[1] ??
        body.sql.match(/timestamp > (?:CAST|parseDateTime64BestEffort)\('([^']+)'/)?.[1]
      const boundaryId = body.sql.match(/(?:id|toString\(id\)) >= '([^']+)'/)?.[1]
      const start = timestampToNanos(body.iso_timestamp_start)
      const end = timestampToNanos(body.iso_timestamp_end)
      return HttpResponse.json<platformComponents['schemas']['AnalyticsResponse_Output']>({
        result: rows
          .filter((row) => {
            const timestamp = timestampToNanos(row.timestamp)
            if (timestamp <= start || timestamp > end) return false
            if (boundaryTimestamp && boundaryId) {
              const boundary = timestampToNanos(boundaryTimestamp)
              if (timestamp < boundary || (timestamp === boundary && row.id < boundaryId)) {
                return false
              }
            }
            if (!cursorTimestamp || !cursorId) return true
            const cursor = timestampToNanos(cursorTimestamp)
            return timestamp < cursor || (timestamp === cursor && row.id < cursorId)
          })
          .sort(compareRows)
          .slice(0, 50),
      })
    },
  })
  return requests
}
