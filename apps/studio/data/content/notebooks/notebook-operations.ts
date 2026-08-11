import * as z from 'zod'

import {
  agentCellSchema,
  type AgentCell,
  type CellWire,
  type NotebookWire,
} from './notebook-schema'

export const CELL_ANCHOR_START = 'start'

const cellAnchorSchema = z
  .string()
  .describe(`The id of the cell to insert after, or "${CELL_ANCHOR_START}" for the beginning.`)

export const insertCellOperationSchema = z.object({
  _tag: z.literal('insert_cell'),
  after_cell_id: cellAnchorSchema,
  cell: agentCellSchema,
})

export const replaceCellOperationSchema = z.object({
  _tag: z.literal('replace_cell'),
  cell_id: z.string().describe('The id of the existing cell to replace.'),
  cell: agentCellSchema,
})

export const deleteCellOperationSchema = z.object({
  _tag: z.literal('delete_cell'),
  cell_id: z.string().describe('The id of the existing cell to delete.'),
})

export const moveCellOperationSchema = z.object({
  _tag: z.literal('move_cell'),
  cell_id: z.string().describe('The id of the existing cell to move.'),
  after_cell_id: cellAnchorSchema,
})

export const notebookOperationSchema = z.discriminatedUnion('_tag', [
  insertCellOperationSchema,
  replaceCellOperationSchema,
  deleteCellOperationSchema,
  moveCellOperationSchema,
])

export const notebookOperationsSchema = z.array(notebookOperationSchema)

export type InsertCellOperation = z.infer<typeof insertCellOperationSchema>
export type ReplaceCellOperation = z.infer<typeof replaceCellOperationSchema>
export type DeleteCellOperation = z.infer<typeof deleteCellOperationSchema>
export type MoveCellOperation = z.infer<typeof moveCellOperationSchema>
export type NotebookOperation = z.infer<typeof notebookOperationSchema>

export type OperationResultCell = CellWire | AgentCell

export type NotebookOperationsResult = {
  schema_version: NotebookWire['schema_version']
  cells: OperationResultCell[]
}

export type NotebookOperationError =
  | { _tag: 'unknown_cell_id'; cell_id: string }
  | { _tag: 'conflicting_operations'; cell_id: string }
  | { _tag: 'empty_result' }

export type ApplyNotebookOperationsResult =
  | { success: true; notebook: NotebookOperationsResult }
  | { success: false; error: NotebookOperationError }

function targetCellId(operation: NotebookOperation): string | undefined {
  switch (operation._tag) {
    case 'insert_cell':
      return undefined
    case 'replace_cell':
    case 'delete_cell':
    case 'move_cell':
      return operation.cell_id
  }
}

function referencedCellIds(operation: NotebookOperation): string[] {
  switch (operation._tag) {
    case 'insert_cell':
      return operation.after_cell_id === CELL_ANCHOR_START ? [] : [operation.after_cell_id]
    case 'replace_cell':
    case 'delete_cell':
      return [operation.cell_id]
    case 'move_cell': {
      const anchors = operation.after_cell_id === CELL_ANCHOR_START ? [] : [operation.after_cell_id]
      return [operation.cell_id, ...anchors]
    }
  }
}

export function applyNotebookOperations(
  notebook: NotebookWire,
  operations: NotebookOperation[]
): ApplyNotebookOperationsResult {
  const existingIds = new Set(notebook.cells.map((cell) => cell.id))

  for (const operation of operations) {
    for (const cellId of referencedCellIds(operation)) {
      if (!existingIds.has(cellId)) {
        return { success: false, error: { _tag: 'unknown_cell_id', cell_id: cellId } }
      }
    }

    // A move targeting its own anchor is a no-op that's simplest to reject as a conflict
    // rather than special-case through the anchor-resolution logic below.
    if (operation._tag === 'move_cell' && operation.after_cell_id === operation.cell_id) {
      return {
        success: false,
        error: { _tag: 'conflicting_operations', cell_id: operation.cell_id },
      }
    }
  }

  const targetedIds = new Set<string>()
  for (const operation of operations) {
    const cellId = targetCellId(operation)
    if (cellId === undefined) continue

    if (targetedIds.has(cellId)) {
      return { success: false, error: { _tag: 'conflicting_operations', cell_id: cellId } }
    }
    targetedIds.add(cellId)
  }

  const deletedIds = new Set(
    operations.filter((op) => op._tag === 'delete_cell').map((op) => op.cell_id)
  )
  const replacements = new Map(
    operations
      .filter((op): op is ReplaceCellOperation => op._tag === 'replace_cell')
      .map((op) => [op.cell_id, op.cell])
  )
  const movedIds = new Set(
    operations.filter((op) => op._tag === 'move_cell').map((op) => op.cell_id)
  )

  const insertionsAfter = new Map<string, OperationResultCell[]>()
  const appendInsertion = (anchor: string, cell: OperationResultCell) => {
    const existing = insertionsAfter.get(anchor)
    if (existing) {
      existing.push(cell)
    } else {
      insertionsAfter.set(anchor, [cell])
    }
  }

  for (const operation of operations) {
    if (operation._tag === 'insert_cell') {
      appendInsertion(operation.after_cell_id, operation.cell)
    } else if (operation._tag === 'move_cell') {
      const movedCell = notebook.cells.find((cell) => cell.id === operation.cell_id)
      if (movedCell) appendInsertion(operation.after_cell_id, movedCell)
    }
  }

  const resultCells: OperationResultCell[] = [...(insertionsAfter.get(CELL_ANCHOR_START) ?? [])]

  for (const cell of notebook.cells) {
    if (!deletedIds.has(cell.id) && !movedIds.has(cell.id)) {
      const replacement = replacements.get(cell.id)
      resultCells.push(replacement ?? cell)
    }

    resultCells.push(...(insertionsAfter.get(cell.id) ?? []))
  }

  if (resultCells.length === 0) {
    return { success: false, error: { _tag: 'empty_result' } }
  }

  return {
    success: true,
    notebook: { schema_version: notebook.schema_version, cells: resultCells },
  }
}
