import { describe, expect, test } from 'vitest'

import {
  AuthorizationToggleState,
  getAuthorizationPreviewExplanation,
  getResultingGrantDescription,
  isAuthorizationConfirmationPending,
} from './Authorization.utils'

describe('getAuthorizationPreviewExplanation', () => {
  test('returns null when both toggles are off', () => {
    expect(getAuthorizationPreviewExplanation(false, false)).toBeNull()
  })

  test('describes per-member grants when only that toggle is on', () => {
    expect(getAuthorizationPreviewExplanation(true, false)).toContain('each member approves')
  })

  test('describes project selection when only that toggle is on', () => {
    expect(getAuthorizationPreviewExplanation(false, true)).toContain(
      'an organization owner approves'
    )
  })

  test('describes both when both toggles are on', () => {
    expect(getAuthorizationPreviewExplanation(true, true)).toContain(
      'each member approves your app and picks'
    )
  })
})

describe('getResultingGrantDescription', () => {
  test('returns legacy behaviour when both toggles are off', () => {
    expect(getResultingGrantDescription(false, false)).toEqual(
      'Legacy behaviour, unchanged from today.'
    )
  })

  test('returns per-member org-wide grant when only member-bound is on', () => {
    expect(getResultingGrantDescription(true, false)).toEqual(
      'One grant per member, organization-wide.'
    )
  })

  test('returns single scoped grant when only project scoping is on', () => {
    expect(getResultingGrantDescription(false, true)).toEqual(
      'One organization grant, limited to chosen projects.'
    )
  })

  test('returns per-member scoped grant when both are on', () => {
    expect(getResultingGrantDescription(true, true)).toEqual(
      'One grant per member, limited to chosen projects.'
    )
  })
})

describe('isAuthorizationConfirmationPending', () => {
  const off: AuthorizationToggleState = { checked: false, locked: false, confirmed: false }

  test('is false when both toggles are off', () => {
    expect(isAuthorizationConfirmationPending(off, off)).toBe(false)
  })

  test('is true when a toggle is newly enabled but not confirmed', () => {
    const newlyEnabled: AuthorizationToggleState = {
      checked: true,
      locked: false,
      confirmed: false,
    }
    expect(isAuthorizationConfirmationPending(newlyEnabled, off)).toBe(true)
  })

  test('is false when a newly enabled toggle has been confirmed', () => {
    const confirmed: AuthorizationToggleState = { checked: true, locked: false, confirmed: true }
    expect(isAuthorizationConfirmationPending(confirmed, off)).toBe(false)
  })

  test('is false when an enabled toggle is locked, regardless of confirmation', () => {
    const locked: AuthorizationToggleState = { checked: true, locked: true, confirmed: false }
    expect(isAuthorizationConfirmationPending(locked, off)).toBe(false)
  })
})
