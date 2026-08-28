import { Option } from 'effect'
import { describe, expect, it } from 'vitest'

import { insertCellAfter, moveCell, removeCell, reorderCells, updateCell } from './notebook.cells'
import { CellId, type Cell } from './notebook.schema'

const markdown = (id: string, source = ''): Cell => ({
  _tag: 'markdown_cell',
  _id: CellId.make(id),
  source,
})

describe('insertCellAfter', () => {
  it('appends to an empty array when afterId is omitted', () => {
    const result = insertCellAfter([], Option.none(), markdown('a'))
    expect(result.map((c) => c._id)).toEqual(['a'])
  })

  it('inserts right after the given cell', () => {
    const cells = [markdown('a'), markdown('b')]
    const result = insertCellAfter(cells, Option.some(CellId.make('a')), markdown('c'))
    expect(result.map((c) => c._id)).toEqual(['a', 'c', 'b'])
  })

  it('appends at the end when afterId is not found', () => {
    const cells = [markdown('a')]
    const result = insertCellAfter(cells, Option.some(CellId.make('missing')), markdown('c'))
    expect(result.map((c) => c._id)).toEqual(['a', 'c'])
  })
})

describe('removeCell', () => {
  it('removes the matching cell', () => {
    const cells = [markdown('a'), markdown('b')]
    expect(removeCell(cells, CellId.make('a')).map((c) => c._id)).toEqual(['b'])
  })

  it('is a no-op when the id is not found', () => {
    const cells = [markdown('a')]
    expect(removeCell(cells, CellId.make('missing'))).toEqual(cells)
  })
})

describe('updateCell', () => {
  it('applies the updater only to the matching cell', () => {
    const cells = [markdown('a', '1'), markdown('b', '2')]
    const result = updateCell(cells, CellId.make('a'), (cell) => ({ ...cell, source: 'updated' }))
    expect(result).toEqual([markdown('a', 'updated'), markdown('b', '2')])
  })
})

describe('moveCell', () => {
  it('moves a cell up', () => {
    const cells = [markdown('a'), markdown('b'), markdown('c')]
    expect(moveCell(cells, CellId.make('c'), 'up').map((c) => c._id)).toEqual(['a', 'c', 'b'])
  })

  it('moves a cell down', () => {
    const cells = [markdown('a'), markdown('b'), markdown('c')]
    expect(moveCell(cells, CellId.make('a'), 'down').map((c) => c._id)).toEqual(['b', 'a', 'c'])
  })

  it('no-ops at the top boundary', () => {
    const cells = [markdown('a'), markdown('b')]
    expect(moveCell(cells, CellId.make('a'), 'up')).toEqual(cells)
  })

  it('no-ops at the bottom boundary', () => {
    const cells = [markdown('a'), markdown('b')]
    expect(moveCell(cells, CellId.make('b'), 'down')).toEqual(cells)
  })

  it('no-ops when the id is not found', () => {
    const cells = [markdown('a')]
    expect(moveCell(cells, CellId.make('missing'), 'up')).toEqual(cells)
  })
})

describe('reorderCells', () => {
  it('moves the active cell to the position of the over cell', () => {
    const cells = [markdown('a'), markdown('b'), markdown('c')]
    expect(reorderCells(cells, CellId.make('a'), CellId.make('c')).map((c) => c._id)).toEqual([
      'b',
      'c',
      'a',
    ])
  })

  it('no-ops when either id is not found', () => {
    const cells = [markdown('a'), markdown('b')]
    expect(reorderCells(cells, CellId.make('a'), CellId.make('missing'))).toEqual(cells)
    expect(reorderCells(cells, CellId.make('missing'), CellId.make('b'))).toEqual(cells)
  })
})
