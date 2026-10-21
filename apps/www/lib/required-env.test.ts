import { afterEach, describe, expect, it, vi } from 'vitest'

import { requireEnvironmentVariables } from './required-env'

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('./changelog-entries-core.mjs', () => ({
  fetchChangelogEntryFilesFromTarball: vi.fn(),
  getPublishedChangelogEntries: vi.fn(),
}))
vi.mock('lib/notion', () => ({ queryDatabase: vi.fn() }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('required environment variables', () => {
  it('reports missing and blank names without exposing configured values', () => {
    expect(() =>
      requireEnvironmentVariables({ ABSENT: undefined, BLANK: '  ', PRESENT: 'private-value' })
    ).toThrow(
      'Missing environment variables: ABSENT, BLANK. ' +
        'Set them in apps/www/.env.local for local development and restart www. ' +
        'See https://github.com/supabase/supabase/blob/master/apps/www/README.md#environment-variables'
    )
    expect(() => requireEnvironmentVariables({ PRESENT: 'configured' })).not.toThrow()
  })

  it('checks changelog credentials before requesting GitHub', async () => {
    for (const key of [
      'CHANGELOG_SYNC_APP_ID',
      'CHANGELOG_SYNC_APP_INSTALLATION_ID',
      'CHANGELOG_SYNC_APP_PRIVATE_KEY',
    ])
      vi.stubEnv(key, '')
    const { getChangelogEntries } = await import('./changelog-repo')
    const { fetchChangelogEntryFilesFromTarball } = await import('./changelog-entries-core.mjs')

    await expect(getChangelogEntries()).rejects.toThrow('CHANGELOG_SYNC_APP_ID')
    expect(fetchChangelogEntryFilesFromTarball).not.toHaveBeenCalled()
  })

  it('reports missing Events credentials and propagates Notion failures', async () => {
    const { getNotionEvents } = await import('./events')
    const { queryDatabase } = await import('lib/notion')
    vi.stubEnv('NOTION_EVENTS_API_KEY', '')
    await expect(getNotionEvents()).rejects.toThrow('NOTION_EVENTS_API_KEY')
    expect(queryDatabase).not.toHaveBeenCalled()

    vi.stubEnv('NOTION_EVENTS_API_KEY', 'configured')
    vi.mocked(queryDatabase).mockRejectedValueOnce(new Error('Notion unavailable'))
    await expect(getNotionEvents()).rejects.toThrow('Notion unavailable')
  })

  it.each([
    'submit-form-newsletter',
    'submit-form-security-newsletter',
    'submit-form-subprocessor-updates',
  ])('%s returns HTTP 500 without credentials', async (route) => {
    vi.stubEnv('CUSTOMERIO_SITE_ID', '')
    vi.stubEnv('CUSTOMERIO_API_KEY', '')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { POST } = await import(`../app/api-v2/${route}/route.tsx`)
    const response = await POST(
      new Request('http://localhost/api-v2/' + route, {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', firstName: 'Test', lastName: 'User' }),
      })
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: expect.stringContaining('CUSTOMERIO_API_KEY') })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('uses the same configuration errors for both Customer.io clients', async () => {
    const { CustomerioAppClient, CustomerioTrackClient } = await import('./customerio')

    expect(() => new CustomerioTrackClient('', '')).toThrow(
      'Missing environment variables: CUSTOMERIO_SITE_ID, CUSTOMERIO_API_KEY.'
    )
    expect(() => new CustomerioAppClient('')).toThrow(
      'Missing environment variables: CUSTOMERIO_APP_API_KEY.'
    )
    expect(() => new CustomerioAppClient('configured')).not.toThrow()
  })
})
