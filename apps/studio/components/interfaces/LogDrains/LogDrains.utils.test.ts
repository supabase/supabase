import { describe, expect, it } from 'vitest'

import {
  getHeadersSectionDescription,
  HEADER_VALIDATION_ERRORS,
  otlpConfigSchema,
  validateNewHeader,
} from './LogDrains.utils'

describe('getHeadersSectionDescription', () => {
  it('returns webhook description for webhook type', () => {
    const result = getHeadersSectionDescription('webhook')
    expect(result).toBe('Set custom headers when draining logs to the Endpoint URL')
  })

  it('returns loki description for loki type', () => {
    const result = getHeadersSectionDescription('loki')
    expect(result).toBe('Set custom headers when draining logs to the Loki HTTP(S) endpoint')
  })

  it('returns otlp description for otlp type', () => {
    const result = getHeadersSectionDescription('otlp')
    expect(result).toBe(
      'Set custom headers for OTLP authentication (e.g., Authorization, X-API-Key)'
    )
  })

  it('returns empty string for unsupported types', () => {
    expect(getHeadersSectionDescription('datadog')).toBe('')
    expect(getHeadersSectionDescription('s3')).toBe('')
    expect(getHeadersSectionDescription('sentry')).toBe('')
  })
})

describe('validateNewHeader', () => {
  describe('valid cases', () => {
    it('accepts valid header with empty existing headers', () => {
      const result = validateNewHeader({}, { name: 'Authorization', value: 'Bearer token' })
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts valid header with existing headers', () => {
      const existingHeaders = {
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      }
      const result = validateNewHeader(existingHeaders, {
        name: 'Authorization',
        value: 'Bearer token',
      })
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('validation errors', () => {
    it('rejects when 20 headers already exist', () => {
      const existingHeaders = Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [`Header-${i}`, `value-${i}`])
      )
      const result = validateNewHeader(existingHeaders, { name: 'New-Header', value: 'value' })
      expect(result.valid).toBe(false)
      expect(result.error).toBe(HEADER_VALIDATION_ERRORS.MAX_LIMIT)
    })

    it('rejects duplicate header names', () => {
      const existingHeaders = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer old-token',
      }
      const result = validateNewHeader(existingHeaders, {
        name: 'Authorization',
        value: 'Bearer new-token',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe(HEADER_VALIDATION_ERRORS.DUPLICATE)
    })

    it('rejects header with empty name', () => {
      const result = validateNewHeader({}, { name: '', value: 'some-value' })
      expect(result.valid).toBe(false)
      expect(result.error).toBe(HEADER_VALIDATION_ERRORS.REQUIRED)
    })

    it('rejects header with empty value', () => {
      const result = validateNewHeader({}, { name: 'Some-Header', value: '' })
      expect(result.valid).toBe(false)
      expect(result.error).toBe(HEADER_VALIDATION_ERRORS.REQUIRED)
    })

    it('rejects header with both empty name and value', () => {
      const result = validateNewHeader({}, { name: '', value: '' })
      expect(result.valid).toBe(false)
      expect(result.error).toBe(HEADER_VALIDATION_ERRORS.REQUIRED)
    })
  })

  describe('edge cases', () => {
    it('allows exactly 19 existing headers', () => {
      const existingHeaders = Object.fromEntries(
        Array.from({ length: 19 }, (_, i) => [`Header-${i}`, `value-${i}`])
      )
      const result = validateNewHeader(existingHeaders, { name: 'New-Header', value: 'value' })
      expect(result.valid).toBe(true)
    })

    it('is case-sensitive for duplicate checking', () => {
      const existingHeaders = { authorization: 'bearer token' }
      const result = validateNewHeader(existingHeaders, {
        name: 'Authorization',
        value: 'Bearer token',
      })
      expect(result.valid).toBe(true)
    })
  })
})

describe('otlpConfigSchema', () => {
  describe('valid OTLP configurations', () => {
    it('accepts valid HTTPS endpoint with all fields', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://otlp.example.com:4318/v1/logs',
        protocol: 'http/protobuf',
        gzip: true,
        headers: { Authorization: 'Bearer token' },
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('accepts HTTP endpoint (for testing environments)', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'http://localhost:4318/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('applies default values for optional fields', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://otlp.example.com/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.protocol).toBe('http/protobuf')
        expect(result.data.gzip).toBe(true)
      }
    })

    it('accepts empty headers object', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://otlp.example.com/v1/logs',
        headers: {},
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('accepts multiple custom headers', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://otlp.example.com/v1/logs',
        headers: {
          Authorization: 'Bearer token',
          'X-API-Key': 'secret-key',
          'X-Custom-Header': 'custom-value',
        },
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })
  })

  describe('invalid OTLP configurations', () => {
    it('rejects empty endpoint', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: '',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('OTLP endpoint is required')
      }
    })

    it('rejects endpoint without protocol', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'otlp.example.com/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must start with http:// or https://')
      }
    })

    it('rejects endpoint with invalid protocol', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'ftp://otlp.example.com/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })

    it('rejects endpoint with ws:// protocol', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'ws://otlp.example.com/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })

    it('rejects wrong type field', () => {
      const config = {
        type: 'webhook' as const,
        endpoint: 'https://otlp.example.com/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('accepts endpoint with port number', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://otlp.example.com:4318/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('accepts endpoint with query parameters', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://otlp.example.com/v1/logs?tenant=123',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('accepts endpoint with authentication in URL', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://user:pass@otlp.example.com/v1/logs',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('allows gzip to be explicitly false', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://otlp.example.com/v1/logs',
        gzip: false,
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.gzip).toBe(false)
      }
    })
  })
})
