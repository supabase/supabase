import { untrustedSql, type SafeSqlFragment } from '@supabase/pg-meta'
import dayjs from 'dayjs'
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
  amount: z.number().int().positive(),
})

export const timeRangeSchema = z
  .discriminatedUnion('_tag', [absoluteTimeRangeSchema, relativeTimeRangeSchema])
  .refine(
    (range) => {
      if (range._tag !== 'absolute_time_range') return true

      const start = dayjs(range.start)
      const end = dayjs(range.end)
      // An unparseable bound is already reported against its own field; the ordering
      // rule stays quiet so it doesn't add a second, misleading issue.
      if (!start.isValid() || !end.isValid()) return true

      return end.isAfter(start)
    },
    { message: 'must be later than the start of the range', path: ['end'] }
  )

// Source parameters — the per-backend values a query needs beyond its SQL. Declared
// here, in the wire contract, because this schema is the shape shared with the API and
// the agent tool surface, so it is where the validation has to be authoritative. The
// runtime registry (data/query-sources/query-source-registry.ts) borrows these rather
// than redeclaring them. Each is spread flat into its cell — no `source` wrapper — to
// keep the JSON an agent has to author as shallow as possible.
export const databaseSourceSchema = z.object({
  /**
   * Which database the query runs against: the read-replica `identifier`, or absent
   * for the project's primary. Named `database_identifier` rather than `identifier`
   * because every cell already carries an `id`.
   */
  database_identifier: z.string().optional(),
})

export const logsSourceSchema = z.object({
  time_range: timeRangeSchema,
})

const cellBaseSchema = z.object({
  id: z.string(),
})

// Fields every runnable cell shares, regardless of backend. `sql` is deliberately NOT
// here: it stays on each member so the domain transform can brand it per dialect and
// generic code holding a `QueryCell` can't hand it to the wrong wire boundary.
const queryCellBaseSchema = cellBaseSchema.extend({
  title: z.string().optional(),
  view: z.enum(['table', 'chart']).optional(),
  // Persisted independently of `view` so a user who switches to the table and back
  // gets their chart configuration returned rather than rebuilt.
  chart: chartConfigSchema.optional(),
})

const markdownCellSchema = cellBaseSchema.extend({
  _tag: z.literal('markdown_cell'),
  text: z.string(),
})

const databaseCellSchema = queryCellBaseSchema.extend({
  _tag: z.literal('database_cell'),
  sql: z.string(),
  row_limit: z.number(),
  ...databaseSourceSchema.shape,
})

const logCellSchema = queryCellBaseSchema.extend({
  _tag: z.literal('log_cell'),
  sql: z.string(),
  ...logsSourceSchema.shape,
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

// The domain shape: parses the same wire cell (`cellSchema`), transforms `sql` into a
// branded `unchecked_sql`, and defaults `view` to 'table'
const cellDomainSchema = cellSchema.transform((cell) => {
  switch (cell._tag) {
    case 'markdown_cell':
      return cell
    case 'database_cell': {
      const { sql, view, ...rest } = cell
      return { ...rest, view: view ?? 'table', unchecked_sql: untrustedSql(sql) }
    }
    case 'log_cell': {
      const { sql, view, ...rest } = cell
      return { ...rest, view: view ?? 'table', unchecked_sql: untrustedLogSql(sql) }
    }
  }
})

export const notebookDomainSchema = z.object({
  schema_version: z.literal(1),
  cells: z.array(cellDomainSchema),
})

export type NotebookContent = z.infer<typeof notebookDomainSchema>
export type Cell = z.infer<typeof cellDomainSchema>

// Reverse of cellDomainSchema's transform, for display-only conversions (e.g. deriving a
// diff preview client-side). Never promoted or executed — writes still go through
// acceptUntrustedSql/acceptUntrustedLogsSql at the point of user action.
export function toWireCell(cell: Cell): CellWire {
  switch (cell._tag) {
    case 'markdown_cell':
      return cell
    case 'database_cell': {
      const { unchecked_sql, ...rest } = cell
      return { ...rest, sql: unchecked_sql }
    }
    case 'log_cell': {
      const { unchecked_sql, ...rest } = cell
      return { ...rest, sql: unchecked_sql }
    }
  }
}

export function toWireNotebook(content: NotebookContent): NotebookWire {
  return { schema_version: content.schema_version, cells: content.cells.map(toWireCell) }
}

export type MarkdownCell = Extract<Cell, { _tag: 'markdown_cell' }>
export type DatabaseCell = Extract<Cell, { _tag: 'database_cell' }>
export type LogCell = Extract<Cell, { _tag: 'log_cell' }>
export type TimeRange = z.infer<typeof timeRangeSchema>
export type ChartConfig = z.infer<typeof chartConfigSchema>
export type DatabaseSourceParameters = z.infer<typeof databaseSourceSchema>
export type LogsSourceParameters = z.infer<typeof logsSourceSchema>

type CellKind = 'content' | 'query'

/**
 * Classifies every cell tag as content or query. The `satisfies` clause makes this the
 * registration point for a new backend: adding a member to `cellSchema` fails to compile
 * here until it is classified, and `QueryCell` / `isQueryCell` widen automatically once
 * it is — so a new cell type can never be silently left out of query-generic UI.
 */
const CELL_KINDS = {
  markdown_cell: 'content',
  database_cell: 'query',
  log_cell: 'query',
} as const satisfies Record<Cell['_tag'], CellKind>

type QueryCellTag = {
  [K in keyof typeof CELL_KINDS]: (typeof CELL_KINDS)[K] extends 'query' ? K : never
}[keyof typeof CELL_KINDS]

export type QueryCell = Extract<Cell, { _tag: QueryCellTag }>

/**
 * Narrows any cell-shaped value to its query members. Generic over the input so it works
 * on domain cells and on the deep-readonly `Snapshot<Cell>` values valtio hands the UI.
 */
export const isQueryCell = <C extends { _tag: Cell['_tag'] }>(
  cell: C
): cell is Extract<C, { _tag: QueryCellTag }> => CELL_KINDS[cell._tag] === 'query'
