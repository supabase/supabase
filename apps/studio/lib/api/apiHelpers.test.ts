import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructHeaders, toSnakeCase } from './apiHelpers'

vi.mock('lib/constants', () => ({
  IS_PLATFORM: false,
}))

describe('apiHelpers', () => {
  describe('constructHeaders', () => {
    beforeEach(() => {
      process.env.READ_ONLY_API_KEY = 'test-readonly-key'
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
    })

    it('should return default headers when no headers are provided', () => {
      const result = constructHeaders(null as any)
      expect(result).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      })
    })

    it('should clean and include only allowed headers', () => {
      const inputHeaders = {
        Accept: 'application/json',
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        'x-connection-encrypted': 'true',
        cookie: 'test-cookie',
        'User-Agent': 'test-agent',
        Referer: 'test-referer',
      }

      const result = constructHeaders(inputHeaders)
      expect(result).toEqual({
        Accept: 'application/json',
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        'x-connection-encrypted': 'true',
        cookie: 'test-cookie',
        apiKey: 'test-service-key',
      })
    })

    it('should remove undefined values from headers', () => {
      const inputHeaders = {
        Accept: undefined,
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        cookie: undefined,
      }

      const result = constructHeaders(inputHeaders)
      expect(result).toEqual({
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
        apiKey: 'test-service-key',
      })
    })
  })

  describe('toSnakeCase', () => {
    it('should return null for null input', () => {
      expect(toSnakeCase(null)).toBeNull()
    })

    it('should convert object keys to snake case', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        contactInfo: {
          emailAddress: 'john@example.com',
          phoneNumber: '1234567890',
        },
      }

      const expected = {
        first_name: 'John',
        last_name: 'Doe',
        contact_info: {
          email_address: 'john@example.com',
          phone_number: '1234567890',
        },
      }

      expect(toSnakeCase(input)).toEqual(expected)
    })

    it('should handle arrays of objects', () => {
      const input = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
      ]

      const expected = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' },
      ]

      expect(toSnakeCase(input)).toEqual(expected)
    })

    it('should handle arrays of primitive values', () => {
      const input = [1, 'test', true]
      expect(toSnakeCase(input)).toEqual([1, 'test', true])
    })

    it('should handle nested arrays', () => {
      const input = {
        users: [
          { firstName: 'John', contactInfo: { emailAddress: 'john@example.com' } },
          { firstName: 'Jane', contactInfo: { emailAddress: 'jane@example.com' } },
        ],
      }

      const expected = {
        users: [
          { first_name: 'John', contact_info: { email_address: 'john@example.com' } },
          { first_name: 'Jane', contact_info: { email_address: 'jane@example.com' } },
        ],
      }

      expect(toSnakeCase(input)).toEqual(expected)
    })

    it('should handle primitive values', () => {
      expect(toSnakeCase('test')).toBe('test')
      expect(toSnakeCase(123)).toBe(123)
      expect(toSnakeCase(true)).toBe(true)
    })
  })
})
