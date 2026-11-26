import { describe, expect, test } from 'vitest'

import {
  getAllProjectsRowLabel,
  getAuthorizationChangeDescriptions,
  getAuthorizationChanges,
  getResultingGrantDescription,
  hasAuthorizationChanges,
} from './Authorization.utils'

describe('getResultingGrantDescription', () => {
  test('describes a single organization-wide grant by default', () => {
    expect(getResultingGrantDescription(false, false)).toEqual(
      'One grant for the organization, every project in it'
    )
  })

  test('describes per-member grants when only the approver is member-bound', () => {
    expect(getResultingGrantDescription(true, false)).toEqual(
      'One grant per member, every project that member can access'
    )
  })

  test('describes chosen projects when only project scoping is on', () => {
    expect(getResultingGrantDescription(false, true)).toEqual(
      'One grant for the organization, projects chosen when connecting'
    )
  })

  test('describes per-member scoped grants when both are strict', () => {
    expect(getResultingGrantDescription(true, true)).toEqual(
      'One grant per member, projects chosen when connecting'
    )
  })
})

describe('getAllProjectsRowLabel', () => {
  test('names the organization for an organization-bound grant', () => {
    expect(getAllProjectsRowLabel(false, 'Acme')).toEqual('All projects in Acme')
  })

  test('falls back when the organization name is unknown', () => {
    expect(getAllProjectsRowLabel(false)).toEqual('All projects in your organization')
  })

  test('scopes to the member for a member-bound grant', () => {
    expect(getAllProjectsRowLabel(true, 'Acme')).toEqual('All projects you can access')
  })
})

describe('getAuthorizationChanges', () => {
  const defaults = { member_bound_grant: false, project_scoping: false }

  test('reports no changes when nothing moved', () => {
    const changes = getAuthorizationChanges(defaults, defaults)
    expect(changes).toEqual({ isApproverChanged: false, isProjectReachChanged: false })
    expect(hasAuthorizationChanges(changes)).toBe(false)
  })

  test('reports each field that became stricter', () => {
    const changes = getAuthorizationChanges(defaults, {
      member_bound_grant: true,
      project_scoping: true,
    })
    expect(changes).toEqual({ isApproverChanged: true, isProjectReachChanged: true })
    expect(hasAuthorizationChanges(changes)).toBe(true)
  })

  test('ignores a field that is already saved as strict', () => {
    const changes = getAuthorizationChanges(
      { member_bound_grant: true, project_scoping: false },
      { member_bound_grant: true, project_scoping: true }
    )
    expect(changes).toEqual({ isApproverChanged: false, isProjectReachChanged: true })
  })

  test('does not report a move back to a looser value as a change', () => {
    const changes = getAuthorizationChanges(
      { member_bound_grant: true, project_scoping: true },
      defaults
    )
    expect(hasAuthorizationChanges(changes)).toBe(false)
  })
})

describe('getAuthorizationChangeDescriptions', () => {
  test('returns nothing when there are no changes', () => {
    expect(
      getAuthorizationChangeDescriptions({
        isApproverChanged: false,
        isProjectReachChanged: false,
      })
    ).toEqual([])
  })

  test('returns one bullet per change', () => {
    const descriptions = getAuthorizationChangeDescriptions({
      isApproverChanged: true,
      isProjectReachChanged: true,
    })
    expect(descriptions).toHaveLength(2)
    expect(descriptions[0]).toContain('their own access')
    expect(descriptions[1]).toContain('403s')
  })
})
