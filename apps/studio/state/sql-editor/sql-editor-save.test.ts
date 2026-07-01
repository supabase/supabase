import { untrustedSql } from '@supabase/pg-meta'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSaveMechanism, type SaveMechanismStore } from './sql-editor-save'
import type { StateSnippet } from './types'
import type { SnippetFolder } from '@/data/content/sql-folders-query'

function makeStateSnippet(overrides: Partial<StateSnippet['snippet']> = {}): StateSnippet {
  return {
    projectRef: 'ref',
    splitSizes: [50, 50],
    snippet: {
      id: 'snippet-1',
      type: 'sql',
      name: 'Query',
      description: '',
      visibility: 'user',
      project_id: 1,
      owner_id: 1,
      folder_id: null,
      favorite: false,
      inserted_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      status: 'new',
      content: {
        content_id: 'snippet-1',
        schema_version: '1',
        unchecked_sql: untrustedSql('select 1'),
      },
      ...overrides,
    },
  }
}

function makeFolder(id: string, name: string): SnippetFolder {
  return { id, name, owner_id: 1, project_id: 1, parent_id: null }
}

function setup(initial?: Partial<SaveMechanismStore>) {
  const state: SaveMechanismStore = {
    snippets: {},
    folders: {},
    removeFolder: vi.fn((id: string) => {
      delete state.folders[id]
    }),
    ...initial,
  }
  const upsertContent = vi.fn(async () => null)
  const createSQLSnippetFolder = vi.fn(async () => makeFolder('real-id', 'Folder'))
  const updateSQLSnippetFolder = vi.fn(async () => null)
  const invalidate = vi.fn(async () => {})
  const notify = { success: vi.fn(), error: vi.fn() }

  const mechanism = createSaveMechanism({
    state,
    upsertContent,
    createSQLSnippetFolder,
    updateSQLSnippetFolder,
    invalidate,
    notify,
    debounceMs: 1000,
  })

  return {
    state,
    upsertContent,
    createSQLSnippetFolder,
    updateSQLSnippetFolder,
    invalidate,
    notify,
    mechanism,
  }
}

describe('save mechanism — saveSnippet', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('debounces and persists a loaded snippet, transitioning new → saving → saved', async () => {
    const t = setup({ snippets: { 'snippet-1': makeStateSnippet() } })

    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    expect(t.upsertContent).not.toHaveBeenCalled() // debounced, not yet fired

    await vi.runAllTimersAsync()

    expect(t.upsertContent).toHaveBeenCalledTimes(1)
    expect(t.upsertContent).toHaveBeenCalledWith({
      projectRef: 'ref',
      payload: expect.objectContaining({ id: 'snippet-1', type: 'sql' }),
    })
    expect(t.state.snippets['snippet-1']!.snippet.status).toBe('saved')
  })

  it('does NOT call upsertContent for a snippet whose content is not loaded', async () => {
    const snippet = makeStateSnippet({ content: undefined })
    const t = setup({ snippets: { 'snippet-1': snippet } })

    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    await vi.runAllTimersAsync()

    expect(t.upsertContent).not.toHaveBeenCalled()
    // status is left untouched — nothing was persisted
    expect(t.state.snippets['snippet-1']!.snippet.status).toBe('new')
  })

  it('invalidates the lists only when shouldInvalidate is true', async () => {
    const t = setup({ snippets: { 'snippet-1': makeStateSnippet() } })

    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    await vi.runAllTimersAsync()
    expect(t.invalidate).not.toHaveBeenCalled()

    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: true })
    await vi.runAllTimersAsync()
    expect(t.invalidate).toHaveBeenCalledWith('ref')
  })

  it('transitions to save_failed when the upsert rejects', async () => {
    const t = setup({ snippets: { 'snippet-1': makeStateSnippet({ status: 'saved' }) } })
    t.upsertContent.mockRejectedValueOnce(new Error('network'))

    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    await vi.runAllTimersAsync()

    expect(t.state.snippets['snippet-1']!.snippet.status).toBe('save_failed')
  })

  it('debounces per snippet id — distinct snippets save independently', async () => {
    const t = setup({
      snippets: {
        'snippet-1': makeStateSnippet({ id: 'snippet-1' }),
        'snippet-2': makeStateSnippet({ id: 'snippet-2' }),
      },
    })

    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    t.mechanism.saveSnippet({ id: 'snippet-2', projectRef: 'ref', shouldInvalidate: false })
    await vi.runAllTimersAsync()

    expect(t.upsertContent).toHaveBeenCalledTimes(2)
  })

  it('coalesces rapid saves of the same snippet into one persist', async () => {
    const t = setup({ snippets: { 'snippet-1': makeStateSnippet() } })

    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    t.mechanism.saveSnippet({ id: 'snippet-1', projectRef: 'ref', shouldInvalidate: false })
    await vi.runAllTimersAsync()

    expect(t.upsertContent).toHaveBeenCalledTimes(1)
  })
})

