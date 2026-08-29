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

export const MAX_CHART_Y_SERIES = 3

export const chartConfigSchema = z.object({
  type: z.enum(['bar', 'line']),
  x_column: z.string(),
  y_series: z.array(z.string()).max(MAX_CHART_Y_SERIES),
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

// The read-replica `identifier`, or absent for the project's primary. An empty string is
// normalized to absent — models asked to omit this key reliably substitute "" instead of
// leaving it out.
export const databaseIdentifierSchema = z
  .string()
  .optional()
  .transform((value) => (value === '' ? undefined : value))

export const databaseSourceSchema = z.object({
  database_identifier: databaseIdentifierSchema,
})

export const logsSourceSchema = z.object({
  time_range: timeRangeSchema,
})

const markdownFieldsSchema = z.object({
  text: z.string(),
})

const queryFieldsBaseSchema = z.object({
  title: z.string().optional(),
  view: z.enum(['table', 'chart']).optional(),
  // Persisted independently of `view` so a user who switches to the table and back
  // gets their chart configuration returned rather than rebuilt.
  chart: chartConfigSchema.optional(),
})

const databaseFieldsSchema = queryFieldsBaseSchema.extend({
  sql: z.string(),
  row_limit: z.number(),
  ...databaseSourceSchema.shape,
})

const logFieldsSchema = queryFieldsBaseSchema.extend({
  sql: z.string(),
  ...logsSourceSchema.shape,
})

// The wire shape: a cell that's been saved always carries the backend's real `_id` — the
// backend assigns one on every write and returns it on every subsequent read.
const markdownCellSchema = markdownFieldsSchema.extend({
  _tag: z.literal('markdown_cell'),
  _id: z.string(),
})

const databaseCellSchema = databaseFieldsSchema.extend({
  _tag: z.literal('database_cell'),
  _id: z.string(),
})

const logCellSchema = logFieldsSchema.extend({
  _tag: z.literal('log_cell'),
  _id: z.string(),
})

const cellSchema = z.discriminatedUnion('_tag', [
  markdownCellSchema,
  databaseCellSchema,
  logCellSchema,
])

export const notebookSchema = z.object({
  schema_version: z.literal(1),
  cells: z.array(cellSchema),
})

export type NotebookWire = z.infer<typeof notebookSchema>
export type CellWire = z.infer<typeof cellSchema>

// Cells for the create/update PUT body (data/content/notebooks/notebook-upsert-mutation.ts).
// An existing cell being kept or edited carries its real backend-assigned `_id` so the
// backend can diff it against the previous version; a newly inserted cell — or one whose
// `_id` is a client-fabricated draft id (see DRAFT_ID_PREFIX below) — has no `_id` at all
// once it reaches the wire, so the backend generates one on write.
const writableCellSchema = z.discriminatedUnion('_tag', [
  markdownFieldsSchema.extend({ _tag: z.literal('markdown_cell'), _id: z.string().optional() }),
  databaseFieldsSchema.extend({ _tag: z.literal('database_cell'), _id: z.string().optional() }),
  logFieldsSchema.extend({ _tag: z.literal('log_cell'), _id: z.string().optional() }),
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

// Same shape as WritableCell/WritableNotebook but with `sql` left as a plain, unbranded
// string — the actual write-body wire shape (`_id` optional, unlike the required `_id` on
// CellWire/NotebookWire above, since a cell being created for the first time has none yet).
type WritableCellWire = z.infer<typeof writableCellSchema>
type WritableNotebookWire = z.infer<typeof writableNotebookSchema>

// Agents have restrictions on writing IDs to preserve guarantees about ID
// uniqueness
export const agentCellSchema = z.discriminatedUnion('_tag', [
  markdownFieldsSchema.extend({ _tag: z.literal('markdown_cell') }).strict(),
  databaseFieldsSchema.extend({ _tag: z.literal('database_cell') }).strict(),
  logFieldsSchema.extend({ _tag: z.literal('log_cell') }).strict(),
])

export const agentNotebookSchema = z.object({
  schema_version: z.literal(1),
  cells: z.array(agentCellSchema),
})

export type AgentNotebook = z.infer<typeof agentNotebookSchema>
export type AgentCell = z.infer<typeof agentCellSchema>

// A backend-recognized `_id` is required once a cell is saved (see cellSchema above), but a
// cell can exist client-side before that first save — created fresh in the editor (see
// components/interfaces/Explorer/utils.ts) — and needs *some* stable identity in the
// meantime for React keys and state lookups. A draft id fills that gap. It's never sent to
// the backend as a real `_id` (see wireId below): a cell with a draft id reaches the wire
// exactly like a brand-new one, so the backend assigns its own.
const DRAFT_ID_PREFIX = 'draft-'

export function generateDraftId(): string {
  return `${DRAFT_ID_PREFIX}${crypto.randomUUID()}`
}

export function isDraftId(id: string): boolean {
  return id.startsWith(DRAFT_ID_PREFIX)
}

function wireId(id: string | undefined): { _id: string } | Record<string, never> {
  return id !== undefined && !isDraftId(id) ? { _id: id } : {}
}

// The domain shape: parses the wire cell (`cellSchema`), transforms `sql` into a branded
// `unchecked_sql`, and defaults `view` to 'table'.
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

export function toWireWritableCell(cell: WritableCell): WritableCellWire {
  switch (cell._tag) {
    case 'markdown_cell': {
      const { _id, ...rest } = cell
      return { ...rest, ...wireId(_id) }
    }
    case 'database_cell': {
      const { _id, ...rest } = cell
      return { ...rest, ...wireId(_id) }
    }
    case 'log_cell': {
      const { _id, ...rest } = cell
      return { ...rest, ...wireId(_id) }
    }
  }
}

export function toWireWritableNotebook(content: WritableNotebook): WritableNotebookWire {
  return { schema_version: content.schema_version, cells: content.cells.map(toWireWritableCell) }
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
