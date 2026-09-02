import { describe, expect, it } from 'vitest'

import { workersKeys } from './keys'
import { parseWorkerLogRows, workerLogsSql } from './worker-logs-query'

describe('workerLogsSql', () => {
  it('reads one worker stream, newest first', () => {
    expect(workerLogsSql('embed', 'output')).toBe(
      "select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes['worker'] = 'embed' and log_attributes['source'] = 'worker_guest_logs' order by timestamp desc limit 100"
    )
  })

  it('filters by event message and request method before applying the limit', () => {
    expect(workerLogsSql('embed', 'requests', { message: 'timeout', method: 'POST' })).toBe(
      "select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes['worker'] = 'embed' and log_attributes['source'] = 'worker_ingress_logs' and event_message ilike '%timeout%' and log_attributes['request.method'] = 'POST' order by timestamp desc limit 100"
    )
  })

  it('names the right stream for each tab', () => {
    expect(workerLogsSql('embed', 'requests')).toContain("'worker_ingress_logs'")
    expect(workerLogsSql('embed', 'builds')).toContain("'worker_api_logs'")
  })

  it('escapes a worker name rather than interpolating it raw', () => {
    expect(workerLogsSql("embed' or '1'='1", 'output')).toContain(
      "log_attributes['worker'] = 'embed'' or ''1''=''1'"
    )
  })

  it('escapes filter values rather than interpolating them raw', () => {
    expect(
      workerLogsSql('embed', 'requests', {
        message: "can't connect",
        method: "POST' OR '1'='1",
      })
    ).toContain(
      "event_message ilike '%can''t connect%' and log_attributes['request.method'] = 'POST'' OR ''1''=''1'"
    )
  })
})

describe('workersKeys.logs', () => {
  it('includes the selected time range and filters', () => {
    expect(
      workersKeys.logs('project-ref', 'embed', 'requests', {
        iso_timestamp_start: '2026-09-01T12:00:00.000Z',
        iso_timestamp_end: '2026-09-02T12:00:00.000Z',
        message: 'timeout',
        method: 'POST',
      })
    ).toEqual([
      'projects',
      'project-ref',
      'worker',
      'embed',
      'logs',
      'requests',
      {
        iso_timestamp_start: '2026-09-01T12:00:00.000Z',
        iso_timestamp_end: '2026-09-02T12:00:00.000Z',
        message: 'timeout',
        method: 'POST',
      },
    ])
  })
})

describe('parseWorkerLogRows', () => {
  it('shapes rows for the logs table with a numeric timestamp', () => {
    const [row] = parseWorkerLogRows([
      { id: 'a', timestamp: '2026-08-24T10:00:00.000000', severity: 'ERROR', message: 'boom' },
    ])
    expect(row.id).toBe('a')
    expect(row.event_message).toBe('boom')
    expect(row.severity_text).toBe('ERROR')
    expect(typeof row.timestamp).toBe('number')
    expect(Number.isFinite(row.timestamp)).toBe(true)
  })

  it('falls back to empty strings for null severity and message', () => {
    const [row] = parseWorkerLogRows([
      { id: 'a', timestamp: '2026-08-24T10:00:00.000000', severity: null, message: null },
    ])
    expect(row.severity_text).toBe('')
    expect(row.event_message).toBe('')
  })

  it('returns an empty array for a missing result', () => {
    expect(parseWorkerLogRows(undefined)).toEqual([])
  })

  it('rejects a malformed row rather than passing bad data to the table', () => {
    expect(() => parseWorkerLogRows([{ timestamp: '2026-08-24T10:00:00.000000' }])).toThrow()
  })
})
