import { describe, expect, it } from 'vitest'
import { buildStudioLink, studioLinks } from './studio-links'

describe('buildStudioLink', () => {
  it('returns path unchanged when no params given', () => {
    expect(buildStudioLink('/project/abc/database/tables')).toBe('/project/abc/database/tables')
  })

  it('returns path unchanged when params object is empty', () => {
    expect(buildStudioLink('/project/abc/database/tables', {})).toBe('/project/abc/database/tables')
  })

  it('encodes space in param value', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'my schema' })
    expect(result).toBe('/project/abc/database/policies?schema=my+schema')
  })

  it('encodes slash in param value', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'a/b' })
    expect(result).toContain('schema=a%2Fb')
  })

  it('encodes ampersand in param value', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'a&b' })
    expect(result).toContain('schema=a%26b')
  })

  it('encodes hash in param value', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'a#b' })
    expect(result).toContain('schema=a%23b')
  })

  it('encodes double-quote in param value', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'a"b' })
    expect(result).toContain('schema=a%22b')
  })

  it('encodes Unicode characters in param value', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: '公共' })
    expect(result).toContain('schema=')
    expect(result).not.toContain('schema=公共')
    // Should be percent-encoded
    expect(result).toContain('%E5%85%AC%E5%85%B1')
  })

  it('encodes emoji in param value', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: '🎉test' })
    expect(result).toContain('schema=')
    expect(result).not.toContain('🎉')
  })

  it('omits null param keys', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'public', search: null })
    expect(result).toBe('/project/abc/database/policies?schema=public')
    expect(result).not.toContain('search')
  })

  it('omits undefined param keys', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'public', search: undefined })
    expect(result).toBe('/project/abc/database/policies?schema=public')
    expect(result).not.toContain('search')
  })

  it('omits empty string param keys', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'public', search: '' })
    expect(result).toBe('/project/abc/database/policies?schema=public')
    expect(result).not.toContain('search')
  })

  it('handles multiple params correctly', () => {
    const result = buildStudioLink('/project/abc/database/policies', { schema: 'my schema', search: 'my table' })
    expect(result).toContain('schema=')
    expect(result).toContain('search=')
    expect(result).not.toContain('my schema')
    expect(result).not.toContain('my table')
  })

  it('does not encode path segments', () => {
    const result = buildStudioLink('/project/my-ref/sql/abc123')
    expect(result).toBe('/project/my-ref/sql/abc123')
  })
})

describe('studioLinks.databasePolicies', () => {
  it('encodes schema with spaces', () => {
    const result = studioLinks.databasePolicies('ref123', 'my schema')
    expect(result).toContain('schema=')
    expect(result).not.toContain('my schema')
  })

  it('encodes search with slashes', () => {
    const result = studioLinks.databasePolicies('ref123', 'public', 'orders/items')
    expect(result).toContain('search=')
    expect(result).toContain('%2F')
  })

  it('omits search param when undefined', () => {
    const result = studioLinks.databasePolicies('ref123', 'public')
    expect(result).toBe('/project/ref123/database/policies?schema=public')
  })
})

describe('studioLinks.vaultSecrets', () => {
  it('encodes Vault secret value with special chars', () => {
    const secretValue = 'my-secret=value&more#stuff'
    const result = studioLinks.vaultSecrets('ref123', secretValue)
    expect(result).toContain('search=')
    expect(result).not.toContain('my-secret=value&more#stuff')
    expect(result).toContain('%3D')  // = encoded
    expect(result).toContain('%26')  // & encoded
    expect(result).toContain('%23')  // # encoded
  })
})

describe('studioLinks.sqlEditorSnippet', () => {
  it('encodes schema param without double-encoding the snippet id in path', () => {
    const result = studioLinks.sqlEditorSnippet('ref123', 'snippet-abc', 'my schema')
    expect(result).toContain('/sql/snippet-abc')
    expect(result).toContain('schema=')
    expect(result).not.toContain('my schema')
  })
})

describe('studioLinks.databaseIndexes', () => {
  it('encodes table name with special chars', () => {
    const result = studioLinks.databaseIndexes('ref123', 'public', 'user"table')
    expect(result).toContain('table=')
    expect(result).toContain('%22')  // " encoded
  })
})
