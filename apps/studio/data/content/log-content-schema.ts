import { z } from 'zod'

import { untrustedLogSql } from '@/data/logs/safe-analytics-sql'

export const logsViewFilterConditionSchema = z.object({
  propertyName: z.string(),
  operator: z.enum(['=', '<>', '~~*', '!~~*']),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

export const logsViewSortSchema = z.object({ id: z.string(), desc: z.boolean() })

export const logsViewOptionsSchema = z.object({
  latency: z.array(z.number().int()).nullable().optional(),
  'timing.dns': z.array(z.number().int()).nullable().optional(),
  'timing.connection': z.array(z.number().int()).nullable().optional(),
  'timing.tls': z.array(z.number().int()).nullable().optional(),
  'timing.ttfb': z.array(z.number().int()).nullable().optional(),
  'timing.transfer': z.array(z.number().int()).nullable().optional(),
  sort: logsViewSortSchema.nullable().optional(),
  show_connection_logs: z.boolean().nullable().optional(),
  edge_auth: z.boolean().nullable().optional(),
  edge_storage: z.boolean().nullable().optional(),
  edge_postgrest: z.boolean().nullable().optional(),
  user: z.string().nullable().optional(),
})

export const logsViewOptionKeySchema = logsViewOptionsSchema.keyof()

export const logsViewContentSchema = z.object({
  type: z.literal('logs_view'),
  version: z.literal(1),
  logSource: z.string(),
  filters: z.object({
    logicalOperator: z.literal('AND'),
    conditions: z.array(logsViewFilterConditionSchema),
  }),
  viewOptions: logsViewOptionsSchema.passthrough(),
})

const logSqlContentSchema = z
  .object({
    sql: z.string().transform(untrustedLogSql),
    content_id: z.string().optional(),
    schema_version: z.string().default('1'),
  })
  .passthrough()

export const parseLogSqlSnippet = <Row extends { id: string; type: string; content?: unknown }>(
  row: Row
) => {
  const type = z.literal('log_sql').parse(row.type)
  const { sql, ...content } = logSqlContentSchema.parse(row.content)
  return {
    ...row,
    type,
    content: { ...content, content_id: content.content_id ?? row.id, unchecked_sql: sql },
  }
}

export const isLogsViewContent = (row: { type: string; content?: unknown }) =>
  row.type === 'log_sql' &&
  typeof row.content === 'object' &&
  row.content !== null &&
  'type' in row.content &&
  row.content.type === 'logs_view'
