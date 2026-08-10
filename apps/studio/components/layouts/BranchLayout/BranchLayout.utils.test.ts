import { describe, expect, it } from 'vitest'

import { generateBranchMenu } from './BranchLayout.utils'

describe('generateBranchMenu', () => {
  it('does not include project configuration drift in the branching menu', () => {
    const items = generateBranchMenu('project-ref').flatMap((group) => group.items)

    expect(items.some((item) => item.key === 'configuration-drift')).toBe(false)
  })
})
