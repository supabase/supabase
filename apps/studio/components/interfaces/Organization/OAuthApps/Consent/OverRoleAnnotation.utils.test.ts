import { describe, expect, test } from 'vitest'

import { isScopeGroupOverRole } from './OverRoleAnnotation.utils'

describe('isScopeGroupOverRole', () => {
  test('flags write and read_write levels for a Read-only role', () => {
    expect(isScopeGroupOverRole('write', 'Read-only')).toBe(true)
    expect(isScopeGroupOverRole('read_write', 'Read-only')).toBe(true)
  })

  test('does not flag a read level for a Read-only role', () => {
    expect(isScopeGroupOverRole('read', 'Read-only')).toBe(false)
  })

  test('does not flag any level for roles that can write', () => {
    expect(isScopeGroupOverRole('read_write', 'Developer')).toBe(false)
    expect(isScopeGroupOverRole('write', 'Owner')).toBe(false)
    expect(isScopeGroupOverRole('read', 'Developer')).toBe(false)
  })
})
