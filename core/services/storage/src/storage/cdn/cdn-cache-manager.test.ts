import { afterEach, describe, expect, it, vi } from 'vitest'
import { spyOnAbortSignalTimeout } from '../../test/utils/abort-signal'

type CdnConfig = {
  cdnPurgeEndpointURL?: string
  cdnPurgeEndpointKey?: string
}

async function importCdnCacheManager(config: CdnConfig = {}) {
  vi.resetModules()

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig(config)

  return import('./cdn-cache-manager')
}

describe('CdnCacheManager', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('sends a purge request for an existing object', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const { timeoutSignal, timeoutSpy } = spyOnAbortSignalTimeout()

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await new CdnCacheManager().purge({
      type: 'object',
      tenant: 'tenant-ref',
      bucket: 'bucket-id',
      objectName: 'folder/image.png',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [input, init] = fetchMock.mock.calls[0]
    const requestInit = init as RequestInit & { dispatcher?: unknown }
    const headers = requestInit.headers as Headers

    expect(input.toString()).toBe('https://cdn.example.com/stub/cache/purge')
    expect(requestInit.method).toBe('POST')
    expect(headers.get('authorization')).toBe('Bearer test-key')
    expect(headers.get('content-type')).toBe('application/json')
    expect(JSON.parse(requestInit.body as string)).toEqual({
      type: 'object',
      tenant: {
        ref: 'tenant-ref',
      },
      bucketId: 'bucket-id',
      objectName: 'folder/image.png',
    })
    expect(requestInit.dispatcher).toBeDefined()
    expect(requestInit.signal).toBe(timeoutSignal)
    expect(timeoutSpy).toHaveBeenCalledWith(10_000)
  })

  it('omits the authorization header when the purge endpoint key is not configured', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: undefined,
    })

    await new CdnCacheManager().purge({
      type: 'object',
      tenant: 'tenant-ref',
      bucket: 'bucket-id',
      objectName: 'folder/image.png',
    })

    const [, init] = fetchMock.mock.calls[0]
    const headers = (init as RequestInit).headers as Headers

    expect(headers.has('authorization')).toBe(false)
    expect(headers.get('content-type')).toBe('application/json')
  })

  it('wraps non-success purge responses and drains the response body', async () => {
    const cancel = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 503,
      body: {
        cancel,
      },
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await expect(
      new CdnCacheManager().purge({
        type: 'object',
        tenant: 'tenant-ref',
        bucket: 'bucket-id',
        objectName: 'folder/image.png',
      })
    ).rejects.toMatchObject({
      code: 'InternalError',
      httpStatusCode: 500,
      message: 'Error purging cache',
      originalError: expect.objectContaining({
        message: 'Request failed with status code 503',
      }),
    })

    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('wraps network failures from fetch', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error('socket hang up'))
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await expect(
      new CdnCacheManager().purge({
        type: 'object',
        tenant: 'tenant-ref',
        bucket: 'bucket-id',
        objectName: 'folder/image.png',
      })
    ).rejects.toMatchObject({
      code: 'InternalError',
      httpStatusCode: 500,
      message: 'Error purging cache',
      originalError: expect.objectContaining({
        message: 'socket hang up',
      }),
    })
  })

  it('wraps non-Error rejections from fetch', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue('socket hang up')
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await expect(
      new CdnCacheManager().purge({
        type: 'object',
        tenant: 'tenant-ref',
        bucket: 'bucket-id',
        objectName: 'folder/image.png',
      })
    ).rejects.toMatchObject({
      code: 'InternalError',
      httpStatusCode: 500,
      message: 'Error purging cache',
      originalError: expect.objectContaining({
        message: 'socket hang up',
      }),
    })
  })

  it('preserves a nested cause chain on the thrown error (e.g. dispatcher timeouts)', async () => {
    const cause = Object.assign(new Error('Connect Timeout Error'), {
      code: 'UND_ERR_CONNECT_TIMEOUT',
    })
    cause.name = 'ConnectTimeoutError'
    const fetchError = new TypeError('fetch failed', { cause })
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(fetchError)
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await expect(
      new CdnCacheManager().purge({
        type: 'object',
        tenant: 'tenant-ref',
        bucket: 'bucket-id',
        objectName: 'folder/image.png',
      })
    ).rejects.toMatchObject({
      code: 'InternalError',
      originalError: expect.objectContaining({
        name: 'TypeError',
        cause: expect.objectContaining({
          name: 'ConnectTimeoutError',
          code: 'UND_ERR_CONNECT_TIMEOUT',
        }),
      }),
    })
  })

  it('requires a CDN purge endpoint URL before sending a purge request', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: undefined,
      cdnPurgeEndpointKey: 'test-key',
    })

    await expect(
      new CdnCacheManager().purge({
        type: 'object',
        tenant: 'tenant-ref',
        bucket: 'bucket-id',
        objectName: 'folder/image.png',
      })
    ).rejects.toMatchObject({
      code: 'MissingParameter',
      message: 'Missing Required Parameter CDN_PURGE_ENDPOINT_URL is not set',
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a purge request for an entire bucket', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await new CdnCacheManager().purge({
      type: 'bucket',
      tenant: 'tenant-ref',
      bucket: 'bucket-id',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [input, init] = fetchMock.mock.calls[0]
    const requestInit = init as RequestInit
    const headers = requestInit.headers as Headers

    expect(input.toString()).toBe('https://cdn.example.com/stub/cache/purge')
    expect(requestInit.method).toBe('POST')
    expect(headers.get('authorization')).toBe('Bearer test-key')
    expect(JSON.parse(requestInit.body as string)).toEqual({
      type: 'bucket',
      tenant: {
        ref: 'tenant-ref',
      },
      bucketId: 'bucket-id',
    })
  })

  it('sends a purge request for an entire tenant', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await new CdnCacheManager().purge({
      type: 'tenant',
      tenant: 'tenant-ref',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [input, init] = fetchMock.mock.calls[0]
    const requestInit = init as RequestInit
    const headers = requestInit.headers as Headers

    expect(input.toString()).toBe('https://cdn.example.com/stub/cache/purge')
    expect(requestInit.method).toBe('POST')
    expect(headers.get('authorization')).toBe('Bearer test-key')
    expect(JSON.parse(requestInit.body as string)).toEqual({
      type: 'tenant',
      tenant: {
        ref: 'tenant-ref',
      },
    })
  })

  it('sends a purge request for object transformations', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await new CdnCacheManager().purge({
      type: 'object-transforms',
      tenant: 'tenant-ref',
      bucket: 'bucket-id',
      objectName: 'folder/image.png',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [input, init] = fetchMock.mock.calls[0]
    const requestInit = init as RequestInit
    const headers = requestInit.headers as Headers

    expect(input.toString()).toBe('https://cdn.example.com/stub/cache/purge')
    expect(requestInit.method).toBe('POST')
    expect(headers.get('authorization')).toBe('Bearer test-key')
    expect(JSON.parse(requestInit.body as string)).toEqual({
      type: 'object-transforms',
      tenant: {
        ref: 'tenant-ref',
      },
      bucketId: 'bucket-id',
      objectName: 'folder/image.png',
    })
  })

  it('sends a purge request for bucket transformations', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await new CdnCacheManager().purge({
      type: 'bucket-transforms',
      tenant: 'tenant-ref',
      bucket: 'bucket-id',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [input, init] = fetchMock.mock.calls[0]
    const requestInit = init as RequestInit
    const headers = requestInit.headers as Headers

    expect(input.toString()).toBe('https://cdn.example.com/stub/cache/purge')
    expect(requestInit.method).toBe('POST')
    expect(headers.get('authorization')).toBe('Bearer test-key')
    expect(JSON.parse(requestInit.body as string)).toEqual({
      type: 'bucket-transforms',
      tenant: {
        ref: 'tenant-ref',
      },
      bucketId: 'bucket-id',
    })
  })

  it('isConfigured returns true when CDN_PURGE_ENDPOINT_URL is set', async () => {
    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
    })

    expect(new CdnCacheManager().isConfigured()).toBe(true)
  })

  it('isConfigured returns false when CDN_PURGE_ENDPOINT_URL is not set', async () => {
    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: undefined,
    })

    expect(new CdnCacheManager().isConfigured()).toBe(false)
  })

  it('sends a purge request for tenant transformations', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const { CdnCacheManager } = await importCdnCacheManager({
      cdnPurgeEndpointURL: 'https://cdn.example.com/stub/cache',
      cdnPurgeEndpointKey: 'test-key',
    })

    await new CdnCacheManager().purge({
      type: 'tenant-transforms',
      tenant: 'tenant-ref',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [input, init] = fetchMock.mock.calls[0]
    const requestInit = init as RequestInit
    const headers = requestInit.headers as Headers

    expect(input.toString()).toBe('https://cdn.example.com/stub/cache/purge')
    expect(requestInit.method).toBe('POST')
    expect(headers.get('authorization')).toBe('Bearer test-key')
    expect(JSON.parse(requestInit.body as string)).toEqual({
      type: 'tenant-transforms',
      tenant: {
        ref: 'tenant-ref',
      },
    })
  })
})