describe('save mechanism — createFolder', () => {
  it('persists a new folder and swaps the local placeholder for it', async () => {
    const t = setup({
      folders: {
        'local-1': {
          projectRef: 'ref',
          status: 'new_editing',
          folder: makeFolder('local-1', ''),
        },
      },
    })

    await t.mechanism.createFolder({
      projectRef: 'ref',
      name: 'My Folder',
      placeholderId: 'local-1',
    })

    expect(t.createSQLSnippetFolder).toHaveBeenCalledWith({ projectRef: 'ref', name: 'My Folder' })
    expect(t.state.removeFolder).toHaveBeenCalledWith('local-1')
    expect(t.state.folders['real-id']).toMatchObject({ status: 'idle', folder: { id: 'real-id' } })
    expect(t.notify.success).toHaveBeenCalled()
  })

  it('rolls back the placeholder when creation fails', async () => {
    const t = setup({
      folders: {
        'local-1': {
          projectRef: 'ref',
          status: 'new_saving',
          folder: makeFolder('local-1', ''),
        },
      },
    })
    t.createSQLSnippetFolder.mockRejectedValueOnce(new Error('boom'))

    await t.mechanism.createFolder({
      projectRef: 'ref',
      name: 'My Folder',
      placeholderId: 'local-1',
    })

    expect(t.state.removeFolder).toHaveBeenCalledWith('local-1')
    expect(t.notify.error).toHaveBeenCalled()
  })
})

describe('save mechanism — updateFolder', () => {
  it('renames an existing folder and resets its status to idle', async () => {
    const t = setup({
      folders: { f1: { projectRef: 'ref', status: 'saving', folder: makeFolder('f1', 'Old') } },
    })

    await t.mechanism.updateFolder({ id: 'f1', projectRef: 'ref', name: 'New' })

    expect(t.updateSQLSnippetFolder).toHaveBeenCalledWith({
      projectRef: 'ref',
      id: 'f1',
      name: 'New',
    })
    expect(t.state.folders['f1']!.status).toBe('idle')
    expect(t.notify.success).toHaveBeenCalled()
  })

  it("rolls the name back to the folder's own previousName when the rename fails", async () => {
    const t = setup({
      folders: {
        f1: {
          projectRef: 'ref',
          status: 'saving',
          folder: makeFolder('f1', 'New'),
          previousName: 'Old',
        },
      },
    })
    t.updateSQLSnippetFolder.mockRejectedValueOnce(new Error('boom'))

    await t.mechanism.updateFolder({ id: 'f1', projectRef: 'ref', name: 'New' })

    expect(t.state.folders['f1']!.folder.name).toBe('Old')
    expect(t.state.folders['f1']!.status).toBe('idle')
    expect(t.state.folders['f1']!.previousName).toBeUndefined()
  })

  it('clears previousName on a successful rename', async () => {
    const t = setup({
      folders: {
        f1: {
          projectRef: 'ref',
          status: 'saving',
          folder: makeFolder('f1', 'New'),
          previousName: 'Old',
        },
      },
    })

    await t.mechanism.updateFolder({ id: 'f1', projectRef: 'ref', name: 'New' })

    expect(t.state.folders['f1']!.previousName).toBeUndefined()
  })

  it('rolls back each folder to its own previousName when concurrent renames fail', async () => {
    const t = setup({
      folders: {
        a: {
          projectRef: 'ref',
          status: 'saving',
          folder: makeFolder('a', 'A-new'),
          previousName: 'A-old',
        },
        b: {
          projectRef: 'ref',
          status: 'saving',
          folder: makeFolder('b', 'B-new'),
          previousName: 'B-old',
        },
      },
    })
    t.updateSQLSnippetFolder.mockRejectedValue(new Error('boom'))

    // Both renames in flight at once; each must restore its own previous name.
    await Promise.all([
      t.mechanism.updateFolder({ id: 'a', projectRef: 'ref', name: 'A-new' }),
      t.mechanism.updateFolder({ id: 'b', projectRef: 'ref', name: 'B-new' }),
    ])

    expect(t.state.folders['a']!.folder.name).toBe('A-old')
    expect(t.state.folders['b']!.folder.name).toBe('B-old')
  })
})
