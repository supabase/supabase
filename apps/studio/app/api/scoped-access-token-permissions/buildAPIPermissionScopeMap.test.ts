import { describe, expect, test } from 'vitest'

import { getEndpointsAndMCPToolsForAPI } from './buildAPIPermissionScopeMap'

describe('getEndpointsAndMCPToolsForAPI', () => {
  const openAPISpecs = {
    paths: {
      '/v1/projects/{ref}/database/migrations': {
        get: {
          security: [
            {
              fga_permissions: ['database_migrations_read'],
            },
          ],
        },
        post: {
          security: [
            {
              fga_permissions: ['database_migrations_write'],
            },
          ],
        },
      },
      '/v1/projects/{ref}/database/migrations/{version}': {
        patch: {
          security: [
            {
              fga_permissions: ['database_migrations_write'],
            },
          ],
        },
      },
    },
  }

  const mcp_tools = {
    list_migrations: ['database_migrations_read'],
    apply_migration: ['database_migrations_write', 'database_write'],
  }

  test('returns an object with permissions as keys and endpoints and mcp_tools as values', () => {
    const permissionScopeMap = getEndpointsAndMCPToolsForAPI(openAPISpecs, mcp_tools)

    expect(permissionScopeMap).toEqual({
      scopes: {
        database_migrations_read: {
          endpoints: ['GET /v1/projects/{ref}/database/migrations'],
          mcp_tools: ['list_migrations'],
        },
        database_migrations_write: {
          endpoints: [
            'POST /v1/projects/{ref}/database/migrations',
            'PATCH /v1/projects/{ref}/database/migrations/{version}',
          ],
          mcp_tools: ['apply_migration'],
        },
      },
      endpoints: {
        'GET /v1/projects/{ref}/database/migrations': ['database_migrations_read'],
        'POST /v1/projects/{ref}/database/migrations': ['database_migrations_write'],
        'PATCH /v1/projects/{ref}/database/migrations/{version}': ['database_migrations_write'],
      },
      mcp_tools,
    })
  })
})
