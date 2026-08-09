import { describe, expect, it } from 'vitest'

import { extractLogMetadata } from './unified-logs.utils'

describe('extractLogMetadata', () => {
  describe('non-auth logs', () => {
    it('returns the row status, method, and url-derived pathname', () => {
      const row = {
        log_type: 'api',
        status: 404,
        method: 'GET',
        url: 'https://example.supabase.co/rest/v1/users?select=id',
        pathname: '/ignored',
        event_message: 'irrelevant',
      }

      expect(extractLogMetadata(row)).toEqual({
        status: 404,
        method: 'GET',
        pathname: '/rest/v1/users?select=id',
      })
    })

    it('falls back to row.pathname when url is missing', () => {
      const row = {
        log_type: 'api',
        status: 500,
        method: 'POST',
        url: '',
        pathname: '/fallback',
        event_message: '',
      }

      expect(extractLogMetadata(row).pathname).toBe('/fallback')
    })

    it('returns empty string for pathname when both url and pathname are missing', () => {
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
        url: 'https://example.supabase.co/health',
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
        url: 'https://ignored',
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
        url: 'https://example.supabase.co/token',
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
})
