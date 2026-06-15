import { describe, expect, it } from 'vitest'

import { getSqlSnippetSource } from './SQLEditorSource.utils'

describe('getSqlSnippetSource', () => {
  it('defaults to database when no snippet is provided', () => {
    expect(getSqlSnippetSource(undefined)).toBe('database')
    expect(getSqlSnippetSource(null)).toBe('database')
  })

  it('defaults to database when content is missing', () => {
    expect(getSqlSnippetSource({ content: undefined })).toBe('database')
  })

  it('returns the explicit source from content', () => {
    expect(getSqlSnippetSource({ content: { source: 'logs' } } as any)).toBe('logs')
    expect(getSqlSnippetSource({ content: { source: 'database' } } as any)).toBe('database')
  })
})
