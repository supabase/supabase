import { describe, it, expect } from 'vitest'
import { PermissionRowSchema, TokenSchema } from './AccessToken.schemas'

const validTokenData = {
  tokenName: 'My Token',
  expiresAt: 'day',
  resourceAccess: 'all-orgs' as const,
  permissionRows: [{ resource: 'organization:billing', actions: ['read'] }],
}

// --- PermissionRowSchema ---

describe('PermissionRowSchema', () => {
  it('should pass for a valid permission row', () => {
    const result = PermissionRowSchema.safeParse({
      resource: 'organization:billing',
      actions: ['read'],
    })
    expect(result.success).toBe(true)
  })

  it('should fail when resource is empty', () => {
    const result = PermissionRowSchema.safeParse({
      resource: '',
      actions: ['read'],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please select a resource')
    }
  })

  it('should fail when actions is empty', () => {
    const result = PermissionRowSchema.safeParse({
      resource: 'organization:billing',
      actions: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please select at least one action')
    }
  })

  it('should fail when resource is missing', () => {
    const result = PermissionRowSchema.safeParse({ actions: ['read'] })
    expect(result.success).toBe(false)
  })

  it('should fail when actions is missing', () => {
    const result = PermissionRowSchema.safeParse({ resource: 'organization:billing' })
    expect(result.success).toBe(false)
  })
})

// --- TokenSchema ---

describe('TokenSchema', () => {
  it('should pass for valid token data', () => {
    const result = TokenSchema.safeParse(validTokenData)
    expect(result.success).toBe(true)
  })

  it('should fail when tokenName is empty', () => {
    const result = TokenSchema.safeParse({ ...validTokenData, tokenName: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('tokenName'))
      expect(nameError?.message).toBe('Please enter a name for the token')
    }
  })

  it('should fail when tokenName is missing', () => {
    const { tokenName, ...rest } = validTokenData
    const result = TokenSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('should fail when permissionRows is empty', () => {
    const result = TokenSchema.safeParse({ ...validTokenData, permissionRows: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const permError = result.error.issues.find((i) => i.path.includes('permissionRows'))
      expect(permError?.message).toBe('Please configure at least one permission')
    }
  })

  it('should fail when resourceAccess is not a valid enum value', () => {
    const result = TokenSchema.safeParse({ ...validTokenData, resourceAccess: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('should accept all valid resourceAccess enum values', () => {
    for (const value of ['all-orgs', 'selected-orgs', 'selected-projects'] as const) {
      const result = TokenSchema.safeParse({ ...validTokenData, resourceAccess: value })
      expect(result.success).toBe(true)
    }
  })

  describe('expiresAt preprocessing', () => {
    it('should convert "never" to undefined', () => {
      const result = TokenSchema.safeParse({ ...validTokenData, expiresAt: 'never' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.expiresAt).toBeUndefined()
      }
    })

    it('should pass through other string values', () => {
      const result = TokenSchema.safeParse({ ...validTokenData, expiresAt: 'day' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.expiresAt).toBe('day')
      }
    })

    it('should allow expiresAt to be omitted', () => {
      const { expiresAt, ...rest } = validTokenData
      const result = TokenSchema.safeParse(rest)
      expect(result.success).toBe(true)
    })
  })

  describe('custom expiry refinement', () => {
    it('should fail when expiresAt is "custom" and customExpiryDate is not provided', () => {
      const result = TokenSchema.safeParse({
        ...validTokenData,
        expiresAt: 'custom',
        customExpiryDate: undefined,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const customError = result.error.issues.find((i) => i.path.includes('expiresAt'))
        expect(customError?.message).toBe('Please select a custom expiry date')
      }
    })

    it('should fail when expiresAt is "custom" and customExpiryDate is empty string', () => {
      const result = TokenSchema.safeParse({
        ...validTokenData,
        expiresAt: 'custom',
        customExpiryDate: '',
      })
      expect(result.success).toBe(false)
    })

    it('should pass when expiresAt is "custom" and customExpiryDate is provided', () => {
      const result = TokenSchema.safeParse({
        ...validTokenData,
        expiresAt: 'custom',
        customExpiryDate: '2026-12-31T00:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    it('should pass when expiresAt is not "custom" even without customExpiryDate', () => {
      const result = TokenSchema.safeParse({
        ...validTokenData,
        expiresAt: 'day',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('nested permissionRows validation', () => {
    it('should fail when a permission row has an empty resource', () => {
      const result = TokenSchema.safeParse({
        ...validTokenData,
        permissionRows: [{ resource: '', actions: ['read'] }],
      })
      expect(result.success).toBe(false)
    })

    it('should fail when a permission row has empty actions', () => {
      const result = TokenSchema.safeParse({
        ...validTokenData,
        permissionRows: [{ resource: 'organization:billing', actions: [] }],
      })
      expect(result.success).toBe(false)
    })

    it('should pass with multiple valid permission rows', () => {
      const result = TokenSchema.safeParse({
        ...validTokenData,
        permissionRows: [
          { resource: 'organization:billing', actions: ['read'] },
          { resource: 'organization:members', actions: ['read', 'write'] },
        ],
      })
      expect(result.success).toBe(true)
    })
  })
})
