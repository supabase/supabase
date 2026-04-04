import { describe, test, expect } from 'vitest'
import { generateApiKey, isValidApiKey } from 'pages/world/security.utils'

// ─── generateApiKey ───────────────────────────────────────
describe('generateApiKey', () => {
  test('starts with default prefix "mrcx_live_"', () => {
    const key = generateApiKey()
    expect(key.startsWith('mrcx_live_')).toBe(true)
  })

  test('has correct total length (prefix + 48 chars)', () => {
    const key = generateApiKey()
    expect(key.length).toBe('mrcx_live_'.length + 48)
  })

  test('body contains only alphanumeric characters', () => {
    const key = generateApiKey()
    const body = key.slice('mrcx_live_'.length)
    expect(/^[A-Za-z0-9]+$/.test(body)).toBe(true)
  })

  test('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateApiKey()))
    expect(keys.size).toBe(20)
  })

  test('uses custom prefix when provided', () => {
    const key = generateApiKey('test_')
    expect(key.startsWith('test_')).toBe(true)
  })

  test('uses custom length when provided', () => {
    const key = generateApiKey('pre_', 10)
    expect(key.length).toBe('pre_'.length + 10)
  })

  test('handles empty prefix', () => {
    const key = generateApiKey('', 16)
    expect(key.length).toBe(16)
    expect(/^[A-Za-z0-9]+$/.test(key)).toBe(true)
  })

  test('handles zero length', () => {
    const key = generateApiKey('prefix_', 0)
    expect(key).toBe('prefix_')
  })
})

// ─── isValidApiKey ────────────────────────────────────────
describe('isValidApiKey', () => {
  test('validates a correctly generated key', () => {
    const key = generateApiKey()
    expect(isValidApiKey(key)).toBe(true)
  })

  test('rejects key with wrong prefix', () => {
    expect(isValidApiKey('wrong_prefix_abc')).toBe(false)
  })

  test('rejects key with wrong body length', () => {
    expect(isValidApiKey('mrcx_live_tooshort')).toBe(false)
  })

  test('rejects key with special characters in body', () => {
    const badKey = 'mrcx_live_' + '!@#$'.padEnd(48, 'a')
    expect(isValidApiKey(badKey)).toBe(false)
  })

  test('rejects empty string', () => {
    expect(isValidApiKey('')).toBe(false)
  })

  test('validates with custom prefix', () => {
    const key = generateApiKey('custom_')
    expect(isValidApiKey(key, 'custom_')).toBe(true)
  })
})
