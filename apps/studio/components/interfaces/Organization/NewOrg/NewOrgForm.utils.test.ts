import { describe, expect, it } from 'vitest'

import { deriveTier } from './NewOrgForm.utils'

describe('deriveTier', () => {
  it('maps FREE to tier_free regardless of spend cap', () => {
    expect(deriveTier('FREE', false)).toBe('tier_free')
    expect(deriveTier('FREE', true)).toBe('tier_free')
  })

  it('maps PRO with spend cap enabled to tier_pro', () => {
    expect(deriveTier('PRO', true)).toBe('tier_pro')
  })

  it('maps PRO with spend cap disabled to tier_payg', () => {
    expect(deriveTier('PRO', false)).toBe('tier_payg')
  })

  it('maps TEAM to tier_team regardless of spend cap', () => {
    expect(deriveTier('TEAM', true)).toBe('tier_team')
    expect(deriveTier('TEAM', false)).toBe('tier_team')
  })
})
