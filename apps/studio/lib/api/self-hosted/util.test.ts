import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { assertSelfHosted, encryptString, getConnectionString } from './util'
import { IS_PLATFORM } from 'lib/constants'

vi.mock('lib/constants', () => ({
  IS_PLATFORM: false,
}))

vi.mock('./constants', () => ({
  ENCRYPTION_KEY: 'test-key',
  POSTGRES_PORT: '5432',
  POSTGRES_HOST: 'db',
  POSTGRES_DATABASE: 'postgres',
  POSTGRES_PASSWORD: 'test-password',
  POSTGRES_USER_READ_WRITE: 'supabase_admin',
  POSTGRES_USER_READ_ONLY: 'supabase_read_only_user',
}))

describe('assertSelfHosted', () => {
  beforeEach(() => {
    ;(IS_PLATFORM as any) = false
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw when IS_PLATFORM is false', () => {
    expect(() => assertSelfHosted()).not.toThrow()
  })

  it('should throw when IS_PLATFORM is true', () => {
    ;(IS_PLATFORM as any) = true
    expect(() => assertSelfHosted()).toThrow(
      'This function can only be called in self-hosted environments'
    )
  })
})

describe('encryptString', () => {
  it('should encrypt a string', () => {
    const input = 'test-string'
    const result = encryptString(input)

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result).not.toBe(input)
  })

  it('should produce different output for different inputs', () => {
    const result1 = encryptString('input1')
    const result2 = encryptString('input2')

    expect(result1).not.toBe(result2)
  })

  it('should produce different output for same input due to random salt', () => {
    const input = 'test-string'
    const result1 = encryptString(input)
    const result2 = encryptString(input)

    // crypto-js AES uses random salt, so outputs differ even with same input
    expect(result1).not.toBe(result2)
    expect(result1).toBeTruthy()
    expect(result2).toBeTruthy()
  })
})

describe('getConnectionString', () => {
  beforeEach(() => {
    vi.stubEnv('POSTGRES_USER_READ_WRITE', 'supabase_admin')
    vi.stubEnv('POSTGRES_USER_READ_ONLY', 'supabase_read_only_user')
    vi.stubEnv('POSTGRES_PASSWORD', 'test-password')
    vi.stubEnv('POSTGRES_HOST', 'localhost')
    vi.stubEnv('POSTGRES_PORT', '5432')
    vi.stubEnv('POSTGRES_DB', 'postgres')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return connection string with read-write user', () => {
    const result = getConnectionString({ readOnly: false })

    expect(result).toContain('supabase_admin')
    expect(result).toContain('test-password')
    expect(result).toContain('db')
    expect(result).toContain('5432')
    expect(result).toContain('postgres')
    expect(result).toMatch(/^postgresql:\/\//)
  })

  it('should return connection string with read-only user', () => {
    const result = getConnectionString({ readOnly: true })

    expect(result).toContain('supabase_read_only_user')
    expect(result).not.toContain('supabase_admin')
  })

  it('should use default values when env vars are not set', () => {
    vi.unstubAllEnvs()

    const result = getConnectionString({ readOnly: false })

    expect(result).toContain('supabase_admin')
    expect(result).toContain('postgres')
    expect(result).toContain('db')
    expect(result).toContain('5432')
  })
})

