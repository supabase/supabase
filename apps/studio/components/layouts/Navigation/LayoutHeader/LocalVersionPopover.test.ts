import { describe, expect, test } from 'vitest'
import { semverGte, semverLte } from './LocalVersionPopover.utils'

describe('LocalVersionPopover.utils:semverLte', () => {
  test('1.2.2 should be lower than 2.1.1', () => {
    const version = { major: 1, minor: 2, patch: 2 }
    const versionCompare = { major: 2, minor: 1, patch: 1 }
    const result = semverLte(version, versionCompare)
    expect(result).toBe(true)
  })
  test('2.1.0 should not be lower than 1.0.0', () => {
    const version = { major: 2, minor: 1, patch: 0 }
    const versionCompare = { major: 1, minor: 0, patch: 0 }
    const result = semverLte(version, versionCompare)
    expect(result).toBe(false)
  })
  test('2.1.2 should not be lower than 1.99.99', () => {
    const version = { major: 2, minor: 1, patch: 2 }
    const versionCompare = { major: 1, minor: 99, patch: 99 }
    const result = semverLte(version, versionCompare)
    expect(result).toBe(false)
  })
  test('Same value comparison should return true', () => {
    const version = { major: 2, minor: 1, patch: 2 }
    const versionCompare = { major: 2, minor: 1, patch: 2 }
    const result = semverLte(version, versionCompare)
    expect(result).toBe(true)
  })
})

describe('LocalVersionPopover.utils:semverGte', () => {
  test('2.0.0 should be greater than 1.99.99', () => {
    const version = { major: 2, minor: 0, patch: 0 }
    const versionCompare = { major: 1, minor: 99, patch: 99 }
    const result = semverGte(version, versionCompare)
    expect(result).toBe(true)
  })
  test('1.99.99 should be not be greater than 2.0.1', () => {
    const version = { major: 1, minor: 99, patch: 99 }
    const versionCompare = { major: 2, minor: 0, patch: 1 }
    const result = semverGte(version, versionCompare)
    expect(result).toBe(false)
  })
  test('Same value comparison should return true', () => {
    const version = { major: 2, minor: 1, patch: 2 }
    const versionCompare = { major: 2, minor: 1, patch: 2 }
    const result = semverLte(version, versionCompare)
    expect(result).toBe(true)
  })
})
