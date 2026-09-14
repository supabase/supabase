import { describe, expect, it } from 'vitest'

import {
  AUTH_TOP_ERROR_CODES_SQL_OTEL,
  AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL,
  parseAuthErrorCodes,
  parseResponseErrors,
} from '@/components/interfaces/Auth/Overview/OverviewErrors.constants'

describe('Auth overview ClickHouse queries', () => {
  it('filters gateway failures and preserves the nested error header path', () => {
    expect(AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL).toContain("source = 'edge_logs'")
    expect(AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL).toContain('status_code between 400 and 599')
    expect(AUTH_TOP_ERROR_CODES_SQL_OTEL).toContain('response.headers.x_sb_error_code')
    expect(AUTH_TOP_ERROR_CODES_SQL_OTEL).toContain("error_code != ''")
    for (const sql of [AUTH_TOP_ERROR_CODES_SQL_OTEL, AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL]) {
      expect(sql).toContain('count()')
      expect(sql).toContain('limit 10')
      expect(sql).not.toContain('unnest')
    }
  })

  it('accepts ClickHouse string counts and legacy numeric counts', () => {
    expect(
      parseAuthErrorCodes([
        { error_code: 'bad_jwt', count: '12' },
        { error_code: 'expired', count: 3 },
      ])
    ).toEqual([
      { error_code: 'bad_jwt', count: 12 },
      { error_code: 'expired', count: 3 },
    ])
    expect(
      parseResponseErrors([
        { method: 'GET', path: '/auth/v1/user', status_code: '401', count: '4' },
      ])
    ).toEqual([{ method: 'GET', path: '/auth/v1/user', status_code: 401, count: 4 }])
  })

  it('drops malformed rows and counts', () => {
    expect(
      parseAuthErrorCodes([
        null,
        {},
        { error_code: 'error', count: 'oops' },
        { error_code: 'error', count: null },
      ])
    ).toEqual([])
    expect(
      parseResponseErrors([
        null,
        {},
        { method: 'GET', path: '/', status_code: 401, count: Infinity },
      ])
    ).toEqual([])
  })
})
