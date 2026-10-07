import { describe, expect, test } from 'vitest'

import { formatPermissionName, groupScopesByLevel } from './OAuthAppsAuthorizeScreen.utils'

describe('OAuthAppsAuthorizeScreen', () => {
  describe('groupScopesByLevel', () => {
    test('groups scopes by level', () => {
      expect(
        groupScopesByLevel([
          'projects:read',
          'organizations:read',
          'projects:write',
          'analytics_config:write',
        ])
      ).toEqual([
        {
          level: 'read-write',
          permissions: ['projects'],
        },
        {
          level: 'write',
          permissions: ['analytics_config'],
        },
        {
          level: 'read',
          permissions: ['organizations'],
        },
      ])
    })
    test('excludes empty groups', () => {
      expect(groupScopesByLevel(['projects:read', 'organizations:read', 'projects:write'])).toEqual(
        [
          {
            level: 'read-write',
            permissions: ['projects'],
          },
          // No write group
          {
            level: 'read',
            permissions: ['organizations'],
          },
        ]
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
