import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { ErrorCode } from '@internal/errors'
import Fastify, { type FastifyRequest } from 'fastify'
import { Readable } from 'stream'
import { blobResponse } from '../../http/plugins/blob-response'
import { errorSchema } from '../../http/schemas/error'
import { spyOnAbortSignalTimeout } from '../../test/utils/abort-signal'
import type { StorageBackendAdapter } from '../backend'

const EXHAUSTED_RETRY_BACKOFF_MS = 50 + 100 + 200 + 400 + 800
const REQUEST_ABORTED_RESPONSE = {
  error: 'Request aborted',
  message: 'Request aborted',
  statusCode: '499',
  code: ErrorCode.Aborted,
} as const

async function readStream(stream: unknown) {
  const chunks: Buffer[] = []

  for await (const chunk of stream as AsyncIterable<Buffer | string | Uint8Array>) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk))
      continue
    }

    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString('utf8')
}

async function loadRendererModule(
  overrides?: {
    imgProxyHttpKeepAlive?: number
    imgProxyHttpMaxSockets?: number
    imgProxyRequestTimeout?: number
    imgProxyURL?: string
    responseStaleWhileRevalidate?: number
    responseStaleIfError?: number
  },
  options: { mockUndici?: boolean } = {}
) {
  vi.resetModules()

  if (options.mockUndici !== false) {
    class MockAgent {
      compose(...handlers: unknown[]) {
        return { __dispatcher: true, handlers }
      }
    }

    vi.doMock('undici', () => ({
      Agent: MockAgent,
      interceptors: {
        retry: vi.fn((opts: unknown) => ({ __retryOpts: opts })),
      },
    }))
  }

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    imgProxyHttpMaxSockets: 0,
    imgProxyRequestTimeout: 30,
    imgProxyURL: 'https://imgproxy.example.test/base',
    ...overrides,
  })

  return import('./image')
}

function createBackend(privateURL = 'https://origin.example/assets/cat.png?token=a b') {
  return {
    headObject: vi.fn().mockResolvedValue({
      cacheControl: 'max-age=3600',
      contentLength: 123,
      eTag: '"source-etag"',
      lastModified: new Date('2022-10-01T00:00:00.000Z'),
      mimetype: 'image/jpeg',
      size: 123,
    }),
    privateAssetUrl: vi.fn().mockResolvedValue(privateURL),
  } as unknown as StorageBackendAdapter
}

function createRequest(headers: FastifyRequest['headers'] = {}) {
  return { headers } as FastifyRequest
}

function createReply() {
  const reply = {
    header: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  }

  return reply
}

function createRenderOptions(signal = new AbortController().signal) {
  return {
    bucket: 'bucket',
    key: 'folder/cat.png',
    signal,
    version: 'version',
  }
}

function stubSuccessfulImageFetch(headers: Record<string, string> = {}) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response('rendered-body', {
      headers: {
        'content-length': '13',
        'content-type': 'image/webp',
        ...headers,
      },
    })
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function expectMappedImgproxyError(
  status: number,
  body: string,
  expected: Record<string, unknown>
) {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status })))

  const { ImageRenderer } = await loadRendererModule()

  await expect(
    new ImageRenderer(createBackend('local:///tmp/cat.png')).getAsset(
      createRequest(),
      createRenderOptions()
    )
  ).rejects.toMatchObject(expected)
}

