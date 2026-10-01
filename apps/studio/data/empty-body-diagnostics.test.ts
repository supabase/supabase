import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({ isPlatform: true }))
const sentry = vi.hoisted(() => ({ captureMessage: vi.fn(), captureException: vi.fn() }))

vi.mock('@sentry/nextjs', () => sentry)
vi.mock('common', () => ({
  get IS_PLATFORM() {
    return platform.isPlatform
  },
  getAccessToken: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ API_URL: 'http://localhost' }))
vi.mock('@/lib/helpers', () => ({ uuidv4: () => 'probe-uuid' }))

// Import after mocks are set up
const { reportEmptyBodyResponse, templateEndpointPath } = await import('./empty-body-diagnostics')
const { client } = await import('./fetchers')

const SECRET = 'service_role_secret_value'

function emptyGet(path: string, init?: RequestInit) {
  const request = new Request(`http://localhost${path}?include=secret`, {
    headers: { 'X-Request-Id': 'original-uuid', Authorization: 'Bearer token' },
    ...init,
  })
  const response = new Response(null, {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private' },
  })
  return { request, response }
}

function lastCapture() {
  const [message, context] = sentry.captureMessage.mock.lastCall ?? []
  return { message, context }
}

describe('templateEndpointPath', () => {
  it.each([
    ['/platform/projects/abcdefghijklmnopqrst/settings', '/platform/projects/{ref}/settings'],
    ['/platform/organizations/my-org/members', '/platform/organizations/{slug}/members'],
    [
      '/v1/projects/abcdefghijklmnopqrst/branches/dev/config',
      '/v1/projects/{ref}/branches/{branch}/config',
    ],
    ['/platform/pg-meta/abcdefghijklmnopqrst/tables', '/platform/pg-meta/{id}/tables'],
    [
      '/platform/organizations/{slug}/members/3f2b8c1e-9d4a-4e6b-8c7d-1a2b3c4d5e6f',
      '/platform/organizations/{slug}/members/{id}',
    ],
    ['/platform/projects/{ref}/backups/12345', '/platform/projects/{ref}/backups/{id}'],
    ['/platform/projects/{ref}/api-keys?reveal=true', '/platform/projects/{ref}/api-keys'],
    ['/platform/profile#section', '/platform/profile'],
    ['/platform/projects/{ref}/custom-hostname', '/platform/projects/{ref}/custom-hostname'],
    ['/platform/projects', '/platform/projects'],
    ['/platform/constructor/toString', '/platform/constructor/toString'],
    ['', ''],
  ])('templates %s as %s', (path, expected) => {
    expect(templateEndpointPath(path)).toBe(expected)
  })
})

describe('reportEmptyBodyResponse', () => {
  beforeEach(() => {
    platform.isPlatform = true
    sentry.captureMessage.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('reports with probe_has_body "true" when a no-store refetch returns a body', async () => {
    const fetchMock = vi.fn<(request: Request) => Promise<Response>>(
      async () => new Response(JSON.stringify({ secret: SECRET }))
    )
    vi.stubGlobal('fetch', fetchMock)
    const { request, response } = emptyGet('/platform/projects/abcdefghijklmnopqrst/a')

    await reportEmptyBodyResponse({ request, response, schemaPath: '/platform/projects/{ref}/a' })

    const probeRequest = fetchMock.mock.lastCall?.[0]
    expect(probeRequest).toBeInstanceOf(Request)
    expect(probeRequest?.cache).toBe('no-store')
    expect(probeRequest?.headers.get('X-Request-Id')).toBe('probe-uuid')

    const { message, context } = lastCapture()
    expect(message).toBe('Empty response body on successful API request')
    expect(context).toMatchObject({
      level: 'warning',
      fingerprint: ['empty-body-response', '/platform/projects/{ref}/a'],
      tags: {
        endpoint: '/platform/projects/{ref}/a',
        probe_has_body: 'true',
        empty_body_diagnostic: 'true',
      },
      extra: {
        method: 'GET',
        status: 200,
        request_id: 'original-uuid',
        probe_request_id: 'probe-uuid',
        header_content_type: 'application/json',
        header_cache_control: 'private',
        header_etag: null,
        probe_status: 200,
        probe_body_length: JSON.stringify({ secret: SECRET }).length,
      },
    })
    expect(JSON.stringify(sentry.captureMessage.mock.calls)).not.toContain(SECRET)
  })

  it('reports probe_has_body "false" when the refetch is also empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null))
    )
    const { request, response } = emptyGet('/platform/b')

    await reportEmptyBodyResponse({ request, response, schemaPath: '/platform/b' })

    expect(lastCapture().context).toMatchObject({
      tags: { probe_has_body: 'false' },
      extra: { probe_body_length: 0 },
    })
  })

  it('reports probe_has_body "error" and does not throw when the refetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Load failed')))
    )
    const { request, response } = emptyGet('/platform/c')

    await expect(
      reportEmptyBodyResponse({ request, response, schemaPath: '/platform/c' })
    ).resolves.toBeUndefined()

    expect(lastCapture().context).toMatchObject({
      tags: { probe_has_body: 'error' },
      extra: { probe_error: 'TypeError' },
    })
  })

  it('reports at most once per endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null))
    )

    for (const ref of ['abcdefghijklmnopqrst', 'tsrqponmlkjihgfedcba']) {
      const { request, response } = emptyGet(`/platform/projects/${ref}/d`)
      await reportEmptyBodyResponse({ request, response, schemaPath: '/platform/projects/{ref}/d' })
    }

    expect(sentry.captureMessage).toHaveBeenCalledTimes(1)
  })

  it('skips non-GET requests', async () => {
    const fetchMock = vi.fn(async () => new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    const { request, response } = emptyGet('/platform/e', { method: 'POST' })

    await reportEmptyBodyResponse({ request, response, schemaPath: '/platform/e' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('skips when not on platform', async () => {
    platform.isPlatform = false
    const fetchMock = vi.fn(async () => new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    const { request, response } = emptyGet('/platform/f')

    await reportEmptyBodyResponse({ request, response, schemaPath: '/platform/f' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('does not throw when Sentry throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null))
    )
    sentry.captureMessage.mockImplementation(() => {
      throw new Error('sentry down')
    })
    const { request, response } = emptyGet('/platform/g')

    await expect(
      reportEmptyBodyResponse({ request, response, schemaPath: '/platform/g' })
    ).resolves.toBeUndefined()
  })
})

describe('openapi-fetch client — empty GET 200', () => {
  beforeEach(() => {
    platform.isPlatform = true
    sentry.captureMessage.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('still resolves with {} and reports the templated schema path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 }))
    )

    const { data, error } = await client.GET('/platform/projects/{ref}/settings', {
      params: { path: { ref: 'abcdefghijklmnopqrst' } },
    })

    expect(error).toBeUndefined()
    expect(data).toEqual({})
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: { endpoint: '/platform/projects/{ref}/settings' },
    })
  })

  it('reports an empty GET 200 that carries Content-Length: 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200, headers: { 'Content-Length': '0' } }))
    )

    const { data } = await client.GET('/platform/organizations/{slug}/members', {
      params: { path: { slug: 'my-org' } },
    })

    expect(data).toEqual({})
    await vi.waitFor(() => expect(sentry.captureMessage).toHaveBeenCalledTimes(1))
    expect(lastCapture().context).toMatchObject({
      tags: { endpoint: '/platform/organizations/{slug}/members' },
      extra: { header_content_length: '0' },
    })
  })
})
