import { describe, expect, it } from 'vitest'

import {
  getFunctionLogsChartQuery,
  getFunctionLogsCountQuery,
  getFunctionLogsFacetQuery,
  getFunctionLogsQuery,
} from './UnifiedLogs.queries.functions'
import { createUnifiedLogsSearch } from './UnifiedLogs.utils'
import { getEdgeFunctionLogsScope } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'

const search = createUnifiedLogsSearch({}, getEdgeFunctionLogsScope('hello'))

describe('self-hosted function queries', () => {
  it('keeps every query independently scoped and compatible with the Logflare translator', () => {
    const queries = [
      ...getFunctionLogsQuery(search),
      ...getFunctionLogsCountQuery(search),
      ...getFunctionLogsChartQuery(search),
      ...getFunctionLogsFacetQuery(search, 'level'),
    ]
    for (const sql of queries) {
      expect(sql).toMatch(/(?:request|runtime)_metadata.function_id = 'hello'/)
      expect(sql).not.toMatch(/\bWITH\b|UNION ALL|TO_JSON_STRING|TIMESTAMP_MICROS/i)
    }
  })
  it('keeps scope when filtering out log types and searching messages', () => {
    const queries = getFunctionLogsQuery({
      ...search,
      filter: ['log_type:neq:edge function', 'event_message:ilike:failed'],
    })
    expect(queries).toHaveLength(2)
    for (const sql of queries) {
      expect(sql).toContain("NOT IN ('edge function')")
      expect(sql).toContain("LIKE LOWER('%failed%')")
      expect(sql).toContain("function_id = 'hello'")
    }
  })
  it('rejects unsupported scopes rather than widening the query', () => {
    expect(() => getFunctionLogsQuery(createUnifiedLogsSearch())).toThrow(
      'Legacy scoped logs require one function ID'
    )
    expect(() =>
      getFunctionLogsQuery({
        ...search,
        scope: { filters: [{ column: 'function_id', operator: '<>', value: 'hello' }] },
      })
    ).toThrow('Legacy scoped logs require one function ID')
  })
  it('escapes function identity as a literal', () => {
    const queries = getFunctionLogsQuery(
      createUnifiedLogsSearch({}, getEdgeFunctionLogsScope("hello' OR 1=1 --"))
    )
    expect(queries[0]).toContain("function_id = 'hello'' OR 1=1 --'")
  })
})
