import { beforeEach, describe, expect, it } from 'vitest'

import { persistNotebookDraft, readNotebookDraft } from './notebook-drafts'
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
    localStorage.clear()
  })

  it('addNotebook marks a locally-created notebook as new', () => {
    notebooksState.addNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })

    expect(notebooksState.notebooks['notebook-1'].status).toBe('new')
  })

  it('addNotebook persists a local draft immediately, even for a still-empty notebook', () => {
    notebooksState.addNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })

    const draft = readNotebookDraft({ projectRef: 'ref', id: 'notebook-1' })
    expect(draft?.name).toBe('My Notebook')
    expect(draft?.content.cells).toEqual([])
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

  it('persists a local draft of every cell edit', () => {
    notebooksState.setNotebook({
      projectRef: 'ref',
      notebook: makeNotebook('notebook-1', { updated_at: '2024-01-01T00:00:00.000Z' }),
    })

    notebooksState.updateCells({
      id: 'notebook-1',
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
    })

    const draft = readNotebookDraft({ projectRef: 'ref', id: 'notebook-1' })
    expect(draft?.content.cells).toMatchObject([{ _tag: 'markdown_cell', text: 'hello' }])
    expect(draft?.baseUpdatedAt).toBe('2024-01-01T00:00:00.000Z')
  })

  it('clears a notebook local draft once it is saved', () => {
    notebooksState.setNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })
    notebooksState.updateCells({
      id: 'notebook-1',
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
    })
    expect(readNotebookDraft({ projectRef: 'ref', id: 'notebook-1' })).toBeDefined()

    notebooksState.markSaved({ id: 'notebook-1', updatedAt: '2024-02-02T00:00:00.000Z' })

    expect(readNotebookDraft({ projectRef: 'ref', id: 'notebook-1' })).toBeUndefined()
    expect(notebooksState.notebooks['notebook-1'].notebook.updated_at).toBe(
      '2024-02-02T00:00:00.000Z'
    )
  })

  it('clears a notebook local draft when the notebook is removed', () => {
    notebooksState.setNotebook({ projectRef: 'ref', notebook: makeNotebook('notebook-1') })
    notebooksState.updateCells({
      id: 'notebook-1',
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' }],
    })

    notebooksState.removeNotebook({ id: 'notebook-1' })

    expect(readNotebookDraft({ projectRef: 'ref', id: 'notebook-1' })).toBeUndefined()
  })

  it('restores a local draft onto a freshly-loaded notebook', () => {
    persistNotebookDraft({
      projectRef: 'ref',
      id: 'notebook-1',
      name: 'Restored name',
      content: {
        schema_version: 1,
        cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'draft' }],
      },
      baseUpdatedAt: '2024-01-01T00:00:00.000Z',
    })
    notebooksState.setNotebook({
      projectRef: 'ref',
      notebook: makeNotebook('notebook-1', { updated_at: '2024-01-01T00:00:00.000Z' }),
    })

    notebooksState.restoreDraft({
      projectRef: 'ref',
      id: 'notebook-1',
      baseUpdatedAt: '2024-01-01T00:00:00.000Z',
    })

    expect(notebooksState.notebooks['notebook-1'].notebook.name).toBe('Restored name')
    expect(notebooksState.notebooks['notebook-1'].notebook.content?.cells).toMatchObject([
      { _tag: 'markdown_cell', text: 'draft' },
    ])
    expect(notebooksState.notebooks['notebook-1'].status).toBe('unsaved')
    expect(notebooksState.serverDivergedWhileDirty.has('notebook-1')).toBe(false)
  })

  it('flags a server-diverged conflict when the draft branched from a stale server version', () => {
    persistNotebookDraft({
      projectRef: 'ref',
      id: 'notebook-1',
      name: 'Restored name',
      content: { schema_version: 1, cells: [] },
      baseUpdatedAt: '2024-01-01T00:00:00.000Z',
    })
    notebooksState.setNotebook({
      projectRef: 'ref',
      notebook: makeNotebook('notebook-1', { updated_at: '2024-06-01T00:00:00.000Z' }),
    })

    notebooksState.restoreDraft({
      projectRef: 'ref',
      id: 'notebook-1',
      baseUpdatedAt: '2024-06-01T00:00:00.000Z',
    })

    expect(notebooksState.serverDivergedWhileDirty.get('notebook-1')).toBe('updated')
  })
})
