import { beforeEach, describe, expect, it } from 'vitest'

import { useRunSource } from './useRunSource'
import { DEFAULT_LOG_TIME_RANGE } from '@/data/query-sources/query-source-registry'
import { sqlEditorSessionState } from '@/state/sql-editor/sql-editor-session-state'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

beforeEach(() => {
  resetSqlEditorStores()
  setupSqlEditorMocks()
})

describe('useRunSource', () => {
  it('resolves a database snippet to a database source', () => {
    const id = 'database-snippet'
    seedSnippet({ id, source: 'database' })

    const { result } = renderSqlEditorHook(() => useRunSource(id))

    expect(result.current).toEqual({ type: 'database' })
  })

  it('resolves a logs snippet with no session range to the default range', () => {
    const id = 'logs-snippet-default-range'
    seedSnippet({ id, source: 'logs' })

    const { result } = renderSqlEditorHook(() => useRunSource(id))

    expect(result.current).toEqual({ type: 'logs', dateRange: DEFAULT_LOG_TIME_RANGE })
  })

  it('resolves a logs snippet to its session-stored range when one is set', () => {
    const id = 'logs-snippet-custom-range'
    seedSnippet({ id, source: 'logs' })
    sqlEditorSessionState.setLogRange(id, { _tag: 'relative_time_range', amount: 2, unit: 'hour' })

    const { result } = renderSqlEditorHook(() => useRunSource(id))

    expect(result.current).toEqual({
      type: 'logs',
      dateRange: { _tag: 'relative_time_range', amount: 2, unit: 'hour' },
    })
  })
})
