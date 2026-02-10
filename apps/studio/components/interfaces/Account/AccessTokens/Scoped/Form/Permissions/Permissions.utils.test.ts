import { describe, it, expect } from 'vitest'
import { sortActions, togglePermissionResource } from './Permissions.utils'
import type { PermissionResource, PermissionRow } from './Permissions.types'

// --- sortActions ---

describe('sortActions', () => {
  it('should sort actions by priority order: read, write, create, delete', () => {
    expect(sortActions(['delete', 'create', 'write', 'read'])).toEqual([
      'read',
      'write',
      'create',
      'delete',
    ])
  })

  it('should return empty array for empty input', () => {
    expect(sortActions([])).toEqual([])
  })

  it('should keep a single action as-is', () => {
    expect(sortActions(['write'])).toEqual(['write'])
  })

  it('should place unknown actions after the priority ones', () => {
    expect(sortActions(['custom-action', 'read', 'delete'])).toEqual([
      'read',
      'delete',
      'custom-action',
    ])
  })

  it('should preserve relative order of multiple unknown actions', () => {
    expect(sortActions(['zeta', 'alpha', 'read'])).toEqual(['read', 'zeta', 'alpha'])
  })

  it('should handle only unknown actions', () => {
    expect(sortActions(['foo', 'bar'])).toEqual(['foo', 'bar'])
  })

  it('should handle a subset of priority actions', () => {
    expect(sortActions(['delete', 'read'])).toEqual(['read', 'delete'])
  })

  it('should not mutate the original array', () => {
    const original = ['delete', 'read']
    sortActions(original)
    expect(original).toEqual(['delete', 'read'])
  })
})

// --- togglePermissionResource ---

describe('togglePermissionResource', () => {
  const billingResource: PermissionResource = {
    resource: 'organization:billing',
    title: 'Billing',
    actions: ['read', 'write'],
  }

  const membersResource: PermissionResource = {
    resource: 'organization:members',
    title: 'Members',
    actions: ['read', 'write', 'create', 'delete'],
  }

  const storageResource: PermissionResource = {
    resource: 'project:storage',
    title: 'Storage',
    actions: ['write', 'create'],
  }

  it('should add a resource with "read" as the default action when available', () => {
    const result = togglePermissionResource([], billingResource)
    expect(result).toEqual([{ resource: 'organization:billing', actions: ['read'] }])
  })

  it('should add a resource with the first action as default when "read" is not available', () => {
    const result = togglePermissionResource([], storageResource)
    expect(result).toEqual([{ resource: 'project:storage', actions: ['write'] }])
  })

  it('should remove a resource if it is already in the list', () => {
    const existing: PermissionRow[] = [
      { resource: 'organization:billing', actions: ['read'] },
      { resource: 'organization:members', actions: ['read', 'write'] },
    ]
    const result = togglePermissionResource(existing, billingResource)
    expect(result).toEqual([{ resource: 'organization:members', actions: ['read', 'write'] }])
  })

  it('should not modify other rows when removing a resource', () => {
    const existing: PermissionRow[] = [
      { resource: 'organization:billing', actions: ['read'] },
      { resource: 'organization:members', actions: ['read', 'write'] },
    ]
    const result = togglePermissionResource(existing, billingResource)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ resource: 'organization:members', actions: ['read', 'write'] })
  })

  it('should append to existing rows when adding', () => {
    const existing: PermissionRow[] = [{ resource: 'organization:billing', actions: ['read'] }]
    const result = togglePermissionResource(existing, membersResource)
    expect(result).toHaveLength(2)
    expect(result[1]).toEqual({ resource: 'organization:members', actions: ['read'] })
  })

  it('should not mutate the original array', () => {
    const existing: PermissionRow[] = [{ resource: 'organization:billing', actions: ['read'] }]
    const original = [...existing]
    togglePermissionResource(existing, membersResource)
    expect(existing).toEqual(original)
  })

  it('should toggle off then on again correctly', () => {
    const step1 = togglePermissionResource([], billingResource)
    expect(step1).toHaveLength(1)

    const step2 = togglePermissionResource(step1, billingResource)
    expect(step2).toHaveLength(0)

    const step3 = togglePermissionResource(step2, billingResource)
    expect(step3).toHaveLength(1)
    expect(step3[0]).toEqual({ resource: 'organization:billing', actions: ['read'] })
  })
})
