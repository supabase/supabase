import { describe, expect, it } from 'vitest'

import {
  buildAuthLogsSql,
  buildEdgeLogsSql,
  buildJourney,
  classifyAuthLog,
  classifyEdgeLog,
  isValidUserId,
} from './UserJourney.utils'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'

const USER_ID = '00000000-0000-4000-8000-000000000000'

const authRow = (overrides: Partial<LogData> = {}): LogData =>
  ({ id: 'a1', timestamp: 1_700_000_000_000_000, event_message: '', ...overrides }) as LogData

const edgeRow = (overrides: Partial<LogData> = {}): LogData =>
  ({ id: 'e1', timestamp: 1_700_000_000_000_000, event_message: '', ...overrides }) as LogData

describe('isValidUserId', () => {
  it('accepts a uuid', () => {
    expect(isValidUserId(USER_ID)).toBe(true)
  })

  it('rejects empty, null, and non-uuid values', () => {
    expect(isValidUserId(undefined)).toBe(false)
    expect(isValidUserId(null)).toBe(false)
    expect(isValidUserId('')).toBe(false)
    expect(isValidUserId('not-a-uuid')).toBe(false)
  })
})

describe('buildAuthLogsSql', () => {
  it('targets auth_logs and filters by user in BigQuery dialect', () => {
    const sql = buildAuthLogsSql(USER_ID, false)
    expect(sql).toContain('from auth_logs')
    expect(sql).toContain(`regexp_contains(event_message, '${USER_ID}')`)
  })

  it('targets the ClickHouse logs table with a source filter in OTEL dialect', () => {
    const sql = buildAuthLogsSql(USER_ID, true)
    expect(sql).toContain("where source = 'auth_logs'")
    expect(sql).toContain(`ilike '%${USER_ID}%'`)
  })
})

describe('buildEdgeLogsSql', () => {
  it('filters edge logs on auth_user in BigQuery dialect', () => {
    const sql = buildEdgeLogsSql(USER_ID, false)
    expect(sql).toContain('from edge_logs')
    expect(sql).toContain(`sb.auth_user = '${USER_ID}'`)
  })

  it('filters edge logs on the auth_user attribute in OTEL dialect', () => {
    const sql = buildEdgeLogsSql(USER_ID, true)
    expect(sql).toContain("where source = 'edge_logs'")
    expect(sql).toContain(`log_attributes['request.sb.auth_user'] = '${USER_ID}'`)
  })
})

describe('classifyAuthLog', () => {
  it('labels a signup event as a success', () => {
    const event = classifyAuthLog(authRow({ path: '/signup', msg: 'user signed up' }))
    expect(event).toMatchObject({ source: 'auth', status: 'success', title: 'Signed up' })
  })

  it('labels a token/login event as Authenticated', () => {
    const event = classifyAuthLog(authRow({ path: '/token', msg: 'login' }))
    expect(event.title).toBe('Authenticated')
  })

  it('marks error/fatal levels as errors and attaches an error object', () => {
    const event = classifyAuthLog(authRow({ level: 'error', msg: 'invalid password' }))
    expect(event.status).toBe('error')
    expect(event.error?.message).toBe('invalid password')
  })
})

describe('classifyEdgeLog', () => {
  it('labels a successful GET as a neutral read', () => {
    const event = classifyEdgeLog(
      edgeRow({ method: 'GET', path: '/rest/v1/profiles', status_code: '200' })
    )
    expect(event).toMatchObject({
      source: 'postgrest',
      status: 'neutral',
      title: 'Read profiles',
    })
    expect(event.request).toEqual({ method: 'GET', path: '/rest/v1/profiles', statusCode: 200 })
  })

  it('labels a successful POST as a neutral create', () => {
    const event = classifyEdgeLog(
      edgeRow({ method: 'POST', path: '/rest/v1/orders', status_code: '201' })
    )
    expect(event.title).toBe('Created orders')
    expect(event.status).toBe('neutral')
  })

  it('treats a 403 write as a blocked error and infers the table but not the policy', () => {
    const event = classifyEdgeLog(
      edgeRow({ method: 'POST', path: '/rest/v1/payments', status_code: '403' })
    )
    expect(event.status).toBe('error')
    expect(event.title).toBe('Write blocked')
    expect(event.error?.table).toBe('payments')
    expect(event.error?.policy).toBeUndefined()
    expect(event.error?.policyUnknown).toBe(true)
  })

  it('handles a query string in the path when inferring the resource', () => {
    const event = classifyEdgeLog(
      edgeRow({ method: 'GET', path: '/rest/v1/orders?select=*&id=eq.1', status_code: '200' })
    )
    expect(event.title).toBe('Read orders')
  })
})

describe('buildJourney', () => {
  it('merges auth and edge events into a single oldest-to-newest timeline', () => {
    const authLogs = [
      authRow({ id: 'signup', timestamp: 100, path: '/signup', msg: 'signed up' }),
      authRow({ id: 'login', timestamp: 200, path: '/token', msg: 'login' }),
    ]
    const edgeLogs = [
      edgeRow({
        id: 'read',
        timestamp: 300,
        method: 'GET',
        path: '/rest/v1/p',
        status_code: '200',
      }),
      edgeRow({
        id: 'blocked',
        timestamp: 400,
        method: 'POST',
        path: '/rest/v1/payments',
        status_code: '403',
      }),
    ]

    const journey = buildJourney(authLogs, edgeLogs)

    expect(journey.map((event) => event.id)).toEqual(['signup', 'login', 'read', 'blocked'])
    expect(journey[journey.length - 1].status).toBe('error')
  })
})
