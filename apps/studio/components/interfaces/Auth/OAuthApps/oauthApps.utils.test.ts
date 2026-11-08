import type { OAuthClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'

import { filterOAuthApps } from './oauthApps.utils'

const createApp = (overrides: Partial<OAuthClient> = {}): OAuthClient => ({
  client_id: 'client-1',
  client_name: 'Acme Web',
  client_type: 'confidential',
  token_endpoint_auth_method: 'client_secret_basic',
  registration_type: 'manual',
  redirect_uris: ['https://acme.example.com/callback'],
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const APPS: OAuthClient[] = [
  createApp({
    client_id: 'client-abc-111',
    client_name: 'Acme Dashboard',
    client_type: 'confidential',
    registration_type: 'manual',
  }),
  createApp({
    client_id: 'client-xyz-222',
    client_name: 'Mobile Companion',
    client_type: 'public',
    registration_type: 'dynamic',
  }),
  createApp({
    client_id: 'client-def-333',
    client_name: 'Internal CLI',
    client_type: 'public',
    registration_type: 'manual',
  }),
]

describe('filterOAuthApps', () => {
  test('returns all apps when no filters are active', () => {
    expect(filterOAuthApps({ apps: APPS })).toEqual(APPS)
    expect(
      filterOAuthApps({
        apps: APPS,
        searchString: '',
        registrationTypes: [],
        clientTypes: [],
      })
    ).toEqual(APPS)
  })

  test('filters by client_name case-insensitively', () => {
    const result = filterOAuthApps({ apps: APPS, searchString: 'companion' })
    expect(result).toEqual([APPS[1]])
  })

  test('filters by client_id case-insensitively', () => {
    const result = filterOAuthApps({ apps: APPS, searchString: 'XYZ-222' })
    expect(result).toEqual([APPS[1]])
  })

  test('returns empty array when search string matches neither name nor client_id', () => {
    expect(filterOAuthApps({ apps: APPS, searchString: 'nonexistent' })).toEqual([])
  })

  test('filters by registrationTypes', () => {
    expect(filterOAuthApps({ apps: APPS, registrationTypes: ['dynamic'] })).toEqual([APPS[1]])
    expect(filterOAuthApps({ apps: APPS, registrationTypes: ['manual', 'dynamic'] })).toEqual(APPS)
  })

  test('filters by clientTypes', () => {
    expect(filterOAuthApps({ apps: APPS, clientTypes: ['confidential'] })).toEqual([APPS[0]])
    expect(filterOAuthApps({ apps: APPS, clientTypes: ['public'] })).toEqual([APPS[1], APPS[2]])
  })

  test('combines searchString, registrationTypes, and clientTypes filters', () => {
    const result = filterOAuthApps({
      apps: APPS,
      searchString: 'cli',
      registrationTypes: ['manual'],
      clientTypes: ['public'],
    })
    expect(result).toEqual([APPS[2]])
  })
})
