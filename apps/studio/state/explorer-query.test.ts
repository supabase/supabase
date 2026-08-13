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
      source: { id: 'database', type: 'database', parameters: {} },
      uncheckedSql: 'select * from users',
      projectRef: 'project-a',
    })
    expect(secondState.restoreDraft({ id: 'query-1', projectRef: 'project-b' })).toBe(false)
  })

  it('persists source parameters and clears stale results when they change', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)

    state.createDraft({ id: 'query-1', projectRef: 'project-a', sql: 'select 1' })
    state.setResult({ id: 'query-1', result: { rows: [{ value: 1 }], executedAt: 1 } })
    state.updateDraft({
      id: 'query-1',
      source: {
        id: 'logs',
        type: 'logs',
        parameters: { time_range: { type: 'relative', amount: 3, unit: 'hour' } },
      },
    })

    expect(state.results['query-1']).toBeUndefined()

    const restored = createExplorerQueryState(storage)
    expect(restored.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(true)
    expect(restored.drafts['query-1'].source).toEqual({
      id: 'logs',
      type: 'logs',
      parameters: { time_range: { type: 'relative', amount: 3, unit: 'hour' } },
    })
  })

  it('restores pre-source drafts as database queries', () => {
    const storage = createMemoryStorage()
    storage.setItem(
      LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a'),
      JSON.stringify({
        'query-1': { name: 'Legacy query', sql: 'select 1', updatedAt: 1 },
      })
    )

    const state = createExplorerQueryState(storage)
    expect(state.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(true)
    expect(state.drafts['query-1'].source).toEqual({
      id: 'database',
      type: 'database',
      parameters: {},
    })
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
