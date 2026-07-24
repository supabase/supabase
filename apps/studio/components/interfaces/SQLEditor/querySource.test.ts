import { describe, expect, it } from 'vitest'

import { getSnippetSource } from './querySource'

describe('querySource.ts:getSnippetSource', () => {
  it('maps log_sql to the logs source', () => {
    expect(getSnippetSource({ type: 'log_sql' })).toBe('logs')
  })

  it('maps sql to the database source', () => {
    expect(getSnippetSource({ type: 'sql' })).toBe('database')
  })

  it('maps report to the database source', () => {
    expect(getSnippetSource({ type: 'report' })).toBe('database')
  })
})
