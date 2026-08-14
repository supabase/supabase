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

/**
 * One entry per cell position in the notebook that a set of operations produces, annotated
 * with what the operations did to it. `removed` entries are kept in the position the cell
 * held before its deletion so the list reads as a diff; every other entry sits where the
 * cell ends up.
 *
 * `operationIndex` is the index of the operation that produced the entry. Its main job is
 * giving `added` and `replaced` entries a stable React key: their cells have no `id` by
 * construction (`agentCellSchema` omits it — the backend assigns one on write).
 */
export type NotebookCellDiffEntry =
  | { _tag: 'unchanged'; cell: CellWire }
  | { _tag: 'added'; cell: AgentCell; operationIndex: number }
  | { _tag: 'removed'; cell: CellWire; operationIndex: number }
  | { _tag: 'replaced'; before: CellWire; after: AgentCell; operationIndex: number }
  | {
      _tag: 'moved'
      cell: CellWire
      /** The cell's zero-based position in the notebook before any operation ran. */
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

/**
 * The position an operation can anchor at, by cell id. A replaced cell still anchors: the
 * replacement holds the same position, so the old id remains a meaningful address for it
 * even though the new cell carries no `id` of its own until the backend assigns one on
 * write. Without this, an agent replacing a cell and inserting after it in the same batch
 * gets a spurious `unknown_cell_id`.
 */
function findAnchorIndex(entries: NotebookCellDiffEntry[], cellId: string): number {
  return entries.findIndex((entry) => {
    switch (entry._tag) {
      case 'unchanged':
      case 'moved':
        return entry.cell.id === cellId
      case 'replaced':
        return entry.before.id === cellId
      // A removed cell is no longer in the notebook, and an inserted cell has no id to be
      // addressed by until the backend assigns one.
      case 'added':
      case 'removed':
        return false
    }
  })
}

/**
 * The cell an operation can target by id — one still holding its original identity.
 * Replaced and removed entries are excluded because `deriveNotebookDiff` rejects two
 * operations targeting the same cell before any of them run, so those entries can never be
 * a legitimate target.
 */
function findTargetCell(
  entries: NotebookCellDiffEntry[],
  cellId: string
): { index: number; cell: CellWire } | undefined {
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    if (entry._tag !== 'unchanged' && entry._tag !== 'moved') continue
    if (entry.cell.id === cellId) return { index, cell: entry.cell }
  }
  return undefined
}

/**
 * A cell targeted by `move_cell` has not necessarily changed position — two moves can
 * anchor on each other and cancel out. Compares each moved cell's predecessors among the
 * surviving original cells and downgrades the entry to `unchanged` when that set is
 * unchanged, so a review UI doesn't badge a cell as moved when it sits exactly where it
 * started.
 */
function downgradeNoOpMoves(
  entries: NotebookCellDiffEntry[],
  notebook: NotebookWire
): NotebookCellDiffEntry[] {
  if (!entries.some((entry) => entry._tag === 'moved')) return entries

  const finalOrder = entries.flatMap((entry) =>
    entry._tag === 'unchanged' || entry._tag === 'moved' ? [entry.cell.id] : []
  )
  const survivingIds = new Set(finalOrder)
  const originalOrder = notebook.cells
    .map((cell) => cell.id)
    .filter((cellId) => survivingIds.has(cellId))

  // Both sequences are permutations of the same id set, so equal predecessor counts plus
  // containment is enough to prove the predecessor sets match.
  const hasSamePredecessors = (cellId: string) => {
    const finalPredecessors = new Set(finalOrder.slice(0, finalOrder.indexOf(cellId)))
    const originalPredecessors = originalOrder.slice(0, originalOrder.indexOf(cellId))
    return (
      originalPredecessors.length === finalPredecessors.size &&
      originalPredecessors.every((predecessor) => finalPredecessors.has(predecessor))
    )
  }

  return entries.map((entry) =>
    entry._tag === 'moved' && hasSamePredecessors(entry.cell.id)
      ? { _tag: 'unchanged', cell: entry.cell }
      : entry
  )
}

/**
 * Resolves an ordered list of operations against a notebook into one annotated entry per
 * cell position. This is the only interpreter of notebook operations —
 * `applyNotebookOperations` projects its result — so the diff a user approves cannot
 * disagree with the cells that get written.
 */
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

  const originalIndexById = new Map(notebook.cells.map((cell, index) => [cell.id, index]))
  const entries: NotebookCellDiffEntry[] = notebook.cells.map((cell) => ({
    _tag: 'unchanged',
    cell,
  }))

  const insertedAfter = new Map<string, number>()
  const insertAfter = (
    anchor: string,
    entry: NotebookCellDiffEntry
  ): NotebookOperationError | undefined => {
    const anchorIndex = anchor === CELL_ANCHOR_START ? -1 : findAnchorIndex(entries, anchor)
    if (anchor !== CELL_ANCHOR_START && anchorIndex === -1) {
      return { _tag: 'unknown_cell_id', cell_id: anchor }
    }

    // Inserts anchored at the same cell land in the order they were issued. Removed
    // entries left in place don't disturb this: prior inserts still sit immediately after
    // the anchor, so the offset lands after them.
    const offset = insertedAfter.get(anchor) ?? 0
    entries.splice(anchorIndex + 1 + offset, 0, entry)
    insertedAfter.set(anchor, offset + 1)
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
        // Marked in place rather than spliced out, so the diff can show the deletion where
        // the cell used to be.
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
          // An addressable entry only ever holds a cell from `notebook.cells`, so the
          // lookup can't miss; the current index is a harmless fallback.
          fromIndex: originalIndexById.get(found.cell.id) ?? found.index,
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
