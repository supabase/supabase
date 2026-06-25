import { describe, expect, it } from 'vitest'

import {
  formatMemberDatabaseExpiryMeta,
  getMemberAccessScopeDisplay,
  getMemberJitGrantSummary,
  getMemberRoleNames,
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

    expect(display.label).toBe('All projects (current and future)')
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
