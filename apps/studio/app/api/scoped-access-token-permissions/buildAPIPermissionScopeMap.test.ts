import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import {
  addMCPToolsToScopes,
  buildAPIPermissionScopeMap,
  getScopesAndEndpointsForAPI,
} from './buildAPIPermissionScopeMap'
import { type ScopeMap } from '@/data/scoped-access-tokens/permission-scope-map-query'
import { mswServer } from '@/tests/lib/msw'

describe('getScopesAndEndpointsForAPI', () => {
  const openAPISpecs = {
    paths: {
      '/v1/projects/{ref}/database/migrations': {
        get: {
          'x-fga-permissions': [['database_migrations_read']],
        },
        post: {
          'x-fga-permissions': [['database_migrations_write']],
        },
      },
      '/v1/projects/{ref}/database/migrations/{version}': {
        patch: {
          'x-fga-permissions': [['database_migrations_write']],
        },
      },
      // Alternative groups: development OR production (real shape of the branching endpoints)
      '/v1/projects/{ref}/branches': {
        get: {
          'x-fga-permissions': [['branching_development_read'], ['branching_production_read']],
        },
      },
      // No annotation -> not part of the map
      '/v1/projects/available-regions': {
        get: {},
      },
    },
  }

  test('indexes scopes and endpoints, preserving alternative permission groups', () => {
    const permissionScopeMap = getScopesAndEndpointsForAPI(openAPISpecs)

    expect(permissionScopeMap).toEqual({
      scopes: {
        database_migrations_read: {
          endpoints: ['GET /v1/projects/{ref}/database/migrations'],
          mcp_tools: [],
        },
        database_migrations_write: {
          endpoints: [
            'POST /v1/projects/{ref}/database/migrations',
            'PATCH /v1/projects/{ref}/database/migrations/{version}',
          ],
          mcp_tools: [],
        },
        branching_development_read: {
          endpoints: ['GET /v1/projects/{ref}/branches'],
          mcp_tools: [],
        },
        branching_production_read: {
          endpoints: ['GET /v1/projects/{ref}/branches'],
          mcp_tools: [],
        },
      },
      endpoints: {
        'GET /v1/projects/{ref}/database/migrations': [['database_migrations_read']],
        'POST /v1/projects/{ref}/database/migrations': [['database_migrations_write']],
        'PATCH /v1/projects/{ref}/database/migrations/{version}': [['database_migrations_write']],
        'GET /v1/projects/{ref}/branches': [
          ['branching_development_read'],
          ['branching_production_read'],
        ],
      },
    })
  })

  // An endpoint recorded with zero groups would read as ungated and be reported callable by every
  // token, so unusable annotations must drop the endpoint instead.
  test('drops endpoints with empty or unusable permission groups rather than marking them ungated', () => {
    const { endpoints, scopes } = getScopesAndEndpointsForAPI({
      paths: {
        '/v1/empty-groups': { get: { 'x-fga-permissions': [[], undefined] } },
        '/v1/unannotated': { get: {} },
      },
    })

    expect(endpoints).toEqual({})
    expect(scopes).toEqual({})
  })
})

describe('addMCPToolsToScopes', () => {
  test('assigns tools to every scope in any of their groups, without duplicates', () => {
    const scopes: ScopeMap = {
      database_migrations_read: {
        endpoints: ['GET /v1/projects/{ref}/database/migrations'],
        mcp_tools: [],
      },
      database_migrations_write: { endpoints: [], mcp_tools: ['apply_migration'] },
    }

    addMCPToolsToScopes(scopes, {
      list_migrations: [['database_migrations_read']],
      apply_migration: [['database_migrations_write'], ['database_migrations_read']],
    })

    expect(scopes).toEqual({
      database_migrations_read: {
        endpoints: ['GET /v1/projects/{ref}/database/migrations'],
        mcp_tools: ['list_migrations', 'apply_migration'],
      },
      database_migrations_write: { endpoints: [], mcp_tools: ['apply_migration'] },
    })
  })

  test('initializes scopes that only MCP tools reference', () => {
    const scopes: ScopeMap = {}

    addMCPToolsToScopes(scopes, { update_storage_config: [['storage_config_write']] })

    expect(scopes.storage_config_write).toEqual({
      endpoints: [],
      mcp_tools: ['update_storage_config'],
    })
  })

  test('leaves ungated tools out of the scope index', () => {
    const scopes: ScopeMap = {}

    addMCPToolsToScopes(scopes, { search_docs: [[]] })

    expect(scopes).toEqual({})
  })
})

