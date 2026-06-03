import { beforeEach, describe, expect, it, vi } from 'vitest'

import { saveSqlSnippet } from './saveSqlSnippet.utils'
import { untitledSnippetTitle } from './SQLEditor.constants'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: true,
}))

const baseParams = {
  id: 'snippet-id',
  sql: 'select 1',
  snippetName: untitledSnippetTitle,
  projectRef: 'project-ref',
  ownerId: 1,
  projectId: 2,
  querySource: 'database' as const,
  snippet: undefined,
  isHipaaProjectDisallowed: false,
  addSnippet: vi.fn(),
  setSql: vi.fn(),
  addNeedsSaving: vi.fn(),
  generateSqlTitle: vi.fn().mockResolvedValue({ title: 'User count' }),
  updateSnippet: vi.fn(),
}

describe('saveSqlSnippet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty when sql is blank', async () => {
    const result = await saveSqlSnippet({ ...baseParams, sql: '   ' })

    expect(result).toEqual({ saved: false, reason: 'empty' })
    expect(baseParams.addSnippet).not.toHaveBeenCalled()
    expect(baseParams.addNeedsSaving).not.toHaveBeenCalled()
  })

  it('creates a private skeleton and queues save when snippet is missing', async () => {
    const addSnippet = vi.fn()
    const setSql = vi.fn()
    const addNeedsSaving = vi.fn()
    const onNavigateToSnippet = vi.fn()

    const result = await saveSqlSnippet({
      ...baseParams,
      addSnippet,
      setSql,
      addNeedsSaving,
      onNavigateToSnippet,
    })

    expect(result).toEqual({ saved: true })
    expect(addSnippet).toHaveBeenCalledWith({
      projectRef: 'project-ref',
      snippet: expect.objectContaining({
        id: 'snippet-id',
        name: untitledSnippetTitle,
        visibility: 'user',
        isNotSavedInDatabaseYet: true,
      }),
    })
    expect(setSql).toHaveBeenCalledWith({
      id: 'snippet-id',
      sql: 'select 1',
      shouldInvalidate: true,
    })
    expect(addNeedsSaving).toHaveBeenCalledWith('snippet-id')
    expect(onNavigateToSnippet).toHaveBeenCalled()
  })

  it('generates an AI title for untitled snippets on save', async () => {
    const generateSqlTitle = vi.fn().mockResolvedValue({ title: 'Active users' })
    const updateSnippet = vi.fn()
    const addNeedsSaving = vi.fn()
    const onTabLabelUpdate = vi.fn()

    await saveSqlSnippet({
      ...baseParams,
      generateSqlTitle,
      updateSnippet,
      addNeedsSaving,
      onTabLabelUpdate,
      snippet: {
        id: 'snippet-id',
        name: untitledSnippetTitle,
        visibility: 'user',
        isNotSavedInDatabaseYet: true,
      } as any,
    })

    expect(generateSqlTitle).toHaveBeenCalledWith({ sql: 'select 1' })
    expect(updateSnippet).toHaveBeenCalledWith({
      id: 'snippet-id',
      snippet: { name: 'Active users' },
    })
    expect(addNeedsSaving).toHaveBeenCalledTimes(2)
    expect(onTabLabelUpdate).toHaveBeenCalledWith('Active users')
  })

  it('clears draft tab flag when saving a draft snippet', async () => {
    const updateSnippet = vi.fn()
    const onDraftSaved = vi.fn()

    await saveSqlSnippet({
      ...baseParams,
      updateSnippet,
      onDraftSaved,
      snippet: {
        id: 'snippet-id',
        name: untitledSnippetTitle,
        visibility: 'user',
        isNotSavedInDatabaseYet: true,
        isDraftTab: true,
      } as any,
    })

    expect(updateSnippet).toHaveBeenCalledWith({
      id: 'snippet-id',
      snippet: { isDraftTab: false },
      skipSave: true,
    })
    expect(onDraftSaved).toHaveBeenCalled()
  })

  it('skips AI rename when snippet already has a custom name', async () => {
    const generateSqlTitle = vi.fn()

    await saveSqlSnippet({
      ...baseParams,
      generateSqlTitle,
      snippet: {
        id: 'snippet-id',
        name: 'My saved query',
        visibility: 'user',
        isNotSavedInDatabaseYet: false,
      } as any,
    })

    expect(generateSqlTitle).not.toHaveBeenCalled()
  })
})
