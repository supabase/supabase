import { describe, expect, it } from 'vitest'

import { getMemberRowHeight } from './TeamSettings.utils'

describe('getMemberRowHeight', () => {
  it('uses the minimum height for members with one role', () => {
    expect(getMemberRowHeight({ role_ids: [1] })).toBe(72)
  })

  it('uses the minimum height when the role list is empty or missing', () => {
    expect(getMemberRowHeight({ role_ids: [] })).toBe(72)
    expect(getMemberRowHeight({} as { role_ids: number[] })).toBe(72)
  })

  it('grows by one line per role once the roles no longer fit in the minimum height', () => {
    expect(getMemberRowHeight({ role_ids: [1, 2] })).toBe(72)
    expect(getMemberRowHeight({ role_ids: [1, 2, 3] })).toBe(92)
    expect(getMemberRowHeight({ role_ids: [1, 2, 3, 4] })).toBe(112)
  })
})
