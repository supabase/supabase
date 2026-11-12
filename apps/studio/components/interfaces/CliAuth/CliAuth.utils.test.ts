import { describe, expect, test } from 'vitest'

import { getScopeCommands, parseRequestedScopes } from './CliAuth.utils'

const DATABASE_WRITE = {
  scope: 'project:database:write',
  key: 'project:database',
  label: 'Database',
  action: 'write',
}
const SNIPPETS_READ = {
  scope: 'project:snippets:read',
  key: 'project:snippets',
  label: 'SQL Snippets',
  action: 'read',
}

describe('parseRequestedScopes', () => {
  test('parses valid comma-separated scopes', () => {
    expect(parseRequestedScopes('project:database:write,project:snippets:read')).toEqual({
      scopes: [DATABASE_WRITE, SNIPPETS_READ],
      unknown: [],
    })
  })

  test('resolves the label from the permission catalog', () => {
    const { scopes } = parseRequestedScopes('project:admin:read')
    expect(scopes).toEqual([
      {
        scope: 'project:admin:read',
        key: 'project:admin',
        label: 'Project Settings',
        action: 'read',
      },
    ])
  })

  test('trims whitespace and lowercases mixed case', () => {
    expect(parseRequestedScopes(' Project:Database:Write , PROJECT:SNIPPETS:READ ')).toEqual({
      scopes: [DATABASE_WRITE, SNIPPETS_READ],
      unknown: [],
    })
  })

  test('deduplicates repeated scopes within a single param', () => {
    expect(parseRequestedScopes('project:database:write,project:database:write')).toEqual({
      scopes: [DATABASE_WRITE],
      unknown: [],
    })
  })

  test('collapses read+write for the same resource into a single write entry', () => {
    expect(parseRequestedScopes('project:database:read,project:database:write')).toEqual({
      scopes: [DATABASE_WRITE],
      unknown: [],
    })
  })

  test('collapses regardless of which order read/write appear in', () => {
    expect(parseRequestedScopes('project:database:write,project:database:read')).toEqual({
      scopes: [DATABASE_WRITE],
      unknown: [],
    })
  })

  test('reports scopes outside the catalog as unknown', () => {
    expect(parseRequestedScopes('project:database:write,project:bogus:read')).toEqual({
      scopes: [DATABASE_WRITE],
      unknown: ['project:bogus:read'],
    })
  })

  test('reports a malformed scope as unknown', () => {
    expect(parseRequestedScopes('database:write')).toEqual({
      scopes: [],
      unknown: ['database:write'],
    })
  })

  test('reports an unsupported action as unknown', () => {
    expect(parseRequestedScopes('project:database:admin')).toEqual({
      scopes: [],
      unknown: ['project:database:admin'],
    })
  })

  test('reports write on a read-only resource as unknown', () => {
    expect(parseRequestedScopes('project:advisors:write')).toEqual({
      scopes: [],
      unknown: ['project:advisors:write'],
    })
  })

  test('returns empty results for a missing param', () => {
    expect(parseRequestedScopes(undefined)).toEqual({ scopes: [], unknown: [] })
  })

  test('returns empty results for an empty string param', () => {
    expect(parseRequestedScopes('')).toEqual({ scopes: [], unknown: [] })
  })

  test('tolerates a repeated query param arriving as an array', () => {
    expect(parseRequestedScopes(['project:database:write', 'project:snippets:read'])).toEqual({
      scopes: [DATABASE_WRITE, SNIPPETS_READ],
      unknown: [],
    })
  })

  test('collapses read+write when they arrive across a repeated param', () => {
    expect(parseRequestedScopes(['project:database:read', 'project:database:write'])).toEqual({
      scopes: [DATABASE_WRITE],
      unknown: [],
    })
  })
})

describe('getScopeCommands', () => {
  test('lists write commands before read commands for a write scope', () => {
    const { scopes } = parseRequestedScopes('project:database:write')
    expect(getScopeCommands(scopes[0])).toEqual(['db push', 'db reset', 'db dump', 'gen types'])
  })

  test('lists only read commands for a read scope', () => {
    const { scopes } = parseRequestedScopes('project:database:read')
    expect(getScopeCommands(scopes[0])).toEqual(['db dump', 'gen types'])
  })

  test('returns nothing for a resource with no mapped commands', () => {
    const { scopes } = parseRequestedScopes('project:advisors:read')
    expect(getScopeCommands(scopes[0])).toEqual([])
  })
})
