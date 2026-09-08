import { beforeEach, describe, expect, it } from 'vitest'

import { notebooksState } from './notebooks-state'
import type { Notebook } from './types'
import type { Notebooks } from '@/types'

function makeNotebook(id: string, overrides: Partial<Notebook> = {}): Notebook {
  return {
    id,
    type: 'notebook',
    name: 'My Notebook',
    description: '',
    visibility: 'project',
    favorite: false,
    owner_id: 7,
    project_id: 42,
    content: { schema_version: 1, cells: [] },
    ...overrides,
  }
}

describe('notebooksState', () => {
  beforeEach(() => {
    // notebooksState is a module-level singleton, so reset the state these tests touch
    for (const id of Object.keys(notebooksState.notebooks)) {
      delete notebooksState.notebooks[id]
    }
    notebooksState.needsSaving.clear()
    notebooksState.cellLocalState.clear()
    notebooksState.serverDivergedWhileDirty.clear()
  })

  it('addNotebook marks a locally-created notebook as new', () => {
    notebooksState.addNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })

    expect(notebooksState.notebooks['notebook-1'].status).toBe('new')
  })

  it('setNotebook marks a notebook not yet in the store as saved', () => {
    notebooksState.setNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })

    expect(notebooksState.notebooks['notebook-1'].status).toBe('saved')
  })

  it('keeps query visibility in session state without marking the notebook as edited', () => {
    const queryCell = {
      _tag: 'database_cell' as const,
      _id: 'cell-1',
      unchecked_sql: '' as Notebooks.DatabaseCell['unchecked_sql'],
      row_limit: 100,
      view: 'table' as const,
    }
    notebooksState.setNotebook({
      projectRef: 'ref',
      notebook: makeNotebook('notebook-1', {
        content: { schema_version: 1, cells: [queryCell] },
      }),
    })

    expect(notebooksState.cellLocalState.has('cell-1')).toBe(false)

    notebooksState.setQueryVisibility({ cellId: 'cell-1', showQuery: true })

    expect(notebooksState.cellLocalState.get('cell-1')).toEqual({ showQuery: true })
    expect(notebooksState.notebooks['notebook-1'].status).toBe('saved')
    expect(notebooksState.needsSaving.has('notebook-1')).toBe(false)
  })

  it('editing a loaded (saved) notebook transitions it to unsaved and queues it for saving', () => {
    notebooksState.setNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })

    notebooksState.updateCells({
      id: 'notebook-1',
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
    })

    expect(notebooksState.notebooks['notebook-1'].status).toBe('unsaved')
    expect(notebooksState.needsSaving.get('notebook-1')).toBe(false)
  })

  it('editing a notebook that has never been saved keeps it as new', () => {
    notebooksState.addNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })

    notebooksState.updateCells({
      id: 'notebook-1',
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
    })

    expect(notebooksState.notebooks['notebook-1'].status).toBe('new')
  })

  it('setNotebook does not downgrade an already-loaded notebook back to saved after edits', () => {
    notebooksState.setNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })
    notebooksState.updateCells({
      id: 'notebook-1',
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
    })
    expect(notebooksState.notebooks['notebook-1'].status).toBe('unsaved')

    // Re-fetching/merging content for the same notebook (e.g. a second setNotebook
    // call) must not reset its status back to 'saved' while edits are pending.
    notebooksState.setNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })

    expect(notebooksState.notebooks['notebook-1'].status).toBe('unsaved')
  })

  it('marks and explicitly clears server divergence', () => {
    notebooksState.markServerDivergence({ id: 'notebook-1', type: 'updated' })

    expect(notebooksState.serverDivergedWhileDirty.get('notebook-1')).toBe('updated')

    notebooksState.clearServerDivergence({ id: 'notebook-1' })

    expect(notebooksState.serverDivergedWhileDirty.has('notebook-1')).toBe(false)
  })

  it('clears server divergence after saving a notebook', () => {
    notebooksState.addNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })
    notebooksState.markServerDivergence({ id: 'notebook-1', type: 'updated' })

    notebooksState.markSaved({ id: 'notebook-1' })

    expect(notebooksState.notebooks['notebook-1'].status).toBe('saved')
    expect(notebooksState.serverDivergedWhileDirty.has('notebook-1')).toBe(false)
  })

  it('clears server divergence when removing a notebook', () => {
    notebooksState.addNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })
    notebooksState.markServerDivergence({ id: 'notebook-1', type: 'deleted' })

    notebooksState.removeNotebook({ id: 'notebook-1' })

    expect(notebooksState.notebooks['notebook-1']).toBeUndefined()
    expect(notebooksState.serverDivergedWhileDirty.has('notebook-1')).toBe(false)
  })
})
