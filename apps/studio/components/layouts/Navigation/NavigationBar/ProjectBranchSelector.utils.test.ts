import { describe, expect, it } from 'vitest'

import { getProjectBranchSelectorState, getSelectedOrgInitial } from './ProjectBranchSelector.utils'

describe('getProjectBranchSelectorState', () => {
  it('returns main branch when branching disabled', () => {
    const result = getProjectBranchSelectorState({
      selectedBranch: undefined,
      isBranchingEnabled: false,
      selectedOrganization: undefined,
    })
    expect(result.isMainBranch).toBe(true)
    expect(result.branchDisplayName).toBe('main')
  })

  it('returns main when branching enabled and selected branch is default', () => {
    const result = getProjectBranchSelectorState({
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
    const result = getProjectBranchSelectorState({
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
    const result = getProjectBranchSelectorState({
      selectedBranch: undefined,
      isBranchingEnabled: true,
      selectedOrganization: undefined,
    })
    expect(result.branchDisplayName).toBe('main')
  })

  it('returns organization href when org has slug', () => {
    const result = getProjectBranchSelectorState({
      selectedBranch: undefined,
      isBranchingEnabled: false,
      selectedOrganization: { slug: 'my-org', name: 'My Org' } as any,
    })
    expect(result.organizationHref).toBe('/org/my-org')
  })

  it('returns organizations fallback when no org slug', () => {
    const result = getProjectBranchSelectorState({
      selectedBranch: undefined,
      isBranchingEnabled: false,
      selectedOrganization: undefined,
    })
    expect(result.organizationHref).toBe('/organizations')
  })
})

describe('getSelectedOrgInitial', () => {
  it('returns first letter of org name', () => {
    expect(getSelectedOrgInitial('My Org')).toBe('M')
  })

  it('returns O for placeholder name (matches selector fallback)', () => {
    expect(getSelectedOrgInitial('O')).toBe('O')
  })

  it('trims whitespace before taking initial', () => {
    expect(getSelectedOrgInitial('  Acme  ')).toBe('A')
  })
})
