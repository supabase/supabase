import { describe, expect, it } from 'vitest'

import {
  aggregateFunctionLogs,
  flattenOtelInspectionRow,
  type OtelLogRow,
} from './otel-inspection.utils'

const edgeRow: OtelLogRow = {
  id: 'a1f2ba98-5701-4044-aed8-5dbcd36256f5',
  timestamp: '2026-05-08T17:42:31.351000',
  source: 'edge_logs',
  event_message: 'GET | 401 | https://example.supabase.red/rest/v1/customers',
  log_attributes: {
    'request.method': 'GET',
    'request.path': '/rest/v1/customers',
    'request.host': 'example.supabase.red',
    'request.url': 'https://example.supabase.red/rest/v1/customers?select=id',
    'request.headers.user_agent': 'pg_net/0.8.0',
    'request.headers.cf_ray': '9f7f5511fcfece4b',
    'request.headers.cf_connecting_ip': '2406:da18::1',
    'request.cf.country': 'SG',
    'request.cf.city': 'Singapore',
    'request.cf.colo': 'SIN',
    'request.cf.httpProtocol': 'HTTP/2',
    'response.status_code': '401',
    'response.headers.content_type': 'application/json;charset=UTF-8',
  },
}

const fnEdgeRow: OtelLogRow = {
  id: 'cf7fbfd7-a23f-4cc5-a526-6fef4c5e47f9',
  timestamp: '2026-05-08T16:59:40.000000',
  source: 'function_edge_logs',
  event_message: 'POST | 401 | /functions/v1/hello-world',
  log_attributes: {
    'request.method': 'POST',
    'request.pathname': '/functions/v1/hello-world',
    'request.host': 'example.supabase.red',
    'request.url': 'https://example.supabase.red/functions/v1/hello-world',
    'response.status_code': '401',
    execution_id: '1221d106-cc1c-463a-a42a-3decf6c52884',
    function_id: '0a47f8f5-afce-485a-8705-6e1f71c6784a',
    deployment_id: 'deploy-123',
    execution_time_ms: '258',
    'response.headers.x_sb_edge_region': 'ap-southeast-1',
  },
}

const pgRow: OtelLogRow = {
  id: '972f990f-2d81-4473-99c5-b78b8943ea71',
  timestamp: '2026-05-08T17:58:53.121000',
  source: 'postgres_logs',
  event_message: 'connection authorized: user=postgres database=postgres',
  log_attributes: {
    'parsed.error_severity': 'LOG',
    'parsed.process_id': '848',
    'parsed.session_id': '69399f78.350',
    'parsed.session_start_time': '2025-12-10 16:27:36 UTC',
    'parsed.transaction_id': '0',
    'parsed.virtual_transaction_id': '3/0',
    'parsed.sql_state_code': '00000',
  },
}

describe('flattenOtelInspectionRow', () => {
  it('maps edge_logs request/CF/headers attributes to underscored aliases', () => {
    const e = flattenOtelInspectionRow(edgeRow) as unknown as Record<string, unknown>
    expect(e.request_method).toBe('GET')
    expect(e.request_path).toBe('/rest/v1/customers')
    expect(e.request_host).toBe('example.supabase.red')
    expect(e.headers_user_agent).toBe('pg_net/0.8.0')
    expect(e.cf_ray).toBe('9f7f5511fcfece4b')
    expect(e.cf_country).toBe('SG')
    expect(e.client_city).toBe('Singapore')
    expect(e.network_protocol).toBe('HTTP/2')
    expect(e.network_datacenter).toBe('SIN')
    expect(e.client_ip).toBe('2406:da18::1')
    expect(e.status_code).toBe('401')
    expect(e.level).toBe('warning')
  })

  it('coalesces request.path / request.pathname for function_edge_logs', () => {
    const e = flattenOtelInspectionRow(fnEdgeRow) as unknown as Record<string, unknown>
    expect(e.request_path).toBe('/functions/v1/hello-world')
    expect(e.path).toBe('/functions/v1/hello-world')
  })

  it('exposes edge function specific fields', () => {
    const e = flattenOtelInspectionRow(fnEdgeRow) as unknown as Record<string, unknown>
    expect(e.execution_id).toBe('1221d106-cc1c-463a-a42a-3decf6c52884')
    expect(e.function_id).toBe('0a47f8f5-afce-485a-8705-6e1f71c6784a')
    expect(e.execution_time_ms).toBe('258')
    expect(e.execution_region).toBe('ap-southeast-1')
  })

  it('maps postgres parsed.* attributes and derives level from severity', () => {
    const e = flattenOtelInspectionRow(pgRow) as unknown as Record<string, unknown>
    expect(e.process_id).toBe('848')
    expect(e.session_id).toBe('69399f78.350')
    expect(e.transaction_id).toBe('0')
    expect(e.error_severity).toBe('LOG')
    expect(e.sql_state_code).toBe('00000')
    expect(e.level).toBe('success')
  })

  it('derives level=error for 5xx responses', () => {
    const row: OtelLogRow = {
      ...edgeRow,
      log_attributes: { ...edgeRow.log_attributes, 'response.status_code': '503' },
    }
    expect((flattenOtelInspectionRow(row) as unknown as Record<string, unknown>).level).toBe(
      'error'
    )
  })

  it('falls back gracefully when log_attributes is missing', () => {
    const row: OtelLogRow = {
      id: 'x',
      timestamp: '2026-01-01T00:00:00Z',
      source: 'edge_logs',
      event_message: 'hi',
    }
    const e = flattenOtelInspectionRow(row) as unknown as Record<string, unknown>
    expect(e.id).toBe('x')
    expect(e.method).toBe('')
    expect(e.path).toBe('')
    expect(e.cf_country).toBeNull()
  })
})

describe('aggregateFunctionLogs', () => {
  it('returns zero counts for an empty result set', () => {
    const agg = aggregateFunctionLogs([])
    expect(agg.function_log_count).toBe(0)
    expect(agg.last_event_message).toBeNull()
    expect(agg.function_logs).toEqual([])
  })

  it('aggregates row count and exposes a sample event message + log entries', () => {
    const rows: OtelLogRow[] = [
      {
        id: '1',
        timestamp: '2026-05-08T17:00:00Z',
        source: 'function_logs',
        event_message: 'first',
        log_attributes: { event_type: 'Log', level: 'log' },
      },
      {
        id: '2',
        timestamp: '2026-05-08T17:00:01Z',
        source: 'function_logs',
        event_message: 'second',
        log_attributes: { event_type: 'Shutdown', level: 'log' },
      },
    ]
    const agg = aggregateFunctionLogs(rows)
    expect(agg.function_log_count).toBe(2)
    expect(agg.last_event_message).toBe('first')
    expect(agg.function_logs).toHaveLength(2)
    expect(agg.function_logs[0]).toMatchObject({ id: '1', event_type: 'Log', level: 'log' })
  })
})
