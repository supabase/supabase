import { untrustedSql } from '@supabase/pg-meta'
import { proxy } from 'valtio'
import { proxyMap } from 'valtio/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSaveScheduler, type SaveMode } from './sql-editor-save-scheduler'
import type { StateSnippet, StateSnippetFolder } from './types'

// Valtio notifies subscribers on a microtask; flush past it before asserting.
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

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
      status: 'saved',
      content: { content_id: 'snippet-1', schema_version: '1', unchecked_sql: untrustedSql('x') },
      ...overrides,
    },
  }
}

function makeStateFolder(
  status: StateSnippetFolder['status'],
  name = 'Folder'
): StateSnippetFolder {
  return {
    projectRef: 'ref',
    status,
    folder: { id: 'f1', name, owner_id: 1, project_id: 1, parent_id: null },
  }
}

function setup(mode: SaveMode = 'auto') {
  const state = proxy({
    needsSaving: proxyMap<string, boolean>(),
    pendingFolderSaves: proxyMap<string, boolean>(),
    snippets: {} as Record<string, StateSnippet>,
    folders: {} as Record<string, StateSnippetFolder>,
  })

  const saveMechanism = { saveSnippet: vi.fn(), createFolder: vi.fn(), updateFolder: vi.fn() }
  const notify = { success: vi.fn(), error: vi.fn() }
  let saveMode = mode

  const scheduler = createSaveScheduler({
    state,
    saveMechanism,
    notify,
    getSaveMode: () => saveMode,
  })

  return { state, saveMechanism, notify, scheduler, setMode: (m: SaveMode) => (saveMode = m) }
}

describe('save scheduler — auto mode', () => {
  let stop: () => void = () => {}
  afterEach(() => stop())

  it('drains the snippet queue, saving each with its shouldInvalidate flag', async () => {
    const t = setup('auto')
    stop = t.scheduler.start()

    t.state.snippets['snippet-1'] = makeStateSnippet()
    t.state.needsSaving.set('snippet-1', true)
    await flush()

    expect(t.saveMechanism.saveSnippet).toHaveBeenCalledWith({
      id: 'snippet-1',
      projectRef: 'ref',
      shouldInvalidate: true,
    })
    expect(t.state.needsSaving.has('snippet-1')).toBe(false) // dequeued
  })

  it('dispatches each queued snippet exactly once (claim-first; no double save)', async () => {
    const t = setup('auto')
    stop = t.scheduler.start()

    t.state.snippets['a'] = makeStateSnippet({ id: 'a' })
    t.state.snippets['b'] = makeStateSnippet({ id: 'b' })
    t.state.needsSaving.set('a', false)
    t.state.needsSaving.set('b', false)
    await flush()

    expect(t.saveMechanism.saveSnippet).toHaveBeenCalledTimes(2)
    expect(t.state.needsSaving.size).toBe(0)
  })

  it('does not save a shared snippet that would land in a folder, and surfaces an error', async () => {
    const t = setup('auto')
    stop = t.scheduler.start()

    t.state.snippets['snippet-1'] = makeStateSnippet({
      visibility: 'project',
      folder_id: 'folder-1',
    })
    t.state.needsSaving.set('snippet-1', false)
    await flush()

    expect(t.saveMechanism.saveSnippet).not.toHaveBeenCalled()
    expect(t.notify.error).toHaveBeenCalledWith('Shared snippet cannot be within a folder')
  })

  it('routes new folders to createFolder and persisted folders to updateFolder', async () => {
    const t = setup('auto')
    stop = t.scheduler.start()

    t.state.folders['f1'] = makeStateFolder('new_saving')
    t.state.pendingFolderSaves.set('f1', true)
    await flush()
    expect(t.saveMechanism.createFolder).toHaveBeenCalledWith({
      projectRef: 'ref',
      name: 'Folder',
      placeholderId: 'f1',
    })

    t.state.folders['f1'] = makeStateFolder('saving')
    t.state.pendingFolderSaves.set('f1', true)
    await flush()
    expect(t.saveMechanism.updateFolder).toHaveBeenCalledWith({
      id: 'f1',
      projectRef: 'ref',
      name: 'Folder',
    })
  })

  it('stops saving after the subscription is torn down', async () => {
    const t = setup('auto')
    const teardown = t.scheduler.start()
    teardown()

    t.state.snippets['snippet-1'] = makeStateSnippet()
    t.state.needsSaving.set('snippet-1', true)
    await flush()

    expect(t.saveMechanism.saveSnippet).not.toHaveBeenCalled()
  })
})

describe('save scheduler — manual mode', () => {
  let stop: () => void = () => {}
  afterEach(() => stop())

  it('leaves edited snippets queued instead of auto-saving', async () => {
    const t = setup('manual')
    stop = t.scheduler.start()

    t.state.snippets['snippet-1'] = makeStateSnippet()
    t.state.needsSaving.set('snippet-1', true)
    await flush()

    expect(t.saveMechanism.saveSnippet).not.toHaveBeenCalled()
    expect(t.state.needsSaving.has('snippet-1')).toBe(true) // still dirty
  })

  it('still persists folder creates/renames (not gated by save mode)', async () => {
    const t = setup('manual')
    stop = t.scheduler.start()

    t.state.folders['f1'] = makeStateFolder('saving')
    t.state.pendingFolderSaves.set('f1', true)
    await flush()

    expect(t.saveMechanism.updateFolder).toHaveBeenCalled()
  })
})

describe('save scheduler — requestSave', () => {
  it('saves immediately regardless of mode', () => {
    const t = setup('manual')
    t.state.snippets['snippet-1'] = makeStateSnippet()

    t.scheduler.requestSave('snippet-1')

    expect(t.saveMechanism.saveSnippet).toHaveBeenCalledWith({
      id: 'snippet-1',
      projectRef: 'ref',
      shouldInvalidate: true,
    })
  })
})
