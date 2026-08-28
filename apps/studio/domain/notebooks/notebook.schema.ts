import { Schema } from 'effect'

export const NotebookId = Schema.String.pipe(Schema.brand('NotebookId'))
export type NotebookId = typeof NotebookId.Type

export const CellId = Schema.String.pipe(Schema.brand('CellId'))
export type CellId = typeof CellId.Type

export const MarkdownCell = Schema.TaggedStruct('markdown_cell', {
  _id: CellId,
  source: Schema.String,
})
export type MarkdownCell = typeof MarkdownCell.Type

export const DatabaseCell = Schema.TaggedStruct('database_cell', {
  _id: CellId,
  sql: Schema.String,
})
export type DatabaseCell = typeof DatabaseCell.Type

export const LogCell = Schema.TaggedStruct('log_cell', {
  _id: CellId,
  sql: Schema.String,
})
export type LogCell = typeof LogCell.Type

export const Cell = Schema.Union([MarkdownCell, DatabaseCell, LogCell])
export type Cell = typeof Cell.Type

export type QueryCell = DatabaseCell | LogCell

export const isQueryCell = (cell: Cell): cell is QueryCell =>
  cell._tag === 'database_cell' || cell._tag === 'log_cell'

export const NotebookContent = Schema.Struct({
  cells: Schema.Array(Cell),
})
export type NotebookContent = typeof NotebookContent.Type

/** List-endpoint shape — omits `content`, which is fetched separately per notebook. */
export const NotebookSummary = Schema.Struct({
  id: NotebookId,
  name: Schema.String,
  favorite: Schema.Boolean,
})
export type NotebookSummary = typeof NotebookSummary.Type
