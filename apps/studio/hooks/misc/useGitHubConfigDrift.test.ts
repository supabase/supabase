import { describe, expect, it } from 'vitest'

import { getGitBranchName } from './useGitHubConfigDrift'
import type { Branch } from '@/data/branches/branches-query'

function branch(overrides: Partial<Branch>): Branch {
  return {
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    id: 'branch-id',
    is_default: false,
    name: 'feature/foo',
    parent_project_ref: 'parent-ref',
    persistent: false,
    project_ref: 'project-ref',
    status: 'MIGRATIONS_PASSED',
    with_data: false,
    ...overrides,
  }
}

describe('getGitBranchName', () => {
  it('returns undefined when there is no branch', () => {
    expect(getGitBranchName(undefined)).toBeUndefined()
  })

  it('prefers the trimmed git_branch when set', () => {
    expect(getGitBranchName(branch({ git_branch: '  main  ', name: 'feature/foo' }))).toBe('main')
  })

  it('falls back to the trimmed branch name when git_branch is unset', () => {
    expect(getGitBranchName(branch({ git_branch: undefined, name: '  feature/foo  ' }))).toBe(
      'feature/foo'
    )
  })

  it('falls back to the branch name when git_branch is blank', () => {
    expect(getGitBranchName(branch({ git_branch: '   ', name: 'feature/foo' }))).toBe('feature/foo')
  })

  it('returns undefined for the default branch when git_branch is unset', () => {
    expect(getGitBranchName(branch({ git_branch: undefined, is_default: true }))).toBeUndefined()
  })

  it('still prefers git_branch for the default branch when it is set', () => {
    expect(getGitBranchName(branch({ git_branch: 'main', is_default: true }))).toBe('main')
  })
})
