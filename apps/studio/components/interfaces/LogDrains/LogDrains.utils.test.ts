import { describe, expect, it } from 'vitest'

import {
  getDefaultHeadersByType,
  getHeadersSectionDescription,
  HEADER_VALIDATION_ERRORS,
  headerRecordToRows,
  headerRowsToRecord,
  logDrainHeaderEntriesSchema,
  otlpConfigSchema,
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

describe('getDefaultHeadersByType', () => {
  it('returns the JSON content type header for webhook destinations', () => {
    expect(getDefaultHeadersByType('webhook')).toEqual({
      'Content-Type': 'application/json',
    })
  })

  it('returns the protobuf content type header for OTLP destinations', () => {
    expect(getDefaultHeadersByType('otlp')).toEqual({
      'Content-Type': 'application/x-protobuf',
    })
  })

  it('returns an empty object for destinations without default headers', () => {
    expect(getDefaultHeadersByType('loki')).toEqual({})
    expect(getDefaultHeadersByType('datadog')).toEqual({})
  })
})

describe('headerRecordToRows', () => {
  it('converts a header record into key/value rows', () => {
    expect(
      headerRecordToRows({
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      })
    ).toEqual([
      { key: 'Authorization', value: 'Bearer token' },
      { key: 'Content-Type', value: 'application/json' },
    ])
  })

  it('returns an empty array for empty header records', () => {
    expect(headerRecordToRows({})).toEqual([])
  })
})

describe('headerRowsToRecord', () => {
  it('converts key/value rows back into a header record', () => {
    expect(
      headerRowsToRecord([
        { key: 'Authorization', value: 'Bearer token' },
        { key: 'Content-Type', value: 'application/json' },
      ])
    ).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    })
  })

  it('trims row values and skips incomplete rows', () => {
    expect(
      headerRowsToRecord([
        { key: ' Authorization ', value: ' Bearer token ' },
        { key: '', value: 'missing-key' },
        { key: 'X-Skip', value: '' },
      ])
    ).toEqual({
      Authorization: 'Bearer token',
    })
  })
})

describe('logDrainHeaderEntriesSchema', () => {
  it('accepts fully empty draft rows', () => {
    const result = logDrainHeaderEntriesSchema.safeParse([
      { key: 'Content-Type', value: 'application/json' },
      { key: '', value: '' },
    ])

    expect(result.success).toBe(true)
  })

  it('rejects rows with a key but no value', () => {
    const result = logDrainHeaderEntriesSchema.safeParse([{ key: 'X-Draft-Only', value: '' }])

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: HEADER_VALIDATION_ERRORS.VALUE_REQUIRED,
            path: [0, 'value'],
          }),
        ])
      )
    }
  })

  it('rejects rows with a value but no key', () => {
    const result = logDrainHeaderEntriesSchema.safeParse([{ key: '', value: 'draft-value' }])

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: HEADER_VALIDATION_ERRORS.KEY_REQUIRED,
            path: [0, 'key'],
          }),
        ])
      )
    }
  })

  it('still rejects duplicate completed header names', () => {
    const result = logDrainHeaderEntriesSchema.safeParse([
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Content-Type', value: 'application/custom' },
    ])

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Header name already exists',
            path: [0, 'key'],
          }),
          expect.objectContaining({
            message: 'Header name already exists',
            path: [1, 'key'],
          }),
        ])
      )
    }
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

    it('rejects endpoint with an incomplete hostname', () => {
      const config = {
        type: 'otlp' as const,
        endpoint: 'https://webhook',
      }
      const result = otlpConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be a valid URL')
      }
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
