import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  countSqlTabsRequiringCloseConfirmation,
  createDraftSqlTab,
  getDiscardSqlTabsDialogCopy,
  getDraftSqlTabSql,
  getOpenDraftSqlTabIds,
  isDraftSqlSnippet,
  restoreDraftSqlTab,
  restoreOpenDraftSqlTabs,
  shouldConfirmCloseSqlTab,
  shouldHideDraftSqlTabFromNav,
} from './createDraftSqlTab'
import { persistDraftSqlTab, readPersistedDraftSqlTab } from './draftSqlTabStorage.utils'

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

describe('getDraftSqlTabSql', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('prefers in-memory snippet sql over persisted storage', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-1', { sql: 'select 1', name: 'One' })

    expect(
      getDraftSqlTabSql({
        projectRef: PROJECT_REF,
        sqlId: 'draft-1',
        snippetSql: 'select 2',
      })
    ).toBe('select 2')
  })

  it('falls back to persisted storage when snippet sql is unavailable', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-1', { sql: 'select 1', name: 'One' })

    expect(
      getDraftSqlTabSql({
        projectRef: PROJECT_REF,
        sqlId: 'draft-1',
      })
    ).toBe('select 1')
  })
})

describe('shouldConfirmCloseSqlTab', () => {
  const draftTab = { type: 'sql', metadata: { isDraft: true, sqlId: 'draft-1' } }

  it('requires confirmation for draft sql tabs with content', () => {
    expect(shouldConfirmCloseSqlTab(draftTab, 'select 1')).toBe(true)
    expect(shouldConfirmCloseSqlTab(draftTab, '   ')).toBe(false)
    expect(shouldConfirmCloseSqlTab({ type: 'r', metadata: { isDraft: true } }, 'select 1')).toBe(
      false
    )
  })

  it('requires confirmation for saved sql tabs with dirty content', () => {
    const savedTab = { type: 'sql', metadata: { sqlId: 'saved-1' } }

    expect(shouldConfirmCloseSqlTab(savedTab, 'select 2', 'select 1')).toBe(true)
    expect(shouldConfirmCloseSqlTab(savedTab, 'select 1', 'select 1')).toBe(false)
    expect(shouldConfirmCloseSqlTab(savedTab, 'select 1')).toBe(false)
  })
})

describe('countSqlTabsRequiringCloseConfirmation', () => {
  const draftTab = (sqlId: string) => ({
    type: 'sql',
    metadata: { isDraft: true, sqlId },
  })

  it('counts dirty saved sql tabs and draft sql tabs with content', () => {
    const tabsMap = {
      'sql-a': draftTab('draft-a'),
      'sql-b': draftTab('draft-b'),
      'sql-c': { type: 'sql', metadata: { sqlId: 'saved-c' } },
      'sql-d': draftTab('draft-d'),
      'sql-e': { type: 'sql', metadata: { sqlId: 'saved-e' } },
    }

    const getTabSql = (tabId: string) => {
      if (tabId === 'sql-b') return '   '
      if (tabId === 'sql-d') return 'select d'
      if (tabId === 'sql-c') return 'select changed'
      if (tabId === 'sql-e') return 'select e'
      return 'select a'
    }
    const getSavedSql = (tabId: string) => {
      if (tabId === 'sql-c') return 'select c'
      if (tabId === 'sql-e') return 'select e'
      return undefined
    }

    expect(
      countSqlTabsRequiringCloseConfirmation(
        ['sql-a', 'sql-b', 'sql-c', 'sql-d', 'sql-e'],
        tabsMap,
        getTabSql,
        getSavedSql
      )
    ).toBe(3)
  })
})

