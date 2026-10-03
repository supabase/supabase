import { Writable } from 'node:stream'
import { vi } from 'vitest'

const mockedLoggerModules = ['pino', '../../config'] as const

function setupLoggerMocks(configOverrides: Record<string, unknown> = {}) {
  const loggerStub = {
    child: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    flush: vi.fn(),
    info: vi.fn(),
    level: 'info',
    silent: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
  }
  loggerStub.child.mockReturnValue(loggerStub)

  const pinoMock = Object.assign(
    vi.fn(() => loggerStub),
    {
      stdTimeFunctions: {
        epochTime: vi.fn(),
        isoTime: vi.fn(),
      },
    }
  )

  vi.doMock('pino', () => ({
    default: pinoMock,
    Logger: class Logger {},
  }))
  vi.doMock('../../config', () => ({
    getConfig: vi.fn(() => ({
      logLevel: 'info',
      logflareApiKey: undefined,
      logflareBatchSize: 1,
      logflareEnabled: false,
      logflareSourceToken: undefined,
      region: 'local',
      ...configOverrides,
    })),
  }))

  return { pinoMock }
}

describe('logger serializers', () => {
  async function createRequestUrlRedactor() {
    setupLoggerMocks()
    const { serializeRequestLog } = await import('./logger')

    return (url: string, query?: unknown) =>
      serializeRequestLog({
        id: 'trace-1',
        method: 'GET',
        url,
        ...(query === undefined ? {} : { query }),
        headers: {},
        hostname: 'storage.test',
        ip: '127.0.0.1',
        protocol: 'https',
        socket: { remotePort: 1234 },
      } as never).url
  }

  afterEach(() => {
    for (const moduleId of mockedLoggerModules) {
      vi.doUnmock(moduleId)
    }

    vi.restoreAllMocks()
    vi.resetModules()
  })

  test('serializeRequestLog redacts sensitive query params and whitelists headers', async () => {
    setupLoggerMocks()
    const { serializeRequestLog } = await import('./logger')

    const request = {
      id: 'trace-1',
      method: 'GET',
      url: '/object?token=hidden-query&keep=visible',
      headers: {
        authorization: 'Bearer hidden-auth',
        'x-client-info': 'storage-js',
      },
      hostname: 'storage.test',
      ip: '127.0.0.1',
      protocol: 'https',
      socket: { remotePort: 1234 },
    } as never

    expect(serializeRequestLog(request)).toEqual({
      region: 'local',
      traceId: 'trace-1',
      method: 'GET',
      url: '/object?token=redacted&keep=visible',
      headers: { x_client_info: 'storage-js' },
      hostname: 'storage.test',
      remoteAddress: '127.0.0.1',
      remotePort: 1234,
    })
  })

  test('redactLogUrl redacts sensitive keys from the parsed query', async () => {
    const redact = await createRequestUrlRedactor()

    expect(redact('/o?token=secret&keep=1', { token: 'secret', keep: '1' })).toBe(
      '/o?token=redacted&keep=1'
    )
  })

  test('redactLogUrl redacts encoded sensitive keys from the parsed query', async () => {
    const redact = await createRequestUrlRedactor()

    expect(redact('/o?to%6Ben=leaked-jwt', { token: 'leaked-jwt' })).toBe('/o?token=redacted')
  })

  test('redactLogUrl leaves URLs untouched when the parsed query has no sensitive keys', async () => {
    const redact = await createRequestUrlRedactor()

    expect(redact('/o?tokenizer=foo', { tokenizer: 'foo' })).toBe('/o?tokenizer=foo')
    expect(redact('/o?keep=visible', { keep: 'visible' })).toBe('/o?keep=visible')
  })

  test('redactLogUrl redacts exact sensitive keys when no parsed query is available', async () => {
    const redact = await createRequestUrlRedactor()

    expect(redact('/o?a=1&X-Amz-Signature=sig&b=2')).toBe('/o?a=1&X-Amz-Signature=redacted&b=2')
  })

  test('redactLogUrl redacts encoded sensitive keys when no parsed query is available', async () => {
    const redact = await createRequestUrlRedactor()

    expect(redact('/o?X-Amz-%53ignature=leaked-sig')).toBe('/o?X-Amz-Signature=redacted')
  })

  test('redactLogUrl does not redact sensitive key prefixes or suffixes', async () => {
    const redact = await createRequestUrlRedactor()

    expect(redact('/o?tokenizer=foo')).toBe('/o?tokenizer=foo')
    expect(redact('/o?notX-Amz-Signature=foo')).toBe('/o?notX-Amz-Signature=foo')
  })

  test('redactLogUrl does not treat path ampersands as query separators', async () => {
    const redact = await createRequestUrlRedactor()

    expect(redact('/object/sign/bucket/a&b.txt?token=leaked-jwt')).toBe(
      '/object/sign/bucket/a&b.txt?token=redacted'
    )
  })

  test('serializeReplyLog whitelists reply headers and tolerates undefined replies', async () => {
    setupLoggerMocks()
    const { serializeReplyLog } = await import('./logger')

    expect(serializeReplyLog(undefined)).toBeUndefined()

    const getHeaders = vi.fn(() => ({ etag: 'fresh-etag', 'x-secret-response': 'hidden' }))
    expect(serializeReplyLog({ statusCode: 200, getHeaders } as never)).toEqual({
      statusCode: 200,
      headers: { etag: 'fresh-etag' },
    })
    expect(getHeaders).toHaveBeenCalledTimes(1)
  })

  test('base req/res serializers pass through safe logs and sanitize raw fastify values', async () => {
    const { pinoMock } = setupLoggerMocks()
    const { serializeReplyLog, serializeRequestLog } = await import('./logger')

    const pinoCalls = pinoMock.mock.calls as unknown as Array<
      [
        {
          serializers: {
            req: (request: unknown) => unknown
            res: (reply: unknown) => unknown
          }
          timestamp: () => string
        },
      ]
    >
    const pinoCall = pinoCalls.at(0)
    expect(pinoCall).toBeDefined()
    expect(pinoCall![0].timestamp).toBe(pinoMock.stdTimeFunctions.epochTime)
    const serializers = pinoCall![0].serializers
    const serializedRequest = serializeRequestLog({
      id: 'trace-1',
      method: 'GET',
      url: '/object?token=redacted',
      headers: { 'x-client-info': 'storage-js' },
      hostname: 'storage.test',
      ip: '127.0.0.1',
      protocol: 'https',
      socket: { remotePort: 1234 },
    } as never)
    const serializedReply = serializeReplyLog({
      statusCode: 200,
      getHeaders: vi.fn(() => ({ etag: 'fresh-etag' })),
    } as never)!

    expect(serializers.req(serializedRequest)).toBe(serializedRequest)
    expect(serializers.res(serializedReply)).toBe(serializedReply)

    const clonedRequest = {
      ...serializedRequest,
      url: '/object?token=hidden-query&keep=visible',
      headers: {
        ...serializedRequest.headers,
        authorization: 'Bearer hidden-auth',
      },
      rawHeaders: ['authorization: hidden-auth'],
    }
    const clonedReply = {
      ...serializedReply,
      headers: {
        ...serializedReply.headers,
        set_cookie: 'hidden-cookie',
      },
      secretHeaders: ['set-cookie'],
    }

    expect(serializers.req(clonedRequest)).toBeUndefined()
    expect(serializers.res(clonedReply)).toEqual({
      statusCode: 200,
      headers: {},
    })

    const rawRequest = {
      id: 'trace-raw',
      traceId: 'spoofed-trace-id',
      method: 'GET',
      url: '/object?token=hidden-query&keep=visible',
      headers: {
        authorization: 'Bearer hidden-auth',
        cookie: 'hidden-cookie',
        'x-client-info': 'storage-js',
      },
      hostname: 'storage.test',
      ip: '127.0.0.1',
      protocol: 'https',
      socket: { remotePort: 4321 },
      circular: undefined as unknown,
    }
    rawRequest.circular = rawRequest

    const rawReply = {
      statusCode: 201,
      getHeaders: vi.fn(() => ({
        etag: 'fresh-etag',
        'set-cookie': 'hidden-cookie',
      })),
    }
    const partialReply = {
      statusCode: 202,
      headers: { etag: 'hidden-etag' },
      secretHeaders: ['set-cookie'],
    }

    expect(serializers.req(rawRequest)).toEqual({
      region: 'local',
      traceId: 'trace-raw',
      method: 'GET',
      url: '/object?token=redacted&keep=visible',
      headers: { x_client_info: 'storage-js' },
      hostname: 'storage.test',
      remoteAddress: '127.0.0.1',
      remotePort: 4321,
    })
    expect(serializers.res(rawReply)).toEqual({
      statusCode: 201,
      headers: { etag: 'fresh-etag' },
    })
    expect(rawReply.getHeaders).toHaveBeenCalledTimes(1)
    expect(serializers.res(partialReply)).toEqual({
      statusCode: 202,
      headers: {},
    })

    const serializedRawValues = JSON.stringify({
      clonedRes: serializers.res(clonedReply),
      req: serializers.req(rawRequest),
      res: serializers.res(rawReply),
      partialRes: serializers.res(partialReply),
    })
    expect(serializedRawValues).not.toContain('hidden-query')
    expect(serializedRawValues).not.toContain('hidden-auth')
    expect(serializedRawValues).not.toContain('hidden-cookie')
  })

  test('serializeRequestLogToJson emits schema JSON, dropping unknown keys and absent optionals', async () => {
    setupLoggerMocks()
    const { serializeRequestLog, serializeRequestLogToJson } = await import('./logger')

    const request = {
      id: 'trace-1',
      method: 'GET',
      url: '/object?keep=visible',
      headers: { 'x-client-info': 'storage-js' },
      hostname: 'storage.test',
      ip: '127.0.0.1',
      protocol: 'https',
      socket: { remotePort: undefined },
    } as never

    const json = serializeRequestLogToJson(serializeRequestLog(request))

    expect(JSON.parse(json)).toEqual({
      region: 'local',
      traceId: 'trace-1',
      method: 'GET',
      url: '/object?keep=visible',
      headers: { x_client_info: 'storage-js' },
      hostname: 'storage.test',
      remoteAddress: '127.0.0.1',
    })
    expect(json).not.toContain('remotePort')
  })

  test('serializeReplyLogToJson emits schema JSON for the reply payload', async () => {
    setupLoggerMocks()
    const { serializeReplyLog, serializeReplyLogToJson } = await import('./logger')

    const reply = serializeReplyLog({
      statusCode: 200,
      getHeaders: vi.fn(() => ({ etag: 'fresh-etag' })),
    } as never)!

    expect(JSON.parse(serializeReplyLogToJson(reply))).toEqual({
      statusCode: 200,
      headers: { etag: 'fresh-etag' },
    })
  })

  test('base logger registers compiled req/res stringifiers on child loggers', async () => {
    const lines: string[] = []
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString())
        callback()
      },
    })

    vi.doMock('pino', async () => {
      type PinoFactory = typeof import('pino')
      const actual = await vi.importActual<{ default: PinoFactory } & Record<string, unknown>>(
        'pino'
      )
      const actualPino = actual.default
      const pinoMock = Object.assign(
        vi.fn((options: unknown) =>
          actualPino(
            {
              ...((options ?? {}) as Record<string, unknown>),
              base: null,
              timestamp: false,
              transport: undefined,
            } as never,
            stream as never
          )
        ),
        actualPino,
        {
          stdTimeFunctions: actualPino.stdTimeFunctions,
          symbols: actualPino.symbols,
        }
      )

      return {
        ...actual,
        default: pinoMock,
      }
    })
    vi.doMock('../../config', () => ({
      getConfig: vi.fn(() => ({
        logLevel: 'info',
        logflareApiKey: undefined,
        logflareBatchSize: 1,
        logflareEnabled: false,
        logflareSourceToken: undefined,
        region: 'local',
        version: 'test-version',
      })),
    }))

    const { logger, serializeReplyLog, serializeRequestLog } = await import('./logger')
    const req = serializeRequestLog({
      id: 'trace-1',
      method: 'GET',
      url: '/object?token=hidden-query&keep=visible',
      query: { token: 'hidden-query', keep: 'visible' },
      headers: {
        authorization: 'Bearer hidden-auth',
        'x-client-info': 'storage-js',
      },
      hostname: 'storage.test',
      ip: '127.0.0.1',
      protocol: 'https',
      socket: { remotePort: 1234 },
    } as never)
    const res = serializeReplyLog({
      statusCode: 200,
      getHeaders: vi.fn(() => ({
        etag: 'fresh-etag',
        'set-cookie': 'hidden-cookie',
      })),
    } as never)!

    ;(req as unknown as Record<string, unknown>).unknownRequestField = 'dropped-request-field'
    ;(res as unknown as Record<string, unknown>).unknownReplyField = 'dropped-reply-field'

    logger.info({ req, res }, 'compiled serializer smoke')

    expect(lines).toHaveLength(1)
    const log = JSON.parse(lines[0])
    expect(log.req).toEqual({
      region: 'local',
      traceId: 'trace-1',
      method: 'GET',
      url: '/object?token=redacted&keep=visible',
      headers: { x_client_info: 'storage-js' },
      hostname: 'storage.test',
      remoteAddress: '127.0.0.1',
      remotePort: 1234,
    })
    expect(log.res).toEqual({
      statusCode: 200,
      headers: { etag: 'fresh-etag' },
    })

    const serializedLog = JSON.stringify(log)
    expect(serializedLog).not.toContain('hidden-query')
    expect(serializedLog).not.toContain('hidden-auth')
    expect(serializedLog).not.toContain('hidden-cookie')
    expect(serializedLog).not.toContain('dropped-request-field')
    expect(serializedLog).not.toContain('dropped-reply-field')
  })

  test('buildTransport wires logflare hooks when logflare is enabled', async () => {
    setupLoggerMocks({
      logLevel: 'debug',
      logflareApiKey: 'api-key',
      logflareBatchSize: 25,
      logflareEnabled: true,
      logflareSourceToken: 'source-token',
    })
    const { buildTransport } = await import('./logger')
    interface LogflareTransportOptions {
      apiKey: string
      sourceToken: string
      batchSize: number
      onPreparePayload: { module: string; method: string }
      onError: { module: string; method: string }
    }
    const transport = buildTransport() as {
      targets: Array<{
        level: string
        target: string
        options: LogflareTransportOptions
      }>
    }

    const logflareTarget = transport.targets.find((target) => target.target === 'pino-logflare')

    expect(logflareTarget).toMatchObject({
      level: 'debug',
      target: 'pino-logflare',
      options: {
        apiKey: 'api-key',
        sourceToken: 'source-token',
        batchSize: 25,
        onPreparePayload: {
          method: 'onPreparePayload',
        },
        onError: {
          method: 'onError',
        },
      },
    })
    expect(logflareTarget?.options.onPreparePayload.module).toMatch(/logflare$/)
    expect(logflareTarget?.options.onPreparePayload.module).toBe(
      logflareTarget?.options.onError.module
    )
  })
})
