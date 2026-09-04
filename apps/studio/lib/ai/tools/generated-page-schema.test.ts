import { describe, expect, it } from 'vitest'

import {
  findGeneratedLogsSqlIssue,
  MAX_GENERATED_PAGE_QUERIES,
  renderPageInputSchema,
} from './generated-page-schema'

const validInput = {
  title: 'Auth debugging console',
  html: '<h1>Console</h1>',
  database_queries: [
    { id: 'recent_users', title: 'Recent users', sql: 'select id from auth.users', row_limit: 50 },
  ],
  log_queries: [
    {
      id: 'auth_errors',
      title: 'Auth errors',
      sql: "select timestamp from logs where source = 'auth_logs' limit 100",
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
  enable_supabase_client: true,
}

describe('renderPageInputSchema', () => {
  it('accepts a well-formed page', () => {
    expect(renderPageInputSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects duplicate ids across both query lists', () => {
    const result = renderPageInputSchema.safeParse({
      ...validInput,
      log_queries: [{ ...validInput.log_queries[0], id: 'recent_users' }],
    })

    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('Duplicate query id')
  })

  it('rejects row limits outside 1–1000', () => {
    for (const row_limit of [0, -1, 1001, 1.5]) {
      const result = renderPageInputSchema.safeParse({
        ...validInput,
        database_queries: [{ ...validInput.database_queries[0], row_limit }],
      })
      expect(result.success).toBe(false)
    }
  })

  it('caps each query list', () => {
    const many = Array.from({ length: MAX_GENERATED_PAGE_QUERIES + 1 }, (_, index) => ({
      id: `q${index}`,
      title: `Query ${index}`,
      sql: 'select 1',
      row_limit: 10,
    }))

    expect(renderPageInputSchema.safeParse({ ...validInput, database_queries: many }).success).toBe(
      false
    )
  })

  it('rejects ids the wrapper document could not safely address', () => {
    for (const id of ['Recent Users', 'recent-users', '', '1users', 'a'.repeat(64)]) {
      const result = renderPageInputSchema.safeParse({
        ...validInput,
        database_queries: [{ ...validInput.database_queries[0], id }],
        log_queries: [],
      })
      expect(result.success).toBe(false)
    }
  })

  it('rejects unknown top-level keys', () => {
    expect(
      renderPageInputSchema.safeParse({ ...validInput, allow_service_role: true }).success
    ).toBe(false)
  })

  it('rejects logs SQL without a source filter or a limit', () => {
    const result = renderPageInputSchema.safeParse({
      ...validInput,
      log_queries: [{ ...validInput.log_queries[0], sql: 'select timestamp from logs' }],
    })

    expect(result.success).toBe(false)
  })
})

describe('findGeneratedLogsSqlIssue', () => {
  it('accepts a bounded, source-filtered query', () => {
    expect(
      findGeneratedLogsSqlIssue("select count() from logs where source = 'edge_logs' limit 10")
    ).toBeNull()
    expect(
      findGeneratedLogsSqlIssue("select 1 from logs where source in ('edge_logs') limit 10")
    ).toBeNull()
  })

  it('flags a missing source filter', () => {
    expect(findGeneratedLogsSqlIssue('select count() from logs limit 10')).toContain('source')
  })

  it('flags a missing limit', () => {
    expect(
      findGeneratedLogsSqlIssue("select count() from logs where source = 'edge_logs'")
    ).toContain('limit')
  })
})
