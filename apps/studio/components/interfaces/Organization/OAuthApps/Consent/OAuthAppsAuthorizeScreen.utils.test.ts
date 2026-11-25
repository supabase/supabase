import { describe, expect, test } from 'vitest'

import {
  formatPermissionName,
  getDiffBetweenScopes,
  getFailedProjects,
  getPreselectedProjectRefs,
  groupScopesByLevel,
} from './OAuthAppsAuthorizeScreen.utils'
import { OAuthAppsPreflightValidationData } from '@/data/oauth-apps/oauth-apps-preflight-validation-query'
import { OrgProject } from '@/data/projects/org-projects-infinite-query'

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

  const createMockOrganizationProject = (project?: Partial<OrgProject>): OrgProject => ({
    cloud_provider: '',
    databases: [],
    inserted_at: '',
    integration_source: null,
    is_branch: false,
    name: '',
    ref: '',
    region: '',
    status: 'ACTIVE_HEALTHY',
    ...project,
  })

  const grant = (refs: string[]): OAuthAppsPreflightValidationData['existing_grant'] => ({
    grant_id: '',
    approved_scopes: ['projects:read'],
    project_refs: refs,
    approved_at: '2026-08-14T09:12:00.000Z',
  })

  describe('getPreselectedProjectRefs', () => {
    const live = ['alpha', 'bravo', 'charlie', 'delta'].map((ref) =>
      createMockOrganizationProject({ ref })
    )
    test('preselects the project_ref query param when it resolves against live projects', () => {
      expect(
        getPreselectedProjectRefs({ existingGrant: null, projectRef: 'alpha', liveProjects: live })
      ).toEqual(['alpha'])
    })

    test('drops a project_ref that does not resolve against live projects', () => {
      expect(
        getPreselectedProjectRefs({ existingGrant: null, projectRef: 'ghost', liveProjects: live })
      ).toEqual([])
    })

    test('returns nothing when there is neither a grant nor a project_ref', () => {
      expect(
        getPreselectedProjectRefs({
          existingGrant: null,
          projectRef: undefined,
          liveProjects: live,
        })
      ).toEqual([])
    })

    test('existing-grant refs win over the project_ref query param', () => {
      expect(
        getPreselectedProjectRefs({
          existingGrant: grant(['charlie', 'delta']),
          projectRef: 'alpha',
          liveProjects: live,
        })
      ).toEqual(['charlie', 'delta'])
    })

    test('filters stale refs out of the existing grant', () => {
      expect(
        getPreselectedProjectRefs({
          existingGrant: grant(['alpha', 'ghost']),
          projectRef: undefined,
          liveProjects: live,
        })
      ).toEqual(['alpha'])
    })

    test('falls back to the project_ref when the existing grant carries no refs', () => {
      expect(
        getPreselectedProjectRefs({
          existingGrant: grant([]),
          projectRef: 'bravo',
          liveProjects: live,
        })
      ).toEqual(['bravo'])
    })

    test('does not cap the number of preselected refs', () => {
      const manyProjects = Array.from({ length: 15 }, (_, index) =>
        createMockOrganizationProject({ ref: `ref-${index}` })
      )
      const manyRefs = manyProjects.map((entry) => entry.ref)

      expect(
        getPreselectedProjectRefs({
          existingGrant: grant(manyRefs),
          projectRef: undefined,
          liveProjects: manyProjects,
        })
      ).toEqual(manyRefs)
    })

    test('returns nothing when there are no live projects', () => {
      expect(
        getPreselectedProjectRefs({
          existingGrant: grant(['alpha']),
          projectRef: 'alpha',
          liveProjects: [],
        })
      ).toEqual([])
    })
  })

  describe('getFailedProjects', () => {
    test('returns the failures of a projects-level failure', () => {
      const failure = {
        ref: 'alpha',
        role: { name: 'read-only' as const },
        failed_scopes: ['database:write' as const],
      }

      expect(getFailedProjects({ scope_target: 'projects', failures: [failure] })).toEqual([
        failure,
      ])
    })

    test('is empty for an organization-level failure', () => {
      expect(
        getFailedProjects({ scope_target: 'organization', role: { name: 'read-only' } })
      ).toEqual([])
    })

    test('is empty when there is no failure', () => {
      expect(getFailedProjects(null)).toEqual([])
      expect(getFailedProjects(undefined)).toEqual([])
    })
  })
})
