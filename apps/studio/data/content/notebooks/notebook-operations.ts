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

export function describeNotebookOperationError(error: NotebookOperationError): string {
  switch (error._tag) {
    case 'unknown_cell_id':
      return `No cell with id "${error.cell_id}" exists in this notebook.`
    case 'conflicting_operations':
      return `More than one operation targets cell "${error.cell_id}".`
    case 'empty_result':
      return 'This update would leave the notebook with no cells.'
  }
}

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

export function applyNotebookOperations(
  notebook: NotebookWire,
  operations: NotebookOperation[]
): ApplyNotebookOperationsResult {
  const targetedIds = new Set<string>()
  for (const operation of operations) {
    const cellId = targetCellId(operation)
    if (cellId === undefined) continue

    if (targetedIds.has(cellId)) {
      return { success: false, error: { _tag: 'conflicting_operations', cell_id: cellId } }
    }
    targetedIds.add(cellId)
  }

  const cells: OperationResultCell[] = [...notebook.cells]
  const indexOfCellId = (cellId: string) =>
    cells.findIndex((cell) => 'id' in cell && cell.id === cellId)

  const insertedAfter = new Map<string, number>()
  const insertAfter = (
    anchor: string,
    item: OperationResultCell
  ): NotebookOperationError | undefined => {
    const anchorIndex = anchor === CELL_ANCHOR_START ? -1 : indexOfCellId(anchor)
    if (anchor !== CELL_ANCHOR_START && anchorIndex === -1) {
      return { _tag: 'unknown_cell_id', cell_id: anchor }
    }

    const offset = insertedAfter.get(anchor) ?? 0
    cells.splice(anchorIndex + 1 + offset, 0, item)
    insertedAfter.set(anchor, offset + 1)
    return undefined
  }

  for (const operation of operations) {
    switch (operation._tag) {
      case 'insert_cell': {
        const error = insertAfter(operation.after_cell_id, operation.cell)
        if (error) return { success: false, error }
        break
      }
      case 'replace_cell': {
        const index = indexOfCellId(operation.cell_id)
        if (index === -1) {
          return {
            success: false,
            error: { _tag: 'unknown_cell_id', cell_id: operation.cell_id },
          }
        }
        cells[index] = operation.cell
        break
      }
      case 'delete_cell': {
        const index = indexOfCellId(operation.cell_id)
        if (index === -1) {
          return {
            success: false,
            error: { _tag: 'unknown_cell_id', cell_id: operation.cell_id },
          }
        }
        cells.splice(index, 1)
        break
      }
      case 'move_cell': {
        if (operation.after_cell_id === operation.cell_id) {
          return {
            success: false,
            error: { _tag: 'conflicting_operations', cell_id: operation.cell_id },
          }
        }

        const fromIndex = indexOfCellId(operation.cell_id)
        if (fromIndex === -1) {
          return {
            success: false,
            error: { _tag: 'unknown_cell_id', cell_id: operation.cell_id },
          }
        }

        const [movedCell] = cells.splice(fromIndex, 1)
        const error = insertAfter(operation.after_cell_id, movedCell)
        if (error) return { success: false, error }
        break
      }
    }
  }

  if (cells.length === 0) {
    return { success: false, error: { _tag: 'empty_result' } }
  }

  return {
    success: true,
    notebook: { schema_version: notebook.schema_version, cells },
  }
}
