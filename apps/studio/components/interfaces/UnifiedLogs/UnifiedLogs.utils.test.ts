import { describe, expect, it } from 'vitest'

import {
  buildUnifiedLogsUrl,
  gateMultigresLogType,
  getEventMessageDisplay,
  parseMultigresEventMessage,
} from './UnifiedLogs.utils'

describe('buildUnifiedLogsUrl', () => {
  const parse = (url: string) => {
    const [path, query] = url.split('?')
    return { path, params: new URLSearchParams(query) }
  }

  it('targets the project logs route with a log_type filter', () => {
    const { path, params } = parse(buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'postgres' }))
    expect(path).toBe('/project/abc/logs')
    expect(params.get('filter')).toBe('log_type:eq:postgres')
    expect(params.has('date')).toBe(false)
  })

  it('preserves multi-word log types once decoded', () => {
    const { params } = parse(buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'edge function' }))
    expect(params.get('filter')).toBe('log_type:eq:edge function')
  })

  it('adds the date range as an epoch-ms pair when start and end are provided', () => {
    const start = new Date('2026-05-08T00:00:00.000Z')
    const end = new Date('2026-05-08T01:00:00.000Z')
    const { params } = parse(
      buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'auth', start, end })
    )
    expect(params.get('date')).toBe(`${start.valueOf()}-${end.valueOf()}`)
  })

  it('accepts ISO strings for the date range', () => {
    const start = '2026-05-08T00:00:00.000Z'
    const end = '2026-05-08T01:00:00.000Z'
    const { params } = parse(
      buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'auth', start, end })
    )
    expect(params.get('date')).toBe(`${new Date(start).valueOf()}-${new Date(end).valueOf()}`)
  })

  it('omits the date range when only one bound is provided', () => {
    const { params } = parse(
      buildUnifiedLogsUrl({ projectRef: 'abc', logType: 'storage', start: new Date() })
    )
    expect(params.has('date')).toBe(false)
  })
})

describe('parseMultigresEventMessage', () => {
  it('extracts the msg field from a stringified JSON payload', () => {
    const value = JSON.stringify({
      time: '2026-07-03T09:42:12.344925698Z',
      level: 'INFO',
      msg: 'user pool capacity updated',
      user: 'supabase_admin',
    })
    expect(parseMultigresEventMessage(value)).toBe('user pool capacity updated')
  })

  it('returns the raw string when it is not JSON', () => {
    expect(parseMultigresEventMessage('plain text message')).toBe('plain text message')
  })

  it('returns the raw string when msg is missing or empty', () => {
    expect(parseMultigresEventMessage(JSON.stringify({ level: 'INFO' }))).toBe('{"level":"INFO"}')
    expect(parseMultigresEventMessage(JSON.stringify({ msg: '  ' }))).toBe('{"msg":"  "}')
  })

  it('passes empty values through unchanged', () => {
    expect(parseMultigresEventMessage(undefined)).toBeUndefined()
    expect(parseMultigresEventMessage('')).toBe('')
  })
})

describe('getEventMessageDisplay', () => {
  it('parses multigres rows into their msg field and capitalizes them', () => {
    const value = JSON.stringify({ level: 'INFO', msg: 'Configuring synchronous replication' })
    expect(getEventMessageDisplay('multigres', value)).toEqual({
      message: 'Configuring synchronous replication',
      capitalize: true,
    })
  })

  it('leaves non-parsed log types untouched and uncapitalized', () => {
    expect(getEventMessageDisplay('postgres', 'relation does not exist')).toEqual({
      message: 'relation does not exist',
      capitalize: false,
    })
  })
})

describe('gateMultigresLogType', () => {
  const fields = [
    { value: 'date' },
    {
      value: 'log_type',
      options: [
        { label: 'Postgres', value: 'postgres' },
        { label: 'Multigres', value: 'multigres' },
      ],
    },
  ]

  it('drops the multigres log_type option when the flag is disabled', () => {
    const gated = gateMultigresLogType(fields, false)
    const logType = gated.find((field) => field.value === 'log_type')
    expect(logType?.options?.map((option) => option.value)).toEqual(['postgres'])
  })

  it('keeps the multigres option when the flag is enabled', () => {
    const gated = gateMultigresLogType(fields, true)
    expect(gated).toBe(fields)
  })

  it('leaves non log_type fields untouched', () => {
    const gated = gateMultigresLogType(fields, false)
    expect(gated.find((field) => field.value === 'date')).toEqual({ value: 'date' })
  })
})
