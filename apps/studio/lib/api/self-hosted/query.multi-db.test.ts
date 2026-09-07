import { beforeEach, describe, expect, it, vi } from 'vitest'

// executeQuery must use caller-supplied x-connection-encrypted when present
// so that multi-database routing works through the SQL editor route.
vi.mock('./util', () => ({
  assertSelfHosted: vi.fn(),
  encryptString: (s: string) => `single-db-encrypted:${s}`,
  getConnectionString: ({ readOnly }: { readOnly: boolean }) =>
    `postgresql://postgres:default-pass@db:5432/postgres${readOnly ? '?read_only=1' : ''}`,
  decryptString: (s: string) => s.replace('single-db-encrypted:', ''),
}))

vi.mock('@/lib/constants', () => ({
  PG_META_URL: 'http://localhost:8080',
  IS_PLATFORM: false,
}))

function makeSuccessResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('executeQuery — multi-database x-connection-encrypted routing', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    // Spy on globalThis.fetch — this overrides MSW's interceptor at the call site
    fetchSpy = vi.fn().mockResolvedValue(makeSuccessResponse([{ result: 1 }]))
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the single-DB connection string when no x-connection-encrypted header is supplied', async () => {
    const { executeQuery } = await import('./query')
    await executeQuery({ query: 'SELECT 1' })

    expect(fetchSpy).toHaveBeenCalled()
    const [, init] = fetchSpy.mock.calls[0]
    const headers = new Headers(init.headers)
    expect(headers.get('x-connection-encrypted')).toMatch(/^single-db-encrypted:/)
  })

  it('respects caller-supplied x-connection-encrypted (multi-DB routing)', async () => {
    const { executeQuery } = await import('./query')
    const callerEncrypted = 'encrypted:postgresql://postgres:alpha-pass@db-alpha:5432/postgres'

    await executeQuery({
      query: 'SELECT 1',
      headers: { 'x-connection-encrypted': callerEncrypted },
    })

    expect(fetchSpy).toHaveBeenCalled()
    const [, init] = fetchSpy.mock.calls[0]
    const headers = new Headers(init.headers)
    const received = headers.get('x-connection-encrypted')
    expect(received).toBe(callerEncrypted)
    expect(received).not.toMatch(/^single-db-encrypted:/)
  })

  it('posts the query body to PG_META_URL/query', async () => {
    const { executeQuery } = await import('./query')
    await executeQuery({ query: 'SELECT 42' })

    expect(fetchSpy).toHaveBeenCalled()
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('http://localhost:8080/query')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.query).toBe('SELECT 42')
  })

  it('forwards query parameters when provided', async () => {
    const { executeQuery } = await import('./query')
    await executeQuery({ query: 'SELECT $1', parameters: [42] })

    expect(fetchSpy).toHaveBeenCalled()
    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.parameters).toEqual([42])
  })

  it('returns error shape on non-200 response', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ message: 'syntax error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { executeQuery } = await import('./query')
    const result = await executeQuery({ query: 'INVALID SQL' })
    expect(result.error).toBeDefined()
  })
})
