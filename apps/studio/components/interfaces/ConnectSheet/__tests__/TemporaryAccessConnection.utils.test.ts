import { describe, expect, test } from 'vitest'

import {
  DATABASE_PASSWORD_VALUE,
  resolvePopoverDirectConnectionBehavior,
  resolveSelectedTemporaryAccessRole,
} from '../TemporaryAccessConnection.utils'

describe('resolveSelectedTemporaryAccessRole', () => {
  test('defaults to the first grant, keeps opt-out, and falls back when the grant is gone', () => {
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: null,
        activeRoles: ['postgres', 'analytics'],
      })
    ).toBe('postgres')
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: DATABASE_PASSWORD_VALUE,
        activeRoles: ['postgres'],
      })
    ).toBe(DATABASE_PASSWORD_VALUE)
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: 'analytics',
        activeRoles: ['postgres'],
      })
    ).toBe('postgres')
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: 'analytics',
        activeRoles: [],
      })
    ).toBe(DATABASE_PASSWORD_VALUE)
  })
})

describe('resolvePopoverDirectConnectionBehavior', () => {
  test('copies by default, waits while pending, and opens Connect for multiple grants', () => {
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: false,
        isPending: true,
        activeRoles: ['postgres'],
      })
    ).toEqual({ type: 'copy' })
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: true,
        activeRoles: [],
      })
    ).toEqual({ type: 'pending' })
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: false,
        activeRoles: ['analytics'],
      })
    ).toEqual({ type: 'copy', role: 'analytics' })
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: false,
        activeRoles: ['postgres', 'analytics'],
      })
    ).toEqual({ type: 'open-connect' })
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: false,
        activeRoles: [],
      })
    ).toEqual({ type: 'copy' })
  })
})
