import { describe, expect, it } from 'vitest'

import { summarizeProjectAccess, summarizeViewerProjectMembers } from './General.utils'

describe('summarizeProjectAccess', () => {
  it('returns organization-wide access when project and org member sets match', () => {
    const summary = summarizeProjectAccess({
      projectMembers: [
        { user_id: 'a', primary_email: 'a@example.com', username: 'a' },
        { user_id: 'b', primary_email: 'b@example.com', username: 'b' },
      ],
      organizationMembers: [{ gotrue_id: 'a' } as any, { gotrue_id: 'b' } as any],
      isSuccessOrganizationMembers: true,
    })

    expect(summary.projectMemberCount).toBe(2)
    expect(summary.organizationMemberCount).toBe(2)
    expect(summary.canCompareWithOrganizationMembers).toBe(true)
    expect(summary.hasOrganizationWideAccess).toBe(true)
  })

  it('returns restricted access when project member set is a subset of org members', () => {
    const summary = summarizeProjectAccess({
      projectMembers: [{ user_id: 'a', primary_email: 'a@example.com', username: 'a' }],
      organizationMembers: [{ gotrue_id: 'a' } as any, { gotrue_id: 'b' } as any],
      isSuccessOrganizationMembers: true,
    })

    expect(summary.projectMemberCount).toBe(1)
    expect(summary.organizationMemberCount).toBe(2)
    expect(summary.canCompareWithOrganizationMembers).toBe(true)
    expect(summary.hasOrganizationWideAccess).toBe(false)
  })

  it('does not compare against organization members when org data is unavailable', () => {
    const summary = summarizeProjectAccess({
      projectMembers: [{ user_id: 'a', primary_email: 'a@example.com', username: 'a' }],
      organizationMembers: [],
      isSuccessOrganizationMembers: false,
    })

    expect(summary.projectMemberCount).toBe(1)
    expect(summary.canCompareWithOrganizationMembers).toBe(false)
    expect(summary.hasOrganizationWideAccess).toBe(false)
  })

  it('deduplicates project members by user id and caps visible members', () => {
    const summary = summarizeProjectAccess({
      projectMembers: [
        { user_id: 'a', primary_email: 'a@example.com', username: 'a' },
        { user_id: 'a', primary_email: 'a@example.com', username: 'a-duplicate' },
        { user_id: 'b', primary_email: 'b@example.com', username: 'b' },
      ],
      organizationMembers: [{ gotrue_id: 'a' } as any, { gotrue_id: 'b' } as any],
      isSuccessOrganizationMembers: true,
    })

    expect(summary.projectMemberCount).toBe(2)
    expect(summary.uniqueProjectMembers).toHaveLength(2)
  })
})

describe('summarizeViewerProjectMembers', () => {
  it('hides non-visible members when viewer has limited visibility', () => {
    const summary = summarizeViewerProjectMembers({
      uniqueProjectMembers: [
        { user_id: 'a', primary_email: 'a@example.com', username: 'a' },
        { user_id: 'b', primary_email: 'b@example.com', username: 'b' },
      ],
      organizationMembers: [{ gotrue_id: 'a' } as any],
      hasLimitedVisibility: true,
    })

    expect(summary.viewerVisibleProjectMemberCount).toBe(1)
    expect(summary.viewerVisibleProjectMembers).toEqual([
      { user_id: 'a', primary_email: 'a@example.com', username: 'a' },
    ])
  })

  it('shows all project members for org-scoped visibility', () => {
    const summary = summarizeViewerProjectMembers({
      uniqueProjectMembers: [
        { user_id: 'a', primary_email: 'a@example.com', username: 'a' },
        { user_id: 'b', primary_email: 'b@example.com', username: 'b' },
      ],
      organizationMembers: [{ gotrue_id: 'a' } as any],
      hasLimitedVisibility: false,
      maxVisibleMembers: 1,
    })

    expect(summary.viewerVisibleProjectMemberCount).toBe(2)
    expect(summary.viewerVisibleMembers).toHaveLength(1)
    expect(summary.viewerHiddenMembersCount).toBe(1)
  })
})
