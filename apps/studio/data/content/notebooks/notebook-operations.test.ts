import { describe, expect, it } from 'vitest'

import {
  applyNotebookOperations,
  deriveNotebookDiff,
  type NotebookOperation,
} from './notebook-operations'
import type { NotebookWire } from './notebook-schema'

const NOTEBOOK: NotebookWire = {
  schema_version: 1,
  cells: [
    { _tag: 'markdown_cell', _id: 'cell-1', text: '# Intro' },
    { _tag: 'database_cell', _id: 'cell-2', sql: 'select 1', row_limit: 100 },
    { _tag: 'markdown_cell', _id: 'cell-3', text: '# Outro' },
  ],
}

const NEW_MARKDOWN_CELL = { _tag: 'markdown_cell' as const, text: '# New' }

describe('applyNotebookOperations', () => {
  it('inserts a cell after an existing cell', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'insert_cell', after_cell_id: 'cell-1', cell: NEW_MARKDOWN_CELL },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(
      result.notebook.cells.map((cell) => ('_id' in cell ? cell._id : 'text' in cell && cell.text))
    ).toEqual(['cell-1', '# New', 'cell-2', 'cell-3'])
  })

  it('inserts a cell at the start', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'insert_cell', after_cell_id: 'start', cell: NEW_MARKDOWN_CELL },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells[0]).toEqual(NEW_MARKDOWN_CELL)
  })

  it('preserves insertion order for multiple inserts anchored at the same cell', () => {
    const ops: NotebookOperation[] = [
      {
        _tag: 'insert_cell',
        after_cell_id: 'cell-1',
        cell: { _tag: 'markdown_cell', text: 'first' },
      },
      {
        _tag: 'insert_cell',
        after_cell_id: 'cell-1',
        cell: { _tag: 'markdown_cell', text: 'second' },
      },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    const texts = result.notebook.cells.map((cell) => ('text' in cell ? cell.text : undefined))
    expect(texts).toEqual(['# Intro', 'first', 'second', undefined, '# Outro'])
  })

  it('replaces a cell in place and drops its id', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells).toEqual([NOTEBOOK.cells[0], NEW_MARKDOWN_CELL, NOTEBOOK.cells[2]])
  })

  it('deletes a cell', () => {
    const ops: NotebookOperation[] = [{ _tag: 'delete_cell', cell_id: 'cell-2' }]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells).toEqual([NOTEBOOK.cells[0], NOTEBOOK.cells[2]])
  })

  it('moves a cell after another cell', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-1', after_cell_id: 'cell-3' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells.map((cell) => ('_id' in cell ? cell._id : undefined))).toEqual([
      'cell-2',
      'cell-3',
      'cell-1',
    ])
  })

  it('moves a cell to the start', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-3', after_cell_id: 'start' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells.map((cell) => ('_id' in cell ? cell._id : undefined))).toEqual([
      'cell-3',
      'cell-1',
      'cell-2',
    ])
  })

  it('resolves a move anchored on another moved cell using its new position', () => {
    // cell-1 moves after cell-3 first, landing at [cell-2, cell-3, cell-1]; cell-2 then moves
    // after cell-1's *new* position, giving [cell-3, cell-1, cell-2].
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-1', after_cell_id: 'cell-3' },
      { _tag: 'move_cell', cell_id: 'cell-2', after_cell_id: 'cell-1' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells.map((cell) => ('_id' in cell ? cell._id : undefined))).toEqual([
      'cell-3',
      'cell-1',
      'cell-2',
    ])
  })

  it('produces a different result when the same two moves are given in the opposite order', () => {
    // cell-2 moves after cell-1 first — a no-op, since it's already there — landing at
    // [cell-1, cell-2, cell-3]; cell-1 then moves after cell-3, giving [cell-2, cell-3, cell-1].
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-2', after_cell_id: 'cell-1' },
      { _tag: 'move_cell', cell_id: 'cell-1', after_cell_id: 'cell-3' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells.map((cell) => ('_id' in cell ? cell._id : undefined))).toEqual([
      'cell-2',
      'cell-3',
      'cell-1',
    ])
  })

  it('resolves two moves that anchor on each other back to the original order', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-1', after_cell_id: 'cell-2' },
      { _tag: 'move_cell', cell_id: 'cell-2', after_cell_id: 'cell-1' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells.map((cell) => ('_id' in cell ? cell._id : undefined))).toEqual([
      'cell-1',
      'cell-2',
      'cell-3',
    ])
  })

  it('applies an insert, a replace, and a delete together', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'delete_cell', cell_id: 'cell-1' },
      { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
      {
        _tag: 'insert_cell',
        after_cell_id: 'cell-3',
        cell: { _tag: 'markdown_cell', text: 'end' },
      },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.notebook.cells).toEqual([
      NEW_MARKDOWN_CELL,
      NOTEBOOK.cells[2],
      { _tag: 'markdown_cell', text: 'end' },
    ])
  })

  it('returns unknown_cell_id when after_cell_id does not exist', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'insert_cell', after_cell_id: 'missing', cell: NEW_MARKDOWN_CELL },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({
      success: false,
      error: { _tag: 'unknown_cell_id', cell_id: 'missing' },
    })
  })

  it('returns unknown_cell_id when a targeted cell_id does not exist', () => {
    const ops: NotebookOperation[] = [{ _tag: 'delete_cell', cell_id: 'missing' }]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({
      success: false,
      error: { _tag: 'unknown_cell_id', cell_id: 'missing' },
    })
  })

  it('returns conflicting_operations when two ops target the same cell', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'delete_cell', cell_id: 'cell-2' },
      { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({
      success: false,
      error: { _tag: 'conflicting_operations', cell_id: 'cell-2' },
    })
  })

  it('returns conflicting_operations when a move targets its own anchor', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-2', after_cell_id: 'cell-2' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({
      success: false,
      error: { _tag: 'conflicting_operations', cell_id: 'cell-2' },
    })
  })

  it('returns empty_result when every cell is deleted', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'delete_cell', cell_id: 'cell-1' },
      { _tag: 'delete_cell', cell_id: 'cell-2' },
      { _tag: 'delete_cell', cell_id: 'cell-3' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({ success: false, error: { _tag: 'empty_result' } })
  })

  it('anchors an insert on a cell that an earlier operation replaced', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
      { _tag: 'insert_cell', after_cell_id: 'cell-2', cell: { _tag: 'markdown_cell', text: 'x' } },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      notebook: {
        schema_version: 1,
        cells: [
          NOTEBOOK.cells[0],
          NEW_MARKDOWN_CELL,
          { _tag: 'markdown_cell', text: 'x' },
          NOTEBOOK.cells[2],
        ],
      },
    })
  })

  it('anchors a move on a cell that an earlier operation replaced', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
      { _tag: 'move_cell', cell_id: 'cell-3', after_cell_id: 'cell-2' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      notebook: {
        schema_version: 1,
        cells: [NOTEBOOK.cells[0], NEW_MARKDOWN_CELL, NOTEBOOK.cells[2]],
      },
    })
  })

  it('still rejects an operation targeting a cell that an earlier operation replaced', () => {
    // A replaced cell can be anchored on, but not targeted — the conflict pre-pass rejects
    // the batch before any operation runs.
    const ops: NotebookOperation[] = [
      { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
      { _tag: 'delete_cell', cell_id: 'cell-2' },
    ]

    const result = applyNotebookOperations(NOTEBOOK, ops)

    expect(result).toEqual({
      success: false,
      error: { _tag: 'conflicting_operations', cell_id: 'cell-2' },
    })
  })
})

