import { describe, expect, it } from 'vitest'

import type { UserActivityEvent } from './UserActivity.constants'
import { describeUserActivityEvent, groupNoisyEvents } from './UserActivity.utils'

const buildEvent = (overrides: Partial<UserActivityEvent> = {}): UserActivityEvent => ({
  id: 'event-id',
  timestampMs: 0,
  logType: 'auth',
  eventMessage: '',
  method: null,
  pathname: null,
  status: null,
  level: 'success',
  headers: {},
  logs: [],
  ...overrides,
})

describe('describeUserActivityEvent', () => {
  describe('auth events', () => {
    it('describes a successful signup', () => {
      const eventMessage = JSON.stringify({
        auth_event: {
          action: 'login',
          actor_id: '592d9fa1-2094-45da-a1de-8717536f5bc9',
          actor_username: 'jamie@example.com',
          actor_via_sso: false,
          log_type: 'account',
          traits: { provider: 'email' },
        },
        component: 'api',
        duration: 113742173,
        level: 'info',
        method: 'POST',
        msg: 'request completed',
        path: '/signup',
        referer: 'http://localhost:3000',
        remote_addr: '77.28.237.61',
        request_id: '019f94a0-dd87-77bc-8d93-e5eaa648d39f',
        status: 200,
        time: '2026-07-24T14:56:38Z',
      })

      expect(describeUserActivityEvent('auth', eventMessage)).toBe('The user signed up')
    })

    it('describes a failed signup with the error code', () => {
      const eventMessage = JSON.stringify({
        auth_event: {
          action: 'user_repeated_signup',
          actor_id: '592d9fa1-2094-45da-a1de-8717536f5bc9',
          actor_username: 'jamie@example.com',
          actor_via_sso: false,
          log_type: 'user',
          traits: { provider: 'email' },
        },
        component: 'api',
        duration: 6082399,
        error: '422: User already registered',
        error_code: 'user_already_exists',
        level: 'warning',
        method: 'POST',
        msg: 'request completed',
        path: '/signup',
        referer: 'http://localhost:3000',
        remote_addr: '77.28.237.61',
        request_id: '019f94a1-065c-7e9e-acae-c746a23e8af8',
        status: 422,
        time: '2026-07-24T14:56:48Z',
      })

      expect(describeUserActivityEvent('auth', eventMessage)).toBe(
        'User failed to sign up with error user_already_exists'
      )
    })

    it('describes a successful login', () => {
      const eventMessage = JSON.stringify({ path: '/token', status: 200 })
      expect(describeUserActivityEvent('auth', eventMessage)).toBe('The user renewed their session')
    })

    it('describes a failed login without an error code', () => {
      const eventMessage = JSON.stringify({ path: '/token', status: 400 })
      expect(describeUserActivityEvent('auth', eventMessage)).toBe(
        'User failed to renew their session'
      )
    })

    it('returns null for an unrecognized auth path', () => {
      const eventMessage = JSON.stringify({ path: '/some/unknown/path', status: 200 })
      expect(describeUserActivityEvent('auth', eventMessage)).toBeNull()
    })

    it('returns null when the message is not valid JSON', () => {
      expect(describeUserActivityEvent('auth', 'not json')).toBeNull()
    })
  })

  describe('REST (PostgREST) events', () => {
    it('describes a successful select', () => {
      const eventMessage =
        'GET | 200 | https://dpbtwfqeypysapjkkxcw.supabase.red/rest/v1/profiles?select=id&limit=1 | node'
      expect(describeUserActivityEvent('postgrest', eventMessage)).toBe(
        'User fetched data from the profiles table'
      )
    })

    it('describes a failed insert/update', () => {
      const eventMessage =
        'POST | 403 | https://dpbtwfqeypysapjkkxcw.supabase.red/rest/v1/orders | node'
      expect(describeUserActivityEvent('edge', eventMessage)).toBe(
        'User failed to insert/update data in the orders table'
      )
    })

    it('describes a successful delete', () => {
      const eventMessage = 'DELETE | 200 | https://example.supabase.red/rest/v1/sessions | node'
      expect(describeUserActivityEvent('postgrest', eventMessage)).toBe(
        'User deleted data from the sessions table'
      )
    })

    it('is case-insensitive on the HTTP method', () => {
      const eventMessage = 'get | 200 | https://example.supabase.red/rest/v1/profiles | node'
      expect(describeUserActivityEvent('postgrest', eventMessage)).toBe(
        'User fetched data from the profiles table'
      )
    })

    it('returns null when the URL is not a /rest/v1 request', () => {
      const eventMessage =
        'GET | 200 | https://example.supabase.red/storage/v1/object/avatars | node'
      expect(describeUserActivityEvent('storage', eventMessage)).toBeNull()
    })

    it('returns null for an unrecognized HTTP method', () => {
      const eventMessage = 'CONNECT | 200 | https://example.supabase.red/rest/v1/profiles | node'
      expect(describeUserActivityEvent('postgrest', eventMessage)).toBeNull()
    })

    it("returns null when the message doesn't match the pipe-delimited shape", () => {
      expect(
        describeUserActivityEvent('postgres', 'connection authorized: user=postgres')
      ).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('returns null for an empty message', () => {
      expect(describeUserActivityEvent('auth', '')).toBeNull()
      expect(describeUserActivityEvent('postgrest', undefined)).toBeNull()
    })
  })
})

describe('groupNoisyEvents', () => {
  it('leaves non-noisy events ungrouped', () => {
    const signup = buildEvent({ id: 'signup', pathname: '/signup' })
    const login = buildEvent({ id: 'user', pathname: '/user' })

    expect(groupNoisyEvents([signup, login])).toEqual([
      { kind: 'event', event: signup },
      { kind: 'event', event: login },
    ])
  })

  it('collapses a single noisy event into its own group', () => {
    const tokenRefresh = buildEvent({ id: 'token-1', pathname: '/token' })

    expect(groupNoisyEvents([tokenRefresh])).toEqual([
      { kind: 'omitted', id: 'omitted-token-1', events: [tokenRefresh] },
    ])
  })

  it('collapses a consecutive run of noisy events into one group', () => {
    const signup = buildEvent({ id: 'signup', pathname: '/signup' })
    const tokenA = buildEvent({ id: 'token-1', pathname: '/token' })
    const tokenB = buildEvent({ id: 'token-2', pathname: '/token' })
    const logout = buildEvent({ id: 'logout', pathname: '/logout' })

    expect(groupNoisyEvents([signup, tokenA, tokenB, logout])).toEqual([
      { kind: 'event', event: signup },
      { kind: 'omitted', id: 'omitted-token-1', events: [tokenA, tokenB] },
      { kind: 'event', event: logout },
    ])
  })

  it('starts a new group when noisy events are interrupted by another event', () => {
    const tokenA = buildEvent({ id: 'token-1', pathname: '/token' })
    const logout = buildEvent({ id: 'logout', pathname: '/logout' })
    const tokenB = buildEvent({ id: 'token-2', pathname: '/token' })

    expect(groupNoisyEvents([tokenA, logout, tokenB])).toEqual([
      { kind: 'omitted', id: 'omitted-token-1', events: [tokenA] },
      { kind: 'event', event: logout },
      { kind: 'omitted', id: 'omitted-token-2', events: [tokenB] },
    ])
  })

  it('returns an empty array for no events', () => {
    expect(groupNoisyEvents([])).toEqual([])
  })
})
