import { describe, expect, it } from 'vitest'

import {
  extractLogMetadata,
  mapUnifiedLogRow,
  parseUnifiedLogsQueryRows,
} from './unified-logs.utils'

describe('extractLogMetadata', () => {
  describe('non-auth logs', () => {
    it('returns projected status, method, and pathname', () => {
      const row = {
        log_type: 'api',
        status: 404,
        method: 'GET',
        pathname: '/rest/v1/users?select=id',
        event_message: 'irrelevant',
      }

      expect(extractLogMetadata(row)).toEqual({
        status: 404,
        method: 'GET',
        pathname: '/rest/v1/users?select=id',
      })
    })

    it('returns the projected pathname', () => {
      const row = {
        log_type: 'api',
        status: 500,
        method: 'POST',
        pathname: '/fallback',
        event_message: '',
      }

      expect(extractLogMetadata(row).pathname).toBe('/fallback')
    })

    it('returns an empty string when pathname is missing', () => {
      const row = {
        log_type: 'api',
        status: 200,
        method: 'GET',
        event_message: '',
      }

      expect(extractLogMetadata(row).pathname).toBe('')
    })

    it('defaults status to 200 when missing', () => {
      const row = {
        log_type: 'api',
        method: 'GET',
        event_message: '',
      }

      expect(extractLogMetadata(row).status).toBe(200)
    })
  })

  describe('auth logs', () => {
    it('extracts status, method, and pathname from event_message JSON', () => {
      const row = {
        log_type: 'auth',
        status: 999,
        method: 'IGNORED',
        event_message: JSON.stringify({
          status: 400,
          method: 'POST',
          path: '/token',
          msg: 'request completed',
        }),
      }

      expect(extractLogMetadata(row)).toEqual({
        status: 400,
        method: 'POST',
        pathname: '/token',
      })
    })

    it('falls back to leading 3-digit status in msg when event_message.status is missing', () => {
      const row = {
        log_type: 'auth',
        event_message: JSON.stringify({
          method: 'POST',
          path: '/token',
          msg: '400: Invalid login credentials',
        }),
      }

      expect(extractLogMetadata(row).status).toBe(400)
    })

    it('falls back to leading 3-digit status in error when neither status nor msg has one', () => {
      const row = {
        log_type: 'auth',
        event_message: JSON.stringify({
          method: 'POST',
          path: '/token',
          msg: 'request completed',
          error: '403: forbidden',
        }),
      }

      expect(extractLogMetadata(row).status).toBe(403)
    })

    it('returns undefined status when no status can be found anywhere', () => {
      const row = {
        log_type: 'auth',
        event_message: JSON.stringify({
          method: 'POST',
          path: '/token',
          msg: 'request completed',
        }),
      }

      expect(extractLogMetadata(row).status).toBeUndefined()
    })

    it('does not extract status from a non-leading 3-digit number in msg', () => {
      const row = {
        log_type: 'auth',
        event_message: JSON.stringify({
          msg: 'attempt 500 failed',
        }),
      }

      expect(extractLogMetadata(row).status).toBeUndefined()
    })

    it('does not match 4+ digit numbers at the start of msg', () => {
      const row = {
        log_type: 'auth',
        event_message: JSON.stringify({
          msg: '4000 something',
        }),
      }

      expect(extractLogMetadata(row).status).toBeUndefined()
    })

    it('returns undefined metadata when event_message is not valid JSON', () => {
      const row = {
        log_type: 'auth',
        status: 200,
        method: 'GET',
        event_message: 'not json',
      }

      expect(extractLogMetadata(row)).toEqual({
        status: undefined,
        method: undefined,
        pathname: undefined,
      })
    })

    it('prefers explicit event_message.status over msg/error extraction', () => {
      const row = {
        log_type: 'auth',
        event_message: JSON.stringify({
          status: 200,
          msg: '500: something went wrong',
          error: '503: service unavailable',
        }),
      }

      expect(extractLogMetadata(row).status).toBe(200)
    })
  })

  describe('workers logs', () => {
    it('does not synthesize unsupported request metadata', () => {
      const row = {
        event_message: 'Error: Dynamic require of "path" is not supported',
        id: '51a29911-9293-4616-8984-743cc548b629',
        log_type: 'workers',
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
      }

      expect(extractLogMetadata(row)).toEqual({ status: null, method: null, pathname: null })
    })

    it('preserves only Workers metadata while keeping unsupported fields null', () => {
      const metadata = {
        cw_event_id: '39883203917805946105278943454814281535421893832620638214',
        launch_id: '1788424715503435269',
        log_group: '/aws/lambda-microvms/workers/cxkpapyhaaywrtudnqpl/api',
        log_stream: 'launch-1788424715503435269',
        source: 'worker_guest_logs',
        worker: 'api',
      }
      const mapped = mapUnifiedLogRow({
        event_message: 'Error: Dynamic require of "path" is not supported',
        id: '51a29911-9293-4616-8984-743cc548b629',
        log_type: 'workers',
        metadata,
        timestamp: 1788424716876000,
        status: 200,
        level: 'success',
        method: 'GET',
        pathname: '/invented',
        auth_user: 'invented-user',
        log_count: null,
        logs: null,
      })

      expect(mapped).toMatchObject({
        id: '51a29911-9293-4616-8984-743cc548b629',
        timestamp: 1788424716876000,
        event_message: 'Error: Dynamic require of "path" is not supported',
        metadata,
        status: null,
        level: null,
        method: null,
        pathname: null,
        auth_user: null,
      })
      expect(mapped).not.toHaveProperty('project')
    })

    it('does not add metadata to non-Workers rows', () => {
      const mapped = mapUnifiedLogRow({
        id: 'edge-log',
        timestamp: 1788424716876000,
        log_type: 'edge',
        metadata: { request: 'existing metadata' },
        status: 200,
        level: 'success',
        method: 'GET',
        pathname: '/rest/v1',
        event_message: null,
        log_count: null,
        logs: null,
      })

      expect(mapped).not.toHaveProperty('metadata')
    })
  })
})

describe('parseUnifiedLogsQueryRows', () => {
  const workersRow = {
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
    log_type: 'workers',
    status: null,
    level: null,
    pathname: null,
    method: null,
    log_count: null,
    logs: null,
    auth_user: null,
  }

  it('parses the Workers projection and strips project', () => {
    const [parsed] = parseUnifiedLogsQueryRows([workersRow])

    expect(parsed).toMatchObject({
      id: workersRow.id,
      timestamp: workersRow.timestamp,
      event_message: workersRow.event_message,
      metadata: workersRow.metadata,
      log_type: 'workers',
      status: null,
      level: null,
      pathname: null,
      method: null,
    })
    expect(parsed).not.toHaveProperty('project')
  })

  it('returns an empty array for undefined results', () => {
    expect(parseUnifiedLogsQueryRows(undefined)).toEqual([])
  })

  it('rejects invalid metadata', () => {
    expect(() => parseUnifiedLogsQueryRows([{ ...workersRow, metadata: 'invalid' }])).toThrow()
  })

  it.each([{ id: 42 }, { timestamp: true }])('rejects invalid identity fields', (invalidFields) => {
    expect(() => parseUnifiedLogsQueryRows([{ ...workersRow, ...invalidFields }])).toThrow()
  })

  it('rejects invalid projected field types', () => {
    expect(() => parseUnifiedLogsQueryRows([{ ...workersRow, level: 'info' }])).toThrow()
  })
})
