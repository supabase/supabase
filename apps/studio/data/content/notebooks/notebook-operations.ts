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

export type NotebookCellDiffEntry =
  | { _tag: 'unchanged'; cell: CellWire }
  | { _tag: 'added'; cell: AgentCell; operationIndex: number }
  | { _tag: 'removed'; cell: CellWire; operationIndex: number }
  | { _tag: 'replaced'; before: CellWire; after: AgentCell; operationIndex: number }
  | {
      _tag: 'moved'
      cell: CellWire
      fromIndex: number
      operationIndex: number
    }

export type DeriveNotebookDiffResult =
  | { success: true; entries: NotebookCellDiffEntry[] }
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

function findAnchorIndex(entries: NotebookCellDiffEntry[], cellId: string): number {
  return entries.findIndex((entry) => {
    switch (entry._tag) {
      case 'unchanged':
      case 'moved':
        return entry.cell._id === cellId
      case 'replaced':
        return entry.before._id === cellId
      case 'added':
      case 'removed':
        return false
    }
  })
}

function findTargetCell(
  entries: NotebookCellDiffEntry[],
  cellId: string
): { index: number; cell: CellWire } | undefined {
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    if (entry._tag !== 'unchanged' && entry._tag !== 'moved') continue
    if (entry.cell._id === cellId) return { index, cell: entry.cell }
  }
  return undefined
}

function downgradeNoOpMoves(
  entries: NotebookCellDiffEntry[],
  notebook: NotebookWire
): NotebookCellDiffEntry[] {
  if (!entries.some((entry) => entry._tag === 'moved')) return entries

  const finalOrder = entries.flatMap((entry) =>
    entry._tag === 'unchanged' || entry._tag === 'moved' ? [entry.cell._id] : []
  )
  const survivingIds = new Set(finalOrder)
  const originalOrder = notebook.cells
    .map((cell) => cell._id)
    .filter((cellId) => survivingIds.has(cellId))

  const hasSamePredecessors = (cellId: string) => {
    const finalPredecessors = new Set(finalOrder.slice(0, finalOrder.indexOf(cellId)))
    const originalPredecessors = originalOrder.slice(0, originalOrder.indexOf(cellId))
    return (
      originalPredecessors.length === finalPredecessors.size &&
      originalPredecessors.every((predecessor) => finalPredecessors.has(predecessor))
    )
  }

  return entries.map((entry) =>
    entry._tag === 'moved' && hasSamePredecessors(entry.cell._id)
      ? { _tag: 'unchanged', cell: entry.cell }
      : entry
  )
}

export function deriveNotebookDiff(
  notebook: NotebookWire,
  operations: NotebookOperation[]
): DeriveNotebookDiffResult {
  const targetedIds = new Set<string>()
  for (const operation of operations) {
    const cellId = targetCellId(operation)
    if (cellId === undefined) continue

    if (targetedIds.has(cellId)) {
      return { success: false, error: { _tag: 'conflicting_operations', cell_id: cellId } }
    }
    targetedIds.add(cellId)
  }

  const originalIndexById = new Map(notebook.cells.map((cell, index) => [cell._id, index]))
  const entries: NotebookCellDiffEntry[] = notebook.cells.map((cell) => ({
    _tag: 'unchanged',
    cell,
  }))

  const insertedAfter = new Map<string, Set<NotebookCellDiffEntry>>()
  const insertAfter = (
    anchor: string,
    entry: NotebookCellDiffEntry
  ): NotebookOperationError | undefined => {
    const anchorIndex = anchor === CELL_ANCHOR_START ? -1 : findAnchorIndex(entries, anchor)
    if (anchor !== CELL_ANCHOR_START && anchorIndex === -1) {
      return { _tag: 'unknown_cell_id', cell_id: anchor }
    }

    const inserted = insertedAfter.get(anchor) ?? new Set<NotebookCellDiffEntry>()
    let index = anchorIndex + 1
    while (index < entries.length && inserted.has(entries[index])) {
      index++
    }

    entries.splice(index, 0, entry)
    inserted.add(entry)
    insertedAfter.set(anchor, inserted)
    return undefined
  }

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex++) {
    const operation = operations[operationIndex]

    switch (operation._tag) {
      case 'insert_cell': {
        const error = insertAfter(operation.after_cell_id, {
          _tag: 'added',
          cell: operation.cell,
          operationIndex,
        })
        if (error) return { success: false, error }
        break
      }
      case 'replace_cell': {
        const found = findTargetCell(entries, operation.cell_id)
        if (found === undefined) {
          return {
            success: false,
            error: { _tag: 'unknown_cell_id', cell_id: operation.cell_id },
          }
        }
        entries[found.index] = {
          _tag: 'replaced',
          before: found.cell,
          after: operation.cell,
          operationIndex,
        }
        break
      }
      case 'delete_cell': {
        const found = findTargetCell(entries, operation.cell_id)
        if (found === undefined) {
          return {
            success: false,
            error: { _tag: 'unknown_cell_id', cell_id: operation.cell_id },
          }
        }
        entries[found.index] = { _tag: 'removed', cell: found.cell, operationIndex }
        break
      }
      case 'move_cell': {
        if (operation.after_cell_id === operation.cell_id) {
          return {
            success: false,
            error: { _tag: 'conflicting_operations', cell_id: operation.cell_id },
          }
        }

        const found = findTargetCell(entries, operation.cell_id)
        if (found === undefined) {
          return {
            success: false,
            error: { _tag: 'unknown_cell_id', cell_id: operation.cell_id },
          }
        }

        entries.splice(found.index, 1)
        const error = insertAfter(operation.after_cell_id, {
          _tag: 'moved',
          cell: found.cell,
          fromIndex: originalIndexById.get(found.cell._id) ?? found.index,
          operationIndex,
        })
        if (error) return { success: false, error }
        break
      }
    }
  }

  if (!entries.some((entry) => entry._tag !== 'removed')) {
    return { success: false, error: { _tag: 'empty_result' } }
  }

  return { success: true, entries: downgradeNoOpMoves(entries, notebook) }
}

function resultingCells(entries: NotebookCellDiffEntry[]): OperationResultCell[] {
  return entries.flatMap((entry) => {
    switch (entry._tag) {
      case 'unchanged':
      case 'moved':
      case 'added':
        return [entry.cell]
      case 'replaced':
        return [entry.after]
      case 'removed':
        return []
    }
  })
}

export function applyNotebookOperations(
  notebook: NotebookWire,
  operations: NotebookOperation[]
): ApplyNotebookOperationsResult {
  const result = deriveNotebookDiff(notebook, operations)
  if (!result.success) return result

  return {
    success: true,
    notebook: {
      schema_version: notebook.schema_version,
      cells: resultingCells(result.entries),
    },
  }
}
