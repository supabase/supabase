import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sqlEditorState } from './sql-editor-v2'
import { readPersistedDraftSqlTab } from '@/components/interfaces/SQLEditor/draftSqlTabStorage.utils'
import { createSqlSnippetSkeletonV2 } from '@/components/interfaces/SQLEditor/SQLEditor.utils'

const mocks = vi.hoisted(() => ({
  upsertContent: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/data/content/content-upsert-mutation', () => ({
  upsertContent: mocks.upsertContent,
}))

vi.mock('@/data/query-client', () => ({
  getQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

const PROJECT_REF = 'test-project'

function resetSqlEditorState() {
  sqlEditorState.folders = {}
  sqlEditorState.snippets = {}
  sqlEditorState.results = {}
  sqlEditorState.explainResults = {}
  sqlEditorState.savingStates = {}
  sqlEditorState.savedSql = {}
  sqlEditorState.lastUpdatedFolderName = ''
  sqlEditorState.diffContent = undefined
  sqlEditorState.needsSaving.clear()
  sqlEditorState.saveSqlOnNextSave.clear()
}

function createSnippet(id: string, sql: string) {
  const snippet = createSqlSnippetSkeletonV2({
    idOverride: id,
    name: 'Test snippet',
    sql,
    owner_id: 1,
    project_id: 1,
  })

  snippet.isNotSavedInDatabaseYet = false
  return snippet
}

describe('sqlEditorState manual SQL save mode', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    mocks.upsertContent.mockClear()
    resetSqlEditorState()
  })

  it('updates saved snippet SQL locally without queueing a save', () => {
    const snippet = createSnippet('saved-1', 'select 1')
    sqlEditorState.addSnippet({ projectRef: PROJECT_REF, snippet })

    sqlEditorState.setSql({ id: 'saved-1', sql: 'select 2' })

    expect(sqlEditorState.snippets['saved-1'].snippet.content?.unchecked_sql).toBe('select 2')
    expect(sqlEditorState.savedSql['saved-1']).toBe('select 1')
    expect(sqlEditorState.needsSaving.has('saved-1')).toBe(false)
  })

  it('advances the saved SQL baseline after an explicit SQL save succeeds', async () => {
    vi.useFakeTimers()
    const snippet = createSnippet('saved-1', 'select 1')
    sqlEditorState.addSnippet({ projectRef: PROJECT_REF, snippet })
    sqlEditorState.setSql({ id: 'saved-1', sql: 'select 2' })

    sqlEditorState.addNeedsSaving('saved-1', { saveSql: true })
    await vi.runAllTimersAsync()

    expect(mocks.upsertContent).toHaveBeenCalledWith({
      projectRef: PROJECT_REF,
      payload: expect.objectContaining({
        id: 'saved-1',
        content: expect.objectContaining({ unchecked_sql: 'select 2' }),
      }),
    })
    expect(sqlEditorState.savedSql['saved-1']).toBe('select 2')
  })

  it('keeps the SQL save flag when an explicit SQL save fails so retry saves SQL content', async () => {
    vi.useFakeTimers()
    mocks.upsertContent.mockRejectedValueOnce(new Error('Failed to save'))
    const snippet = createSnippet('saved-1', 'select 1')
    sqlEditorState.addSnippet({ projectRef: PROJECT_REF, snippet })
    sqlEditorState.setSql({ id: 'saved-1', sql: 'select 2' })

    sqlEditorState.addNeedsSaving('saved-1', { saveSql: true })
    await vi.runAllTimersAsync()

    expect(sqlEditorState.savingStates['saved-1']).toBe('UPDATING_FAILED')
    expect(sqlEditorState.saveSqlOnNextSave.get('saved-1')).toBe(true)
  })

  it('persists draft SQL to local storage without queueing a save', () => {
    const snippet = createSnippet('draft-1', '')
    snippet.isDraftTab = true
    sqlEditorState.addSnippet({ projectRef: PROJECT_REF, snippet })

    sqlEditorState.setSql({ id: 'draft-1', sql: 'select draft' })

    expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-1')).toMatchObject({
      sql: 'select draft',
    })
    expect(sqlEditorState.needsSaving.has('draft-1')).toBe(false)
  })
})
