import { describe, expect, it } from 'vitest'

import {
  countConfigured,
  countConfiguredInCategory,
  getCatalogEntry,
  getEntryModes,
  getVisibleCategories,
  getVisibleEntries,
  sanitizeSelection,
  scopesToSelection,
  selectionToScopes,
  type PermissionSelection,
} from './AccessToken.permissions'
import {
  getEnabledEndpoints,
  getEnabledEndpointsForCapability,
  getEnabledMcpTools,
  normalizePermissionScopeMap,
  type PermissionScopeMap,
} from '@/data/scoped-access-tokens/permission-scope-map-query'

const scopeMap = (partial: Partial<PermissionScopeMap>): PermissionScopeMap => ({
  scopes: {},
  endpoints: {},
  mcp_tools: {},
  ...partial,
})

describe('scopesToSelection', () => {
  it('round-trips studio-created grants (full read/write sets)', () => {
    expect(scopesToSelection(['database_read', 'database_write'])).toEqual({
      'project:database': 'readwrite',
    })
    expect(scopesToSelection(['database_read'])).toEqual({ 'project:database': 'read' })
    expect(scopesToSelection([])).toEqual({})
  })

  // API-created tokens can hold partial scope sets; the derived mode is an upper bound so the
  // review UI never claims 'Minimal — no capabilities' for a token with real authority.
  it('never drops partial grants from API-created tokens', () => {
    // A lone create scope (one of the entry's three write scopes) still surfaces as readwrite.
    expect(scopesToSelection(['branching_development_create'])).toEqual({
      'project:branching_development': 'readwrite',
    })
    // A write grant without the read scopes still surfaces (upper-bound readwrite).
    expect(scopesToSelection(['project_admin_write'])).toEqual({ 'project:admin': 'readwrite' })
  })
})

