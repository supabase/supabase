import { z } from 'zod'

import { parseOtelTimestamp } from './otel-inspection.utils'
import { LEVELS } from '@/components/ui/DataTable/DataTable.constants'
import { tryParseJson } from '@/lib/helpers'

type UnifiedLogMetadataRow = {
  log_type?: string | null
  status?: string | number | null
  method?: string | null
  pathname?: string | null
  event_message?: string | null
}

const unifiedLogsQueryRowSchema = z.object({
  id: z.string(),
  timestamp: z.union([z.string(), z.number()]),
  log_type: z.string(),
  status: z.union([z.string(), z.number()]).nullable(),
  level: z.enum(LEVELS).nullable(),
  pathname: z.string().nullable(),
  event_message: z.string().nullable(),
  method: z.string().nullable(),
  log_count: z.number().nullable(),
  logs: z.array(z.unknown()).nullable(),
  auth_user: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export type UnifiedLogsQueryRow = z.infer<typeof unifiedLogsQueryRowSchema>

export const parseUnifiedLogsQueryRows = (value: unknown): UnifiedLogsQueryRow[] =>
  z.array(unifiedLogsQueryRowSchema).parse(value ?? [])

const extractLeadingStatus = (s?: string) => {
  const m = typeof s === 'string' ? s.match(/^(\d{3})\b/) : null
  return m ? Number(m[1]) : undefined
}

export const extractLogMetadata = (row: UnifiedLogMetadataRow) => {
  if (row.log_type === 'workers') {
    return { status: null, method: null, pathname: null }
  }

  // [Joshen] For auth logs, these metadata are nested within event_message,
  // so opting to bring them out at the query level
  const eventMessage = tryParseJson(row.event_message)
  const status =
    row.log_type === 'auth'
      ? (eventMessage?.status ??
        extractLeadingStatus(eventMessage?.msg) ??
        extractLeadingStatus(eventMessage?.error))
      : (row.status ?? 200)
  const method = row.log_type === 'auth' ? eventMessage?.method : row.method
  const pathname = row.log_type === 'auth' ? eventMessage?.path : row.pathname || ''

  return { status, method, pathname }
}

export const mapUnifiedLogRow = (row: UnifiedLogsQueryRow) => {
  const isWorkersLog = row.log_type === 'workers'
  const { status, method, pathname } = extractLogMetadata(row)

  const mappedRow = {
    id: row.id,
    date: parseOtelTimestamp(row.timestamp),
    method,
    pathname,
    status,
    timestamp: row.timestamp,
    level: isWorkersLog ? null : row.level,
    event_message: row.event_message ?? '',
    log_type: row.log_type,
    log_count: row.log_count || null,
    logs: row.logs ?? [],
    auth_user: isWorkersLog ? null : row.auth_user || null,
  }

  if (isWorkersLog) return { ...mappedRow, metadata: row.metadata ?? null }
  return mappedRow
}
