import { beforeEach, describe, expect, it } from 'vitest'

import { sqlEditorState, type SnippetWithContent } from './sql-editor-v2'
import { readPersistedDraftSqlTab } from '@/components/interfaces/SQLEditor/draftSqlTabStorage.utils'
import { createSqlSnippetSkeletonV2 } from '@/components/interfaces/SQLEditor/SQLEditor.utils'

const PROJECT_REF = 'test-project'
const LOG_DATE_RANGE = {
  from: '2026-06-15T00:00:00.000Z',
  to: '2026-06-15T01:00:00.000Z',
  isHelper: true,
  text: 'Last hour',
}

function resetState() {
  for (const key of Object.keys(sqlEditorState.snippets)) delete sqlEditorState.snippets[key]
  for (const key of Object.keys(sqlEditorState.results)) delete sqlEditorState.results[key]
  for (const key of Object.keys(sqlEditorState.explainResults))
    delete sqlEditorState.explainResults[key]
  for (const key of Object.keys(sqlEditorState.savingStates))
    delete sqlEditorState.savingStates[key]
  sqlEditorState.needsSaving.clear()
  localStorage.clear()
}

function seedSnippet({
  id,
  isDraft = false,
}: {
  id: string
  isDraft?: boolean
}): SnippetWithContent {
  const snippet = createSqlSnippetSkeletonV2({
    idOverride: id,
    name: `Snippet ${id}`,
    sql: 'select 1',
    owner_id: 1,
    project_id: 1,
  })
  if (isDraft) snippet.isDraftTab = true
  sqlEditorState.addSnippet({ projectRef: PROJECT_REF, snippet })
  return snippet
}

describe('sqlEditorState source + log date range', () => {
  beforeEach(() => {
    resetState()
  })

  describe('setSnippetSource', () => {
    it('updates a saved snippet and queues it for saving', () => {
      seedSnippet({ id: 'saved-1' })

      sqlEditorState.setSnippetSource({ id: 'saved-1', source: 'logs' })

      expect(sqlEditorState.snippets['saved-1'].snippet.content?.source).toBe('logs')
      expect(sqlEditorState.needsSaving.get('saved-1')).toBe(true)
    })

    it('updates a draft and persists to local storage without queuing for DB save', () => {
      seedSnippet({ id: 'draft-1', isDraft: true })

      sqlEditorState.setSnippetSource({ id: 'draft-1', source: 'logs' })

      expect(sqlEditorState.snippets['draft-1'].snippet.content?.source).toBe('logs')
      expect(sqlEditorState.needsSaving.has('draft-1')).toBe(false)
      expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-1')).toMatchObject({ source: 'logs' })
    })

    it('is a no-op when the snippet does not exist', () => {
      expect(() => sqlEditorState.setSnippetSource({ id: 'missing', source: 'logs' })).not.toThrow()
      expect(sqlEditorState.needsSaving.has('missing')).toBe(false)
    })
  })

  describe('setSnippetLogDateRange', () => {
    it('updates a saved snippet and queues it for saving', () => {
      seedSnippet({ id: 'saved-2' })

      sqlEditorState.setSnippetLogDateRange({ id: 'saved-2', logDateRange: LOG_DATE_RANGE })

      expect(sqlEditorState.snippets['saved-2'].snippet.content?.logDateRange).toEqual(
        LOG_DATE_RANGE
      )
      expect(sqlEditorState.needsSaving.get('saved-2')).toBe(true)
    })

    it('updates a draft and persists to local storage without queuing for DB save', () => {
      seedSnippet({ id: 'draft-2', isDraft: true })

      sqlEditorState.setSnippetLogDateRange({ id: 'draft-2', logDateRange: LOG_DATE_RANGE })

      expect(sqlEditorState.needsSaving.has('draft-2')).toBe(false)
      expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-2')).toMatchObject({
        logDateRange: LOG_DATE_RANGE,
      })
    })
  })

  describe('draft persistence in updateSnippet / setSql', () => {
    it('updateSnippet on a draft persists locally and never queues for DB save', () => {
      seedSnippet({ id: 'draft-3', isDraft: true })

      sqlEditorState.updateSnippet({
        id: 'draft-3',
        snippet: { name: 'Renamed draft' },
        skipSave: false,
      })

      expect(sqlEditorState.needsSaving.has('draft-3')).toBe(false)
      expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-3')).toMatchObject({
        name: 'Renamed draft',
      })
    })

    it('setSql on a draft persists locally and never queues for DB save', () => {
      seedSnippet({ id: 'draft-4', isDraft: true })

      sqlEditorState.setSql({ id: 'draft-4', sql: 'select 42' })

      expect(sqlEditorState.needsSaving.has('draft-4')).toBe(false)
      expect(readPersistedDraftSqlTab(PROJECT_REF, 'draft-4')).toMatchObject({ sql: 'select 42' })
    })
  })
})