describe('deriveNotebookDiff', () => {
  it('annotates every cell as unchanged when there are no operations', () => {
    const result = deriveNotebookDiff(NOTEBOOK, [])

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'unchanged', cell: NOTEBOOK.cells[0] },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[1] },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[2] },
      ],
    })
  })

  it('annotates an inserted cell as added in its resulting position', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'insert_cell', after_cell_id: 'cell-1', cell: NEW_MARKDOWN_CELL },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'unchanged', cell: NOTEBOOK.cells[0] },
        { _tag: 'added', cell: NEW_MARKDOWN_CELL, operationIndex: 0 },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[1] },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[2] },
      ],
    })
  })

  it('annotates a replaced cell in place, keeping both sides', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'unchanged', cell: NOTEBOOK.cells[0] },
        {
          _tag: 'replaced',
          before: NOTEBOOK.cells[1],
          after: NEW_MARKDOWN_CELL,
          operationIndex: 0,
        },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[2] },
      ],
    })
  })

  it('keeps a deleted cell in the position it used to hold', () => {
    const ops: NotebookOperation[] = [{ _tag: 'delete_cell', cell_id: 'cell-2' }]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'unchanged', cell: NOTEBOOK.cells[0] },
        { _tag: 'removed', cell: NOTEBOOK.cells[1], operationIndex: 0 },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[2] },
      ],
    })
  })

  it('annotates a moved cell with the position it started from', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-1', after_cell_id: 'cell-3' },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'unchanged', cell: NOTEBOOK.cells[1] },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[2] },
        { _tag: 'moved', cell: NOTEBOOK.cells[0], fromIndex: 0, operationIndex: 0 },
      ],
    })
  })

  it('reports fromIndex against the original notebook, not the shifted working order', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'delete_cell', cell_id: 'cell-1' },
      { _tag: 'move_cell', cell_id: 'cell-3', after_cell_id: 'start' },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'moved', cell: NOTEBOOK.cells[2], fromIndex: 2, operationIndex: 1 },
        { _tag: 'removed', cell: NOTEBOOK.cells[0], operationIndex: 0 },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[1] },
      ],
    })
  })

  it('downgrades moves that cancel out to unchanged', () => {
    // Same operations as the applyNotebookOperations case that lands back on the original
    // order: nothing actually moved, so nothing should be badged as moved.
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-1', after_cell_id: 'cell-2' },
      { _tag: 'move_cell', cell_id: 'cell-2', after_cell_id: 'cell-1' },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'unchanged', cell: NOTEBOOK.cells[0] },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[1] },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[2] },
      ],
    })
  })

  it('keeps reporting moves that do change the order', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'move_cell', cell_id: 'cell-1', after_cell_id: 'cell-3' },
      { _tag: 'move_cell', cell_id: 'cell-2', after_cell_id: 'cell-1' },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.entries.map((entry) => entry._tag)).toEqual(['unchanged', 'moved', 'moved'])
  })

  it('keeps a removed entry in place when a move is downgraded to unchanged', () => {
    // Moving cell-3 after cell-1 is a no-op once cell-2 is deleted, so cell-2 has to stay in
    // the position it held rather than being pushed below cell-3.
    const ops: NotebookOperation[] = [
      { _tag: 'delete_cell', cell_id: 'cell-2' },
      { _tag: 'move_cell', cell_id: 'cell-3', after_cell_id: 'cell-1' },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result).toEqual({
      success: true,
      entries: [
        { _tag: 'unchanged', cell: NOTEBOOK.cells[0] },
        { _tag: 'removed', cell: NOTEBOOK.cells[1], operationIndex: 0 },
        { _tag: 'unchanged', cell: NOTEBOOK.cells[2] },
      ],
    })
  })

  it('leaves removed entries out of the way of inserts anchored at the same cell', () => {
    const ops: NotebookOperation[] = [
      { _tag: 'delete_cell', cell_id: 'cell-2' },
      {
        _tag: 'insert_cell',
        after_cell_id: 'cell-1',
        cell: { _tag: 'markdown_cell', text: '1st' },
      },
      {
        _tag: 'insert_cell',
        after_cell_id: 'cell-1',
        cell: { _tag: 'markdown_cell', text: '2nd' },
      },
    ]

    const result = deriveNotebookDiff(NOTEBOOK, ops)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.entries.map((entry) => entry._tag)).toEqual([
      'unchanged',
      'added',
      'added',
      'removed',
      'unchanged',
    ])
    // The removed entry sits in the middle of the entry list but must not affect the order
    // the surviving cells end up in.
    expect(applyNotebookOperations(NOTEBOOK, ops)).toEqual({
      success: true,
      notebook: {
        schema_version: 1,
        cells: [
          NOTEBOOK.cells[0],
          { _tag: 'markdown_cell', text: '1st' },
          { _tag: 'markdown_cell', text: '2nd' },
          NOTEBOOK.cells[2],
        ],
      },
    })
  })

  it('reports the same errors as applyNotebookOperations', () => {
    expect(deriveNotebookDiff(NOTEBOOK, [{ _tag: 'delete_cell', cell_id: 'missing' }])).toEqual({
      success: false,
      error: { _tag: 'unknown_cell_id', cell_id: 'missing' },
    })
    expect(
      deriveNotebookDiff(NOTEBOOK, [
        { _tag: 'delete_cell', cell_id: 'cell-2' },
        { _tag: 'replace_cell', cell_id: 'cell-2', cell: NEW_MARKDOWN_CELL },
      ])
    ).toEqual({
      success: false,
      error: { _tag: 'conflicting_operations', cell_id: 'cell-2' },
    })
    expect(
      deriveNotebookDiff(NOTEBOOK, [
        { _tag: 'delete_cell', cell_id: 'cell-1' },
        { _tag: 'delete_cell', cell_id: 'cell-2' },
        { _tag: 'delete_cell', cell_id: 'cell-3' },
      ])
    ).toEqual({ success: false, error: { _tag: 'empty_result' } })
  })
})
