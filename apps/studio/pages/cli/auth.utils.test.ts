import { describe, expect, test } from 'vitest'

import { parseRequestedScopes, toResourceLabel } from './auth.utils'

describe('parseRequestedScopes', () => {
  test('parses valid comma-separated scopes', () => {
    expect(parseRequestedScopes('database:write,storage:read')).toEqual({
      scopes: [
        { scope: 'database:write', resource: 'database', action: 'write' },
        { scope: 'storage:read', resource: 'storage', action: 'read' },
      ],
      unknown: [],
    })
  })

  test('trims whitespace and lowercases mixed case', () => {
    expect(parseRequestedScopes(' Database:Write , STORAGE:READ ')).toEqual({
      scopes: [
        { scope: 'database:write', resource: 'database', action: 'write' },
        { scope: 'storage:read', resource: 'storage', action: 'read' },
      ],
      unknown: [],
    })
  })

  test('deduplicates repeated scopes within a single param', () => {
    expect(parseRequestedScopes('database:write,database:write')).toEqual({
      scopes: [{ scope: 'database:write', resource: 'database', action: 'write' }],
      unknown: [],
    })
  })

  test('collapses read+write for the same resource into a single write entry', () => {
    expect(parseRequestedScopes('database:read,database:write')).toEqual({
      scopes: [{ scope: 'database:write', resource: 'database', action: 'write' }],
      unknown: [],
    })
  })

  test('collapses regardless of which order read/write appear in', () => {
    expect(parseRequestedScopes('database:write,database:read')).toEqual({
      scopes: [{ scope: 'database:write', resource: 'database', action: 'write' }],
      unknown: [],
    })
  })

  test('reports scopes outside the allowlist as unknown, dropping them from scopes', () => {
    expect(parseRequestedScopes('database:write,bogus:read')).toEqual({
      scopes: [{ scope: 'database:write', resource: 'database', action: 'write' }],
      unknown: ['bogus:read'],
    })
  })

  test('returns empty results for a missing param', () => {
    expect(parseRequestedScopes(undefined)).toEqual({ scopes: [], unknown: [] })
  })

  test('returns empty results for an empty string param', () => {
    expect(parseRequestedScopes('')).toEqual({ scopes: [], unknown: [] })
  })

  test('tolerates a repeated query param arriving as an array', () => {
    expect(parseRequestedScopes(['database:write', 'storage:read'])).toEqual({
      scopes: [
        { scope: 'database:write', resource: 'database', action: 'write' },
        { scope: 'storage:read', resource: 'storage', action: 'read' },
      ],
      unknown: [],
    })
  })

  test('collapses read+write when they arrive across a repeated param', () => {
    expect(parseRequestedScopes(['database:read', 'database:write'])).toEqual({
      scopes: [{ scope: 'database:write', resource: 'database', action: 'write' }],
      unknown: [],
    })
  })
})

describe('toResourceLabel', () => {
  test('title-cases a simple resource', () => {
    expect(toResourceLabel('database')).toBe('Database')
  })

  test('title-cases a multi-word resource', () => {
    expect(toResourceLabel('edge_functions')).toBe('Edge Functions')
  })

  test('applies the override for acronym-style resources', () => {
    expect(toResourceLabel('rest')).toBe('PostgREST')
  })
})
