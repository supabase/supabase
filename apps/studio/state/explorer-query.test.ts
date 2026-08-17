import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createExplorerQueryState,
  EXPLORER_QUERY_PERSIST_DELAY,
  MAX_PERSISTED_EXPLORER_QUERY_DRAFTS,
} from './explorer-query'

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: (key: string) => values.delete(key),
  }
}

const LOGS_SOURCE = {
  _tag: 'logs',
  time_range: { _tag: 'relative_time_range', amount: 3, unit: 'hour' },
} as const

describe('explorer query drafts', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('persists and restores drafts within their project', () => {
    const storage = createMemoryStorage()
    const firstState = createExplorerQueryState(storage)

    firstState.createDraft({ id: 'query-1', projectRef: 'project-a' })
    firstState.updateDraft({ id: 'query-1', name: 'Active users', sql: 'select * from users' })

    const secondState = createExplorerQueryState(storage)

    expect(secondState.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(true)
    expect(secondState.drafts['query-1']).toMatchObject({
      _tag: 'database',
      name: 'Active users',
      uncheckedSql: 'select * from users',
      projectRef: 'project-a',
    })
    expect(secondState.restoreDraft({ id: 'query-1', projectRef: 'project-b' })).toBe(false)
  })

  it('persists source parameters and clears stale results when the backend changes', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)

    state.createDraft({ id: 'query-1', projectRef: 'project-a', sql: 'select 1' })
    state.setResult({ id: 'query-1', result: { rows: [{ value: 1 }], executedAt: 1 } })
    state.updateDraft({ id: 'query-1', source: LOGS_SOURCE })

    expect(state.results['query-1']).toBeUndefined()

    const restored = createExplorerQueryState(storage)
    expect(restored.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(true)
    expect(restored.drafts['query-1']).toMatchObject(LOGS_SOURCE)
  })

  it('carries the query text over when the backend changes, rebranded for the new dialect', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)

    state.createDraft({ id: 'query-1', projectRef: 'project-a', sql: 'select * from users' })
    state.updateDraft({ id: 'query-1', source: LOGS_SOURCE })

    expect(state.drafts['query-1']).toMatchObject({
      _tag: 'logs',
      uncheckedSql: 'select * from users',
    })
  })

  it('keeps the query when only the parameters of the same backend change', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)

    state.createDraft({ id: 'query-1', projectRef: 'project-a', sql: 'select * from users' })
    state.setResult({ id: 'query-1', result: { rows: [{ value: 1 }], executedAt: 1 } })
    state.updateDraft({
      id: 'query-1',
      source: { _tag: 'database', database_identifier: 'replica-1' },
    })

    expect(state.drafts['query-1']).toMatchObject({
      _tag: 'database',
      database_identifier: 'replica-1',
      uncheckedSql: 'select * from users',
    })
    expect(state.results['query-1']).toBeDefined()
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
    expect(state.drafts['query-1']._tag).toBe('database')
  })

  it('ignores a malformed root value', () => {
    const storage = createMemoryStorage()
    storage.setItem(LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a'), JSON.stringify([]))

    const state = createExplorerQueryState(storage)
    expect(state.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(false)
  })

  it('drops entries with malformed draft fields', () => {
    const storage = createMemoryStorage()
    storage.setItem(
      LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a'),
      JSON.stringify({
        'query-1': { name: 'Invalid query', sql: 123, updatedAt: 1 },
      })
    )

    const state = createExplorerQueryState(storage)
    expect(state.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(false)
  })

  it('falls back to the database source when persisted source data is invalid', () => {
    const storage = createMemoryStorage()
    storage.setItem(
      LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a'),
      JSON.stringify({
        'query-1': {
          name: 'Recoverable query',
          sql: 'select 1',
          updatedAt: 1,
          source: { id: 'logs', type: 'logs', parameters: {} },
        },
      })
    )

    const state = createExplorerQueryState(storage)
    expect(state.restoreDraft({ id: 'query-1', projectRef: 'project-a' })).toBe(true)
    expect(state.drafts['query-1']).toMatchObject({
      _tag: 'database',
      uncheckedSql: 'select 1',
    })
  })

  it('debounces SQL persistence while updating in-memory state immediately', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)
    const key = LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a')
    state.createDraft({ id: 'query-1', projectRef: 'project-a' })
    storage.setItem.mockClear()

    state.updateDraft({ id: 'query-1', sql: 's' })
    state.updateDraft({ id: 'query-1', sql: 'se' })
    state.updateDraft({ id: 'query-1', sql: 'select 1' })

    expect(state.drafts['query-1'].uncheckedSql).toBe('select 1')
    expect(storage.setItem).not.toHaveBeenCalled()

    vi.advanceTimersByTime(EXPLORER_QUERY_PERSIST_DELAY)

    expect(storage.setItem).toHaveBeenCalledOnce()
    expect(JSON.parse(storage.getItem(key)!)['query-1'].sql).toBe('select 1')
  })

  it('flushes pending SQL persistence before the debounce elapses', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)
    const key = LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a')
    state.createDraft({ id: 'query-1', projectRef: 'project-a' })
    storage.setItem.mockClear()

    state.updateDraft({ id: 'query-1', sql: 'select 1' })
    state.flushPendingPersistence({ projectRef: 'project-a' })

    expect(storage.setItem).toHaveBeenCalledOnce()
    expect(JSON.parse(storage.getItem(key)!)['query-1'].sql).toBe('select 1')

    vi.advanceTimersByTime(EXPLORER_QUERY_PERSIST_DELAY)
    expect(storage.setItem).toHaveBeenCalledOnce()
  })

  it('retains only the most recently updated persisted drafts', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)
    const key = LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a')

    for (let index = 0; index <= MAX_PERSISTED_EXPLORER_QUERY_DRAFTS; index++) {
      vi.setSystemTime(index)
      state.createDraft({ id: `query-${index}`, projectRef: 'project-a' })
    }

    const persisted = JSON.parse(storage.getItem(key)!)
    expect(Object.keys(persisted)).toHaveLength(MAX_PERSISTED_EXPLORER_QUERY_DRAFTS)
    expect(persisted['query-0']).toBeUndefined()
    expect(persisted[`query-${MAX_PERSISTED_EXPLORER_QUERY_DRAFTS}`]).toBeDefined()
  })

  it('removes the persisted draft and its session result when its tab closes', () => {
    const storage = createMemoryStorage()
    const state = createExplorerQueryState(storage)

    state.createDraft({ id: 'query-1', projectRef: 'project-a', sql: 'select 1' })
    state.updateDraft({ id: 'query-1', sql: 'select 2' })
    state.setResult({ id: 'query-1', result: { rows: [{ value: 1 }], executedAt: 1 } })
    state.removeDraft({ id: 'query-1', projectRef: 'project-a' })
    vi.advanceTimersByTime(EXPLORER_QUERY_PERSIST_DELAY)

    expect(state.drafts['query-1']).toBeUndefined()
    expect(state.results['query-1']).toBeUndefined()
    expect(storage.getItem(LOCAL_STORAGE_KEYS.EXPLORER_QUERY_DRAFTS('project-a'))).toBeNull()
  })
})
