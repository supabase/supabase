import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getDraftSqlTabStorageKey,
  persistDraftSqlTab,
  prunePersistedDraftSqlTabs,
  readPersistedDraftSqlTab,
  removePersistedDraftSqlTab,
} from './draftSqlTabStorage.utils'

const PROJECT_REF = 'test-project'

describe('draftSqlTabStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('persists and reads draft tab sql', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-1', {
      sql: 'select 1',
      name: 'Untitled query',
    })

    expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-1')).toMatchObject({
      sql: 'select 1',
      name: 'Untitled query',
    })
  })

  it('merges partial updates without clearing sql', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-1', {
      sql: 'select 1',
      name: 'Untitled query',
    })

    persistDraftSqlTab(PROJECT_REF, 'draft-1', {
      name: 'Untitled query 2',
    })

    expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-1')).toMatchObject({
      sql: 'select 1',
      name: 'Untitled query 2',
    })
  })

  it('removes a persisted draft tab', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-1', {
      sql: 'select 1',
      name: 'Untitled query',
    })

    removePersistedDraftSqlTab(PROJECT_REF, 'draft-1')

    expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-1')).toBeUndefined()
  })

  it('prunes drafts that are no longer open', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-1', { sql: 'select 1', name: 'One' })
    persistDraftSqlTab(PROJECT_REF, 'draft-2', { sql: 'select 2', name: 'Two' })

    prunePersistedDraftSqlTabs(PROJECT_REF, ['draft-2'])

    expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-1')).toBeUndefined()
    expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-2')).toBeDefined()
  })

  it('does not throw when localStorage writes fail', () => {
    localStorage.setItem(
      getDraftSqlTabStorageKey(PROJECT_REF),
      JSON.stringify({
        'draft-1': { sql: 'select 1', name: 'One', updatedAt: Date.now() },
        'draft-2': { sql: 'select 2', name: 'Two', updatedAt: Date.now() },
      })
    )

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })

    expect(() =>
      persistDraftSqlTab(PROJECT_REF, 'draft-3', { sql: 'select 3', name: 'Three' })
    ).not.toThrow()
    expect(() => removePersistedDraftSqlTab(PROJECT_REF, 'draft-1')).not.toThrow()
    expect(() => prunePersistedDraftSqlTabs(PROJECT_REF, ['draft-2'])).not.toThrow()
  })

  it('uses a project-scoped storage key', () => {
    expect(getDraftSqlTabStorageKey(PROJECT_REF)).toBe(`sql-editor-draft-tabs-${PROJECT_REF}`)
  })
})
