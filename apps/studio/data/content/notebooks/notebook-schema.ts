import { untrustedSql, type SafeSqlFragment } from '@supabase/pg-meta'
import * as z from 'zod'

import { untrustedLogSql, type SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import { isoDateTimeString } from '@/lib/iso-datetime'

const isoDateTimeSchema = z.string().transform((raw, ctx) => {
  const parsed = isoDateTimeString(raw)
  if (parsed === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid ISO-8601 datetime' })
    return z.NEVER
  }
  return parsed
})

const chartConfigSchema = z.object({
  type: z.enum(['bar', 'line']),
  x_column: z.string(),
  y_columns: z.array(z.string()),
  cumulative: z.boolean(),
  scale: z.enum(['linear', 'log']).default('linear'),
  show_labels: z.boolean(),
})

const absoluteTimeRangeSchema = z.object({
  _tag: z.literal('absolute_time_range'),
  start: isoDateTimeSchema,
  end: isoDateTimeSchema,
})

const relativeTimeRangeSchema = z.object({
  _tag: z.literal('relative_time_range'),
  unit: z.enum(['minute', 'hour', 'day', 'week', 'month', 'year']),
  amount: z.number(),
})

const timeRangeSchema = z.discriminatedUnion('_tag', [
  absoluteTimeRangeSchema,
  relativeTimeRangeSchema,
])

const markdownCellSchema = z.object({
  _tag: z.literal('markdown_cell'),
  id: z.string(),
  text: z.string(),
})

const databaseCellSchema = z.object({
  _tag: z.literal('database_cell'),
  id: z.string(),
  title: z.string().optional(),
  sql: z.string(),
  row_limit: z.number(),
  view: z.enum(['table', 'chart']).default('table').optional(),
  chart: chartConfigSchema.optional(),
})

const logCellSchema = z.object({
  _tag: z.literal('log_cell'),
  id: z.string(),
  title: z.string().optional(),
  sql: z.string(),
  time_range: timeRangeSchema,
  chart: chartConfigSchema.optional(),
})

const cellSchema = z.discriminatedUnion('_tag', [
  markdownCellSchema,
  databaseCellSchema,
  logCellSchema,
])

// The wire shape: every notebook fetched from the API has this shape, with backend-
// generated cell `id`s and plaintext `sql`.
export const notebookSchema = z.object({
  schema_version: z.literal(1),
  cells: z.array(cellSchema),
})

export type NotebookWire = z.infer<typeof notebookSchema>
export type CellWire = z.infer<typeof cellSchema>

// Cells for the create/update PUT body (data/content/notebooks/notebook-upsert-mutation.ts).
// An existing cell being kept or edited carries its real backend-assigned `id` so the
// backend can diff it against the previous version; a newly inserted cell has no `id` at
// all — the backend generates one on write. `sql` must already be a SafeSqlFragment /
// SafeLogSqlFragment — i.e. promoted at the point of user action per the
// safe-sql-execution skill — never a raw string or an UntrustedSqlFragment/unchecked_sql,
// since neither proves this specific save was user-authored.
const writableCellSchema = z.discriminatedUnion('_tag', [
  markdownCellSchema.extend({ id: z.string().optional() }),
  databaseCellSchema.extend({ id: z.string().optional() }),
  logCellSchema.extend({ id: z.string().optional() }),
])

export const writableNotebookSchema = z.object({
  schema_version: z.literal(1),
  cells: z.array(writableCellSchema),
})

type WithSafeSql<C extends { _tag: string }> = C extends { _tag: 'database_cell' }
  ? Omit<C, 'sql'> & { sql: SafeSqlFragment }
  : C extends { _tag: 'log_cell' }
    ? Omit<C, 'sql'> & { sql: SafeLogSqlFragment }
    : C

export type WritableCell = WithSafeSql<z.infer<typeof writableCellSchema>>

export type WritableNotebook = Omit<z.infer<typeof writableNotebookSchema>, 'cells'> & {
  cells: Array<WritableCell>
}

// Agents have restrictions on writing IDs to preserve guarantees about ID
// uniqueness.
export const agentCellSchema = z.discriminatedUnion('_tag', [
  markdownCellSchema.omit({ id: true }).strict(),
  databaseCellSchema.omit({ id: true }).strict(),
  logCellSchema.omit({ id: true }).strict(),
])

export const agentNotebookSchema = z.object({
  schema_version: z.literal(1),
  cells: z.array(agentCellSchema),
})

export type AgentNotebook = z.infer<typeof agentNotebookSchema>
export type AgentCell = z.infer<typeof agentCellSchema>

// The domain shape: parses the same wire cell (`cellSchema`) and transforms `sql` into a
// branded `unchecked_sql`.
const cellDomainSchema = cellSchema.transform((cell) => {
  switch (cell._tag) {
    case 'markdown_cell':
      return cell
    case 'database_cell': {
      const { sql, ...rest } = cell
      return { ...rest, unchecked_sql: untrustedSql(sql) }
    }
    case 'log_cell': {
      const { sql, ...rest } = cell
      return { ...rest, unchecked_sql: untrustedLogSql(sql) }
    }
  }
})

export const notebookDomainSchema = z.object({
  schema_version: z.literal(1),
  cells: z.array(cellDomainSchema),
})

export type NotebookContent = z.infer<typeof notebookDomainSchema>
export type Cell = z.infer<typeof cellDomainSchema>
export type MarkdownCell = Extract<Cell, { _tag: 'markdown_cell' }>
export type DatabaseCell = Extract<Cell, { _tag: 'database_cell' }>
export type LogCell = Extract<Cell, { _tag: 'log_cell' }>
export type TimeRange = z.infer<typeof timeRangeSchema>
export type ChartConfig = z.infer<typeof chartConfigSchema>