describe('normalizePermissionScopeMap', () => {
  // A stale CDN entry can serve the pre-groups payload (flat conjunctive string[] per endpoint)
  // to a client whose evaluators expect string[][]; without normalization group.every crashes.
  it('interprets a stale flat payload as single conjunctive groups', () => {
    const normalized = normalizePermissionScopeMap({
      scopes: {},
      endpoints: {
        'GET /v1/projects': ['projects_read', 'organization_projects_read'],
      },
      mcp_tools: { execute_sql: ['database_read', 'database_write'] },
    })

    expect(normalized.endpoints['GET /v1/projects']).toEqual([
      ['projects_read', 'organization_projects_read'],
    ])
    expect(normalized.mcp_tools.execute_sql).toEqual([['database_read', 'database_write']])
    // The normalized shape evaluates without throwing
    expect(
      getEnabledMcpTools({ grantedScopes: ['database_read'], permissionScopeMap: normalized })
    ).toEqual([])
  })

  it('passes the current grouped payload through unchanged', () => {
    const grouped: PermissionScopeMap = {
      scopes: {},
      endpoints: { 'GET /v1/branches': [['branching_development_read']] },
      mcp_tools: { search_docs: [[]], broken_tool: [] },
    }

    expect(normalizePermissionScopeMap(grouped)).toEqual(grouped)
  })

  it('tolerates payloads missing any of the three maps entirely', () => {
    const normalized = normalizePermissionScopeMap({})

    expect(normalized.scopes).toEqual({})
    expect(normalized.endpoints).toEqual({})
    expect(normalized.mcp_tools).toEqual({})
  })

  it('fails closed (nobody) on values that are not arrays at all', () => {
    const normalized = normalizePermissionScopeMap({
      scopes: {},
      endpoints: { 'GET /v1/projects': null },
      mcp_tools: { execute_sql: 'database_read' },
    })

    expect(normalized.endpoints['GET /v1/projects']).toEqual([])
    expect(normalized.mcp_tools.execute_sql).toEqual([])
  })

  // response.json() can legally produce any of these (a null body, an error string); the
  // normalizer is the boundary and must return the fail-closed empty map, not throw.
  it('fails closed on a top-level payload that is not an object', () => {
    const empty = { scopes: {}, endpoints: {}, mcp_tools: {} }

    expect(normalizePermissionScopeMap(null)).toEqual(empty)
    expect(normalizePermissionScopeMap(undefined)).toEqual(empty)
    expect(normalizePermissionScopeMap('internal server error')).toEqual(empty)
    expect(normalizePermissionScopeMap([])).toEqual(empty)
  })

  it('empties a field whose record shape is wrong without discarding the rest', () => {
    const normalized = normalizePermissionScopeMap({
      scopes: { database_read: { endpoints: 'not-an-array', mcp_tools: [] } },
      endpoints: { 'GET /v1/projects': [['projects_read']] },
      mcp_tools: null,
    })

    expect(normalized.scopes).toEqual({})
    expect(normalized.endpoints['GET /v1/projects']).toEqual([['projects_read']])
    expect(normalized.mcp_tools).toEqual({})
  })
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

describe('countConfigured', () => {
  it('counts only non-none modes', () => {
    expect(
      countConfigured(
        {
          'project:database': 'read',
          'project:storage': 'none',
          'organization:members': 'readwrite',
        },
        'organization'
      )
    ).toBe(2)
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

  it('reports ungated tools (one empty group) as enabled for any token, including one with no scopes', () => {
    // search_docs hits the public content API and confirm_cost computes a local hash, so no
    // permission gates either — the review step should say so rather than hide them.
    const permissionScopeMap = scopeMap({
      mcp_tools: { search_docs: [[]], confirm_cost: [[]] },
    })

    expect(getEnabledMcpTools({ grantedScopes: ['database_read'], permissionScopeMap })).toEqual([
      'search_docs',
      'confirm_cost',
    ])
    expect(getEnabledMcpTools({ grantedScopes: [], permissionScopeMap })).toEqual([
      'search_docs',
      'confirm_cost',
    ])
  })

  it('never enables a tool whose alternatives were all dropped ([])', () => {
    const permissionScopeMap = scopeMap({ mcp_tools: { broken_tool: [] } })

    expect(
      getEnabledMcpTools({ grantedScopes: ['database_read'], permissionScopeMap })
    ).not.toContain('broken_tool')
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

const PROJECT_SCOPE_HIDDEN_KEYS = [
  'user:organizations',
  'organization:audit_logs',
  'organization:billing',
  'organization:config',
  'organization:members',
  'organization:projects',
  'organization:platform_webhooks',
  'project:auth_hooks',
  'project:auth_users',
  'project:operations',
  'project:snippets',
]

const keysOf = (resourceAccess: 'project' | 'organization' | 'account') =>
  getVisibleEntries(resourceAccess).map((entry) => entry.key)

describe('project-scope visibility', () => {
  it('names eleven real catalog entries as hidden', () => {
    expect(PROJECT_SCOPE_HIDDEN_KEYS).toHaveLength(11)
    for (const key of PROJECT_SCOPE_HIDDEN_KEYS) {
      expect(getCatalogEntry(key), key).toBeDefined()
    }
  })

  it('hides exactly those entries on project scope', () => {
    expect(keysOf('project')).toEqual(
      keysOf('organization').filter((key) => !PROJECT_SCOPE_HIDDEN_KEYS.includes(key))
    )
  })

  it('keeps every entry on organization and account scope', () => {
    for (const key of PROJECT_SCOPE_HIDDEN_KEYS) {
      expect(keysOf('organization')).toContain(key)
      expect(keysOf('account')).toContain(key)
    }
  })

  it('keeps the account-wide rows and the rest of the project category on project scope', () => {
    expect(keysOf('project')).toContain('user:projects')
    expect(keysOf('project')).toContain('user:snippets')
    expect(keysOf('project')).toContain('organization:admin')
    expect(keysOf('project')).toContain('project:admin')
  })

  it('drops a category once every one of its rows is hidden', () => {
    const categories = getVisibleCategories('project')
    expect(categories.every((category) => category.entries.length > 0)).toBe(true)
    expect(categories.map((category) => category.key)).toEqual(
      getVisibleCategories('organization').map((category) => category.key)
    )
  })
})

describe('getEntryModes', () => {
  const organizationAdmin = getCatalogEntry('organization:admin')!
  const projectAdmin = getCatalogEntry('project:admin')!
  const advisors = getCatalogEntry('project:advisors')!

  it('drops Read from Organization Settings on project scope only', () => {
    expect(getEntryModes(organizationAdmin, 'project')).toEqual(['none', 'readwrite'])
    expect(getEntryModes(organizationAdmin, 'organization')).toEqual(['none', 'read', 'readwrite'])
    expect(getEntryModes(organizationAdmin, 'account')).toEqual(['none', 'read', 'readwrite'])
  })

  it('leaves every other entry unrestricted', () => {
    expect(getEntryModes(projectAdmin, 'project')).toEqual(['none', 'read', 'readwrite'])
    expect(getEntryModes(advisors, 'project')).toEqual(['none', 'read'])
  })
})

describe('sanitizeSelection', () => {
  const configured: PermissionSelection = {
    'organization:members': 'readwrite',
    'organization:billing': 'read',
    'project:snippets': 'readwrite',
    'project:auth_users': 'read',
    'user:organizations': 'read',
    'organization:admin': 'read',
    'project:admin': 'readwrite',
  }

  it('resets hidden rows and Organization Settings Read to none on project scope', () => {
    expect(sanitizeSelection(configured, 'project')).toEqual({
      'organization:members': 'none',
      'organization:billing': 'none',
      'project:snippets': 'none',
      'project:auth_users': 'none',
      'user:organizations': 'none',
      'organization:admin': 'none',
      'project:admin': 'readwrite',
    })
  })

  it('keeps Organization Settings Read-write on project scope', () => {
    expect(sanitizeSelection({ 'organization:admin': 'readwrite' }, 'project')).toEqual({
      'organization:admin': 'readwrite',
    })
  })

  it('leaves an organization-scoped selection untouched', () => {
    expect(sanitizeSelection(configured, 'organization')).toEqual(configured)
  })

  it('drops modes for keys that are not in the catalog', () => {
    expect(sanitizeSelection({ 'project:gone': 'read' }, 'organization')).toEqual({
      'project:gone': 'none',
    })
  })
})

describe('configured counters on project scope', () => {
  const selection: PermissionSelection = {
    'project:admin': 'read',
    'project:snippets': 'readwrite',
    'organization:members': 'readwrite',
  }

  it('skips hidden rows', () => {
    expect(countConfigured(selection, 'project')).toBe(1)
    expect(countConfigured(selection, 'organization')).toBe(3)
  })

  it('skips hidden rows per category', () => {
    expect(countConfiguredInCategory(selection, 'project', 'project')).toBe(1)
    expect(countConfiguredInCategory(selection, 'project', 'organization')).toBe(2)
    expect(countConfiguredInCategory(selection, 'account', 'project')).toBe(0)
    expect(countConfiguredInCategory(selection, 'account', 'organization')).toBe(1)
  })
})

describe('project-scoped payload', () => {
  const hiddenScopes = PROJECT_SCOPE_HIDDEN_KEYS.flatMap((key) => {
    const entry = getCatalogEntry(key)!
    return [...entry.readScopes, ...entry.writeScopes]
  })

  it('grants no hidden scope, whatever the selection held', () => {
    const everything: PermissionSelection = Object.fromEntries(
      getVisibleEntries('organization').map((entry) => [entry.key, 'readwrite' as const])
    )
    const scopes = selectionToScopes(sanitizeSelection(everything, 'project'))

    for (const scope of hiddenScopes) {
      expect(scopes, scope).not.toContain(scope)
    }
    expect(scopes).toContain('project_admin_write')
  })

  it('grants no organization settings scope when the selection only held Read', () => {
    const allRead: PermissionSelection = Object.fromEntries(
      getVisibleEntries('organization').map((entry) => [entry.key, 'read' as const])
    )
    const scopes = selectionToScopes(sanitizeSelection(allRead, 'project'))

    for (const scope of hiddenScopes) {
      expect(scopes, scope).not.toContain(scope)
    }
    expect(scopes).not.toContain('organization_admin_read')
    expect(scopes).toContain('project_admin_read')
  })

  it('still grants Organization Settings read-write, which carries its read scope', () => {
    const scopes = selectionToScopes(
      sanitizeSelection({ 'organization:admin': 'readwrite' }, 'project')
    )
    expect(scopes.sort()).toEqual(['organization_admin_read', 'organization_admin_write'])
  })
})
