import { describe, expect, it } from 'vitest'

import { applyNotebookOperations, type NotebookOperation } from './notebook-operations'
import type { NotebookWire } from './notebook-schema'

const NOTEBOOK: NotebookWire = {
  schema_version: 1,
  cells: [
    { _tag: 'markdown_cell', id: 'cell-1', text: '# Intro' },
    { _tag: 'database_cell', id: 'cell-2', sql: 'select 1', row_limit: 100 },
    { _tag: 'markdown_cell', id: 'cell-3', text: '# Outro' },
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
      result.notebook.cells.map((cell) => ('id' in cell ? cell.id : 'text' in cell && cell.text))
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
    expect(result.notebook.cells.map((cell) => ('id' in cell ? cell.id : undefined))).toEqual([
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
    expect(result.notebook.cells.map((cell) => ('id' in cell ? cell.id : undefined))).toEqual([
      'cell-3',
      'cell-1',
      'cell-2',
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
})
