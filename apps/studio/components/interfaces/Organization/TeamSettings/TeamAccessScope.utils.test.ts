import { describe, expect, test } from 'vitest'

import {
  ALL_PROJECTS_ACCESS_SCOPE,
  buildProjectPayload,
  buildProjectPayloadFromAccessScope,
  getAccessScopeLabel,
  isAllProjectsAccessScope,
  roleRequiresOrgWideAccess,
  toggleProjectInAccessScope,
} from './TeamAccessScope.utils'

describe('TeamAccessScope.utils', () => {
  test('identifies the all-projects sentinel value', () => {
    expect(isAllProjectsAccessScope(ALL_PROJECTS_ACCESS_SCOPE)).toBe(true)
    expect(isAllProjectsAccessScope(['project-ref'])).toBe(false)
  })

  test('buildProjectPayloadFromAccessScope returns empty object for all projects', () => {
    expect(buildProjectPayloadFromAccessScope(ALL_PROJECTS_ACCESS_SCOPE)).toStrictEqual({})
  })

  test('buildProjectPayloadFromAccessScope returns multiple project refs', () => {
    expect(buildProjectPayloadFromAccessScope(['ref_a', 'ref_b'])).toStrictEqual({
      projects: ['ref_a', 'ref_b'],
    })
  })

  test('buildProjectPayloadFromAccessScope throws when no projects are selected', () => {
    expect(() => buildProjectPayloadFromAccessScope([])).toThrowError('Select at least one project')
  })

  test('getAccessScopeLabel resolves single and multiple project selections', () => {
    const projects = [
      { ref: 'ref_a', name: 'Project A' },
      { ref: 'ref_b', name: 'Project B' },
    ]

    expect(getAccessScopeLabel(['ref_a'], projects)).toBe('Project A')
    expect(getAccessScopeLabel(['ref_a', 'ref_b'], projects)).toBe('2 projects selected')
  })

  test('toggleProjectInAccessScope supports multi-select', () => {
    expect(toggleProjectInAccessScope(ALL_PROJECTS_ACCESS_SCOPE, 'ref_a')).toStrictEqual(['ref_a'])
    expect(toggleProjectInAccessScope(['ref_a'], 'ref_b')).toStrictEqual(['ref_a', 'ref_b'])
    expect(toggleProjectInAccessScope(['ref_a', 'ref_b'], 'ref_a')).toStrictEqual(['ref_b'])
  })

  test('roleRequiresOrgWideAccess is true for Owner and Administrator', () => {
    expect(roleRequiresOrgWideAccess('Owner')).toBe(true)
    expect(roleRequiresOrgWideAccess('Administrator')).toBe(true)
    expect(roleRequiresOrgWideAccess('Developer')).toBe(false)
    expect(roleRequiresOrgWideAccess('Read-only')).toBe(false)
  })

  test('buildProjectPayload remains compatible with applyToOrg flag', () => {
    expect(buildProjectPayload(true, 'ref_abc')).toStrictEqual({})
    expect(buildProjectPayload(false, 'ref_abc')).toStrictEqual({ projects: ['ref_abc'] })
  })
})
