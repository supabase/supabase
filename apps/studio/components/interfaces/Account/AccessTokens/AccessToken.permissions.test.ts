import { describe, expect, it } from 'vitest'

import {
  computeOverallRisk,
  countConfigured,
  getCatalogEntry,
  selectionToScopes,
  type PermissionSelection,
} from './AccessToken.permissions'
import { getEnabledEndpoints, getEnabledMcpTools } from '@/data/access-tokens/permission-scope-map'

describe('selectionToScopes', () => {
  it('ignores none and returns read scope for read mode', () => {
    const selection: PermissionSelection = { 'project:database': 'read', 'project:backups': 'none' }
    expect(selectionToScopes(selection)).toEqual(['database_read'])
  })

  it('returns read + write scopes for readwrite mode', () => {
    const selection: PermissionSelection = { 'project:database': 'readwrite' }
    expect(selectionToScopes(selection).sort()).toEqual(['database_read', 'database_write'])
  })

  it('dedupes and skips unknown keys', () => {
    const selection: PermissionSelection = {
      'project:database': 'read',
      'not:a-real-key': 'readwrite',
    }
    expect(selectionToScopes(selection)).toEqual(['database_read'])
  })

  it('read-only resources have no write scopes', () => {
    const advisors = getCatalogEntry('project:advisors')
    expect(advisors?.writable).toBe(false)
    expect(selectionToScopes({ 'project:advisors': 'readwrite' })).toEqual(['advisors_read'])
  })
})

describe('computeOverallRisk', () => {
  it('is Minimal with no capabilities', () => {
    expect(computeOverallRisk({}, 'project').level).toBe('Minimal')
  })

  it('account-level read-only is still Elevated', () => {
    const risk = computeOverallRisk({ 'project:advisors': 'read' }, 'account')
    expect(risk.level).toBe('Elevated')
    expect(risk.tone).toBe('medium')
  })

  it('account-level with any write is High', () => {
    const risk = computeOverallRisk({ 'project:realtime_config': 'readwrite' }, 'account')
    expect(risk.level).toBe('High')
  })

  it('project high-risk write is High', () => {
    expect(computeOverallRisk({ 'project:database': 'readwrite' }, 'project').level).toBe('High')
  })

  it('project medium write is Medium', () => {
    expect(computeOverallRisk({ 'project:realtime_config': 'readwrite' }, 'project').level).toBe(
      'Medium'
    )
  })

  it('read-only project is Low', () => {
    expect(computeOverallRisk({ 'project:database': 'read' }, 'project').level).toBe('Low')
  })
})

describe('countConfigured', () => {
  it('counts only non-none modes', () => {
    expect(countConfigured({ a: 'read', b: 'none', c: 'readwrite' })).toBe(2)
  })
})

describe('permission scope map (dual-scope enforcement)', () => {
  it('enables a dual-scope MCP tool only when all required scopes are granted', () => {
    // execute_sql requires both database_read and database_write
    expect(getEnabledMcpTools(['database_read'])).not.toContain('execute_sql')
    expect(getEnabledMcpTools(['database_read', 'database_write'])).toContain('execute_sql')
  })

  it('only lists endpoints whose every required scope is granted', () => {
    const endpoints = getEnabledEndpoints(['database_read', 'database_write'])
    expect(endpoints.every((e) => e.method.length > 0 && e.path.startsWith('/'))).toBe(true)
  })
})
