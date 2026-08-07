/**
 * PROTOTYPE — reference implementation of the Explorer / Notebooks schema.
 *
 * This file is the schema from the design spec, expressed as TypeScript. It is
 * deliberately standalone: nothing here imports from `state/` or `data/`, so the
 * shapes can be reviewed on their own before PR N1 turns them into zod schemas.
 *
 * Two deliberate departures from the spec text:
 *
 * 1. `QueryBinding` is inline-only. Notebook cells always own their query
 *    payload, so there are no legacy resource references to stay compatible with.
 * 2. `CellSource` is a discriminated union rather than `{ id, parameters }` with
 *    loose parameter typing. Same wire shape, but the compiler can then tell that
 *    `time_range` belongs to logs and `identifier` belongs to database.
 */

// ---------------------------------------------------------------------------
// Tabs — a tab points at any Explorer resource. Chat internals stay outside.
// ---------------------------------------------------------------------------

export type TabResource =
  | { type: 'query'; id: string }
  | { type: 'notebook'; id: string }
  | { type: 'chat'; id: string }

export type Tab = {
  id: string
  title: string
  resource: TabResource
}

/**
 * Sidebar "Recent" group — mixed across every resource type, ordered by last
 * *modification*, not by when a tab was opened. Titles are deliberately not
 * stored: they're derived from the live documents so a rename shows up here.
 */
export type RecentItem = {
  resource: TabResource
  modifiedAt: number
}

// ---------------------------------------------------------------------------
// Sources — application-wide. A source owns its endpoint and its parameters.
// ---------------------------------------------------------------------------

export type SourceId = 'database' | 'logs'

export type LogTimeRange =
  | { type: 'relative'; amount: number; unit: 'minute' | 'hour' | 'day' | 'week' }
  | { type: 'absolute'; from: string; to: string }

/** What the application declares once, at startup. */
export type Source =
  | { id: 'database'; type: 'database'; endpoint: string }
  | { id: 'logs'; type: 'logs'; endpoint: string }

/** What a cell stores: which source, plus the parameter values to send to it. */
export type CellSource =
  | { id: 'database'; parameters: { identifier?: string } }
  | { id: 'logs'; parameters: { time_range: LogTimeRange } }

// ---------------------------------------------------------------------------
// Display — the SELECT determines the columns; this only says how to draw them.
// ---------------------------------------------------------------------------

export type ChartDisplay = {
  type: 'bar' | 'line'
  x_axis: { field: string }
  series: Array<{ field: string; label?: string }>
  cumulative?: boolean
  show_labels?: boolean
  log_scale?: boolean
}

export type QueryDisplay = { type: 'table' } | { type: 'chart'; chart: ChartDisplay }

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

export type RunMode = 'manual' | 'on_open'

export type InlineQuery = {
  type: 'inline'
  source: CellSource
  sql: string
}

export type QueryCellModel = {
  id: string
  type: 'query'
  name: string
  query: InlineQuery
  display: QueryDisplay
  execution?: {
    run_mode?: RunMode
    row_limit?: number
  }
}

export type MarkdownCell = {
  id: string
  type: 'markdown'
  markdown: string
}

export type NotebookCell = QueryCellModel | MarkdownCell

export type NotebookContent = {
  schema_version: 1
  settings: {
    run_mode: RunMode
    default_row_limit: number
  }
  /** Array position defines display and execution order. */
  cells: NotebookCell[]
}

// ---------------------------------------------------------------------------
// Execution result — caller-owned state, so each surface decides where it lives
// (ad-hoc query, notebook session, or assistant message state).
// ---------------------------------------------------------------------------

export type ResultRow = Record<string, string | number | null>

export type CellResultState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'success'; rows: ResultRow[]; ranAt: string; rowLimitApplied: number }
  | { status: 'error'; message: string }

// ---------------------------------------------------------------------------
// Surfaces other than notebooks
// ---------------------------------------------------------------------------

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string }
  | {
      id: string
      role: 'assistant'
      /** The agent query block — same QueryCell shape, rendered read-only. */
      cell: QueryCellModel
      approval: 'pending' | 'approved' | 'denied'
    }
  | {
      id: string
      role: 'assistant'
      /** A notebook the Assistant can read from or create for the user. */
      notebook: { title: string; content: NotebookContent }
      approval: 'pending' | 'approved' | 'denied'
    }

export type ChatSession = {
  id: string
  name: string
  messages: ChatMessage[]
}