async function waitForCondition(condition: () => boolean) {
  const deadline = Date.now() + 500

  while (Date.now() < deadline) {
    if (condition()) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  throw new Error('Timed out waiting for condition')
}

async function useUndiciMockAgent() {
  const actualUndici = await vi.importActual<typeof import('undici')>('undici')
  vi.stubGlobal('fetch', actualUndici.fetch)

  let mockAgent: import('undici').MockAgent | undefined

  vi.doMock('undici', async () => {
    const actual = await vi.importActual<typeof import('undici')>('undici')
    mockAgent = new actual.MockAgent()
    mockAgent.disableNetConnect()

    const Agent = vi.fn(function () {
      return mockAgent
    })

    return {
      ...actual,
      Agent,
    }
  })

  return {
    async close() {
      await mockAgent?.close()
    },
    getMockAgent() {
      if (!mockAgent) {
        throw new Error('MockAgent has not been created')
      }

      return mockAgent
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.doUnmock('undici')
  vi.useRealTimers()
})

describe('ImageRenderer gravity transformations', () => {
  const directionalGravityCases = [
    ['no', undefined, undefined, 'gravity:no'],
    ['so', 0.25, 0.75, 'gravity:so:0.25:0.75'],
    ['ea', 12, undefined, 'gravity:ea:12:0'],
    ['we', undefined, 12, 'gravity:we:0:12'],
    ['noea', -12, 4, 'gravity:noea:-12:4'],
    ['nowe', 0, 0, 'gravity:nowe:0:0'],
    ['soea', 0.25, 12, 'gravity:soea:0.25:12'],
    ['sowe', -0.25, -0.5, 'gravity:sowe:-0.25:-0.5'],
    ['ce', undefined, undefined, 'gravity:ce'],
  ] as const

  for (const [gravity, xOffset, yOffset, expected] of directionalGravityCases) {
    it(`emits directional gravity ${gravity}`, async () => {
      const { ImageRenderer } = await loadRendererModule()

      expect(
        ImageRenderer.applyTransformation({
          gravity,
          x_offset: xOffset,
          y_offset: yOffset,
        })
      ).toEqual([expected])
    })
  }

  it('emits smart gravity without coordinates and ignores supplied offsets', async () => {
    const { ImageRenderer } = await loadRendererModule()

    expect(
      ImageRenderer.applyTransformation({ gravity: 'sm', x_offset: 12, y_offset: -4 })
    ).toEqual(['gravity:sm'])
  })

  it.each([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ])('accepts focal point boundary coordinates %s:%s', async (xOffset, yOffset) => {
    const { ImageRenderer } = await loadRendererModule()

    expect(
      ImageRenderer.applyTransformation({
        gravity: 'fp',
        x_offset: xOffset,
        y_offset: yOffset,
      })
    ).toEqual([`gravity:fp:${xOffset}:${yOffset}`])
  })

  it('rejects missing, non-finite, and out-of-range focal point coordinates', async () => {
    const { ImageRenderer } = await loadRendererModule()
    const invalidCoordinates = [
      [undefined, 0.5],
      [0.5, undefined],
      [Number.NaN, 0.5],
      [0.5, Number.POSITIVE_INFINITY],
      [-0.1, 0.5],
      [0.5, 1.1],
    ] as const

    for (const [xOffset, yOffset] of invalidCoordinates) {
      expect(() =>
        ImageRenderer.applyTransformation({
          gravity: 'fp',
          x_offset: xOffset,
          y_offset: yOffset,
        })
      ).toThrow('Focal point requires x and y coordinates within 0-1 range')
    }
  })

  describe('signed gravity transformations', () => {
    beforeEach(() => {
      stubSuccessfulImageFetch()
    })

    it.each([
      [{ gravity: 'fp', x_offset: 0.5, y_offset: 0.75 }, 'gravity:fp:0.5:0.75'],
      [{ gravity: 'no', x_offset: 12, y_offset: -4 }, 'gravity:no:12:-4'],
      [{ gravity: 'sm', x_offset: 12, y_offset: -4 }, 'gravity:sm'],
      [{ gravity: 'ce' }, 'gravity:ce'],
    ] as const)('round-trips transformation %s', async (options, expected) => {
      const { ImageRenderer } = await loadRendererModule()
      const signedTransformations = ImageRenderer.applyTransformation(options, true).join(',')
      const renderer = new ImageRenderer(createBackend()).setTransformationsFromString(
        signedTransformations
      )

      const result = await renderer.getAsset(createRequest(), createRenderOptions())

      expect(signedTransformations).toBe(expected)
      expect(result.transformations).toEqual([expected])
      await expect(readStream(result.body)).resolves.toBe('rendered-body')
    })

    it('ignores non-finite compound offsets', async () => {
      const { ImageRenderer } = await loadRendererModule()
      const renderer = new ImageRenderer(createBackend()).setTransformationsFromString(
        'gravity:no:NaN:Infinity'
      )

      const result = await renderer.getAsset(createRequest(), createRenderOptions())

      expect(result.transformations).toEqual(['gravity:no'])
      await expect(readStream(result.body)).resolves.toBe('rendered-body')
    })
  })
})

describe('ImageRenderer fetch client', () => {
  it('fetches the transformed image with native fetch and maps the streamed response metadata', async () => {
    const fetchMock = stubSuccessfulImageFetch({
      'last-modified': 'Wed, 12 Oct 2022 11:17:02 GMT',
    })

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend()).setTransformations({
      format: 'webp',
      width: 100,
    })

    const result = await renderer.getAsset(
      createRequest({ accept: 'image/avif,image/webp' }),
      createRenderOptions()
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'https://imgproxy.example.test/base/public/width:100/resizing_type:fill/format:webp/plain/https%3A%2F%2Forigin.example%2Fassets%2Fcat.png%3Ftoken%3Da%20b'
    )
    expect(init).toMatchObject({
      method: 'GET',
      signal: expect.any(AbortSignal),
    })
    expect(init?.headers).toBeInstanceOf(Headers)
    expect((init?.headers as Headers).get('accept')).toBe('image/avif,image/webp')

    await expect(readStream(result.body)).resolves.toBe('rendered-body')
    expect(result.metadata).toMatchObject({
      cacheControl: 'max-age=3600',
      contentLength: 13,
      eTag: '"source-etag"',
      httpStatusCode: 200,
      lastModified: new Date('2022-10-12T11:17:02.000Z'),
      mimetype: 'image/webp',
      size: 13,
    })
    expect(result.transformations).toEqual(['width:100', 'resizing_type:fill', 'format:webp'])
  })

  it('coerces numeric string object metadata and passes through string metadata for head and info renderers', async () => {
    await loadRendererModule()
    const [{ HeadRenderer }, { InfoRenderer }] = await Promise.all([
      import('./head'),
      import('./info'),
    ])
    const object = {
      bucket_id: 'bucket',
      created_at: '2022-10-01T00:00:00.000Z',
      id: 'object-id',
      metadata: {
        cacheControl: 'max-age=3600',
        contentLength: '123',
        contentRange: 'bytes 0-122/123',
        eTag: '"source-etag"',
        httpStatusCode: '206',
        lastModified: '2022-10-12T11:17:02.000Z',
        mimetype: 'image/webp',
        size: '123',
        xRobotsTag: 'noindex',
      },
      name: 'folder/cat.png',
      updated_at: '2022-10-12T11:17:02.000Z',
      user_metadata: { owner: 'test-user' },
      version: 'version',
    }

    const headAsset = await new HeadRenderer().getAsset(
      { headers: {}, query: {} } as never,
      {
        ...createRenderOptions(),
        object,
      } as never
    )
    const infoAsset = await new InfoRenderer().getAsset(
      { headers: {}, query: {} } as never,
      {
        ...createRenderOptions(),
        object,
      } as never
    )

    expect(headAsset.metadata).toMatchObject({
      contentLength: 123,
      contentRange: 'bytes 0-122/123',
      httpStatusCode: 206,
      size: 123,
      xRobotsTag: 'noindex',
    })
    expect(infoAsset.body).toMatchObject({
      content_type: 'image/webp',
      size: 123,
    })
  })

  it('throws NoSuchKey when the head renderer has no object to render', async () => {
    await loadRendererModule()
    const { HeadRenderer } = await import('./head')

    await expect(
      new HeadRenderer().getAsset(
        { headers: {}, query: {} } as never,
        createRenderOptions() as never
      )
    ).rejects.toMatchObject({
      code: ErrorCode.NoSuchKey,
      error: 'not_found',
      httpStatusCode: 404,
      message: 'Object not found',
    })
  })

  it('drops invalid object lastModified metadata for head renderer responses', async () => {
    await loadRendererModule()
    const { HeadRenderer } = await import('./head')
    const headAsset = await new HeadRenderer().getAsset(
      { headers: {}, query: {} } as never,
      {
        ...createRenderOptions(),
        object: {
          metadata: {
            lastModified: 'not-a-date',
          },
        },
      } as never
    )

    expect(headAsset.metadata.lastModified).toBeUndefined()
  })

  it('does not emit empty Cache-Control headers when metadata has no cache control', async () => {
    await loadRendererModule()
    const [{ Renderer }, { HeadRenderer }, { InfoRenderer }] = await Promise.all([
      import('./renderer'),
      import('./head'),
      import('./info'),
    ])

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {},
        }
      }
    }

    const assetReply = createReply()
    await new TestRenderer().render(createRequest(), assetReply as never, createRenderOptions())

    expect(assetReply.header).not.toHaveBeenCalledWith('Cache-Control', expect.anything())

    const headReply = createReply()
    await new HeadRenderer().render(
      { headers: {}, query: {} } as never,
      headReply as never,
      {
        ...createRenderOptions(),
        object: {
          metadata: {},
        },
      } as never
    )

    expect(headReply.header).not.toHaveBeenCalledWith('Cache-Control', expect.anything())

    const infoReply = createReply()
    await new InfoRenderer().render(
      { headers: {}, query: {} } as never,
      infoReply as never,
      {
        ...createRenderOptions(),
        object: {
          bucket_id: 'bucket',
          created_at: '2022-10-01T00:00:00.000Z',
          id: 'object-id',
          metadata: {},
          name: 'folder/cat.png',
          updated_at: '2022-10-12T11:17:02.000Z',
          user_metadata: null,
          version: 'version',
        },
      } as never
    )

    expect(infoReply.header).not.toHaveBeenCalledWith('Cache-Control', expect.anything())
  })

  it('serializes backend 404s through the shared error schema', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    class MissingAssetRenderer extends Renderer {
      async getAsset(): Promise<never> {
        throw Object.assign(new Error('missing asset'), {
          $metadata: { httpStatusCode: 404 },
        })
      }
    }

    const app = Fastify()
    app.addSchema(errorSchema)
    app.get(
      '/missing',
      {
        schema: {
          response: {
            '4xx': { $ref: 'errorSchema#' },
          },
        },
      },
      async (request, reply) =>
        new MissingAssetRenderer().render(request, reply, createRenderOptions())
    )

    try {
      const response = await app.inject('/missing')

      expect(response.statusCode).toBe(400)
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.json()).toEqual({
        error: 'Not found',
        message: 'The resource was not found',
        statusCode: '404',
        code: ErrorCode.NoSuchKey,
      })
    } finally {
      await app.close()
    }
  })

  it('serializes caller aborts through the shared error schema', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {},
        }
      }
    }

    const controller = new AbortController()
    controller.abort()

    const app = Fastify()
    app.addSchema(errorSchema)
    app.get(
      '/aborted',
      {
        schema: {
          response: {
            '4xx': { $ref: 'errorSchema#' },
          },
        },
      },
      async (request, reply) =>
        new TestRenderer().render(request, reply, createRenderOptions(controller.signal))
    )

    try {
      const response = await app.inject('/aborted')

      expect(response.statusCode).toBe(499)
      expect(response.json()).toEqual(REQUEST_ABORTED_RESPONSE)
    } finally {
      await app.close()
    }
  })

  it('streams Blob asset bodies instead of sending object payloads to Fastify', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    class BlobRenderer extends Renderer {
      async getAsset() {
        return {
          body: new Blob(['blob-body']),
          metadata: {
            contentLength: 9,
            mimetype: 'text/plain',
          },
        }
      }
    }

    const app = Fastify()
    await app.register(blobResponse)
    app.get('/blob', async (request, reply) =>
      new BlobRenderer().render(request, reply, createRenderOptions())
    )

    try {
      const response = await app.inject('/blob')

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('text/plain')
      expect(response.body).toBe('blob-body')
    } finally {
      await app.close()
    }
  })

  it('omits nullish Cache-Control parts when only shared cache max-age applies', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      protected sMaxAge = 60

      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            eTag: '"source-etag"',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(
      createRequest({ 'if-none-match': '"source-etag"' }),
      reply as never,
      createRenderOptions()
    )

    expect(reply.header).toHaveBeenCalledWith('Cache-Control', 's-maxage=60')
    expect(reply.header).not.toHaveBeenCalledWith(
      'Cache-Control',
      expect.stringContaining('undefined')
    )
  })

  it('does not duplicate s-maxage already present in the object Cache-Control', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      protected sMaxAge = 120

      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            eTag: '"current-etag"',
            cacheControl: 'public, max-age=3600, s-maxage=999',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(
      createRequest({ 'if-none-match': '"stale-etag"' }),
      reply as never,
      createRenderOptions()
    )

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, s-maxage=999, stale-while-revalidate=30'
    )
  })

  it('does not add stale-while-revalidate/stale-if-error when unconfigured', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            cacheControl: 'public, max-age=3600',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(createRequest(), reply as never, createRenderOptions())

    expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600')
  })

  it('adds configured stale-while-revalidate and stale-if-error alongside the object Cache-Control', async () => {
    await loadRendererModule({
      responseStaleWhileRevalidate: 120,
      responseStaleIfError: 300,
    })
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            cacheControl: 'public, max-age=3600',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(createRequest(), reply as never, createRenderOptions())

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=120, stale-if-error=300'
    )
  })

  it('configures stale-while-revalidate and stale-if-error independently', async () => {
    await loadRendererModule({
      responseStaleWhileRevalidate: 90,
    })
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            cacheControl: 'public, max-age=3600',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(createRequest(), reply as never, createRenderOptions())

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=90'
    )
  })

  it('uses the configured stale-while-revalidate instead of the default even when the etag mismatches', async () => {
    await loadRendererModule({
      responseStaleWhileRevalidate: 120,
    })
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            eTag: '"current-etag"',
            cacheControl: 'public, max-age=3600',
          },
        }
      }
    }

    const reply = createReply()
    // A mismatched conditional request etag used to make the base Renderer
    // push its own hardcoded `stale-while-revalidate=30`. Once configured,
    // that default is superseded — the configured value applies uniformly
    // instead of being layered underneath it.
    await new TestRenderer().render(
      createRequest({ 'if-none-match': '"stale-etag"' }),
      reply as never,
      createRenderOptions()
    )

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=120'
    )
  })

  it('applies stale-if-error alongside the configured stale-while-revalidate on an etag mismatch', async () => {
    await loadRendererModule({
      responseStaleWhileRevalidate: 120,
      responseStaleIfError: 300,
    })
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            eTag: '"current-etag"',
            cacheControl: 'public, max-age=3600',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(
      createRequest({ 'if-none-match': '"stale-etag"' }),
      reply as never,
      createRenderOptions()
    )

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=120, stale-if-error=300'
    )
  })

  it('falls back to the default stale-while-revalidate on an etag mismatch when unconfigured', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            eTag: '"current-etag"',
            cacheControl: 'public, max-age=3600',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(
      createRequest({ 'if-none-match': '"stale-etag"' }),
      reply as never,
      createRenderOptions()
    )

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=30'
    )
  })

  it('does not duplicate a stale directive already present in the object Cache-Control', async () => {
    await loadRendererModule({
      responseStaleWhileRevalidate: 120,
      responseStaleIfError: 300,
    })
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            cacheControl: 'public, max-age=3600, stale-while-revalidate=999',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(createRequest(), reply as never, createRenderOptions())

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=999, stale-if-error=300'
    )
  })

  it('does not mistake a comma inside a quoted object Cache-Control value for a directive boundary', async () => {
    await loadRendererModule({
      responseStaleWhileRevalidate: 120,
      responseStaleIfError: 300,
    })
    const { Renderer } = await import('./renderer')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body: Buffer.from('body'),
          metadata: {
            cacheControl: 'private="Set-Cookie, X-Foo", stale-while-revalidate=999',
          },
        }
      }
    }

    const reply = createReply()
    await new TestRenderer().render(createRequest(), reply as never, createRenderOptions())

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'private="Set-Cookie, X-Foo", stale-while-revalidate=999, stale-if-error=300'
    )
  })

  it('does not add stale-while-revalidate/stale-if-error to HeadRenderer or InfoRenderer responses', async () => {
    await loadRendererModule({
      responseStaleWhileRevalidate: 120,
      responseStaleIfError: 300,
    })
    const [{ HeadRenderer }, { InfoRenderer }] = await Promise.all([
      import('./head'),
      import('./info'),
    ])

    const headReply = createReply()
    await new HeadRenderer().render(
      { headers: {}, query: {} } as never,
      headReply as never,
      {
        ...createRenderOptions(),
        object: {
          metadata: {
            cacheControl: 'public, max-age=3600',
          },
        },
      } as never
    )

    expect(headReply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600')

    const infoReply = createReply()
    await new InfoRenderer().render(
      { headers: {}, query: {} } as never,
      infoReply as never,
      {
        ...createRenderOptions(),
        object: {
          bucket_id: 'bucket',
          created_at: '2022-10-01T00:00:00.000Z',
          id: 'object-id',
          metadata: {
            cacheControl: 'public, max-age=3600',
          },
          name: 'folder/cat.png',
          updated_at: '2022-10-12T11:17:02.000Z',
          user_metadata: null,
          version: 'version',
        },
      } as never
    )

    expect(infoReply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600')
  })

  it('does not duplicate must-revalidate already present in the object Cache-Control for HeadRenderer', async () => {
    await loadRendererModule()
    const { HeadRenderer } = await import('./head')

    const reply = createReply()
    await new HeadRenderer().render(
      { headers: { 'if-none-match': '"stale-etag"' }, query: {} } as never,
      reply as never,
      {
        ...createRenderOptions(),
        object: {
          metadata: {
            eTag: '"current-etag"',
            cacheControl: 'public, max-age=3600, must-revalidate',
          },
        },
      } as never
    )

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, must-revalidate'
    )
  })

  it('adds s-maxage for HeadRenderer when the etag matches', async () => {
    await loadRendererModule()
    const { HeadRenderer } = await import('./head')

    class TestHeadRenderer extends HeadRenderer {
      protected sMaxAge = 60
    }

    const reply = createReply()
    await new TestHeadRenderer().render(
      { headers: { 'if-none-match': '"current-etag"' }, query: {} } as never,
      reply as never,
      {
        ...createRenderOptions(),
        object: {
          metadata: {
            eTag: '"current-etag"',
            cacheControl: 'public, max-age=3600',
          },
        },
      } as never
    )

    expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600, s-maxage=60')
  })

  it('passes an undici dispatcher to fetch when imgproxy socket pooling is enabled', async () => {
    const agentInstances: Array<{ instance: unknown; options: unknown }> = []
    const composedHandlers: unknown[] = []
    const composedDispatcher = { __composed: true }
    class MockAgent {
      constructor(options: unknown) {
        agentInstances.push({ instance: this, options })
      }
      compose(...handlers: unknown[]) {
        composedHandlers.push(...handlers)
        return composedDispatcher
      }
    }
    const retryStub = vi.fn((opts: unknown) => ({ __retryOpts: opts }))
    vi.doMock('undici', () => ({
      Agent: MockAgent,
      interceptors: { retry: retryStub },
    }))

    const fetchMock = stubSuccessfulImageFetch()

    const { ImageRenderer } = await loadRendererModule(
      {
        imgProxyHttpKeepAlive: 11,
        imgProxyHttpMaxSockets: 3,
        imgProxyRequestTimeout: 7,
      },
      { mockUndici: false }
    )
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    const result = await renderer.getAsset(createRequest(), createRenderOptions())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(agentInstances).toEqual([
      {
        instance: expect.any(MockAgent),
        options: {
          bodyTimeout: 7000,
          connections: 3,
          headersTimeout: 7000,
          keepAliveMaxTimeout: 11000,
          keepAliveTimeout: 2000,
        },
      },
    ])
    expect(retryStub).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 5,
        maxTimeout: 1000,
        methods: ['GET'],
        statusCodes: [408, 429, 500, 502, 503, 504],
        throwOnError: false,
        errorCodes: expect.arrayContaining([
          'ECONNRESET',
          'ETIMEDOUT',
          'UND_ERR_CONNECT_TIMEOUT',
          'UND_ERR_HEADERS_TIMEOUT',
          'UND_ERR_BODY_TIMEOUT',
        ]),
      })
    )
    expect(composedHandlers).toEqual([{ __retryOpts: expect.any(Object) }])
    const [, init] = fetchMock.mock.calls[0]
    const dispatcher = (init as RequestInit & { dispatcher?: unknown }).dispatcher
    expect(dispatcher).toBe(composedDispatcher)
    await expect(readStream(result.body)).resolves.toBe('rendered-body')
  })

  it('keeps imgproxy timeout and retry dispatcher when socket cap is disabled', async () => {
    const agentInstances: Array<{ instance: unknown; options: Record<string, unknown> }> = []
    const composedHandlers: unknown[] = []
    const composedDispatcher = { __composed: true }
    class MockAgent {
      constructor(options: Record<string, unknown>) {
        agentInstances.push({ instance: this, options })
      }
      compose(...handlers: unknown[]) {
        composedHandlers.push(...handlers)
        return composedDispatcher
      }
    }
    const retryStub = vi.fn((opts: unknown) => ({ __retryOpts: opts }))
    vi.doMock('undici', () => ({
      Agent: MockAgent,
      interceptors: { retry: retryStub },
    }))

    const fetchMock = stubSuccessfulImageFetch()

    const { ImageRenderer } = await loadRendererModule(
      {
        imgProxyHttpKeepAlive: 13,
        imgProxyHttpMaxSockets: 0,
        imgProxyRequestTimeout: 9,
      },
      { mockUndici: false }
    )
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    const result = await renderer.getAsset(createRequest(), createRenderOptions())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(agentInstances).toEqual([
      {
        instance: expect.any(MockAgent),
        options: {
          bodyTimeout: 9000,
          headersTimeout: 9000,
          keepAliveMaxTimeout: 13000,
          keepAliveTimeout: 2000,
        },
      },
    ])
    expect(agentInstances[0]?.options).not.toHaveProperty('connections')
    expect(retryStub).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 5,
        maxTimeout: 1000,
        methods: ['GET'],
        statusCodes: [408, 429, 500, 502, 503, 504],
        throwOnError: false,
        errorCodes: expect.arrayContaining([
          'ECONNRESET',
          'ETIMEDOUT',
          'UND_ERR_CONNECT_TIMEOUT',
          'UND_ERR_HEADERS_TIMEOUT',
          'UND_ERR_BODY_TIMEOUT',
        ]),
      })
    )
    expect(composedHandlers).toEqual([{ __retryOpts: expect.any(Object) }])
    const [, init] = fetchMock.mock.calls[0]
    const dispatcher = (init as RequestInit & { dispatcher?: unknown }).dispatcher
    expect(dispatcher).toBe(composedDispatcher)
    await expect(readStream(result.body)).resolves.toBe('rendered-body')
  })

  it.each([
    [408, 'image request timed out', 408, 400, 'Image request timed out'],
    [429, 'too many image requests', 429, 400, 'Too many requests'],
    [
      500,
      "Can't download source image: https://internal.example/private.png?X-Amz-Signature=secret",
      500,
      500,
      'Internal error',
    ],
    [503, 'temporary imgproxy failure', 503, 400, 'Internal error'],
  ])('maps exhausted retry response for imgproxy %i', async (statusCode, body, expectedStatusCode, expectedUserStatusCode, expectedMessage) => {
    const mockUndici = await useUndiciMockAgent()

    try {
      const { ImageRenderer } = await loadRendererModule(
        {
          imgProxyHttpMaxSockets: 2,
          imgProxyRequestTimeout: 1,
          imgProxyURL: 'https://imgproxy.example.test/base',
        },
        { mockUndici: false }
      )
      const mockAgent = mockUndici.getMockAgent()
      mockAgent
        .get('https://imgproxy.example.test')
        .intercept({
          method: 'GET',
          path: '/base/public/plain/local:///tmp/cat.png',
        })
        .reply(statusCode, body)
        .times(6)

      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
      vi.useFakeTimers()
      const resultPromise = renderer
        .getAsset(createRequest(), createRenderOptions())
        .catch((e) => e)

      await vi.advanceTimersByTimeAsync(EXHAUSTED_RETRY_BACKOFF_MS)
      const result = await resultPromise

      expect(result).toMatchObject({
        httpStatusCode: expectedStatusCode,
        userStatusCode: expectedUserStatusCode,
        message: expectedMessage,
      })
      mockAgent.assertNoPendingInterceptors()
    } finally {
      vi.useRealTimers()
      await mockUndici.close()
    }
  })

  it.each([
    [500, "Can't download source image: Image is not compatible with heic/avif"],
    [500, "Can't download source image: Image is not compatible with future/format"],
    [
      422,
      "Can't download source image: Source image resolution is too big",
      'The source image resolution is too large to process',
    ],
    [
      422,
      "Can't download source image: Source image frame resolution is too big",
      'The source image frame resolution is too large to process',
    ],
    [
      422,
      "Can't download source image: Source image file is too big",
      'The source image file is too large to process',
    ],
    [422, "Can't download source image: Source image type not supported"],
    [500, "Can't download source image: invalid TIFF format: image dimensions are not specified"],
    [
      500,
      'glib: XML parse error: warning code=100 (3) in (null):8:23: xmlns: URI ns_sfw; is not absolute',
    ],
    [
      500,
      "source: bad seek to 3022366\nheif: Invalid input: No 'hvcC' box: No hvcC property in hvc1 type image (2.106)",
    ],
    [422, 'Invalid source image'],
    [422, 'Invalid source image \n'],
    [422, 'Broken or unsupported image'],
    [422, 'Broken or unsupported image \t'],
    [500, "Can't download source image: invalid JPEG format: missing SOF marker"],
    [500, "Can't download source image: webp: invalid format"],
    [500, "Can't download source image: Invalid box data size"],
    [500, "Can't download source image: Invalid ftyp data"],
    [500, "Can't download source image: Invalid meta data"],
    [500, "Can't download source image: Invalid ispe data"],
    [500, "Can't download source image: Dimensions data wasn't found in meta box"],
    [422, 'VipsJpeg: Invalid JPEG file structure: two SOI markers'],
    [422, 'pngload_buffer: libspng read error'],
    [422, 'pngload_source: libspng read error\n/vips/vips.go:136'],
    [422, 'tiff2vips: unable to read header'],
    [422, 'webp2vips: unable to read pixels'],
    [422, 'gif2vips: unable to read header'],
    [422, 'Broken or unsupported SVG image'],
  ])('maps imgproxy source-image validation error %# (%i)', async (upstreamStatusCode, body, expectedMessage = 'The source image is invalid or unsupported for rendering') => {
    await expectMappedImgproxyError(upstreamStatusCode, body, {
      code: 'InvalidRequest',
      httpStatusCode: 400,
      userStatusCode: 400,
      message: expectedMessage,
    })
  })

  it.each([
    [
      404,
      "Can't download source image: https://internal.example/private.png?X-Amz-Signature=secret: 404",
    ],
    [422, "Can't download source image: local:///tmp/private-source.jpg: unsupported source state"],
  ])('sanitizes unrecognized imgproxy source-image error %# (%i)', async (upstreamStatusCode, body) => {
    await expectMappedImgproxyError(upstreamStatusCode, body, {
      code: 'InvalidRequest',
      httpStatusCode: upstreamStatusCode,
      userStatusCode: 400,
      message: 'Unable to download source image',
    })
  })

  it.each([
    [404, 'Invalid URL', 404, 400, 'Invalid image request'],
    [404, 'Invalid source', 404, 400, 'Invalid image source'],
    [404, 'Invalid source \n', 404, 400, 'Invalid image source'],
    [403, 'Forbidden', 403, 400, 'Image transformation request was rejected'],
    [404, 'Not found', 404, 400, 'Not found'],
    [404, 'Source image is unreachable', 404, 400, 'Unable to download source image'],
    [404, 'Source image is unreachable \n', 404, 400, 'Unable to download source image'],
    [429, 'Too many requests', 429, 400, 'Too many requests'],
    [429, 'Too many requests \t', 429, 400, 'Too many requests'],
    [503, 'Timeout', 503, 400, 'Image request timed out'],
    [422, '<html>upstream debug</html>', 422, 400, 'Invalid image request'],
    [502, '<html>upstream failure</html>', 502, 400, 'Internal error'],
    [500, 'heif: Memory allocation error', 500, 500, 'Internal error'],
    [500, 'source: bad seek to 3022366', 500, 500, 'Internal error'],
    [500, "Can't download source image: unexpected EOF", 500, 500, 'Internal error'],
    [
      500,
      "Can't download source image: Invalid meta data from upstream server",
      500,
      500,
      'Internal error',
    ],
    [500, 'VipsForeignSave: unable to write output', 500, 500, 'Internal error'],
    [404, 'Source is unreachable', 404, 400, 'Unable to download source image'],
    [504, 'Source is unreachable', 504, 400, 'Unable to download source image'],
    [422, 'Source response is incomplete', 422, 400, 'Unable to download source image'],
    [422, 'Failed to detect source image type', 422, 400, 'Unable to determine source image type'],
    [404, 'Invalid source URL', 404, 400, 'Invalid image source'],
  ])('maps imgproxy production public error %# (%i)', async (upstreamStatusCode, body, expectedStatusCode, expectedUserStatusCode, expectedMessage) => {
    await expectMappedImgproxyError(upstreamStatusCode, body, {
      httpStatusCode: expectedStatusCode,
      userStatusCode: expectedUserStatusCode,
      message: expectedMessage,
    })
  })

  it('clamps imgproxy Retry-After waits before retrying', async () => {
    const mockUndici = await useUndiciMockAgent()

    try {
      const { ImageRenderer } = await loadRendererModule(
        {
          imgProxyHttpMaxSockets: 2,
          imgProxyRequestTimeout: 1,
          imgProxyURL: 'https://imgproxy.example.test/base',
        },
        { mockUndici: false }
      )
      const mockAgent = mockUndici.getMockAgent()
      const pool = mockAgent.get('https://imgproxy.example.test')
      pool
        .intercept({
          method: 'GET',
          path: '/base/public/plain/local:///tmp/cat.png',
        })
        .reply(429, 'retry later', {
          headers: {
            'retry-after': '2',
          },
        })
      pool
        .intercept({
          method: 'GET',
          path: '/base/public/plain/local:///tmp/cat.png',
        })
        .reply(200, 'rendered-body', {
          headers: {
            'content-length': '13',
            'content-type': 'image/webp',
          },
        })

      vi.useFakeTimers()
      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
      let settled = false
      const resultPromise = renderer
        .getAsset(createRequest(), createRenderOptions())
        .finally(() => {
          settled = true
        })

      await vi.advanceTimersByTimeAsync(1000)
      const result = await resultPromise

      expect(settled).toBe(true)
      await expect(readStream(result.body)).resolves.toBe('rendered-body')
      mockAgent.assertNoPendingInterceptors()
    } finally {
      vi.useRealTimers()
      await mockUndici.close()
    }
  })

  it('keeps enough total budget for retry sleeps and the final imgproxy attempt', async () => {
    const mockUndici = await useUndiciMockAgent()

    try {
      const { ImageRenderer } = await loadRendererModule(
        {
          imgProxyHttpMaxSockets: 2,
          imgProxyRequestTimeout: 0.2,
          imgProxyURL: 'https://imgproxy.example.test/base',
        },
        { mockUndici: false }
      )
      const mockAgent = mockUndici.getMockAgent()
      const pool = mockAgent.get('https://imgproxy.example.test')
      const { timeoutSpy } = spyOnAbortSignalTimeout()

      for (let retry = 0; retry < 5; retry += 1) {
        pool
          .intercept({
            method: 'GET',
            path: '/base/public/plain/local:///tmp/cat.png',
          })
          .reply(429, 'retry later', {
            headers: {
              'retry-after': '1',
            },
          })
      }

      pool
        .intercept({
          method: 'GET',
          path: '/base/public/plain/local:///tmp/cat.png',
        })
        .reply(200, 'rendered-body', {
          headers: {
            'content-length': '13',
            'content-type': 'image/webp',
          },
        })

      vi.useFakeTimers()
      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
      const resultPromise = renderer.getAsset(createRequest(), createRenderOptions())

      await vi.advanceTimersByTimeAsync(5000)
      const result = await resultPromise

      expect(timeoutSpy).toHaveBeenCalledTimes(1)
      expect(timeoutSpy).toHaveBeenCalledWith(6200)
      await expect(readStream(result.body)).resolves.toBe('rendered-body')
      mockAgent.assertNoPendingInterceptors()
    } finally {
      vi.useRealTimers()
      await mockUndici.close()
    }
  })

  it.each([
    ['ECONNRESET', 'connection reset', 'Error'],
    ['ETIMEDOUT', 'connect timed out', 'Error'],
    ['ENOTFOUND', 'dns lookup failed', 'Error'],
    ['UND_ERR_CONNECT_TIMEOUT', 'Connect Timeout Error', 'ConnectTimeoutError'],
    ['UND_ERR_HEADERS_TIMEOUT', 'Headers Timeout Error', 'HeadersTimeoutError'],
    ['UND_ERR_BODY_TIMEOUT', 'Body Timeout Error', 'BodyTimeoutError'],
  ])('retries retryable imgproxy transport error %s before returning the body', async (errorCode, errorMessage, errorName) => {
    const mockUndici = await useUndiciMockAgent()

    try {
      const { ImageRenderer } = await loadRendererModule(
        {
          imgProxyHttpMaxSockets: 2,
          imgProxyRequestTimeout: 1,
          imgProxyURL: 'https://imgproxy.example.test/base',
        },
        { mockUndici: false }
      )
      const mockAgent = mockUndici.getMockAgent()
      const pool = mockAgent.get('https://imgproxy.example.test')
      pool
        .intercept({
          method: 'GET',
          path: '/base/public/plain/local:///tmp/cat.png',
        })
        .replyWithError(
          Object.assign(new Error(errorMessage), { code: errorCode, name: errorName })
        )
      pool
        .intercept({
          method: 'GET',
          path: '/base/public/plain/local:///tmp/cat.png',
        })
        .reply(200, 'rendered-body', {
          headers: {
            'content-length': '13',
            'content-type': 'image/webp',
          },
        })

      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
      const result = await renderer.getAsset(createRequest(), createRenderOptions())

      await expect(readStream(result.body)).resolves.toBe('rendered-body')
      mockAgent.assertNoPendingInterceptors()
    } finally {
      await mockUndici.close()
    }
  })

  it('only exposes renderer metadata headers from fetch responses', async () => {
    stubSuccessfulImageFetch({
      'last-modified': 'Wed, 12 Oct 2022 11:17:02 GMT',
      'set-cookie': 'session=abc',
    })

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const response = await renderer.getClient().get('/public/plain/local:///tmp/cat.png')

    expect(response.headers).toEqual({
      'content-length': '13',
      'content-type': 'image/webp',
      'last-modified': 'Wed, 12 Oct 2022 11:17:02 GMT',
    })
  })

  it('skips nullish request headers when fetching imgproxy', async () => {
    const fetchMock = stubSuccessfulImageFetch()

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    await renderer.getClient().get('/public/plain/local:///tmp/cat.png', {
      headers: {
        accept: undefined,
        'x-null': null,
        'x-array': ['a', 'b'],
        'x-value': 'ok',
      },
    })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init?.headers as Headers
    expect(headers.has('accept')).toBe(false)
    expect(headers.has('x-null')).toBe(false)
    expect(headers.get('x-array')).toBe('a, b')
    expect(headers.get('x-value')).toBe('ok')
  })

  it('passes through successful imgproxy responses that omit content-type', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: {
          'content-length': '3',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png')).setTransformations({
      width: 50,
    })

    const result = await renderer.getAsset(createRequest(), createRenderOptions())

    await expect(readStream(result.body)).resolves.toBe('\u0001\u0002\u0003')
    expect(result.metadata).toMatchObject({
      contentLength: 3,
      httpStatusCode: 200,
      size: 3,
    })
    expect(result.metadata.mimetype).toBeUndefined()
    expect(result.transformations).toEqual(['width:50', 'resizing_type:fill'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps imgproxy retry resume stream failures to an actionable stream error', async () => {
    const requestRetryError = Object.assign(
      new Error('server does not support the range header and the payload was partially consumed'),
      {
        code: 'UND_ERR_REQ_RETRY',
        name: 'RequestRetryError',
      }
    )
    let sentChunk = false
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            if (!sentChunk) {
              sentChunk = true
              controller.enqueue(new Uint8Array([1, 2, 3]))
              return
            }

            controller.error(requestRetryError)
          },
        }),
        {
          headers: {
            'content-length': '3',
            'content-type': 'image/webp',
          },
        }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png')).setTransformations({
      width: 50,
    })

    const result = await renderer.getAsset(createRequest(), createRenderOptions())
    const streamError = await readStream(result.body).catch((error) => error)

    expect(streamError).toMatchObject({
      cause: expect.objectContaining({
        code: 'UND_ERR_REQ_RETRY',
        message: 'server does not support the range header and the payload was partially consumed',
        name: 'RequestRetryError',
      }),
      message: 'imgproxy connection dropped mid-response: retry resume is not supported',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('drops invalid imgproxy Last-Modified headers before rendering', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        headers: {
          'content-type': 'image/webp',
          'last-modified': 'not-a-date',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions())

    expect(reply.header).not.toHaveBeenCalledWith('Last-Modified', expect.anything())
    expect(reply.send).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('cancels imgproxy response bodies when stream conversion fails', async () => {
    const readerError = new Error('getReader failed')
    const cancelSpy = vi.fn()
    const responseBody = new ReadableStream<Uint8Array>({
      cancel: cancelSpy,
    })
    vi.spyOn(responseBody, 'getReader').mockImplementation(() => {
      throw readerError
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseBody))
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(renderer.getClient().get('/public/plain/local:///tmp/cat.png')).rejects.toBe(
      readerError
    )
    await waitForCondition(() => cancelSpy.mock.calls.length === 1)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('omits content-length metadata and response header when imgproxy streams without it', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        new Response('rendered-body', {
          headers: {
            'content-type': 'image/webp',
          },
        })
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const reply = createReply()

    const result = await renderer.getAsset(createRequest(), createRenderOptions())
    await expect(readStream(result.body)).resolves.toBe('rendered-body')
    expect(result.metadata.contentLength).toBeUndefined()
    expect(result.metadata.size).toBeUndefined()

    await renderer.render(createRequest(), reply as never, createRenderOptions())
    expect(reply.header).not.toHaveBeenCalledWith('Content-Length', expect.anything())
  })

  it('drops invalid imgproxy content-length while preserving the response body', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: {
          'content-length': '3 bytes',
          'content-type': 'image/webp',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const warn = vi.fn()

    const result = await renderer.getAsset(
      { headers: {}, log: { warn } } as unknown as FastifyRequest,
      createRenderOptions()
    )

    await expect(readStream(result.body)).resolves.toBe('\u0001\u0002\u0003')
    expect(result.metadata.contentLength).toBeUndefined()
    expect(result.metadata.size).toBeUndefined()
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Invalid content-length header value: 3 bytes',
        }),
        type: 'imgproxy',
      }),
      'imgproxy returned invalid content-length'
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('destroys successful imgproxy response bodies when metadata processing throws', async () => {
    const warnError = new Error('logger failed')
    const cancelSpy = vi.fn()
    const responseBody = new ReadableStream<Uint8Array>({
      cancel: cancelSpy,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(responseBody, {
        headers: {
          'content-length': '3 bytes',
          'content-type': 'image/webp',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(
      renderer.getAsset(
        {
          headers: {},
          log: {
            warn() {
              throw warnError
            },
          },
        } as unknown as FastifyRequest,
        createRenderOptions()
      )
    ).rejects.toBe(warnError)
    await waitForCondition(() => cancelSpy.mock.calls.length === 1)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('destroys successful imgproxy response bodies when request logging is missing', async () => {
    const cancelSpy = vi.fn()
    const responseBody = new ReadableStream<Uint8Array>({
      cancel: cancelSpy,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(responseBody, {
        headers: {
          'content-length': '3 bytes',
          'content-type': 'image/webp',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(renderer.getAsset(createRequest(), createRenderOptions())).rejects.toThrow()
    await waitForCondition(() => cancelSpy.mock.calls.length === 1)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('ignores malformed transformation segments with missing or empty values', async () => {
    stubSuccessfulImageFetch()

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(
      createBackend('local:///tmp/cat.png')
    ).setTransformationsFromString('width:100,height,quality:80,resize:')

    const result = await renderer.getAsset(createRequest(), createRenderOptions())

    expect(result.transformations).toEqual(['width:100', 'resizing_type:fill', 'quality:80'])
    await expect(readStream(result.body)).resolves.toBe('rendered-body')
  })

  it('does not retry non-retryable imgproxy failures and returns a controlled message', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('invalid image request', {
        status: 400,
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png')).setTransformations({
      height: 50,
    })

    await expect(renderer.getAsset(createRequest(), createRenderOptions())).rejects.toMatchObject({
      httpStatusCode: 400,
      message: 'Invalid image request',
      metadata: {
        transformations: ['height:50', 'resizing_type:fill'],
      },
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns a controlled message when imgproxy returns an empty error body', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(renderer.getAsset(createRequest(), createRenderOptions())).rejects.toMatchObject({
      httpStatusCode: 400,
      message: 'Invalid image request',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps imgproxy error response stream failures to an internal error without hanging', async () => {
    const streamError = new Error('imgproxy stream failed')
    const errorBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('partial error body'))
        controller.error(streamError)
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(errorBody, {
        status: 400,
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(renderer.getAsset(createRequest(), createRenderOptions())).rejects.toMatchObject({
      httpStatusCode: 500,
      message: 'imgproxy stream failed',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('decodes Uint8Array chunks from imgproxy error response bodies', async () => {
    const { ImageRenderer } = await loadRendererModule()

    class TestImageRenderer extends ImageRenderer {
      readRequestError(error: never) {
        return this.handleRequestError(error)
      }
    }

    const errorBody = new Readable({
      objectMode: true,
      read() {
        this.push(new TextEncoder().encode('Invalid source image'))
        this.push(null)
      },
    })
    const renderer = new TestImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(
      renderer.readRequestError({
        response: {
          data: errorBody,
          status: 400,
        },
      } as never)
    ).resolves.toMatchObject({
      httpStatusCode: 400,
      message: 'The source image is invalid or unsupported for rendering',
    })
  })

  it('maps already-errored response streams without waiting for a future error event', async () => {
    const { ImageRenderer } = await loadRendererModule()

    class TestImageRenderer extends ImageRenderer {
      readRequestError(error: never) {
        return this.handleRequestError(error)
      }
    }

    const streamError = new Error('imgproxy response failed before read')
    const errorBody = new Readable({
      read() {},
    })
    errorBody.on('error', () => {})
    errorBody.destroy(streamError)
    await new Promise((resolve) => setImmediate(resolve))

    const renderer = new TestImageRenderer(createBackend('local:///tmp/cat.png'))
    const result = await Promise.race([
      renderer.readRequestError({
        response: {
          data: errorBody,
          status: 400,
        },
      } as never),
      new Promise((resolve) => setTimeout(() => resolve('timed out'), 100)),
    ])

    expect(result).toMatchObject({
      httpStatusCode: 500,
      message: 'imgproxy response failed before read',
    })
  })

  it('bubbles caller-driven aborts without remapping them to storage errors', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      const signal = init?.signal as AbortSignal
      controller.abort(abortError)
      return Promise.reject(signal.reason ?? abortError)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(
      renderer.getAsset(createRequest(), createRenderOptions(controller.signal))
    ).rejects.toBe(abortError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps caller-driven aborts during render to the request-aborted response', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      const signal = init?.signal as AbortSignal
      controller.abort(abortError)
      return Promise.reject(signal.reason ?? abortError)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps caller aborts after fetch resolves to the request-aborted response before sending headers', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    const cancelError = new Error('cancel failed')
    const cancelSpy = vi.fn(() => {
      throw cancelError
    })
    const unhandledRejection = vi.fn()
    const responseBody = new ReadableStream({
      cancel: cancelSpy,
    })
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        new Response(responseBody, {
          headers: {
            'content-length': '13',
            'content-type': 'image/webp',
          },
        })
      ).then((response) => {
        controller.abort(abortError)
        return response
      })
    )
    vi.stubGlobal('fetch', fetchMock)
    process.once('unhandledRejection', unhandledRejection)

    try {
      const { ImageRenderer } = await loadRendererModule()
      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
      const reply = createReply()

      await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))
      await new Promise((resolve) => setImmediate(resolve))

      expect(cancelSpy).toHaveBeenCalledTimes(1)
      expect(unhandledRejection).not.toHaveBeenCalled()
      expect(reply.status).toHaveBeenCalledWith(499)
      expect(reply.status).not.toHaveBeenCalledWith(200)
      expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      process.off('unhandledRejection', unhandledRejection)
    }
  })

  it('waits for imgproxy response body cancellation before surfacing post-fetch caller aborts', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    let resolveCancel: (() => void) | undefined
    const cancelStarted = vi.fn()
    const cancelFinished = vi.fn()
    const responseBody = new ReadableStream({
      cancel() {
        cancelStarted()
        return new Promise<void>((resolve) => {
          resolveCancel = () => {
            cancelFinished()
            resolve()
          }
        })
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(new Response(responseBody)).then((response) => {
        controller.abort(abortError)
        return response
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    let settled = false
    const resultPromise = renderer
      .getClient()
      .get('/public/plain/local:///tmp/cat.png', { signal: controller.signal })
      .catch((error: unknown) => error)
      .finally(() => {
        settled = true
      })

    await waitForCondition(() => cancelStarted.mock.calls.length === 1)
    await new Promise((resolve) => setImmediate(resolve))

    expect(settled).toBe(false)
    expect(cancelFinished).not.toHaveBeenCalled()

    resolveCancel?.()

    await expect(resultPromise).resolves.toBe(abortError)
    expect(cancelFinished).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses a fallback abort error when the post-fetch abort reason is undefined', async () => {
    const cancelSpy = vi.fn()
    const signal = {
      aborted: false,
      reason: undefined,
    } as AbortSignal & { aborted: boolean; reason: undefined }
    const responseBody = new ReadableStream({
      cancel: cancelSpy,
    })
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(new Response(responseBody)).then((response) => {
        signal.aborted = true
        return response
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(
      renderer.getClient().get('/public/plain/local:///tmp/cat.png', { signal })
    ).rejects.toMatchObject({
      message: 'aborted',
      name: 'AbortError',
    })

    expect(cancelSpy).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('errors the response stream when the web body ends after the caller aborts', async () => {
    const abortError = new Error('caller stopped')
    const signal = {
      aborted: false,
      reason: abortError,
    } as AbortSignal & { aborted: boolean }
    let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined
    const responseBody = new ReadableStream<Uint8Array>({
      start(controller) {
        bodyController = controller
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseBody))
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const response = await renderer.getClient().get('/public/plain/local:///tmp/cat.png', {
      signal,
    })
    const bodyRead = readStream(response.data)

    signal.aborted = true
    bodyController?.close()

    await expect(bodyRead).rejects.toBe(abortError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('errors the response stream when the caller aborts while the body is streaming', async () => {
    const abortError = new Error('caller stopped')
    const signal = {
      aborted: false,
      reason: abortError,
    } as AbortSignal & { aborted: boolean }
    let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined
    const responseBody = new ReadableStream<Uint8Array>({
      start(controller) {
        bodyController = controller
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseBody))
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const response = await renderer.getClient().get('/public/plain/local:///tmp/cat.png', {
      signal,
    })
    const bodyRead = readStream(response.data)

    bodyController?.enqueue(new TextEncoder().encode('partial body'))
    await new Promise((resolve) => setImmediate(resolve))
    signal.aborted = true
    bodyController?.error(abortError)

    await expect(bodyRead).rejects.toBe(abortError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('errors the response stream when a real AbortController aborts native fetch mid-body', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'image/webp',
      })
      response.write('partial body')
    })

    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
          reject(error)
        }
        server.once('error', onError)
        server.listen(0, '127.0.0.1', () => {
          server.off('error', onError)
          resolve()
        })
      })

      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected imgproxy test server to listen on a TCP port')
      }

      const controller = new AbortController()
      const abortError = new DOMException('caller stopped', 'AbortError')
      const { ImageRenderer } = await loadRendererModule(
        {
          imgProxyURL: `http://127.0.0.1:${(address as AddressInfo).port}/base`,
        },
        { mockUndici: false }
      )
      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
      const response = await renderer.getClient().get('/public/plain/local:///tmp/cat.png', {
        signal: controller.signal,
      })
      const chunks: Buffer[] = []
      const bodyRead = (async () => {
        for await (const chunk of response.data as AsyncIterable<Buffer | Uint8Array>) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          controller.abort(abortError)
        }
      })()

      await expect(bodyRead).rejects.toBe(abortError)
      expect(Buffer.concat(chunks).toString('utf8')).toBe('partial body')
    } finally {
      if (server.listening) {
        server.closeAllConnections()
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve()))
        )
      }
    }
  })

  it('errors a real native fetch response stream when the total request budget expires mid-body', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'image/webp',
      })
      response.write('partial body')
    })

    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
          reject(error)
        }
        server.once('error', onError)
        server.listen(0, '127.0.0.1', () => {
          server.off('error', onError)
          resolve()
        })
      })

      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected imgproxy test server to listen on a TCP port')
      }

      const { ImageRenderer } = await loadRendererModule(
        {
          imgProxyRequestTimeout: 0.01,
          imgProxyURL: `http://127.0.0.1:${(address as AddressInfo).port}/base`,
        },
        { mockUndici: false }
      )
      const timeoutController = new AbortController()
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal)
      const timeoutError = new DOMException('timeout', 'TimeoutError')
      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
      const response = await renderer.getClient().get('/public/plain/local:///tmp/cat.png')
      const chunks: Buffer[] = []
      const bodyRead = (async () => {
        for await (const chunk of response.data as AsyncIterable<Buffer | Uint8Array>) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
      })()

      await waitForCondition(() => Buffer.concat(chunks).toString('utf8') === 'partial body')
      timeoutController.abort(timeoutError)

      await expect(bodyRead).rejects.toMatchObject({ name: 'TimeoutError' })
      expect(Buffer.concat(chunks).toString('utf8')).toBe('partial body')
      expect(timeoutSpy).toHaveBeenCalledTimes(1)
      expect(timeoutSpy).toHaveBeenCalledWith(5060)
    } finally {
      if (server.listening) {
        server.closeAllConnections()
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve()))
        )
      }
    }
  })

  it('maps post-fetch aborts with undefined reason to the request-aborted response', async () => {
    const cancelSpy = vi.fn()
    const signal = {
      aborted: false,
      reason: undefined,
    } as AbortSignal & { aborted: boolean; reason: undefined }
    const responseBody = new ReadableStream({
      cancel: cancelSpy,
    })
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(new Response(responseBody)).then((response) => {
        signal.aborted = true
        return response
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(signal))

    expect(cancelSpy).toHaveBeenCalledTimes(1)
    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('destroys an asset body when the caller aborts after getAsset resolves before headers are set', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    const body = new Readable({
      read() {},
    })

    class TestRenderer extends Renderer {
      async getAsset() {
        return Promise.resolve({
          body,
          metadata: {},
        }).then((asset) => {
          controller.abort(abortError)
          return asset
        })
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(body.destroyed).toBe(true)
    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.status).not.toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
  })

  it('destroys an asset body when header setup fails before send', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')
    const body = new Readable({
      read() {},
    })
    const headerError = new Error('header failure')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body,
          metadata: {},
        }
      }

      protected setHeaders(): never {
        throw headerError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await expect(
      renderer.render(createRequest(), reply as never, createRenderOptions())
    ).rejects.toBe(headerError)

    expect(body.destroyed).toBe(true)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('cancels imgproxy response bodies when header setup fails before send', async () => {
    const headerError = new Error('header failure')
    const cancelSpy = vi.fn()
    const responseBody = new ReadableStream<Uint8Array>({
      cancel: cancelSpy,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(responseBody, {
        headers: {
          'content-length': '13',
          'content-type': 'image/webp',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()

    class HeaderFailingImageRenderer extends ImageRenderer {
      protected setHeaders(): never {
        throw headerError
      }
    }

    const renderer = new HeaderFailingImageRenderer(createBackend('local:///tmp/cat.png'))
    const reply = createReply()

    await expect(
      renderer.render(createRequest(), reply as never, createRenderOptions())
    ).rejects.toBe(headerError)
    await waitForCondition(() => cancelSpy.mock.calls.length === 1)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('does not call destroy fields on plain object response bodies during cleanup', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')
    const body = { destroy: vi.fn() }
    const headerError = new Error('header failure')

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body,
          metadata: {},
        }
      }

      protected setHeaders(): never {
        throw headerError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await expect(
      renderer.render(createRequest(), reply as never, createRenderOptions())
    ).rejects.toBe(headerError)

    expect(body.destroy).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('suppresses ReadableStream cancel rejections when header setup fails before send', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')
    const headerError = new Error('header failure')
    const cancelError = new Error('cancel failed')
    const unhandledRejection = vi.fn()
    const body = new ReadableStream({
      cancel() {
        throw cancelError
      },
    })

    class TestRenderer extends Renderer {
      async getAsset() {
        return {
          body,
          metadata: {},
        }
      }

      protected setHeaders(): never {
        throw headerError
      }
    }

    process.once('unhandledRejection', unhandledRejection)

    try {
      const renderer = new TestRenderer()
      const reply = createReply()

      await expect(
        renderer.render(createRequest(), reply as never, createRenderOptions())
      ).rejects.toBe(headerError)
      await new Promise((resolve) => setImmediate(resolve))

      expect(unhandledRejection).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
    } finally {
      process.off('unhandledRejection', unhandledRejection)
    }
  })

  it('maps caller aborts while reading imgproxy error bodies to the request-aborted response', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    let fetchSignal: AbortSignal | undefined
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      fetchSignal = init?.signal as AbortSignal
      const errorBody = new ReadableStream<Uint8Array>({
        start(bodyController) {
          fetchSignal?.addEventListener(
            'abort',
            () => {
              bodyController.error(fetchSignal?.reason)
            },
            { once: true }
          )
        },
      })

      return Promise.resolve(new Response(errorBody, { status: 400 }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const reply = createReply()

    const renderPromise = renderer.render(
      createRequest(),
      reply as never,
      createRenderOptions(controller.signal)
    )
    await waitForCondition(() => fetchSignal !== undefined)
    controller.abort(abortError)
    await renderPromise

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('preserves a null caller abort reason while reading imgproxy error bodies', async () => {
    const { ImageRenderer } = await loadRendererModule()

    class TestImageRenderer extends ImageRenderer {
      readRequestError(error: never, signal: AbortSignal) {
        return this.handleRequestError(error, signal)
      }
    }

    const controller = new AbortController()
    const streamError = new Error('imgproxy response failed while aborted')
    const errorBody = new Readable({
      read() {},
    })
    errorBody.on('error', () => {})
    errorBody.destroy(streamError)
    await new Promise((resolve) => setImmediate(resolve))
    controller.abort(null)

    const renderer = new TestImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(
      renderer.readRequestError(
        {
          response: {
            data: errorBody,
            status: 400,
          },
        } as never,
        controller.signal
      )
    ).rejects.toBeNull()
  })

  it('maps undici-style caller abort errors during render to the request-aborted response', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    const controller = new AbortController()
    const callerAbortReason = new DOMException('caller stopped', 'AbortError')
    const abortError = Object.assign(new Error('request aborted'), {
      code: 'UND_ERR_ABORTED',
      cause: callerAbortReason,
      name: 'RequestAbortedError',
    })

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(callerAbortReason)
        throw abortError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
  })

  it('maps nested caller abort causes during render to the request-aborted response', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    const controller = new AbortController()
    const callerAbortReason = new DOMException('caller stopped', 'AbortError')
    const intermediateError = Object.assign(new Error('wrapped abort'), {
      cause: callerAbortReason,
    })
    const abortError = Object.assign(new Error('request aborted'), {
      cause: intermediateError,
    })

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(callerAbortReason)
        throw abortError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
  })

  it('maps storage errors wrapping caller aborts to the request-aborted response', async () => {
    await loadRendererModule()
    const [{ Renderer }, { ERRORS }] = await Promise.all([
      import('./renderer'),
      import('@internal/errors'),
    ])

    const controller = new AbortController()
    const callerAbortReason = new DOMException('caller stopped', 'AbortError')

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(callerAbortReason)
        throw ERRORS.InternalError(callerAbortReason, 'wrapped caller abort')
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
  })

  it('maps nested storage original errors wrapping caller aborts to the request-aborted response', async () => {
    await loadRendererModule()
    const [{ Renderer }, { ERRORS }] = await Promise.all([
      import('./renderer'),
      import('@internal/errors'),
    ])

    const controller = new AbortController()
    const callerAbortReason = new DOMException('caller stopped', 'AbortError')
    const innerError = ERRORS.InternalError(callerAbortReason, 'wrapped caller abort')

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(callerAbortReason)
        throw ERRORS.InternalError(innerError, 'outer wrapped caller abort')
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
  })

  it('maps fresh SDK AbortError instances after caller aborts to the request-aborted response', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    const controller = new AbortController()
    const callerAbortReason = new DOMException('caller stopped', 'AbortError')
    const sdkAbortError = Object.assign(new Error('Request aborted'), {
      name: 'AbortError',
    })

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(callerAbortReason)
        throw sdkAbortError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
  })

  it('maps deep caller abort cause chains without recursive stack growth', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    const controller = new AbortController()
    const callerAbortReason = new DOMException('caller stopped', 'AbortError')
    let abortError: unknown = callerAbortReason
    for (let i = 0; i < 10_000; i += 1) {
      abortError = { cause: abortError }
    }

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(callerAbortReason)
        throw abortError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
  })

  it('does not let throwing error cause getters poison caller abort checks', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    const controller = new AbortController()
    const getterError = new Error('cause getter failed')
    const originalError = Object.defineProperties(new Error('request failed'), {
      cause: {
        get() {
          throw getterError
        },
      },
      originalError: {
        get() {
          throw getterError
        },
      },
    })

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(new DOMException('caller stopped', 'AbortError'))
        throw originalError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await expect(
      renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))
    ).rejects.toBe(originalError)

    expect(reply.status).not.toHaveBeenCalledWith(499)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('does not map unrelated abort-like errors to the request-aborted response', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    const controller = new AbortController()
    const unrelatedAbortError = Object.assign(new Error('unrelated request aborted'), {
      code: 'UND_ERR_ABORTED',
      name: 'RequestAbortedError',
    })

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(new DOMException('caller stopped', 'AbortError'))
        throw unrelatedAbortError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await expect(
      renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))
    ).rejects.toBe(unrelatedAbortError)

    expect(reply.status).not.toHaveBeenCalledWith(499)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('does not map equal-looking abort causes to the request-aborted response', async () => {
    await loadRendererModule()
    const { Renderer } = await import('./renderer')

    const controller = new AbortController()
    const callerAbortReason = new DOMException('caller stopped', 'AbortError')
    const differentAbortReason = new DOMException('caller stopped', 'AbortError')
    const abortError = Object.assign(new Error('request aborted'), {
      cause: differentAbortReason,
      name: 'RequestAbortedError',
    })

    class TestRenderer extends Renderer {
      async getAsset(): Promise<never> {
        controller.abort(callerAbortReason)
        throw abortError
      }
    }

    const renderer = new TestRenderer()
    const reply = createReply()

    await expect(
      renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))
    ).rejects.toBe(abortError)

    expect(reply.status).not.toHaveBeenCalledWith(499)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('normalizes caller aborts without an explicit reason on the fetch path', async () => {
    const controller = new AbortController()
    let innerSignal: AbortSignal | undefined
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      innerSignal = init?.signal as AbortSignal
      controller.abort()
      return Promise.reject(innerSignal.reason)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    const result = await renderer
      .getAsset(createRequest(), createRenderOptions(controller.signal))
      .catch((e: unknown) => e)

    expect(result).toMatchObject({ name: 'AbortError' })
    expect(innerSignal?.reason).toBe(result)
    expect(controller.signal.aborted).toBe(true)
  })

  it.each([
    '',
    0,
  ])('preserves explicit caller abort reason %p on the fetch path', async (abortReason) => {
    const controller = new AbortController()
    let innerSignal: AbortSignal | undefined
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      innerSignal = init?.signal as AbortSignal
      controller.abort(abortReason)
      return Promise.reject(innerSignal.reason)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(
      renderer.getAsset(createRequest(), createRenderOptions(controller.signal))
    ).rejects.toBe(abortReason)
    expect(innerSignal?.reason).toBe(abortReason)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('preserves fetch error details when abort races with a fetch failure', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    const fetchError = new TypeError('network failure')
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() => {
      controller.abort(abortError)
      return Promise.reject(fetchError)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    const result = await renderer
      .getAsset(createRequest(), createRenderOptions(controller.signal))
      .catch((e: unknown) => e)

    expect(result).toMatchObject({
      httpStatusCode: 500,
      message: 'network failure',
    })
    const requestError = (result as { getOriginalError(): unknown }).getOriginalError()
    expect(requestError).toMatchObject({
      message: 'network failure',
      name: 'ImageRendererRequestError',
      originalError: fetchError,
    })
    expect((requestError as { cause?: unknown }).cause).toBe(abortError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps abort-raced fetch failures during render to the request-aborted response', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    const fetchError = new TypeError('network failure')
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() => {
      controller.abort(abortError)
      return Promise.reject(fetchError)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const reply = createReply()

    await renderer.render(createRequest(), reply as never, createRenderOptions(controller.signal))

    expect(reply.status).toHaveBeenCalledWith(499)
    expect(reply.send).toHaveBeenCalledWith(REQUEST_ABORTED_RESPONSE)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'headers',
      'HeadersTimeoutError',
      'UND_ERR_HEADERS_TIMEOUT',
      'Headers Timeout Error',
      'imgproxy headers timeout of 1000ms exceeded',
    ],
    [
      'body',
      'BodyTimeoutError',
      'UND_ERR_BODY_TIMEOUT',
      'Body Timeout Error',
      'imgproxy body timeout of 1000ms exceeded',
    ],
  ])('maps native fetch wrapped undici %s timeout errors to the imgproxy timeout message', async (_timeoutType, errorName, errorCode, errorMessage, expectedMessage) => {
    const mockUndici = await useUndiciMockAgent()

    try {
      const { ImageRenderer } = await loadRendererModule(
        {
          imgProxyHttpMaxSockets: 2,
          imgProxyRequestTimeout: 1,
          imgProxyURL: 'https://imgproxy.example.test/base',
        },
        { mockUndici: false }
      )
      const mockAgent = mockUndici.getMockAgent()
      mockAgent
        .get('https://imgproxy.example.test')
        .intercept({
          method: 'GET',
          path: '/base/public/width:50/resizing_type:fill/plain/local:///tmp/cat.png',
        })
        .replyWithError(
          Object.assign(new Error(errorMessage), {
            code: errorCode,
            name: errorName,
          })
        )
        .times(6)

      const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png')).setTransformations({
        width: 50,
      })
      vi.useFakeTimers()
      const resultPromise = renderer
        .getAsset(createRequest(), createRenderOptions())
        .catch((e) => e)

      await vi.advanceTimersByTimeAsync(EXHAUSTED_RETRY_BACKOFF_MS)
      const result = await resultPromise

      expect(result).toMatchObject({
        httpStatusCode: 500,
        metadata: {
          transformations: ['width:50', 'resizing_type:fill'],
        },
        message: expectedMessage,
      })
      expect((result as { getOriginalError(): unknown }).getOriginalError()).toMatchObject({
        name: 'ImageRendererRequestError',
        originalError: expect.objectContaining({
          cause: expect.objectContaining({
            code: errorCode,
            message: errorMessage,
            name: errorName,
          }),
          message: 'fetch failed',
          name: 'TypeError',
        }),
      })
      mockAgent.assertNoPendingInterceptors()
    } finally {
      vi.useRealTimers()
      await mockUndici.close()
    }
  })

  it('aborts the imgproxy request when the total request budget is exceeded before headers arrive', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal as AbortSignal
          if (signal.aborted) {
            reject(signal.reason)
            return
          }
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    // total budget = request attempts + retry sleeps = 0.01s * 6 + 1000ms * 5 = 5060ms
    const { ImageRenderer } = await loadRendererModule({
      imgProxyRequestTimeout: 0.01,
    })
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const timeoutController = new AbortController()
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal)

    const resultPromise = renderer.getAsset(createRequest(), createRenderOptions())

    timeoutController.abort(new DOMException('timeout', 'TimeoutError'))

    await expect(resultPromise).rejects.toMatchObject({
      httpStatusCode: 500,
      message: 'imgproxy total request timeout of 5060ms exceeded',
    })
    expect(timeoutSpy).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalledWith(5060)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('errors the response stream when the total request budget is exceeded after headers arrive', async () => {
    let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined
    const responseBody = new ReadableStream<Uint8Array>({
      start(controller) {
        bodyController = controller
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseBody))
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule({
      imgProxyRequestTimeout: 0.01,
    })
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))
    const timeoutController = new AbortController()
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal)

    const response = await renderer.getClient().get('/public/plain/local:///tmp/cat.png')
    const bodyRead = readStream(response.data)

    timeoutController.abort(new DOMException('timeout', 'TimeoutError'))
    bodyController?.close()

    await expect(bodyRead).rejects.toMatchObject({ name: 'TimeoutError' })
    expect(timeoutSpy).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalledWith(5060)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('preserves caller abort detection when the total request budget is also configured', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('caller stopped', 'AbortError')
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      const signal = init?.signal as AbortSignal
      controller.abort(abortError)
      return Promise.reject(signal.reason ?? abortError)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule({
      imgProxyRequestTimeout: 0.01,
    })
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(
      renderer.getAsset(createRequest(), createRenderOptions(controller.signal))
    ).rejects.toBe(abortError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps native fetch wrapped undici retry resume failures to an imgproxy range message', async () => {
    const requestRetryError = Object.assign(
      new Error('server does not support the range header and the payload was partially consumed'),
      {
        code: 'UND_ERR_REQ_RETRY',
        name: 'RequestRetryError',
      }
    )
    const fetchError = Object.assign(new TypeError('fetch failed'), {
      cause: requestRetryError,
    })
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(fetchError)
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png')).setTransformations({
      width: 50,
    })

    const result = await renderer.getAsset(createRequest(), createRenderOptions()).catch((e) => e)

    expect(result).toMatchObject({
      httpStatusCode: 500,
      metadata: {
        transformations: ['width:50', 'resizing_type:fill'],
      },
      message: 'imgproxy connection dropped mid-response: retry resume is not supported',
    })
    expect((result as { getOriginalError(): unknown }).getOriginalError()).toMatchObject({
      name: 'ImageRendererRequestError',
      originalError: expect.objectContaining({
        cause: requestRetryError,
        message: 'fetch failed',
        name: 'TypeError',
      }),
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps fetch network failures with transformation metadata', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('network failure'))
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png')).setTransformations({
      width: 50,
    })

    await expect(renderer.getAsset(createRequest(), createRenderOptions())).rejects.toMatchObject({
      httpStatusCode: 500,
      metadata: {
        transformations: ['width:50', 'resizing_type:fill'],
      },
      message: 'network failure',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['plain fetch failure', 'plain fetch failure'],
    [null, 'Unknown request error'],
  ])('maps non-Error fetch failures from %s', async (thrown, message) => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(thrown)
    vi.stubGlobal('fetch', fetchMock)

    const { ImageRenderer } = await loadRendererModule()
    const renderer = new ImageRenderer(createBackend('local:///tmp/cat.png'))

    await expect(renderer.getAsset(createRequest(), createRenderOptions())).rejects.toMatchObject({
      httpStatusCode: 500,
      message,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
