import type { OAuthClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { filterOAuthApps } from '@/components/interfaces/Auth/OAuthApps/oauthApps.utils'

const makeApp = (overrides: Partial<OAuthClient>) =>
  ({
    client_id: 'client-id-default',
    client_name: 'Default App',
    registration_type: 'manual',
    client_type: 'public',
    ...overrides,
  }) as OAuthClient

const apps = [
  makeApp({
    client_id: 'acme-123',
    client_name: 'Acme Dashboard',
    registration_type: 'manual',
    client_type: 'confidential',
  }),
  makeApp({
    client_id: 'xyz-789',
    client_name: 'Zeta CLI',
    registration_type: 'dynamic',
    client_type: 'public',
  }),
  makeApp({ client_id: 'nameless-1', client_name: undefined, registration_type: 'dynamic' }),
]

describe('filterOAuthApps', () => {
  it('returns every app when no filters are set', () => {
    expect(filterOAuthApps({ apps })).toEqual(apps)
  })

  it('treats empty filter lists as no filter', () => {
    expect(filterOAuthApps({ apps, registrationTypes: [], clientTypes: [] })).toEqual(apps)
  })

  it('matches the search string against the app name, ignoring case', () => {
    expect(filterOAuthApps({ apps, searchString: 'ACME' }).map((a) => a.client_id)).toEqual([
      'acme-123',
    ])
  })

  it('matches the search string against the client id', () => {
    expect(filterOAuthApps({ apps, searchString: 'xyz' }).map((a) => a.client_id)).toEqual([
      'xyz-789',
    ])
  })

  it('excludes apps with no name or id that match the search string', () => {
    expect(filterOAuthApps({ apps, searchString: 'nothing-matches' })).toEqual([])
  })

  it('filters by registration type', () => {
    expect(
      filterOAuthApps({ apps, registrationTypes: ['dynamic'] }).map((a) => a.client_id)
    ).toEqual(['xyz-789', 'nameless-1'])
  })

  it('filters by client type', () => {
    expect(
      filterOAuthApps({ apps, clientTypes: ['confidential'] }).map((a) => a.client_id)
    ).toEqual(['acme-123'])
  })

  it('applies search and type filters together', () => {
    expect(
      filterOAuthApps({
        apps,
        searchString: 'zeta',
        registrationTypes: ['dynamic'],
        clientTypes: ['confidential'],
      })
    ).toEqual([])
  })
})
