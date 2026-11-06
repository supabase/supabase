import { describe, expect, it } from 'vitest'

import { databaseErrorSchema, PgMetaDatabaseError } from './types'

describe('api/self-hosted/types', () => {
  describe('databaseErrorSchema', () => {
    it('should validate valid database error', () => {
      const validError = {
        message: 'Database connection failed',
        code: '08006',
        formattedError: 'Error: Connection refused',
      }

      const result = databaseErrorSchema.safeParse(validError)
      expect(result.success).toBe(true)
    })

    it('should reject error missing message', () => {
      const invalidError = {
        code: '08006',
        formattedError: 'Error: Connection refused',
      }

      const result = databaseErrorSchema.safeParse(invalidError)
      expect(result.success).toBe(false)
    })

    it('should reject error missing code', () => {
      const invalidError = {
        message: 'Database connection failed',
        formattedError: 'Error: Connection refused',
      }

      const result = databaseErrorSchema.safeParse(invalidError)
      expect(result.success).toBe(false)
    })

    it('should reject error missing formattedError', () => {
      const invalidError = {
        message: 'Database connection failed',
        code: '08006',
      }

      const result = databaseErrorSchema.safeParse(invalidError)
      expect(result.success).toBe(false)
    })

    it('should reject non-string values', () => {
      const invalidError = {
        message: 123,
        code: '08006',
        formattedError: 'Error',
      }

      const result = databaseErrorSchema.safeParse(invalidError)
      expect(result.success).toBe(false)
    })
  })

  describe('PgMetaDatabaseError', () => {
    it('should create error with all properties', () => {
      const error = new PgMetaDatabaseError(
        'Syntax error',
        '42601',
        400,
        'ERROR: syntax error at or near "SELCT"'
      )

      expect(error.message).toBe('Syntax error')
      expect(error.code).toBe('42601')
      expect(error.statusCode).toBe(400)
      expect(error.formattedError).toBe('ERROR: syntax error at or near "SELCT"')
      expect(error.name).toBe('PgMetaDatabaseError')
    })

    it('should be instanceof Error', () => {
      const error = new PgMetaDatabaseError('Test error', '12345', 500, 'Formatted')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(PgMetaDatabaseError)
    })

    it('should have correct name property', () => {
      const error = new PgMetaDatabaseError('Test', 'CODE', 400, 'Formatted')

      expect(error.name).toBe('PgMetaDatabaseError')
    })

    it('should preserve all custom properties', () => {
      const error = new PgMetaDatabaseError(
        'Connection timeout',
        '08000',
        503,
        'ERROR: connection timeout'
      )

      expect(error.code).toBe('08000')
      expect(error.statusCode).toBe(503)
      expect(error.formattedError).toBe('ERROR: connection timeout')
    })

    it('should work with different status codes', () => {
      const error400 = new PgMetaDatabaseError('Bad request', 'ERR', 400, 'Error')
      const error500 = new PgMetaDatabaseError('Server error', 'ERR', 500, 'Error')

      expect(error400.statusCode).toBe(400)
      expect(error500.statusCode).toBe(500)
    })
  })
})
