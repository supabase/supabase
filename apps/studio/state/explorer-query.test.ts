import { LOCAL_STORAGE_KEYS } from 'common'
import { describe, expect, it } from 'vitest'

import { createExplorerQueryState } from './explorer-query'

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('explorer query drafts', () => {
  it('persists and restores drafts within their project', () => {
    const storage = createMemoryStorage()
    const firstState = createExplorerQueryState(storage)

    firstState.createDraft({ id: 'query-1', projectRef: 'project-a' })
    firstState.updateDraft({ id: 'query-1', name: 'Active users', sql: 'select * from users' })

    const secondState = createExplorerQueryState(storage)

    expect(secondState.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(true)
    expect(secondState.drafts['query-1']).toMatchObject({
      name: 'Active users',
      uncheckedSql: 'select * from users',
      projectRef: 'project-a',
    })
    expect(secondState.restoreDraft({ id: 'query-1', projectRef: 'project-b' })).toBe(false)
  })

  it('removes the persisted draft and its session result when its tab closes', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)

    state.createDraft({ id: 'query-1', projectRef: 'project-a', sql: 'select 1' })
    state.setResult({ id: 'query-1', result: { rows: [{ value: 1 }], executedAt: 1 } })
    state.removeDraft({ id: 'query-1', projectRef: 'project-a' })

    expect(state.drafts['query-1']).toBeUndefined()
    expect(state.results['query-1']).toBeUndefined()
    expect(storage.getItem(LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a'))).toBeNull()
  })
})
