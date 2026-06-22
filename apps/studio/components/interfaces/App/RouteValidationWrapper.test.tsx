import { AuthClient } from '@supabase/auth-js'
import { afterEach, describe, expect, it } from 'vitest'

import { buildOrgNotFoundRedirectUrl } from './RouteValidationWrapper.utils'

function createStudioLikeAuthClient() {
  const store = new Map<string, string>()
  return new AuthClient({
    url: 'http://localhost/auth/v1',
    storageKey: 'supabase.dashboard.auth.token',
    detectSessionInUrl: true,
    skipAutoInitialize: true,
    storage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => void store.set(key, value),
      removeItem: (key) => void store.delete(key),
    },
  })
}

async function initializeAuthClientAt(path: string) {
  window.history.replaceState({}, '', path)
  return createStudioLikeAuthClient().initialize()
}

describe('buildOrgNotFoundRedirectUrl', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('does not produce a redirect URL that the auth client mistakes for a failed OAuth login', async () => {
    const redirectUrl = buildOrgNotFoundRedirectUrl('/org/last-visited-org', 'inaccessible-org')

    const { error } = await initializeAuthClientAt(redirectUrl)

    expect(error).toBeNull()
  })

  it('proves the auth client does choke on a reserved `error` query param (documents the trap)', async () => {
    const { error } = await initializeAuthClientAt('/org/foo?error=org_not_found&org=bar')

    expect(error?.message).toBe('Error in URL with unspecified error_description')
  })
})
