import { describe, it, expect } from 'vitest'
import { inferConnectTabFromParentKey } from 'components/interfaces/Connect/Connect.utils'

describe('Connect.utils helpers', () => {
  it('inferConnectTabFromParentKey returns frameworks for nextjs', () => {
    expect(inferConnectTabFromParentKey('nextjs')).toBe('frameworks')
  })

  it('inferConnectTabFromParentKey returns null for unknown', () => {
    expect(inferConnectTabFromParentKey('unknown-x')).toBeNull()
  })
})
