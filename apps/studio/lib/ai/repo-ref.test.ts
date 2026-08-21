import { describe, expect, it } from 'vitest'

import { resolveRepoRef } from './repo-ref'

describe('resolveRepoRef', () => {
  it('uses the Git branch attached to the current preview', () => {
    expect(
      resolveRepoRef({
        currentBranch: { git_branch: 'feature/current' },
        branches: [{ is_default: true, git_branch: 'main' }],
      })
    ).toBe('feature/current')
  })

  it('falls back to the production branch Git ref', () => {
    expect(
      resolveRepoRef({
        currentBranch: {},
        branches: [{ is_default: true, git_branch: 'production' }],
      })
    ).toBe('production')
  })

  it('leaves the final default-branch fallback to the archive endpoint', () => {
    expect(resolveRepoRef({ currentBranch: {}, branches: [] })).toBeUndefined()
  })
})
