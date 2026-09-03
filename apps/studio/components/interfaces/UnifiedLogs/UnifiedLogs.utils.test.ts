import { describe, expect, it } from 'vitest'

import {
  buildUnifiedLogsUrl,
  gateLogTypeFilters,
  gateLogTypeOptions,
  getEventMessageDisplay,
  getRawLogData,
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

describe('getRawLogData', () => {
  it('returns only the real Workers payload fields', () => {
    const row = {
      event_message: 'Error: Dynamic require of "path" is not supported',
      id: '51a29911-9293-4616-8984-743cc548b629',
      metadata: {
        cw_event_id: '39883203917805946105278943454814281535421893832620638214',
        launch_id: '1788424715503435269',
        log_group: '/aws/lambda-microvms/workers/cxkpapyhaaywrtudnqpl/api',
        log_stream: 'launch-1788424715503435269',
        source: 'worker_guest_logs',
        worker: 'api',
      },
      project: 'cxkpapyhaaywrtudnqpl',
      timestamp: 1788424716876000,
      log_type: 'workers' as const,
      status: null,
      level: null,
      method: null,
      pathname: null,
      auth_user: null,
      date: new Date(1788424716876),
    }

    expect(getRawLogData(row)).toEqual({
      id: '51a29911-9293-4616-8984-743cc548b629',
      timestamp: 1788424716876000,
      event_message: 'Error: Dynamic require of "path" is not supported',
      metadata: row.metadata,
    })
  })

  it('returns non-Workers rows unchanged', () => {
    const row = {
      id: 'edge-log',
      timestamp: 1788424716876000,
      log_type: 'edge' as const,
      status: 200,
      method: 'GET' as const,
      pathname: '/rest/v1',
      level: 'success' as const,
      date: new Date(1788424716876),
    }

    expect(getRawLogData(row)).toBe(row)
  })
})

describe('gateLogTypeOptions', () => {
  const fields = [
    { value: 'date' },
    {
      value: 'log_type',
      options: [
        { label: 'Postgres', value: 'postgres' },
        { label: 'Multigres', value: 'multigres' },
        { label: 'Workers', value: 'workers' },
      ],
    },
  ]

  it('drops log_type options whose flags are disabled', () => {
    const gated = gateLogTypeOptions(fields, { multigres: false, workers: false })
    const logType = gated.find((field) => field.value === 'log_type')
    expect(logType?.options?.map((option) => option.value)).toEqual(['postgres'])
  })

  it('keeps independently enabled log types', () => {
    const gated = gateLogTypeOptions(fields, { multigres: false, workers: true })
    const logType = gated.find((field) => field.value === 'log_type')
    expect(logType?.options?.map((option) => option.value)).toEqual(['postgres', 'workers'])
  })

  it('returns the original fields when every gated log type is enabled', () => {
    const gated = gateLogTypeOptions(fields, { multigres: true, workers: true })
    expect(gated).toBe(fields)
  })

  it('leaves non log_type fields untouched', () => {
    const gated = gateLogTypeOptions(fields, { workers: false })
    expect(gated.find((field) => field.value === 'date')).toEqual({ value: 'date' })
  })
})

describe('gateLogTypeFilters', () => {
  it('removes disabled log types from equality and inequality filters', () => {
    expect(
      gateLogTypeFilters(
        ['log_type:eq:workers', 'log_type:neq:multigres', 'log_type:eq:postgres', 'method:eq:GET'],
        { workers: false, multigres: false }
      )
    ).toEqual(['log_type:eq:postgres', 'method:eq:GET'])
  })

  it('keeps enabled log types and unrelated filters unchanged', () => {
    const filters = ['log_type:eq:workers', 'method:eq:GET']
    expect(gateLogTypeFilters(filters, { workers: true })).toBe(filters)
  })

  it('preserves absent filter values', () => {
    expect(gateLogTypeFilters(undefined, { workers: false })).toBeUndefined()
    expect(gateLogTypeFilters(null, { workers: false })).toBeNull()
  })
})
