import { SnippetStatus } from '@/data/content/snippet-status'

/** Start and end follows ISO8601 convention */
type AbsoluteTimeRange = { start: string; end: string }
type RelativeTimeRange = { unit: 'm' | 'h' | 'd' | 'w' | 'M' | 'y'; amount: number }
type TimeRange = AbsoluteTimeRange | RelativeTimeRange

type DatabaseQueryCell = { type: 'sql'; sql: string }
type LogsQueryCell = { type: 'logs'; sql: string; range: TimeRange }
type MarkdownCell = { type: 'markdown'; content: string }
export type NotebookCell = DatabaseQueryCell | LogsQueryCell | MarkdownCell

interface NotebookContent {
  schema_version: string
  cells: NotebookCell[]
}

export interface Notebook {
  id: string
  type: 'notebook'
  name: string
  description?: string
  visibility: 'project'
  favorite: boolean
  owner_id: number
  project_id: number
  content?: NotebookContent // Undefined until loaded
}

export interface StateNotebook {
  projectRef: string
  notebook: Notebook
  status: SnippetStatus
}
