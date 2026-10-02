import { Readable } from 'node:stream'

const requestMock = vi.hoisted(() => vi.fn())

vi.mock('undici', () => ({ request: requestMock }))

import {
  downloadArchivedProfile,
  fetchArchivedProfiles,
  fetchPprofStream,
  resolvePprofAdminUrl,
  triggerPprofCapture,
} from './client-http'

async function readStream(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = []
  for await (const chunk of stream as AsyncIterable<Buffer | string | Uint8Array>) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

function mockResponse(
  content: Buffer | Readable | string,
  options: {
    statusCode?: number
    statusText?: string
    headers?: Record<string, string | string[]>
  } = {}
) {
  const body = content instanceof Readable ? content : Readable.from([content])
  Object.assign(body, {
    json: async () => JSON.parse(await readStream(body)),
  })
  return {
    body,
    headers: options.headers ?? {},
    statusCode: options.statusCode ?? 200,
    statusText: options.statusText ?? 'OK',
  }
}

describe('pprof admin HTTP client', () => {
  afterEach(() => requestMock.mockReset())

  it('preserves ADMIN_URL path prefixes', () => {
    expect(
      resolvePprofAdminUrl('https://example.com/admin/internal', '/debug/pprof/profile', {
        seconds: 60,
      })
    ).toBe('https://example.com/admin/internal/debug/pprof/profile?seconds=60')
  })

  it.each([
    ['cpu', 'profile'],
    ['heap', 'heap'],
  ] as const)('triggers Watt manual %s captures for later download', async (type, path) => {
    const result = {
      scheduled: true as const,
      class: 'manual' as const,
      kind: type,
      message: 'Profile capture scheduled; use list and download to retrieve it',
    }
    requestMock.mockResolvedValue(mockResponse(JSON.stringify(result), { statusCode: 202 }))

    await expect(
      triggerPprofCapture({
        adminUrl: 'https://example.com/admin',
        apiKey: 'secret',
        type,
        seconds: 90,
      })
    ).resolves.toEqual(result)
    expect(requestMock).toHaveBeenCalledWith(
      `https://example.com/admin/debug/pprof/${path}?seconds=90`,
      {
        headers: { Accept: 'application/json', ApiKey: 'secret' },
        method: 'GET',
      }
    )
  })

  it('requests JSON heap snapshots without a duration', async () => {
    requestMock.mockResolvedValue(mockResponse('{}'))

    const response = await fetchPprofStream({
      adminUrl: 'https://example.com/admin',
      apiKey: 'secret',
      type: 'heap-snapshot',
    })

    const url = 'https://example.com/admin/debug/pprof/heap-snapshot'
    expect(requestMock).toHaveBeenCalledWith(url, {
      headers: { Accept: 'application/json', ApiKey: 'secret' },
      method: 'GET',
    })
    expect(await readStream(response.stream)).toBe('{}')
  })

  it('lists and downloads stored profiles', async () => {
    const key = 'v1/auto/capture/cpu/profile.pprof.gz'
    requestMock
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ profiles: [], cursor: 'next' })))
      .mockResolvedValueOnce(
        mockResponse('stored-profile', {
          headers: { 'content-disposition': 'attachment; filename="profile.pprof.gz"' },
        })
      )

    expect(
      await fetchArchivedProfiles({
        adminUrl: 'https://example.com/admin',
        apiKey: 'secret',
        class: 'auto',
        kind: 'cpu',
        date: '2026-07-13',
        limit: 20,
      })
    ).toEqual({ profiles: [], cursor: 'next' })
    const download = await downloadArchivedProfile({
      adminUrl: 'https://example.com/admin',
      apiKey: 'secret',
      key,
    })
    expect(await readStream(download.stream)).toBe('stored-profile')
    expect(download.contentDisposition).toBe('attachment; filename="profile.pprof.gz"')

    expect(requestMock.mock.calls.map(([url]) => url)).toEqual([
      'https://example.com/admin/debug/pprof/profiles?class=auto&kind=cpu&date=2026-07-13&limit=20',
      'https://example.com/admin/debug/pprof/profiles/download?key=v1%2Fauto%2Fcapture%2Fcpu%2Fprofile.pprof.gz',
    ])
  })

  it('caps error response bodies', async () => {
    requestMock.mockResolvedValue(
      mockResponse('x'.repeat(6000), { statusCode: 502, statusText: 'Bad Gateway' })
    )

    await expect(
      fetchPprofStream({
        adminUrl: 'https://example.com/admin',
        apiKey: 'secret',
        type: 'heap-snapshot',
      })
    ).rejects.toThrow(/Pprof admin request failed: HTTP 502 Bad Gateway: .*\[truncated\]/)
  })

  it('destroys an error response whose first chunk exactly fills the limit', async () => {
    const body = Readable.from([Buffer.alloc(4096, 'x'), Buffer.from('more')])
    requestMock.mockResolvedValue(mockResponse(body, { statusCode: 502 }))

    await expect(
      fetchPprofStream({
        adminUrl: 'https://example.com/admin',
        apiKey: 'secret',
        type: 'heap-snapshot',
      })
    ).rejects.toThrow(/\[truncated\]/)
    expect(body.destroyed).toBe(true)
  })
})
