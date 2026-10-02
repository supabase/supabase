import { expect, test, describe } from 'vitest'
import { FastifyRequest } from 'fastify'
import {
  extractRequestForLogging,
  createConnectionConfig,
  translateErrorToResponseCode,
} from '../src/server/utils.js'

describe('server/utils', () => {
  describe('extractRequestForLogging', () => {
    test('should extract request information for logging', () => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        headers: {
          'user-agent': 'test-agent',
          'x-supabase-info': 'test-info',
        },
        query: { param: 'value' },
      } as FastifyRequest

      const result = extractRequestForLogging(mockRequest)
      expect(result).toHaveProperty('method')
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('pg')
      expect(result).toHaveProperty('opt')
    })

    test('should handle request with minimal properties', () => {
      const mockRequest = {
        method: 'POST',
        url: '/api/test',
        headers: {},
      } as FastifyRequest

      const result = extractRequestForLogging(mockRequest)
      expect(result.method).toBe('POST')
      expect(result.url).toBe('/api/test')
      expect(result.pg).toBe('unknown')
    })
  })

  describe('createConnectionConfig', () => {
    test('should create connection config from request headers', () => {
      const mockRequest = {
        headers: {
          pg: 'postgresql://user:pass@localhost:5432/db',
          'x-pg-application-name': 'test-app',
        },
      } as FastifyRequest

      const result = createConnectionConfig(mockRequest)
      expect(result).toHaveProperty('connectionString')
      expect(result).toHaveProperty('application_name')
      expect(result.connectionString).toBe('postgresql://user:pass@localhost:5432/db')
      expect(result.application_name).toBe('test-app')
    })

    test('should handle request without application name', () => {
      const mockRequest = {
        headers: {
          pg: 'postgresql://user:pass@localhost:5432/db',
        },
      } as FastifyRequest

      const result = createConnectionConfig(mockRequest)
      expect(result).toHaveProperty('connectionString')
      expect(result.connectionString).toBe('postgresql://user:pass@localhost:5432/db')
      // application_name should have default value if not provided
      expect(result.application_name).toBe('postgres-meta 0.0.0-automated')
    })
  })

  describe('translateErrorToResponseCode', () => {
    test('should return 504 for connection timeout errors', () => {
      const error = { message: 'Connection terminated due to connection timeout' }
      const result = translateErrorToResponseCode(error)
      expect(result).toBe(504)
    })

    test('should return 503 for too many clients errors', () => {
      const error = { message: 'sorry, too many clients already' }
      const result = translateErrorToResponseCode(error)
      expect(result).toBe(503)
    })

    test('should return 408 for query timeout errors', () => {
      const error = { message: 'Query read timeout' }
      const result = translateErrorToResponseCode(error)
      expect(result).toBe(408)
    })

    test('should return default 400 for other errors', () => {
      const error = { message: 'database connection failed' }
      const result = translateErrorToResponseCode(error)
      expect(result).toBe(400)
    })

    test('should return custom default for other errors', () => {
      const error = { message: 'some other error' }
      const result = translateErrorToResponseCode(error, 500)
      expect(result).toBe(500)
    })
  })
})
