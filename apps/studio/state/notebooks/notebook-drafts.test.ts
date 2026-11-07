import { untrustedSql } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  hasNotebookDraft,
  MAX_PERSISTED_NOTEBOOK_DRAFTS,
  persistNotebookDraft,
  readNotebookDraft,
  removeNotebookDraft,
} from './notebook-drafts'
import type { NotebookContent } from '@/data/content/notebooks/notebook-schema'

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: (key: string) => values.delete(key),
  }
}

const makeContent = (sql = 'select 1'): NotebookContent => ({
  schema_version: 1,
  cells: [
    { _tag: 'markdown_cell', _id: 'cell-1', text: 'hello' },
    {
      _tag: 'database_cell',
      _id: 'cell-2',
      unchecked_sql: untrustedSql(sql),
      row_limit: 100,
      view: 'table',
    },
  ],
})

describe('notebook drafts', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('persists and reads back a draft, re-branding SQL through the domain parse', () => {
    const storage = createMemoryStorage()

    persistNotebookDraft({
      storage,
      projectRef: 'project-a',
      id: 'notebook-1',
      name: 'My notebook',
      content: makeContent('select * from users'),
      baseUpdatedAt: '2024-01-01T00:00:00.000Z',
    })

    const draft = readNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-1' })

    expect(draft?.name).toBe('My notebook')
    expect(draft?.baseUpdatedAt).toBe('2024-01-01T00:00:00.000Z')
    expect(draft?.content.cells).toMatchObject([
      { _tag: 'markdown_cell', text: 'hello' },
      { _tag: 'database_cell', unchecked_sql: 'select * from users' },
    ])
  })

  it('scopes drafts by project ref', () => {
    const storage = createMemoryStorage()
    persistNotebookDraft({
      storage,
      projectRef: 'project-a',
      id: 'notebook-1',
      name: 'My notebook',
      content: makeContent(),
      baseUpdatedAt: null,
    })

    expect(
      readNotebookDraft({ storage, projectRef: 'project-b', id: 'notebook-1' })
    ).toBeUndefined()
  })

  it('reports whether a draft exists without needing to parse its content', () => {
    const storage = createMemoryStorage()
    expect(hasNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-1' })).toBe(false)

    persistNotebookDraft({
      storage,
      projectRef: 'project-a',
      id: 'notebook-1',
      name: 'My notebook',
      content: makeContent(),
      baseUpdatedAt: null,
    })

    expect(hasNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-1' })).toBe(true)
  })

  it('removes a draft, clearing the storage key entirely once empty', () => {
    const storage = createMemoryStorage()
    const key = LOCAL_STORAGE_KEYS.NOTEBOOK_DRAFTS('project-a')

    persistNotebookDraft({
      storage,
      projectRef: 'project-a',
      id: 'notebook-1',
      name: 'My notebook',
      content: makeContent(),
      baseUpdatedAt: null,
    })
    expect(storage.getItem(key)).not.toBeNull()

    removeNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-1' })

    expect(
      readNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-1' })
    ).toBeUndefined()
    expect(storage.getItem(key)).toBeNull()
  })

  it('falls back to no drafts when storage holds malformed JSON', () => {
    const storage = createMemoryStorage()
    storage.setItem(LOCAL_STORAGE_KEYS.NOTEBOOK_DRAFTS('project-a'), '{not json')

    expect(
      readNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-1' })
    ).toBeUndefined()
  })

  it('drops an individual draft that fails schema validation without discarding the rest', () => {
    const storage = createMemoryStorage()
    persistNotebookDraft({
      storage,
      projectRef: 'project-a',
      id: 'notebook-good',
      name: 'Good notebook',
      content: makeContent(),
      baseUpdatedAt: null,
    })

    const key = LOCAL_STORAGE_KEYS.NOTEBOOK_DRAFTS('project-a')
    const raw = JSON.parse(storage.getItem(key)!)
    raw['notebook-bad'] = { name: 'Bad notebook' } // missing required fields
    storage.setItem(key, JSON.stringify(raw))

    expect(
      readNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-bad' })
    ).toBeUndefined()
    expect(readNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-good' })?.name).toBe(
      'Good notebook'
    )
  })

  it('caps the number of persisted drafts, evicting the least recently updated', () => {
    const storage = createMemoryStorage()

    for (let i = 0; i < MAX_PERSISTED_NOTEBOOK_DRAFTS + 1; i++) {
      vi.setSystemTime(i)
      persistNotebookDraft({
        storage,
        projectRef: 'project-a',
        id: `notebook-${i}`,
        name: `Notebook ${i}`,
        content: makeContent(),
        baseUpdatedAt: null,
      })
    }

    expect(
      readNotebookDraft({ storage, projectRef: 'project-a', id: 'notebook-0' })
    ).toBeUndefined()
    expect(
      readNotebookDraft({
        storage,
        projectRef: 'project-a',
        id: `notebook-${MAX_PERSISTED_NOTEBOOK_DRAFTS}`,
      })
    ).toBeDefined()
  })
})