describe('buildAPIPermissionScopeMap', () => {
  // vitestSetup starts mswServer with `onUnhandledRequest: 'error'` and resets handlers between
  // tests, so mocking here keeps that guard instead of replacing global fetch. All three live
  // sources (v1 spec, v2 spec, the MCP tool-permissions endpoint) are stubbed.
  const stubSources = (
    v1: Record<string, unknown>,
    v2: Record<string, unknown>,
    mcpTools: Record<string, string[][]> = { execute_sql: [['database_read']] }
  ) => {
    mswServer.use(
      http.get('*/api/v1-json', () => HttpResponse.json(v1)),
      http.get('*/api/v2-json', () => HttpResponse.json(v2)),
      http.get('*/platform/mcp-tools-permissions', () => HttpResponse.json(mcpTools))
    )
  }

  test('merges both specs, attaching each MCP tool to a shared scope exactly once', async () => {
    stubSources(
      {
        paths: {
          '/v1/projects/{ref}/database/query': {
            post: { 'x-fga-permissions': [['database_read']] },
          },
        },
      },
      {
        paths: {
          '/v2/projects/{ref}/inspect': { get: { 'x-fga-permissions': [['database_read']] } },
        },
      }
    )

    const map = await buildAPIPermissionScopeMap()

    // Both specs contribute an endpoint to the same scope, and neither is duplicated
    expect(map.scopes.database_read.endpoints).toEqual([
      'POST /v1/projects/{ref}/database/query',
      'GET /v2/projects/{ref}/inspect',
    ])
    // The tools were attached after the merge, so a scope shared by both specs lists each once
    const tools = map.scopes.database_read.mcp_tools
    expect(new Set(tools).size).toBe(tools.length)
    expect(tools).toContain('execute_sql')
  })

  // Path items may legally carry non-operation members; the specs are fetched live, so a benign
  // upstream swagger change must not start 500ing this route.
  test('tolerates path items with non-method OpenAPI members', async () => {
    stubSources(
      {
        paths: {
          '/v1/projects/{ref}': {
            parameters: [{ name: 'ref', in: 'path', required: true }],
            summary: 'Project detail',
            get: { 'x-fga-permissions': [['project_admin_read']] },
          },
        },
      },
      { paths: {} }
    )

    const map = await buildAPIPermissionScopeMap()

    expect(map.endpoints['GET /v1/projects/{ref}']).toEqual([['project_admin_read']])
    expect(Object.keys(map.endpoints)).toHaveLength(1)
  })

  test('returns the MCP tool map fetched from the endpoint', async () => {
    stubSources(
      { paths: {} },
      { paths: {} },
      {
        apply_migration: [['database_migrations_write']],
        search_docs: [[]],
      }
    )

    const map = await buildAPIPermissionScopeMap()

    expect(map.mcp_tools).toEqual({
      apply_migration: [['database_migrations_write']],
      search_docs: [[]],
    })
    // The gated tool is indexed under its permission; the ungated one is not.
    expect(map.scopes.database_migrations_write.mcp_tools).toEqual(['apply_migration'])
  })

  test('throws when the MCP tool-permissions endpoint is unavailable', async () => {
    mswServer.use(
      http.get('*/api/v1-json', () => HttpResponse.json({ paths: {} })),
      http.get('*/api/v2-json', () => HttpResponse.json({ paths: {} })),
      http.get('*/platform/mcp-tools-permissions', () => new HttpResponse(null, { status: 503 }))
    )

    await expect(buildAPIPermissionScopeMap()).rejects.toThrow()
  })
})
