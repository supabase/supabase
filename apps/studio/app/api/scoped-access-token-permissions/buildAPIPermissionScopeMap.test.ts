import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import {
  addMCPToolsToScopes,
  buildAPIPermissionScopeMap,
  getScopesAndEndpointsForAPI,
} from './buildAPIPermissionScopeMap'
import { MCPToolScopeMappings } from './MCPToolScopeMappings'
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

describe('MCPToolScopeMappings', () => {
  // Platform gates execute_sql on database:read OR database:write depending on the MCP session's
  // read_only mode (mcp.controller.ts), so the derived requirement must be two alternatives — a
  // single conjunctive group would hide the tool from read-only tokens the platform accepts.
  test('execute_sql derives the database:read bundle OR the database:write bundle', () => {
    expect(MCPToolScopeMappings.execute_sql).toHaveLength(2)
    const [readGroup, writeGroup] = MCPToolScopeMappings.execute_sql
    expect(readGroup).toContain('database_read')
    expect(readGroup).not.toContain('database_write')
    expect(writeGroup).toContain('database_write')
  })

  test('single-scope tools derive a single conjunctive group', () => {
    expect(MCPToolScopeMappings.apply_migration).toHaveLength(1)
    expect(MCPToolScopeMappings.apply_migration[0]).toContain('database_write')
  })
})

describe('buildAPIPermissionScopeMap', () => {
  // vitestSetup starts mswServer with `onUnhandledRequest: 'error'` and resets handlers between
  // tests, so mocking here keeps that guard instead of replacing global fetch.
  const stubSpecs = (v1: Record<string, unknown>, v2: Record<string, unknown>) => {
    mswServer.use(
      http.get('*/api/v1-json', () => HttpResponse.json(v1)),
      http.get('*/api/v2-json', () => HttpResponse.json(v2))
    )
  }

  test('merges both specs, attaching each MCP tool to a shared scope exactly once', async () => {
    stubSpecs(
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

  test('returns a copy of the tool mapping so callers cannot corrupt the module singleton', async () => {
    stubSpecs({ paths: {} }, { paths: {} })

    const map = await buildAPIPermissionScopeMap()
    expect(map.mcp_tools).toEqual(MCPToolScopeMappings)
    expect(map.mcp_tools).not.toBe(MCPToolScopeMappings)

    const before = structuredClone(MCPToolScopeMappings.execute_sql)
    map.mcp_tools.execute_sql.push(['tampered'])
    expect(MCPToolScopeMappings.execute_sql).toEqual(before)
  })
})
