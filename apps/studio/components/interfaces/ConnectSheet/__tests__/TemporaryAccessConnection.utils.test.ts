import { describe, expect, test } from 'vitest'

import {
  DATABASE_PASSWORD_VALUE,
  resolvePopoverDirectConnectionBehavior,
  resolveSelectedTemporaryAccessRole,
} from '../TemporaryAccessConnection.utils'

describe('resolveSelectedTemporaryAccessRole', () => {
  test('defaults to the first active grant', () => {
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: null,
        activeRoles: ['postgres', 'analytics'],
      })
    ).toBe('postgres')
  })

  test('keeps an explicit database-password opt-out', () => {
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: DATABASE_PASSWORD_VALUE,
        activeRoles: ['postgres'],
      })
    ).toBe(DATABASE_PASSWORD_VALUE)
  })

  test('falls back when the selected grant is no longer active', () => {
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: 'analytics',
        activeRoles: ['postgres'],
      })
    ).toBe('postgres')
  })

  test('falls back to the database password when there are no grants', () => {
    expect(
      resolveSelectedTemporaryAccessRole({
        selectedRole: 'analytics',
        activeRoles: [],
      })
    ).toBe(DATABASE_PASSWORD_VALUE)
  })
})

describe('resolvePopoverDirectConnectionBehavior', () => {
  test('copies the default string when temporary access is off', () => {
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: false,
        isPending: true,
        activeRoles: ['postgres'],
      })
    ).toEqual({ type: 'copy' })
  })

  test('waits until grants have loaded', () => {
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: true,
        activeRoles: [],
      })
    ).toEqual({ type: 'pending' })
  })

  test('copies a role-aware string for a single grant', () => {
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: false,
        activeRoles: ['analytics'],
      })
    ).toEqual({ type: 'copy', role: 'analytics' })
  })

  test('opens Connect when the user has multiple grants', () => {
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: false,
        activeRoles: ['postgres', 'analytics'],
      })
    ).toEqual({ type: 'open-connect' })
  })

  test('copies the default string when there are no grants', () => {
    expect(
      resolvePopoverDirectConnectionBehavior({
        isJitEnabled: true,
        isPending: false,
        activeRoles: [],
      })
    ).toEqual({ type: 'copy' })
  })
})
