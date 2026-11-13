import { z } from 'zod'

import type { ContentBase } from './content-query'
import { get, handleError } from '@/data/fetchers'

const filterConditionSchema = z.object({
  propertyName: z.string(),
  operator: z.enum(['=', '<>', '~~*', '!~~*']),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

export const logsViewContentSchema = z.object({
  type: z.literal('logs_view'),
  version: z.literal(1),
  logSource: z.string(),
  filters: z.object({
    logicalOperator: z.literal('AND'),
    conditions: z.array(filterConditionSchema),
  }),
  viewOptions: z
    .object({
      latency: z.array(z.number().int()).nullable().optional(),
      'timing.dns': z.array(z.number().int()).nullable().optional(),
      'timing.connection': z.array(z.number().int()).nullable().optional(),
      'timing.tls': z.array(z.number().int()).nullable().optional(),
      'timing.ttfb': z.array(z.number().int()).nullable().optional(),
      'timing.transfer': z.array(z.number().int()).nullable().optional(),
      sort: z.object({ id: z.string(), desc: z.boolean() }).nullable().optional(),
      show_connection_logs: z.boolean().nullable().optional(),
      edge_auth: z.boolean().nullable().optional(),
      edge_storage: z.boolean().nullable().optional(),
      edge_postgrest: z.boolean().nullable().optional(),
      user: z.string().nullable().optional(),
    })
    .passthrough(),
})

export const isLogsViewContent = (row: { type: string; content?: unknown }) =>
  row.type === 'log_sql' &&
  typeof row.content === 'object' &&
  row.content !== null &&
  'type' in row.content &&
  row.content.type === 'logs_view'

type LogContentVariables = {
  projectRef?: string
  name?: string
  visibility?: ContentBase['visibility']
  favorite?: boolean
  sort?: 'name' | 'inserted_at'
  limit?: number
  cursor?: string
}

async function getLogContentPage(
  { projectRef, name, visibility, favorite, sort, limit = 100, cursor }: LogContentVariables,
  signal?: AbortSignal,
  headers?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')
  const { data, error } = await get('/platform/projects/{ref}/content', {
    params: {
      path: { ref: projectRef },
      query: {
        type: 'log_sql',
        name,
        limit: String(limit),
        cursor,
        visibility,
        favorite: favorite?.toString(),
        sort_by: sort,
        sort_order: sort === 'name' ? 'asc' : 'desc',
      },
    },
    signal,
    headers,
  })
  if (error) handleError(error)
  return data
}

export async function getAllLogContent(
  variables: Omit<LogContentVariables, 'cursor'>,
  signal?: AbortSignal
) {
  const rows: ContentBase[] = []
  let cursor: string | undefined
  do {
    const data = await getLogContentPage({ ...variables, cursor }, signal)
    rows.push(...data.data)
    cursor = data.cursor
  } while (cursor)
  return rows
}

export async function getLogSqlSnippetPage(
  variables: LogContentVariables,
  signal?: AbortSignal,
  headers?: HeadersInit
) {
  let cursor = variables.cursor
  do {
    const data = await getLogContentPage({ ...variables, cursor }, signal, headers)
    const rows = data.data.filter((row) => !isLogsViewContent(row))
    cursor = data.cursor
    if (rows.length > 0 || !cursor) return { cursor, rows }
  } while (cursor)
  return { cursor: undefined, rows: [] }
}
