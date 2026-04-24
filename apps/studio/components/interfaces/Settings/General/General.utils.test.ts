import { describe, expect, it } from 'vitest'

import { summarizeProjectAccess } from './General.utils'

const roles = {
  org_scoped_roles: [
    {
      id: 1,
      name: 'Owner',
      description: null,
      base_role_id: 1,
      projects: [],
    },
  ],
  project_scoped_roles: [
    {
      id: 2,
      name: 'Developer',
      description: null,
      base_role_id: 3,
      projects: [{ name: 'Project A', ref: 'ref-a' }],
    },
  ],
} as any

describe('summarizeProjectAccess', () => {
  it('includes org-scoped members for every project', () => {
    const summary = summarizeProjectAccess({
      organizationMembers: [
        {
          gotrue_id: 'owner-id',
          username: 'Owner User',
          primary_email: 'owner@example.com',
          role_ids: [1],
        } as any,
      ],
      roles,
      projectRef: 'ref-a',
      hasLimitedVisibility: false,
    })

    expect(summary.projectMemberCount).toBe(1)
    expect(summary.projectMembers[0].email).toBe('owner@example.com')
    expect(summary.projectMembers[0].role).toBe('Owner')
    expect(summary.hasOrganizationWideAccess).toBe(true)
  })

  it('filters project-scoped members to the selected project', () => {
    const summary = summarizeProjectAccess({
      organizationMembers: [
        {
          gotrue_id: 'dev-visible',
          username: 'Dev Visible',
          primary_email: 'visible@example.com',
          role_ids: [2],
        } as any,
        {
          gotrue_id: 'dev-hidden',
          username: 'Dev Hidden',
          primary_email: 'hidden@example.com',
          role_ids: [3],
        } as any,
      ],
      roles: {
        ...roles,
        project_scoped_roles: [
          {
            ...roles.project_scoped_roles[0],
            projects: [{ name: 'Project A', ref: 'ref-a' }],
          },
          {
            ...roles.project_scoped_roles[0],
            id: 3,
            projects: [{ name: 'Project B', ref: 'ref-b' }],
          },
        ],
      } as any,
      projectRef: 'ref-a',
      hasLimitedVisibility: false,
    })

    expect(summary.projectMemberCount).toBe(1)
    expect(summary.projectMembers[0].email).toBe('visible@example.com')
  })

  it('excludes invited members', () => {
    const summary = summarizeProjectAccess({
      organizationMembers: [
        {
          gotrue_id: 'member-id',
          username: 'Member',
          primary_email: 'member@example.com',
          role_ids: [1],
        } as any,
        {
          gotrue_id: 'invite-id',
          username: 'invite',
          primary_email: 'invite@example.com',
          role_ids: [1],
          invited_id: 123,
        } as any,
      ],
      roles,
      projectRef: 'ref-a',
      hasLimitedVisibility: false,
    })

    expect(summary.organizationMemberCount).toBe(1)
    expect(summary.projectMemberCount).toBe(1)
  })

  it('does not show org comparison in limited-visibility mode', () => {
    const summary = summarizeProjectAccess({
      organizationMembers: [
        {
          gotrue_id: 'member-id',
          username: 'Member',
          primary_email: 'member@example.com',
          role_ids: [1],
        } as any,
      ],
      roles,
      projectRef: 'ref-a',
      hasLimitedVisibility: true,
    })

    expect(summary.shouldShowOrgComparison).toBe(false)
    expect(summary.hasOrganizationWideAccess).toBe(false)
  })

  it('caps visible members and tracks hidden count', () => {
    const summary = summarizeProjectAccess({
      organizationMembers: [
        {
          gotrue_id: '1',
          username: 'A',
          primary_email: 'a@example.com',
          role_ids: [1],
        } as any,
        {
          gotrue_id: '2',
          username: 'B',
          primary_email: 'b@example.com',
          role_ids: [1],
        } as any,
      ],
      roles,
      projectRef: 'ref-a',
      hasLimitedVisibility: false,
      maxVisibleMembers: 1,
    })

    expect(summary.projectMemberCount).toBe(2)
    expect(summary.visibleMembers).toHaveLength(1)
    expect(summary.hiddenMembersCount).toBe(1)
  })

  it('places current user at the top of project members', () => {
    const summary = summarizeProjectAccess({
      organizationMembers: [
        {
          gotrue_id: 'alpha-id',
          username: 'Alpha',
          primary_email: 'alpha@example.com',
          role_ids: [1],
        } as any,
        {
          gotrue_id: 'current-user-id',
          username: 'Current User',
          primary_email: 'zeta@example.com',
          role_ids: [1],
        } as any,
        {
          gotrue_id: 'beta-id',
          username: 'Beta',
          primary_email: 'beta@example.com',
          role_ids: [1],
        } as any,
      ],
      roles,
      projectRef: 'ref-a',
      hasLimitedVisibility: false,
      currentUserId: 'current-user-id',
      maxVisibleMembers: 2,
    })

    expect(summary.projectMembers.map((member) => member.id)).toEqual([
      'current-user-id',
      'alpha-id',
      'beta-id',
    ])
    expect(summary.visibleMembers.map((member) => member.id)).toEqual([
      'current-user-id',
      'alpha-id',
    ])
    expect(summary.hiddenMembersCount).toBe(1)
  })
})
