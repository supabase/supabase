import { describe, expect, it } from 'vitest'

import {
  formatMemberDatabaseExpiryMeta,
  getMemberAccessScopeDisplay,
  getMemberJitGrantSummary,
  getMemberRoleNames,
  isExternalCollaboratorMember,
  resolveOrganizationRoleDisplayName,
} from './TemporaryAccessMember.utils'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'

const member = {
  gotrue_id: 'user-1',
  role_ids: [3],
} as OrganizationMember

const roles = {
  org_scoped_roles: [
    { id: 3, name: 'Developer', projects: [{ ref: 'proj-a' }, { ref: 'proj-b' }] },
    { id: 4, name: 'Read-only', projects: [] },
  ],
  project_scoped_roles: [],
} as never

describe('TemporaryAccessMember.utils', () => {
  it('returns role names for member role ids', () => {
    expect(getMemberRoleNames(member, roles)).toEqual(['Developer'])
  })

  it('resolves project-scoped internal role names to base roles', () => {
    expect(
      getMemberRoleNames(
        { ...member, role_ids: [301] } as OrganizationMember,
        {
          org_scoped_roles: [
            { id: 3, name: 'Developer', base_role_id: 3, description: null, projects: [] },
            { id: 4, name: 'Read-only', base_role_id: 4, description: null, projects: [] },
          ],
          project_scoped_roles: [
            {
              id: 301,
              name: 'Read-only_djszgdismohreupbpgob',
              base_role_id: 4,
              description: null,
              projects: [{ ref: 'djszgdismohreupbpgob', name: 'My project' }],
            },
          ],
        } as never
      )
    ).toEqual(['Read-only'])
  })

  it('shows External collaborator for JIT guest members', () => {
    expect(
      getMemberRoleNames({ ...member, role_ids: [301] } as OrganizationMember, roles, {
        isJitGuest: true,
      })
    ).toEqual(['External collaborator'])
  })

  it('detects pending external collaborator invites with project-scoped read-only role', () => {
    const pendingMember = {
      invited_id: 1,
      role_ids: [301],
      invited_is_external_collaborator: true,
    } as OrganizationMember
    const teamRoles = {
      org_scoped_roles: [
        { id: 4, name: 'Read-only', base_role_id: 4, description: null, projects: [] },
      ],
      project_scoped_roles: [
        {
          id: 301,
          name: 'Read-only_djszgdismohreupbpgob',
          base_role_id: 4,
          description: null,
          projects: [{ ref: 'djszgdismohreupbpgob', name: 'My project' }],
        },
      ],
    } as never

    expect(isExternalCollaboratorMember(pendingMember, teamRoles)).toBe(true)
    expect(getMemberRoleNames(pendingMember, teamRoles, { isJitGuest: true })).toEqual([
      'External collaborator',
    ])
  })

  it('does not treat multi-project read-only pending invites as external collaborators', () => {
    const pendingMember = {
      invited_id: 3,
      role_ids: [301],
    } as OrganizationMember
    const teamRoles = {
      org_scoped_roles: [
        { id: 4, name: 'Read-only', base_role_id: 4, description: null, projects: [] },
      ],
      project_scoped_roles: [
        {
          id: 301,
          name: 'Read-only_proj-a',
          base_role_id: 4,
          description: null,
          projects: [
            { ref: 'proj-a', name: 'Alpha' },
            { ref: 'proj-b', name: 'Beta' },
          ],
        },
      ],
    } as never

    expect(isExternalCollaboratorMember(pendingMember, teamRoles)).toBe(false)
  })

  it('does not treat org-scoped read-only pending invites as external collaborators', () => {
    const pendingMember = {
      invited_id: 4,
      role_ids: [4],
      invited_role_scoped_projects: ['proj-a', 'proj-b'],
    } as OrganizationMember

    expect(isExternalCollaboratorMember(pendingMember, roles)).toBe(false)
  })

  it('detects accepted external collaborators with project-scoped read-only and jit grants', () => {
    const acceptedMember = {
      gotrue_id: 'user-2',
      role_ids: [301],
    } as OrganizationMember
    const teamRoles = {
      org_scoped_roles: [
        { id: 4, name: 'Read-only', base_role_id: 4, description: null, projects: [] },
      ],
      project_scoped_roles: [
        {
          id: 301,
          name: 'Read-only_proj-a',
          base_role_id: 4,
          description: null,
          projects: [{ ref: 'proj-a', name: 'Alpha' }],
        },
      ],
    } as never
    const jitSummary = {
      grants: [],
      status: { active: 1, expired: 0, activeIp: 0, expiredIp: 0 },
    }

    expect(isExternalCollaboratorMember(acceptedMember, teamRoles, { jitSummary })).toBe(true)
  })

  it('does not treat project-scoped read-only members without jit grants as external collaborators', () => {
    const readOnlyMember = {
      gotrue_id: 'user-4',
      role_ids: [301],
    } as OrganizationMember
    const teamRoles = {
      org_scoped_roles: [
        { id: 4, name: 'Read-only', base_role_id: 4, description: null, projects: [] },
      ],
      project_scoped_roles: [
        {
          id: 301,
          name: 'Read-only_proj-a',
          base_role_id: 4,
          description: null,
          projects: [{ ref: 'proj-a', name: 'Alpha' }],
        },
      ],
    } as never

    expect(isExternalCollaboratorMember(readOnlyMember, teamRoles, { jitSummary: null })).toBe(
      false
    )
    expect(getMemberRoleNames(readOnlyMember, teamRoles)).toEqual(['Read-only'])
  })

  it('does not treat org-wide read-only members with jit grants as external collaborators', () => {
    const jitSummary = {
      grants: [],
      status: { active: 1, expired: 0, activeIp: 0, expiredIp: 0 },
    }

    expect(
      isExternalCollaboratorMember(
        { gotrue_id: 'user-3', role_ids: [4] } as OrganizationMember,
        roles,
        { jitSummary }
      )
    ).toBe(false)
  })

  it('resolveOrganizationRoleDisplayName strips known role suffixes', () => {
    expect(
      resolveOrganizationRoleDisplayName(
        {
          id: 99,
          name: 'Developer_muvcxxloudcjgsjddnyl',
          base_role_id: 3,
          description: null,
          projects: [],
        },
        [{ id: 3, name: 'Developer', base_role_id: 3, description: null, projects: [] }]
      )
    ).toBe('Developer')
  })

  it('describes multi-project access scope', () => {
    const display = getMemberAccessScopeDisplay({
      member,
      roles,
      orgProjects: [
        { ref: 'proj-a', name: 'Alpha' },
        { ref: 'proj-b', name: 'Beta' },
      ],
      hasProjectScopedRoles: true,
      jitSummary: null,
    })

    expect(display.label).toBe('2 projects')
    expect(display.projectNames).toEqual(['Alpha', 'Beta'])
    expect(display.expiryMeta).toBeNull()
  })

  it('describes org-wide access scope', () => {
    const display = getMemberAccessScopeDisplay({
      member: { ...member, role_ids: [4] } as OrganizationMember,
      roles,
      orgProjects: [],
      hasProjectScopedRoles: true,
      jitSummary: null,
    })

    expect(display.label).toBe('All projects')
    expect(display.isOrgWide).toBe(true)
  })

  it('formats database expiry metadata from jit grants', () => {
    const jitSummary = getMemberJitGrantSummary(
      { gotrue_id: 'user-1', role_ids: [4] } as OrganizationMember,
      new Map([
        [
          'user-1',
          [
            {
              projectRef: 'proj-a',
              projectName: 'Alpha',
              userRoles: [{ role: 'postgres', expires_at: Math.floor(Date.now() / 1000) + 7200 }],
              status: { active: 1, expired: 0, activeIp: 0, expiredIp: 0 },
            },
          ],
        ],
      ])
    )

    expect(jitSummary).not.toBeNull()
    expect(formatMemberDatabaseExpiryMeta(jitSummary!)).toMatch(/Database access expires in \d+h/)
  })
})
