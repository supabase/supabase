import { describe, it, expect } from 'vitest'
import {
  API_ACCESS_ROLES,
  isApiAccessRole,
  API_PRIVILEGE_TYPES,
  isApiPrivilegeType,
} from './data-api-types'

describe('data-api-types', () => {
  describe('isApiAccessRole', () => {
    it('should return true for valid API access roles', () => {
      expect(isApiAccessRole('anon')).toBe(true)
      expect(isApiAccessRole('authenticated')).toBe(true)
    })

    it('should return false for invalid API access roles', () => {
      expect(isApiAccessRole('invalid')).toBe(false)
      expect(isApiAccessRole('admin')).toBe(false)
      expect(isApiAccessRole('')).toBe(false)
      expect(isApiAccessRole('service_role')).toBe(false)
    })

    it('should work with API_ACCESS_ROLES constant', () => {
      API_ACCESS_ROLES.forEach((role) => {
        expect(isApiAccessRole(role)).toBe(true)
      })
    })
  })

  describe('isApiPrivilegeType', () => {
    it('should return true for valid API privilege types', () => {
      expect(isApiPrivilegeType('SELECT')).toBe(true)
      expect(isApiPrivilegeType('INSERT')).toBe(true)
      expect(isApiPrivilegeType('UPDATE')).toBe(true)
      expect(isApiPrivilegeType('DELETE')).toBe(true)
    })

    it('should return false for invalid API privilege types', () => {
      expect(isApiPrivilegeType('EXECUTE')).toBe(false)
      expect(isApiPrivilegeType('TRUNCATE')).toBe(false)
      expect(isApiPrivilegeType('')).toBe(false)
      expect(isApiPrivilegeType('select')).toBe(false)
    })

    it('should work with API_PRIVILEGE_TYPES constant', () => {
      API_PRIVILEGE_TYPES.forEach((privilege) => {
        expect(isApiPrivilegeType(privilege)).toBe(true)
      })
    })
  })
})
