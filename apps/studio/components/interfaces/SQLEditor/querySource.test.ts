import { describe, expect, it } from 'vitest'

import {
  getSnippetSource,
  isLogsSource,
  resolveSnippetSource,
  sqlSourceToFenceLanguage,
} from './querySource'

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

describe('querySource.ts:isLogsSource', () => {
  it('is true only for the logs source', () => {
    expect(isLogsSource('logs')).toBe(true)
    expect(isLogsSource('database')).toBe(false)
  })

  it('is false for an absent source', () => {
    expect(isLogsSource(undefined)).toBe(false)
  })
})

describe('querySource.ts:sqlSourceToFenceLanguage', () => {
  it('labels a logs query as clickhouse and everything else as sql', () => {
    expect(sqlSourceToFenceLanguage('logs')).toBe('clickhouse')
    expect(sqlSourceToFenceLanguage('database')).toBe('sql')
  })

  // Attachments can carry no source; those are Postgres SQL.
  it('treats an absent source as sql', () => {
    expect(sqlSourceToFenceLanguage(undefined)).toBe('sql')
  })
})

describe('querySource.ts:resolveSnippetSource', () => {
  it('prefers the snippet type over the URL param', () => {
    expect(resolveSnippetSource({ type: 'log_sql' }, undefined)).toBe('logs')
    // A stale/mismatched param must not override a snippet that already exists.
    expect(resolveSnippetSource({ type: 'sql' }, 'logs')).toBe('database')
  })

  // A fresh `/sql/new` tab has no snippet until the first keystroke, so the param is
  // the only signal that it is a logs tab.
  it('falls back to the URL param before the snippet exists', () => {
    expect(resolveSnippetSource(undefined, 'logs')).toBe('logs')
    expect(resolveSnippetSource(undefined, undefined)).toBe('database')
    expect(resolveSnippetSource(undefined, 'nonsense')).toBe('database')
  })
})
