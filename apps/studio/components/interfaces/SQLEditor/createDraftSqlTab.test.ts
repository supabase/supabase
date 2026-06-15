import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDraftSqlTab,
  getOpenDraftSqlTabIds,
  isDraftSqlSnippet,
  shouldHideDraftSqlTabFromNav,
} from './createDraftSqlTab'
import { readPersistedDraftSqlTab } from './draftSqlTabStorage.utils'

const PROJECT_REF = 'test-project'

describe('isDraftSqlSnippet', () => {
  it('is true only when isDraftTab is set', () => {
    expect(isDraftSqlSnippet({ isDraftTab: true })).toBe(true)
    expect(isDraftSqlSnippet({ isDraftTab: false })).toBe(false)
    expect(isDraftSqlSnippet({ isNotSavedInDatabaseYet: true })).toBe(false)
    expect(isDraftSqlSnippet(undefined)).toBe(false)
  })
})

describe('getOpenDraftSqlTabIds', () => {
  it('collects sqlIds for open sql tabs flagged as drafts', () => {
    const tabsMap = {
      'sql-a': { type: 'sql', metadata: { sqlId: 'a', isDraft: true } },
      'sql-b': { type: 'sql', metadata: { sqlId: 'b' } },
      'sql-c': { type: 'sql', metadata: { sqlId: 'c', isDraft: true } },
      'r-1': { type: 'r', metadata: { isDraft: true } },
    }

    const ids = getOpenDraftSqlTabIds(['sql-a', 'sql-b', 'sql-c', 'r-1'], tabsMap)

    expect([...ids].sort()).toEqual(['a', 'c'])
  })
})

describe('shouldHideDraftSqlTabFromNav', () => {
  it('hides snippets that are open drafts, in-memory drafts, or not yet saved', () => {
    const openDraftIds = new Set(['a'])

    expect(shouldHideDraftSqlTabFromNav('a', openDraftIds)).toBe(true)
    expect(shouldHideDraftSqlTabFromNav('b', openDraftIds, { isDraftTab: true })).toBe(true)
    expect(shouldHideDraftSqlTabFromNav('b', openDraftIds, { isNotSavedInDatabaseYet: true })).toBe(
      true
    )
    expect(shouldHideDraftSqlTabFromNav('b', openDraftIds, { isDraftTab: false })).toBe(false)
    expect(shouldHideDraftSqlTabFromNav('b', openDraftIds)).toBe(false)
  })
})

describe('createDraftSqlTab', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('registers a draft snippet + tab and persists it to local storage', () => {
    const addSnippet = vi.fn()
    const addTab = vi.fn()

    const draftId = createDraftSqlTab({
      projectRef: PROJECT_REF,
      projectId: 1,
      ownerId: 2,
      snapV2: { addSnippet },
      tabs: { addTab },
      initialSql: 'select 1',
      skipNavigation: true,
    })

    expect(typeof draftId).toBe('string')
    expect(draftId.length).toBeGreaterThan(0)

    // Snippet added to the store as a draft
    expect(addSnippet).toHaveBeenCalledTimes(1)
    const addedSnippet = addSnippet.mock.calls[0][0].snippet
    expect(addedSnippet.id).toBe(draftId)
    expect(addedSnippet.isDraftTab).toBe(true)

    // Tab added with the draft flag
    expect(addTab).toHaveBeenCalledTimes(1)
    const addedTab = addTab.mock.calls[0][0]
    expect(addedTab.type).toBe('sql')
    expect(addedTab.metadata).toMatchObject({ sqlId: draftId, isDraft: true })

    // Persisted to local storage with the initial sql
    expect(readPersistedDraftSqlTab(PROJECT_REF, draftId)).toMatchObject({ sql: 'select 1' })
  })
})
