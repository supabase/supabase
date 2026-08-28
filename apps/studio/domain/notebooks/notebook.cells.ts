import { Array as Arr, Option } from 'effect'

import type { Cell, CellId } from './notebook.schema'

const findIndexById = (cells: ReadonlyArray<Cell>, id: CellId) =>
  Arr.findFirstIndex(cells, (cell) => cell._id === id)

const moveTo = (cells: ReadonlyArray<Cell>, from: number, to: number): ReadonlyArray<Cell> => {
  const cell = cells[from]
  const without = Arr.remove(cells, from)
  const clampedTo = Math.min(Math.max(to, 0), without.length)
  return Arr.insertAt(without, clampedTo, cell).pipe(
    Option.getOrElse(() => Arr.append(without, cell))
  )
}

/**
 * Insert `cell` right after `afterId` — or at the end, if `afterId` is
 * omitted or isn't found (e.g. an empty notebook has no cell to insert after).
 */
export const insertCellAfter = (
  cells: ReadonlyArray<Cell>,
  afterId: Option.Option<CellId>,
  cell: Cell
): ReadonlyArray<Cell> => {
  const index = afterId.pipe(Option.flatMap((id) => findIndexById(cells, id)))
  return index.pipe(
    Option.match({
      onNone: () => Arr.append(cells, cell),
      onSome: (i) =>
        Arr.insertAt(cells, i + 1, cell).pipe(Option.getOrElse(() => Arr.append(cells, cell))),
    })
  )
}

export const removeCell = (cells: ReadonlyArray<Cell>, id: CellId): ReadonlyArray<Cell> =>
  Arr.filter(cells, (cell) => cell._id !== id)

export const updateCell = (
  cells: ReadonlyArray<Cell>,
  id: CellId,
  updater: (cell: Cell) => Cell
): ReadonlyArray<Cell> => Arr.map(cells, (cell) => (cell._id === id ? updater(cell) : cell))

/**
 * Shift a cell one position up or down. No-ops if the cell is already at
 * that boundary (or isn't found).
 */
export const moveCell = (
  cells: ReadonlyArray<Cell>,
  id: CellId,
  direction: 'up' | 'down'
): ReadonlyArray<Cell> => {
  const index = findIndexById(cells, id)
  if (Option.isNone(index)) return cells

  const nextIndex = direction === 'up' ? index.value - 1 : index.value + 1
  if (nextIndex < 0 || nextIndex >= cells.length) return cells

  return moveTo(cells, index.value, nextIndex)
}

/** Reorder by moving the cell at `activeId` to where `overId` currently sits. */
export const reorderCells = (
  cells: ReadonlyArray<Cell>,
  activeId: CellId,
  overId: CellId
): ReadonlyArray<Cell> => {
  const from = findIndexById(cells, activeId)
  const to = findIndexById(cells, overId)
  if (Option.isNone(from) || Option.isNone(to)) return cells

  return moveTo(cells, from.value, to.value)
}
