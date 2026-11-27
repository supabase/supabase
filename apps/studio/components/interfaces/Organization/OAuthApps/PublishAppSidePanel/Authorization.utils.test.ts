import { describe, expect, test } from 'vitest'

import {
  getAllProjectsRowLabel,
  getAuthorizationChangeDescriptions,
  getAuthorizationChanges,
  hasAuthorizationChanges,
} from './Authorization.utils'

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
  const defaults = {
    member_bound_grant: false,
    project_scoping: false,
    allow_partial_grants: false,
  }

  test('reports no changes when nothing moved with partial grant disabled', () => {
    const changes = getAuthorizationChanges(defaults, defaults, false)
    expect(changes).toEqual({
      isApproverChanged: false,
      isProjectReachChanged: false,
    })
    expect(hasAuthorizationChanges(changes, false)).toBe(false)
  })

  test('reports no changes when nothing moved with partial grant enabled', () => {
    const changes = getAuthorizationChanges(defaults, defaults, true)
    expect(changes).toEqual({
      isApproverChanged: false,
      isProjectReachChanged: false,
      isPartialGrantChanged: false,
    })
    expect(hasAuthorizationChanges(changes, true)).toBe(false)
  })

  test('reports each field that became stricter with partial grant disabled', () => {
    const changes = getAuthorizationChanges(
      defaults,
      {
        member_bound_grant: true,
        project_scoping: true,
      },
      false
    )
    expect(changes).toEqual({
      isApproverChanged: true,
      isProjectReachChanged: true,
    })
    expect(hasAuthorizationChanges(changes, false)).toBe(true)
  })

  test('reports each field that became stricter with partial grant enabled', () => {
    const changes = getAuthorizationChanges(
      defaults,
      {
        member_bound_grant: true,
        project_scoping: true,
        allow_partial_grants: true,
      },
      true
    )
    expect(changes).toEqual({
      isApproverChanged: true,
      isProjectReachChanged: true,
      isPartialGrantChanged: true,
    })
    expect(hasAuthorizationChanges(changes, true)).toBe(true)
  })

  test('ignores a field that is already saved as strict', () => {
    const changes = getAuthorizationChanges(
      { member_bound_grant: true, project_scoping: false, allow_partial_grants: false },
      { member_bound_grant: true, project_scoping: true, allow_partial_grants: true },
      true
    )
    expect(changes).toEqual({
      isApproverChanged: false,
      isProjectReachChanged: true,
      isPartialGrantChanged: true,
    })
  })

  test('does not report a move back to a looser value as a change', () => {
    const changes = getAuthorizationChanges(
      { member_bound_grant: true, project_scoping: true, allow_partial_grants: true },
      defaults
    )
    expect(hasAuthorizationChanges(changes, false)).toBe(false)
  })
})

describe('getAuthorizationChangeDescriptions', () => {
  test('returns nothing when there are no changes', () => {
    expect(
      getAuthorizationChangeDescriptions({
        isApproverChanged: false,
        isProjectReachChanged: false,
        isPartialGrantChanged: false,
      })
    ).toEqual([])
  })

  test('returns one bullet per change', () => {
    const descriptions = getAuthorizationChangeDescriptions({
      isApproverChanged: true,
      isProjectReachChanged: true,
      isPartialGrantChanged: false,
    })
    expect(descriptions).toHaveLength(2)
    expect(descriptions[0]).toContain('their own access')
    expect(descriptions[1]).toContain('403s')
  })
})
