import { describe, expect, it } from 'vitest'

import { isKnownSupabaseApiKeyPayload, jwtAPIKey } from './Logs.utils'
import { formatCellValue, getOrderedFirstRow, resolveColumns } from './LogTable'

describe('isKnownSupabaseApiKeyPayload', () => {
  it('returns true for anon role with correct algorithm and issuer', () => {
    expect(
      isKnownSupabaseApiKeyPayload({ algorithm: 'HS256', issuer: 'supabase', role: 'anon' })
    ).toBe(true)
  })

  it('returns true for service_role with correct algorithm and issuer', () => {
    expect(
      isKnownSupabaseApiKeyPayload({
        algorithm: 'HS256',
        issuer: 'supabase',
        role: 'service_role',
      })
    ).toBe(true)
  })

  it('returns false when subject is present', () => {
    expect(
      isKnownSupabaseApiKeyPayload({
        algorithm: 'HS256',
        issuer: 'supabase',
        role: 'anon',
        subject: 'user-123',
      })
    ).toBe(false)
  })

  it('returns false for wrong algorithm', () => {
    expect(
      isKnownSupabaseApiKeyPayload({ algorithm: 'RS256', issuer: 'supabase', role: 'anon' })
    ).toBe(false)
  })

  it('returns false for wrong issuer', () => {
    expect(
      isKnownSupabaseApiKeyPayload({ algorithm: 'HS256', issuer: 'other', role: 'anon' })
    ).toBe(false)
  })

  it('returns false for unrecognized role', () => {
    expect(
      isKnownSupabaseApiKeyPayload({ algorithm: 'HS256', issuer: 'supabase', role: 'admin' })
    ).toBe(false)
  })

  it('returns false when role is missing', () => {
    expect(isKnownSupabaseApiKeyPayload({ algorithm: 'HS256', issuer: 'supabase' })).toBe(false)
  })
})

describe('getOrderedFirstRow', () => {
  it('returns empty object for undefined', () => {
    expect(getOrderedFirstRow(undefined)).toEqual({})
  })

  it('returns row as-is when no timestamp', () => {
    const row = { id: '1', event_message: 'hello' } as any
    expect(getOrderedFirstRow(row)).toEqual(row)
  })

  it('moves timestamp to the front', () => {
    const row = { id: '1', event_message: 'hello', timestamp: 123456 } as any
    const result = getOrderedFirstRow(row)
    expect(Object.keys(result)[0]).toBe('timestamp')
  })
})

describe('formatCellValue', () => {
  it('stringifies objects', () => {
    expect(formatCellValue({ a: 1 })).toBe('{"a":1}')
  })

  it('formats null as NULL', () => {
    expect(formatCellValue(null)).toBe('NULL')
  })

  it('converts numbers to string', () => {
    expect(formatCellValue(42)).toBe('42')
  })

  it('passes strings through', () => {
    expect(formatCellValue('hello')).toBe('hello')
  })
})

describe('resolveColumns', () => {
  const defaultCols = [{ key: 'default', name: 'default' }] as any[]

  it('returns defaultColumns when queryType is undefined', () => {
    expect(resolveColumns(undefined, undefined, defaultCols)).toBe(defaultCols)
  })

  it('returns defaultColumns when queryType is undefined even with firstRow', () => {
    expect(resolveColumns(undefined, { id: '1' } as any, defaultCols)).toBe(defaultCols)
  })

  it('returns correct columns for api', () => {
    const result = resolveColumns('api', undefined, defaultCols)
    expect(result).not.toBe(defaultCols)
  })

  it('returns same columns for database and pg_cron', () => {
    expect(resolveColumns('database', undefined, defaultCols)).toBe(
      resolveColumns('pg_cron', undefined, defaultCols)
    )
  })
})

describe('jwtAPIKey', () => {
  function buildMetadata(override: Record<string, any> = {}) {
    return [
      {
        request: [
          {
            sb: [
              {
                jwt: [
                  {
                    apikey: [
                      {
                        invalid: false,
                        payload: [
                          {
                            algorithm: 'HS256',
                            issuer: 'supabase',
                            role: 'anon',
                          },
                        ],
                        ...override,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]
  }

  it('returns undefined when no apikey header', () => {
    expect(jwtAPIKey(null)).toBeUndefined()
    expect(jwtAPIKey(undefined)).toBeUndefined()
    expect(jwtAPIKey([])).toBeUndefined()
  })

  it('returns <invalid> when header is marked invalid', () => {
    expect(jwtAPIKey(buildMetadata({ invalid: true }))).toBe('<invalid>')
  })

  it('returns <unrecognized> when payload is missing', () => {
    expect(jwtAPIKey(buildMetadata({ payload: [] }))).toBe('<unrecognized>')
  })

  it('returns the role for a known anon key', () => {
    expect(jwtAPIKey(buildMetadata())).toBe('anon')
  })

  it('returns the role for a known service_role key', () => {
    expect(
      jwtAPIKey(
        buildMetadata({
          payload: [{ algorithm: 'HS256', issuer: 'supabase', role: 'service_role' }],
        })
      )
    ).toBe('service_role')
  })

  it('returns <unrecognized> for a user JWT (has subject)', () => {
    expect(
      jwtAPIKey(
        buildMetadata({
          payload: [
            { algorithm: 'HS256', issuer: 'supabase', role: 'authenticated', subject: 'uuid' },
          ],
        })
      )
    ).toBe('<unrecognized>')
  })
})
