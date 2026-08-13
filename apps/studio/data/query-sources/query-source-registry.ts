import * as z from 'zod'

import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { isoDateTimeString } from '@/lib/iso-datetime'

export type LogTimeRange =
  | {
      type: 'relative'
      amount: number
      unit: 'minute' | 'hour' | 'day' | 'week'
    }
  | {
      type: 'absolute'
      from: string
      to: string
    }

export type DatabaseSource = {
  id: 'database'
  type: 'database'
  endpoint: '/platform/pg-meta/{ref}/query'
  parameters: {
    identifier?: string
  }
}

export type LogsSource = {
  id: 'logs'
  type: 'logs'
  endpoint: ReturnType<typeof logsAllEndpointUrl>
  parameters: {
    time_range: LogTimeRange
  }
}

/** Sources are registered by Studio; query surfaces only store a source binding. */
export type Source = DatabaseSource | LogsSource

export type CellSourceOf<S extends Source> = Pick<S, 'type' | 'id' | 'parameters'>

export type CellSource = CellSourceOf<DatabaseSource> | CellSourceOf<LogsSource>

export const DEFAULT_LOG_TIME_RANGE: LogTimeRange = {
  type: 'relative',
  amount: 1,
  unit: 'hour',
}

export const QUERY_SOURCE_REGISTRY = {
  database: {
    id: 'database',
    type: 'database',
    endpoint: '/platform/pg-meta/{ref}/query',
    parameters: {},
  },
  logs: {
    id: 'logs',
    type: 'logs',
    endpoint: logsAllEndpointUrl(true),
    parameters: { time_range: DEFAULT_LOG_TIME_RANGE },
  },
} as const satisfies Record<Source['id'], Source>

export type QuerySourceId = keyof typeof QUERY_SOURCE_REGISTRY

export const QUERY_SOURCES = Object.values(QUERY_SOURCE_REGISTRY) as Source[]

export const QUERY_SOURCE_LABELS: Record<QuerySourceId, string> = {
  database: 'Database',
  logs: 'Logs',
}

const isoDateTimeSchema = z.string().refine((value) => isoDateTimeString(value) !== null, {
  message: 'must be a valid ISO-8601 datetime',
})

export const logTimeRangeSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('relative'),
      amount: z.number().int().positive(),
      unit: z.enum(['minute', 'hour', 'day', 'week']),
    })
    .strict(),
  z
    .object({
      type: z.literal('absolute'),
      from: isoDateTimeSchema,
      to: isoDateTimeSchema,
    })
    .strict(),
])

export const cellSourceSchema = z.discriminatedUnion('type', [
  z
    .object({
      id: z.literal('database'),
      type: z.literal('database'),
      parameters: z.object({ identifier: z.string().optional() }).strict(),
    })
    .strict(),
  z
    .object({
      id: z.literal('logs'),
      type: z.literal('logs'),
      parameters: z.object({ time_range: logTimeRangeSchema }).strict(),
    })
    .strict(),
])

export function createDefaultCellSource(id: 'database'): CellSourceOf<DatabaseSource>
export function createDefaultCellSource(id: 'logs'): CellSourceOf<LogsSource>
export function createDefaultCellSource(id: QuerySourceId): CellSource
export function createDefaultCellSource(id: QuerySourceId): CellSource {
  const source = QUERY_SOURCE_REGISTRY[id]

  if (source.type === 'logs') {
    return {
      id: source.id,
      type: source.type,
      parameters: { time_range: { ...source.parameters.time_range } },
    }
  }

  return { id: source.id, type: source.type, parameters: { ...source.parameters } }
}

export const getQuerySource = (id: QuerySourceId): Source => QUERY_SOURCE_REGISTRY[id]
