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
  it.each(['webhook', 'loki', 'otlp'] as const)('returns a description for %s', (type) => {
    expect(getHeadersSectionDescription(type)).not.toBe('')
  })

  it.each(['datadog', 's3', 'sentry'] as const)('returns an empty string for %s', (type) => {
    expect(getHeadersSectionDescription(type)).toBe('')
  })
})

describe('getDefaultHeadersByType', () => {
  it('returns the protobuf content type header for OTLP destinations', () => {
    expect(getDefaultHeadersByType('otlp')).toEqual({
      'Content-Type': 'application/x-protobuf',
    })
  })

  it.each(['webhook', 'loki', 'datadog'] as const)(
    'returns no default headers (incl. Content-Type) for %s',
    (type) => {
      expect(getDefaultHeadersByType(type)).toEqual({})
    }
  )
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

// URL parsing rules are covered in lib/validation/http-url.test.ts; these check the OTLP schema
// wiring (messages, defaults, type literal).
describe('otlpConfigSchema', () => {
  it('accepts a full configuration unchanged', () => {
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

  it.each([
    'http://localhost:4318/v1/logs',
    'https://otlp.example.com/v1/logs?tenant=123',
    'https://user:pass@otlp.example.com/v1/logs',
  ])('accepts endpoint %s', (endpoint) => {
    expect(otlpConfigSchema.safeParse({ type: 'otlp', endpoint }).success).toBe(true)
  })

  it('applies default values for optional fields', () => {
    const result = otlpConfigSchema.safeParse({
      type: 'otlp',
      endpoint: 'https://otlp.example.com/v1/logs',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.protocol).toBe('http/protobuf')
      expect(result.data.gzip).toBe(true)
    }
  })

  it('allows gzip to be explicitly false', () => {
    const result = otlpConfigSchema.safeParse({
      type: 'otlp',
      endpoint: 'https://otlp.example.com/v1/logs',
      gzip: false,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.gzip).toBe(false)
    }
  })

  it.each([
    ['', 'OTLP endpoint is required'],
    ['otlp.example.com/v1/logs', 'must start with http:// or https://'],
    ['ws://otlp.example.com/v1/logs', undefined],
    ['https://webhook', 'must be a valid URL'],
  ])('rejects endpoint %j', (endpoint, message) => {
    const result = otlpConfigSchema.safeParse({ type: 'otlp', endpoint })
    expect(result.success).toBe(false)
    if (!result.success && message) {
      expect(result.error.issues[0].message).toContain(message)
    }
  })

  it('rejects wrong type field', () => {
    const result = otlpConfigSchema.safeParse({
      type: 'webhook',
      endpoint: 'https://otlp.example.com/v1/logs',
    })
    expect(result.success).toBe(false)
  })
})
