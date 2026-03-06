import { describe, expect, it } from 'vitest'
import {
  compareSemver,
  isEqual,
  isGreaterThan,
  isGreaterThanOrEqual,
  isLessThan,
  isLessThanOrEqual,
  isValidSemver,
  parseSemver,
} from './semver'

describe('parseSemver', () => {
  it('should parse valid semver strings', () => {
    expect(parseSemver('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
    expect(parseSemver('0.0.1')).toEqual({ major: 0, minor: 0, patch: 1 })
    expect(parseSemver('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 })
  })

  it('should parse versions with fewer than 3 parts', () => {
    expect(parseSemver('1')).toEqual({ major: 1, minor: 0, patch: 0 })
    expect(parseSemver('1.5')).toEqual({ major: 1, minor: 5, patch: 0 })
  })

  it('should return null for versions with more than 3 parts', () => {
    expect(parseSemver('1.2.3.4')).toBeNull()
    expect(parseSemver('1.2.3.4.5')).toBeNull()
  })

  it('should handle strings with extra whitespace', () => {
    expect(parseSemver(' 1.2.3 ')).toEqual({ major: 1, minor: 2, patch: 3 })
    expect(parseSemver('  1.2.3  ')).toEqual({ major: 1, minor: 2, patch: 3 })
  })

  it('should return null for invalid semver strings', () => {
    expect(parseSemver('1.2.x')).toBeNull()
    expect(parseSemver('a.b.c')).toBeNull()
    expect(parseSemver('')).toBeNull()
    expect(parseSemver('invalid')).toBeNull()
  })

  it('should return null for negative numbers', () => {
    expect(parseSemver('-1.2.3')).toBeNull()
    expect(parseSemver('1.-2.3')).toBeNull()
    expect(parseSemver('1.2.-3')).toBeNull()
  })

  it('should return null for non-string inputs', () => {
    expect(parseSemver(null as any)).toBeNull()
    expect(parseSemver(undefined as any)).toBeNull()
    expect(parseSemver(123 as any)).toBeNull()
  })
})

describe('compareSemver', () => {
  it('should return 0 for equal versions', () => {
    expect(compareSemver('1.2.3', '1.2.3')).toBe(0)
    expect(compareSemver('0.0.0', '0.0.0')).toBe(0)
    expect(compareSemver('10.20.30', '10.20.30')).toBe(0)
  })

  it('should return 1 when first version is greater', () => {
    expect(compareSemver('2.0.0', '1.0.0')).toBe(1)
    expect(compareSemver('1.3.0', '1.2.0')).toBe(1)
    expect(compareSemver('1.2.4', '1.2.3')).toBe(1)
    expect(compareSemver('2.0.0', '1.9.9')).toBe(1)
  })

  it('should return -1 when first version is less', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBe(-1)
    expect(compareSemver('1.2.0', '1.3.0')).toBe(-1)
    expect(compareSemver('1.2.3', '1.2.4')).toBe(-1)
    expect(compareSemver('1.9.9', '2.0.0')).toBe(-1)
  })

  it('should return null for invalid versions', () => {
    expect(compareSemver('1.2.3', 'invalid')).toBeNull()
    expect(compareSemver('invalid', '1.2.3')).toBeNull()
  })

  it('should prioritize major version differences', () => {
    expect(compareSemver('2.0.0', '1.99.99')).toBe(1)
    expect(compareSemver('1.99.99', '2.0.0')).toBe(-1)
  })

  it('should prioritize minor version differences when major is equal', () => {
    expect(compareSemver('1.3.0', '1.2.99')).toBe(1)
    expect(compareSemver('1.2.99', '1.3.0')).toBe(-1)
  })

  it('should compare variable-length versions treating missing parts as 0', () => {
    expect(compareSemver('1.5', '1.5.0')).toBe(0)
    expect(compareSemver('1.5.0', '1.5')).toBe(0)
    expect(compareSemver('1', '1.0.0')).toBe(0)
    expect(compareSemver('1.5', '1.5.1')).toBe(-1)
    expect(compareSemver('1.5.1', '1.5')).toBe(1)
    expect(compareSemver('2', '1.9.9')).toBe(1)
    expect(compareSemver('1.9.9', '2')).toBe(-1)
  })

  it('should return null for versions with more than 3 parts', () => {
    expect(compareSemver('1.2.3.4', '1.2.3')).toBeNull()
    expect(compareSemver('1.2.3', '1.2.3.4')).toBeNull()
  })
})

describe('isGreaterThan', () => {
  it('should return true when first version is greater', () => {
    expect(isGreaterThan('2.0.0', '1.0.0')).toBe(true)
    expect(isGreaterThan('1.3.0', '1.2.0')).toBe(true)
    expect(isGreaterThan('1.2.4', '1.2.3')).toBe(true)
  })

  it('should return false when first version is not greater', () => {
    expect(isGreaterThan('1.0.0', '2.0.0')).toBe(false)
    expect(isGreaterThan('1.2.3', '1.2.3')).toBe(false)
    expect(isGreaterThan('1.2.3', 'invalid')).toBe(false)
  })
})

describe('isLessThan', () => {
  it('should return true when first version is less', () => {
    expect(isLessThan('1.0.0', '2.0.0')).toBe(true)
    expect(isLessThan('1.2.0', '1.3.0')).toBe(true)
    expect(isLessThan('1.2.3', '1.2.4')).toBe(true)
  })

  it('should return false when first version is not less', () => {
    expect(isLessThan('2.0.0', '1.0.0')).toBe(false)
    expect(isLessThan('1.2.3', '1.2.3')).toBe(false)
    expect(isLessThan('1.2.3', 'invalid')).toBe(false)
  })
})

describe('isEqual', () => {
  it('should return true when versions are equal', () => {
    expect(isEqual('1.2.3', '1.2.3')).toBe(true)
    expect(isEqual('0.0.0', '0.0.0')).toBe(true)
    expect(isEqual('10.20.30', '10.20.30')).toBe(true)
  })

  it('should return false when versions are not equal', () => {
    expect(isEqual('1.2.3', '1.2.4')).toBe(false)
    expect(isEqual('1.2.3', '2.2.3')).toBe(false)
    expect(isEqual('1.2.3', 'invalid')).toBe(false)
  })
})

describe('isGreaterThanOrEqual', () => {
  it('should return true when first version is greater or equal', () => {
    expect(isGreaterThanOrEqual('2.0.0', '1.0.0')).toBe(true)
    expect(isGreaterThanOrEqual('1.2.3', '1.2.3')).toBe(true)
    expect(isGreaterThanOrEqual('1.2.4', '1.2.3')).toBe(true)
  })

  it('should return false when first version is less', () => {
    expect(isGreaterThanOrEqual('1.0.0', '2.0.0')).toBe(false)
    expect(isGreaterThanOrEqual('1.2.3', 'invalid')).toBe(false)
  })

  it('should handle variable-length versions', () => {
    expect(isGreaterThanOrEqual('1.5', '1.5')).toBe(true)
    expect(isGreaterThanOrEqual('1.6', '1.5')).toBe(true)
    expect(isGreaterThanOrEqual('1.4', '1.5')).toBe(false)
    expect(isGreaterThanOrEqual('1.5.0', '1.5')).toBe(true)
    expect(isGreaterThanOrEqual('1.5.1', '1.5')).toBe(true)
    expect(isGreaterThanOrEqual('2', '1.5')).toBe(true)
    expect(isGreaterThanOrEqual('1', '1.5')).toBe(false)
  })
})

describe('isLessThanOrEqual', () => {
  it('should return true when first version is less or equal', () => {
    expect(isLessThanOrEqual('1.0.0', '2.0.0')).toBe(true)
    expect(isLessThanOrEqual('1.2.3', '1.2.3')).toBe(true)
    expect(isLessThanOrEqual('1.2.3', '1.2.4')).toBe(true)
  })

  it('should return false when first version is greater', () => {
    expect(isLessThanOrEqual('2.0.0', '1.0.0')).toBe(false)
    expect(isLessThanOrEqual('1.2.3', 'invalid')).toBe(false)
  })
})

describe('isValidSemver', () => {
  it('should return true for valid semver strings', () => {
    expect(isValidSemver('1.2.3')).toBe(true)
    expect(isValidSemver('0.0.0')).toBe(true)
    expect(isValidSemver('10.20.30')).toBe(true)
  })

  it('should return true for versions with 1-3 parts', () => {
    expect(isValidSemver('1')).toBe(true)
    expect(isValidSemver('1.2')).toBe(true)
  })

  it('should return false for versions with more than 3 parts', () => {
    expect(isValidSemver('1.2.3.4')).toBe(false)
  })

  it('should return false for invalid semver strings', () => {
    expect(isValidSemver('invalid')).toBe(false)
    expect(isValidSemver('')).toBe(false)
    expect(isValidSemver('1.x.3')).toBe(false)
  })
})
