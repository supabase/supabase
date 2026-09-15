import { describe, expect, it } from 'vitest'

import { getJwtVerificationState } from '@/components/interfaces/Functions/jwtVerification.utils'

describe('getJwtVerificationState', () => {
  it('allows toggling and flags nothing when legacy JWT keys are available and the gate is off', () => {
    expect(getJwtVerificationState({ isAvailable: true, isEnforced: false })).toStrictEqual({
      canToggle: true,
      isUnsatisfiable: false,
    })
  })

  it('allows toggling and flags nothing when legacy JWT keys are available and the gate is on', () => {
    expect(getJwtVerificationState({ isAvailable: true, isEnforced: true })).toStrictEqual({
      canToggle: true,
      isUnsatisfiable: false,
    })
  })

  it('blocks turning the gate on when legacy JWT keys are unavailable', () => {
    expect(getJwtVerificationState({ isAvailable: false, isEnforced: false })).toStrictEqual({
      canToggle: false,
      isUnsatisfiable: false,
    })
  })

  it('keeps an already enforced gate toggleable so it can be turned off, and flags it', () => {
    expect(getJwtVerificationState({ isAvailable: false, isEnforced: true })).toStrictEqual({
      canToggle: true,
      isUnsatisfiable: true,
    })
  })
})