describe('getDiscardSqlTabsDialogCopy', () => {
  it('uses singular copy for a single tab', () => {
    expect(getDiscardSqlTabsDialogCopy(1)).toMatchObject({
      title: 'Discard unsaved changes?',
      confirmLabel: 'Discard query',
    })
  })

  it('uses plural copy with a count for multiple tabs', () => {
    expect(getDiscardSqlTabsDialogCopy(3)).toMatchObject({
      title: 'Close 3 tabs with unsaved changes?',
      description:
        'You are about to close 3 tabs that have unsaved changes. Their contents will be discarded.',
      confirmLabel: 'Discard 3 queries',
    })
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

  it('registers an autosaved snippet + tab and queues the initial save', () => {
    const addSnippet = vi.fn()
    const addNeedsSaving = vi.fn()
    const addTab = vi.fn()

    const snippetId = createDraftSqlTab({
      projectRef: PROJECT_REF,
      projectId: 1,
      ownerId: 2,
      snapV2: { addSnippet, addNeedsSaving },
      tabs: { addTab },
      initialSql: 'select 1',
      creationMode: 'saved',
      skipNavigation: true,
    })

    expect(addSnippet).toHaveBeenCalledTimes(1)
    const addedSnippet = addSnippet.mock.calls[0][0].snippet
    expect(addedSnippet.id).toBe(snippetId)
    expect(addedSnippet.isDraftTab).toBeUndefined()

    expect(addNeedsSaving).toHaveBeenCalledWith(snippetId, { saveSql: true })
    expect(addTab).toHaveBeenCalledTimes(1)
    expect(addTab.mock.calls[0][0].metadata).toMatchObject({ sqlId: snippetId })
    expect(addTab.mock.calls[0][0].metadata.isDraft).toBeUndefined()
    expect(readPersistedDraftSqlTab(PROJECT_REF, snippetId)).toBeUndefined()
  })
})

describe('restoreDraftSqlTab', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores a draft snippet from persisted storage', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-1', {
      sql: 'select 1',
      name: 'My draft',
    })

    const addSnippet = vi.fn()

    restoreDraftSqlTab({
      draftId: 'draft-1',
      projectRef: PROJECT_REF,
      projectId: 1,
      ownerId: 2,
      snapV2: { addSnippet },
    })

    expect(addSnippet).toHaveBeenCalledTimes(1)
    const addedSnippet = addSnippet.mock.calls[0][0].snippet
    expect(addedSnippet).toMatchObject({
      id: 'draft-1',
      name: 'My draft',
      isDraftTab: true,
      content: { unchecked_sql: 'select 1' },
    })
  })

  it('falls back to provided name and sql when nothing is persisted', () => {
    const addSnippet = vi.fn()

    restoreDraftSqlTab({
      draftId: 'draft-2',
      projectRef: PROJECT_REF,
      projectId: 1,
      ownerId: 2,
      snapV2: { addSnippet },
      name: 'Fallback name',
      initialSql: 'select 2',
    })

    expect(addSnippet).toHaveBeenCalledTimes(1)
    const addedSnippet = addSnippet.mock.calls[0][0].snippet
    expect(addedSnippet).toMatchObject({
      id: 'draft-2',
      name: 'Fallback name',
      isDraftTab: true,
      content: { unchecked_sql: 'select 2' },
    })
  })
})

describe('restoreOpenDraftSqlTabs', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores missing draft snippets and returns all open draft ids', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-a', { sql: 'select a', name: 'Draft A' })
    persistDraftSqlTab(PROJECT_REF, 'draft-c', { sql: 'select c', name: 'Draft C' })

    const addSnippet = vi.fn()
    const tabsMap = {
      'sql-a': { type: 'sql', metadata: { sqlId: 'draft-a', isDraft: true, name: 'Draft A' } },
      'sql-b': { type: 'sql', metadata: { sqlId: 'draft-b' } },
      'sql-c': { type: 'sql', metadata: { sqlId: 'draft-c', isDraft: true, name: 'Draft C' } },
      'r-1': { type: 'r', metadata: { isDraft: true } },
    }

    const openDraftIds = restoreOpenDraftSqlTabs({
      projectRef: PROJECT_REF,
      projectId: 1,
      ownerId: 2,
      snapV2: { addSnippet },
      openTabs: ['sql-a', 'sql-b', 'sql-c', 'r-1'],
      tabsMap,
      existingSnippetIds: new Set(['draft-b']),
    })

    expect(openDraftIds).toEqual(['draft-a', 'draft-c'])
    expect(addSnippet).toHaveBeenCalledTimes(2)

    const restoredIds = addSnippet.mock.calls.map((call) => call[0].snippet.id).sort()
    expect(restoredIds).toEqual(['draft-a', 'draft-c'])

    const restoredDraftA = addSnippet.mock.calls.find(
      (call) => call[0].snippet.id === 'draft-a'
    )?.[0].snippet
    expect(restoredDraftA).toMatchObject({
      name: 'Draft A',
      isDraftTab: true,
      content: { unchecked_sql: 'select a' },
    })
  })

  it('skips restore when the snippet is already in editor state', () => {
    persistDraftSqlTab(PROJECT_REF, 'draft-a', { sql: 'select a', name: 'Draft A' })

    const addSnippet = vi.fn()
    const tabsMap = {
      'sql-a': { type: 'sql', metadata: { sqlId: 'draft-a', isDraft: true, name: 'Draft A' } },
    }

    const openDraftIds = restoreOpenDraftSqlTabs({
      projectRef: PROJECT_REF,
      projectId: 1,
      ownerId: 2,
      snapV2: { addSnippet },
      openTabs: ['sql-a'],
      tabsMap,
      existingSnippetIds: new Set(['draft-a']),
    })

    expect(openDraftIds).toEqual(['draft-a'])
    expect(addSnippet).not.toHaveBeenCalled()
  })

  it('ignores tabs without draft metadata', () => {
    const addSnippet = vi.fn()
    const tabsMap = {
      'sql-a': { type: 'sql', metadata: { sqlId: 'saved-a' } },
      'sql-b': { type: 'sql', metadata: { isDraft: true } },
    }

    const openDraftIds = restoreOpenDraftSqlTabs({
      projectRef: PROJECT_REF,
      projectId: 1,
      ownerId: 2,
      snapV2: { addSnippet },
      openTabs: ['sql-a', 'sql-b'],
      tabsMap,
      existingSnippetIds: new Set(),
    })

    expect(openDraftIds).toEqual([])
    expect(addSnippet).not.toHaveBeenCalled()
  })
})
