import { describe, expect, it } from 'vitest'

import {
  computeOverallRisk,
  countConfigured,
  getCatalogEntry,
  selectionToScopes,
  type PermissionSelection,
} from './AccessToken.permissions'
import {
  getEnabledEndpoints,
  getEnabledEndpointsForCapability,
  getEnabledMcpTools,
  type PermissionScopeMap,
} from '@/data/scoped-access-tokens/permission-scope-map-query'

const scopeMap = (partial: Partial<PermissionScopeMap>): PermissionScopeMap => ({
  scopes: {},
  endpoints: {},
  mcp_tools: {},
  ...partial,
})

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

describe('permission scope map (group enforcement)', () => {
  it('enables a multi-scope MCP tool group only when all scopes of the group are granted', () => {
    // create_project requires org read + org project create together (the handler's FGA checks)
    const permissionScopeMap = scopeMap({
      mcp_tools: { create_project: [['organization_admin_read', 'organization_projects_create']] },
    })
    expect(
      getEnabledMcpTools({
        grantedScopes: ['organization_projects_create'],
        permissionScopeMap,
      })
    ).not.toContain('create_project')
    expect(
      getEnabledMcpTools({
        grantedScopes: ['organization_admin_read', 'organization_projects_create'],
        permissionScopeMap,
      })
    ).toContain('create_project')
  })

  it('enables a tool with alternative groups when any single group is fully granted', () => {
    // execute_sql requires database_read OR database_write, depending on read-only mode
    const permissionScopeMap = scopeMap({
      mcp_tools: { execute_sql: [['database_read'], ['database_write']] },
    })
    expect(getEnabledMcpTools({ grantedScopes: ['database_read'], permissionScopeMap })).toContain(
      'execute_sql'
    )
    expect(getEnabledMcpTools({ grantedScopes: ['database_write'], permissionScopeMap })).toContain(
      'execute_sql'
    )
    expect(
      getEnabledMcpTools({ grantedScopes: ['storage_read'], permissionScopeMap })
    ).not.toContain('execute_sql')
  })

  it('reports ungated tools (no groups) as enabled for any token, including one with no scopes', () => {
    // search_docs hits the content API and get_project_url builds a hostname string, so no
    // permission gates either — the review step should say so rather than hide them.
    const permissionScopeMap = scopeMap({
      mcp_tools: { search_docs: [[]], get_project_url: [[]], get_cost: [[]] },
    })

    expect(getEnabledMcpTools({ grantedScopes: ['database_read'], permissionScopeMap })).toEqual([
      'search_docs',
      'get_project_url',
      'get_cost',
    ])
    expect(getEnabledMcpTools({ grantedScopes: [], permissionScopeMap })).toEqual([
      'search_docs',
      'get_project_url',
      'get_cost',
    ])
  })

  it('lists endpoints when at least one alternative group is fully granted', () => {
    const endpoints = getEnabledEndpoints({
      grantedScopes: ['database_read', 'database_write', 'branching_development_read'],
      permissionScopeMap: scopeMap({
        endpoints: {
          'GET /api/valid_read': [['database_read']],
          'POST /api/valid_write': [['database_write']],
          'PUT /api/valid_both': [['database_read', 'database_write']],
          // development OR production: development alone is enough
          'GET /api/valid_alternative': [
            ['branching_development_read'],
            ['branching_production_read'],
          ],
          'PUT /api/invalid': [['project_write']],
          'PUT /api/incomplete': [['database_read', 'project_write']],
        },
      }),
    })
    expect(endpoints).toEqual([
      { raw: 'GET /api/valid_read', method: 'GET', path: '/api/valid_read' },
      { raw: 'POST /api/valid_write', method: 'POST', path: '/api/valid_write' },
      { raw: 'PUT /api/valid_both', method: 'PUT', path: '/api/valid_both' },
      { raw: 'GET /api/valid_alternative', method: 'GET', path: '/api/valid_alternative' },
    ])
  })
})

describe('getEnabledEndpointsForCapability', () => {
  const rawPaths = (endpoints: ReturnType<typeof getEnabledEndpointsForCapability>) =>
    endpoints.map(({ raw }) => raw)

  it('attributes an endpoint to each capability whose scope is in a fully-granted group', () => {
    const permissionScopeMap = scopeMap({
      endpoints: {
        'GET /api/branches': [['branching_development_read'], ['branching_production_read']],
      },
    })
    const allGrantedScopes = ['branching_development_read', 'branching_production_read']

    expect(
      rawPaths(
        getEnabledEndpointsForCapability({
          capabilityScopes: ['branching_development_read'],
          allGrantedScopes,
          permissionScopeMap,
        })
      )
    ).toEqual(['GET /api/branches'])
    expect(
      rawPaths(
        getEnabledEndpointsForCapability({
          capabilityScopes: ['branching_production_read'],
          allGrantedScopes,
          permissionScopeMap,
        })
      )
    ).toEqual(['GET /api/branches'])
  })

  // The endpoint is callable, but thanks to the development alternative — production granted alone
  // would not have enabled it, so it must not be listed under the production capability.
  it('does not attribute an endpoint to a capability whose own group is unsatisfied', () => {
    const enabled = getEnabledEndpointsForCapability({
      capabilityScopes: ['branching_production_read'],
      allGrantedScopes: ['branching_development_read'],
      permissionScopeMap: scopeMap({
        endpoints: {
          'GET /api/branches': [['branching_development_read'], ['branching_production_read']],
        },
      }),
    })

    expect(enabled).toEqual([])
  })

  it('requires every scope of the capability group to be granted', () => {
    const permissionScopeMap = scopeMap({
      endpoints: { 'PUT /api/upgrade': [['project_admin_read', 'database_read']] },
    })

    expect(
      getEnabledEndpointsForCapability({
        capabilityScopes: ['database_read'],
        allGrantedScopes: ['database_read'],
        permissionScopeMap,
      })
    ).toEqual([])
    expect(
      rawPaths(
        getEnabledEndpointsForCapability({
          capabilityScopes: ['database_read'],
          allGrantedScopes: ['database_read', 'project_admin_read'],
          permissionScopeMap,
        })
      )
    ).toEqual(['PUT /api/upgrade'])
  })
})
