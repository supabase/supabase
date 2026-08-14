import * as z from 'zod'

import { timeRangeSchema, type TimeRange } from '@/data/content/notebooks/notebook-schema'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'

export type DatabaseSource = {
  id: 'database'
  type: 'database'
  endpoint: '/platform/pg-meta/{ref}/query'
  parameters: {
    /**
     * Query-owned database selection. The SQL editor still adapts its legacy
     * global/local-storage selector into this shape; new consumers persist the
     * identifier directly with their query.
     */
    identifier?: string
  }
}

export type LogsSource = {
  id: 'logs'
  type: 'logs'
  endpoint: ReturnType<typeof logsAllEndpointUrl>
  parameters: {
    time_range: TimeRange
  }
}

/** Sources are registered by Studio; query surfaces only store a source binding. */
export type Source = DatabaseSource | LogsSource

export type CellSourceOf<S extends Source> = Pick<S, 'type' | 'id' | 'parameters'>

export type CellSource = CellSourceOf<DatabaseSource> | CellSourceOf<LogsSource>

export const DEFAULT_LOG_TIME_RANGE: TimeRange = {
  _tag: 'relative_time_range',
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

export const QUERY_SOURCES = Object.values(QUERY_SOURCE_REGISTRY) satisfies Source[]

export const QUERY_SOURCE_LABELS: Record<QuerySourceId, string> = {
  database: 'Database',
  logs: 'Logs',
}

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
      parameters: z.object({ time_range: timeRangeSchema }).strict(),
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
