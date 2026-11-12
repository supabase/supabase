import { describe, expect, test } from 'vitest'

import {
  formatPermissionName,
  getDiffBetweenScopes,
  groupScopesByLevel,
} from './OAuthAppsAuthorizeScreen.utils'

describe('OAuthAppsAuthorizeScreen', () => {
  describe('getDiffBetweenScopes', () => {
    test('returns the proper differences between two set of scopes', () => {
      expect(
        getDiffBetweenScopes({
          scopes: [
            // Upgraded to read-write
            'analytics:read',
            'analytics:write',
            // Changed to write only
            'analytics_config:write',
            // Changed to read only
            'auth:read',
            // Unchanged read-write
            'database:read',
            'database:write',
            // Unchanged write
            'domains:write',
            // Unchanged read
            'edge_functions:read',
          ],
          previousScopes: [
            'analytics:read',
            'analytics_config:read',
            'auth:write',
            'database:read',
            'database:write',
            'domains:write',
            'edge_functions:read',
            // Removed
            'secrets:read',
          ],
        })
      ).toEqual({
        unchanged: {
          'read-write': ['database'],
          write: ['domains'],
          read: ['edge_functions'],
        },
        changed: {
          'read-write': [{ permission: 'analytics', previousLevel: 'read' }],
          write: [{ permission: 'analytics_config', previousLevel: 'read' }],
          read: [{ permission: 'auth', previousLevel: 'write' }],
          removed: [{ permission: 'secrets', previousLevel: 'read' }],
        },
      })
    })
  })
  describe('groupScopesByLevel', () => {
    test('groups scopes by level', () => {
      expect(
        groupScopesByLevel([
          'projects:read',
          'organizations:read',
          'projects:write',
          'analytics_config:write',
        ])
      ).toEqual({
        ['read-write']: ['projects'],
        write: ['analytics_config'],
        read: ['organizations'],
      })
    })
    test('excludes empty groups', () => {
      expect(groupScopesByLevel(['projects:read', 'organizations:read', 'projects:write'])).toEqual(
        {
          'read-write': ['projects'],
          write: [],
          read: ['organizations'],
        }
      )
    })
  })
  describe('formatPermissionName', () => {
    test('formats single word permissions', () => {
      expect(formatPermissionName('projects')).toEqual('Projects')
    })
    test('formats multiple words permissions', () => {
      expect(formatPermissionName('project_settings')).toEqual('Project Settings')
    })
  })
})
