import type { IncomingHttpHeaders } from 'node:http'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  commaSeparatedStringIntoArray,
  constructHeaders,
  fromNodeHeaders,
  toSnakeCase,
  zBooleanString,
} from './apiHelpers'

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

  describe('zBooleanString', () => {
    it('should transform "true" string to boolean true', () => {
      const schema = zBooleanString()
      const result = schema.parse('true')
      expect(result).toBe(true)
    })

    it('should transform "false" string to boolean false', () => {
      const schema = zBooleanString()
      const result = schema.parse('false')
      expect(result).toBe(false)
    })

    it('should throw error for invalid boolean string', () => {
      const schema = zBooleanString()
      expect(() => schema.parse('invalid')).toThrow('must be a boolean string')
    })

    it('should throw custom error message when provided', () => {
      const customError = 'Custom boolean error'
      const schema = zBooleanString(customError)
      expect(() => schema.parse('invalid')).toThrow(customError)
    })

    it('should throw error for empty string', () => {
      const schema = zBooleanString()
      expect(() => schema.parse('')).toThrow('must be a boolean string')
    })

    it('should throw error for non-string input', () => {
      const schema = zBooleanString()
      expect(() => schema.parse(true)).toThrow()
      expect(() => schema.parse(false)).toThrow()
      expect(() => schema.parse(123)).toThrow()
    })
  })

  describe('commaSeparatedStringIntoArray', () => {
    it('should split comma-separated string into array', () => {
      const result = commaSeparatedStringIntoArray('a,b,c')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should trim whitespace from values', () => {
      const result = commaSeparatedStringIntoArray('a, b , c')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should filter out empty values', () => {
      const result = commaSeparatedStringIntoArray('a,,b,')
      expect(result).toEqual(['a', 'b'])
    })

    it('should handle single value', () => {
      const result = commaSeparatedStringIntoArray('single')
      expect(result).toEqual(['single'])
    })

    it('should handle empty string', () => {
      const result = commaSeparatedStringIntoArray('')
      expect(result).toEqual([])
    })

    it('should handle string with only commas', () => {
      const result = commaSeparatedStringIntoArray(',,,')
      expect(result).toEqual([])
    })
  })

  describe('fromNodeHeaders', () => {
    it('should convert simple node headers to fetch headers', () => {
      const nodeHeaders: IncomingHttpHeaders = {
        'content-type': 'application/json',
        authorization: 'Bearer token',
      }

      const result = fromNodeHeaders(nodeHeaders)

      expect(result.get('content-type')).toBe('application/json')
      expect(result.get('authorization')).toBe('Bearer token')
    })

    it('should skip undefined values', () => {
      const nodeHeaders: IncomingHttpHeaders = {
        'content-type': 'application/json',
        authorization: undefined,
        accept: 'application/json',
      }

      const result = fromNodeHeaders(nodeHeaders)

      expect(result.get('content-type')).toBe('application/json')
      expect(result.get('authorization')).toBeNull()
      expect(result.get('accept')).toBe('application/json')
    })

    it('should handle empty headers object', () => {
      const nodeHeaders: IncomingHttpHeaders = {}
      const result = fromNodeHeaders(nodeHeaders)

      expect(Array.from(result.keys())).toEqual([])
    })

    it('should handle mixed array and string values', () => {
      const nodeHeaders: IncomingHttpHeaders = {
        'content-type': 'application/json',
        'x-custom': ['value1', 'value2'],
        authorization: 'Bearer token',
        'x-empty': undefined,
      }

      const result = fromNodeHeaders(nodeHeaders)

      expect(result.get('content-type')).toBe('application/json')
      expect(result.get('authorization')).toBe('Bearer token')
      expect(result.get('x-empty')).toBeNull()
      expect(result.get('x-custom')).toBe('value1, value2')
    })
  })
})
