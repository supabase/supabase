import { describe, expect, it } from 'vitest'

import { getMobileProjectSwitcherState } from './MobileProjectSwitcher.utils'

describe('getMobileProjectSwitcherState', () => {
  it('returns main branch when branching disabled', () => {
    const result = getMobileProjectSwitcherState({
      selectedBranch: undefined,
      isBranchingEnabled: false,
      selectedOrganization: undefined,
    })
    expect(result.isMainBranch).toBe(true)
    expect(result.branchDisplayName).toBe('main')
  })

  it('returns main when branching enabled and selected branch is default', () => {
    const result = getMobileProjectSwitcherState({
      selectedBranch: {
        id: '1',
        name: 'main',
        project_ref: 'ref',
        is_default: true,
        created_at: '',
      } as any,
      isBranchingEnabled: true,
      selectedOrganization: undefined,
    })
    expect(result.isMainBranch).toBe(true)
    expect(result.branchDisplayName).toBe('main')
  })

  it('returns non-main when branching enabled and selected branch is not default', () => {
    const result = getMobileProjectSwitcherState({
      selectedBranch: {
        id: '2',
        name: 'feature-x',
        project_ref: 'ref-2',
        is_default: false,
        created_at: '',
      } as any,
      isBranchingEnabled: true,
      selectedOrganization: undefined,
    })
    expect(result.isMainBranch).toBe(false)
    expect(result.branchDisplayName).toBe('feature-x')
  })

  it('returns main when selected branch undefined and branching enabled', () => {
    const result = getMobileProjectSwitcherState({
      selectedBranch: undefined,
      isBranchingEnabled: true,
      selectedOrganization: undefined,
    })
    expect(result.branchDisplayName).toBe('main')
  })

  it('returns organization href when org has slug', () => {
    const result = getMobileProjectSwitcherState({
      selectedBranch: undefined,
      isBranchingEnabled: false,
      selectedOrganization: { slug: 'my-org', name: 'My Org' } as any,
    })
    expect(result.organizationHref).toBe('/org/my-org')
    expect(result.selectedOrgInitial).toBe('M')
  })

  it('returns organizations fallback when no org slug', () => {
    const result = getMobileProjectSwitcherState({
      selectedBranch: undefined,
      isBranchingEnabled: false,
      selectedOrganization: undefined,
    })
    expect(result.organizationHref).toBe('/organizations')
    expect(result.selectedOrgInitial).toBe('O')
  })

  it('handles org name with leading/trailing spaces for initial', () => {
    const result = getMobileProjectSwitcherState({
      selectedBranch: undefined,
      isBranchingEnabled: false,
      selectedOrganization: { slug: 'x', name: '  Acme  ' } as any,
    })
    expect(result.selectedOrgInitial).toBe('A')
  })
})
