import { describe, expect, it } from 'vitest'

import { computeInstanceLogsSql, parseComputeInstanceLogRows } from './compute-instance-logs-query'
import { computeKeys } from './keys'

describe('computeInstanceLogsSql', () => {
  it('reads one instance stream, newest first', () => {
    expect(computeInstanceLogsSql('embed', 'output')).toBe(
      "select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes['worker'] = 'embed' and log_attributes['source'] = 'worker_guest_logs' order by timestamp desc limit 100"
    )
  })

  it('filters by event message before applying the limit', () => {
    expect(computeInstanceLogsSql('embed', 'requests', { message: 'timeout' })).toBe(
      "select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes['worker'] = 'embed' and log_attributes['source'] = 'worker_ingress_logs' and event_message ilike '%timeout%' order by timestamp desc limit 100"
    )
  })

  it('names the right stream for each tab', () => {
    expect(computeInstanceLogsSql('embed', 'requests')).toContain("'worker_ingress_logs'")
    expect(computeInstanceLogsSql('embed', 'builds')).toContain("'worker_api_logs'")
  })

  it('escapes an instance name rather than interpolating it raw', () => {
    expect(computeInstanceLogsSql("embed' or '1'='1", 'output')).toContain(
      "log_attributes['worker'] = 'embed'' or ''1''=''1'"
    )
  })

  it('escapes filter values rather than interpolating them raw', () => {
    expect(computeInstanceLogsSql('embed', 'requests', { message: "can't connect" })).toContain(
      "event_message ilike '%can''t connect%'"
    )
  })
})

describe('computeKeys.logs', () => {
  it('includes the selected time range and filters', () => {
    expect(
      computeKeys.logs('project-ref', 'embed', 'requests', {
        iso_timestamp_start: '2026-09-01T12:00:00.000Z',
        iso_timestamp_end: '2026-09-02T12:00:00.000Z',
        message: 'timeout',
      })
    ).toEqual([
      'projects',
      'project-ref',
      'instance',
      'embed',
      'logs',
      'requests',
      {
        iso_timestamp_start: '2026-09-01T12:00:00.000Z',
        iso_timestamp_end: '2026-09-02T12:00:00.000Z',
        message: 'timeout',
      },
    ])
  })
})

describe('parseComputeInstanceLogRows', () => {
  it('shapes rows for the logs table with a numeric timestamp', () => {
    const [row] = parseComputeInstanceLogRows([
      { id: 'a', timestamp: '2026-08-24T10:00:00.000000', severity: 'ERROR', message: 'boom' },
    ])
    expect(row.id).toBe('a')
    expect(row.event_message).toBe('boom')
    expect(row.severity_text).toBe('ERROR')
    expect(typeof row.timestamp).toBe('number')
    expect(Number.isFinite(row.timestamp)).toBe(true)
  })

  it('falls back to empty strings for null severity and message', () => {
    const [row] = parseComputeInstanceLogRows([
      { id: 'a', timestamp: '2026-08-24T10:00:00.000000', severity: null, message: null },
    ])
    expect(row.severity_text).toBe('')
    expect(row.event_message).toBe('')
  })

  it('returns an empty array for a missing result', () => {
    expect(parseComputeInstanceLogRows(undefined)).toEqual([])
  })

  it('rejects a malformed row rather than passing bad data to the table', () => {
    expect(() =>
      parseComputeInstanceLogRows([{ timestamp: '2026-08-24T10:00:00.000000' }])
    ).toThrow()
  })
})
