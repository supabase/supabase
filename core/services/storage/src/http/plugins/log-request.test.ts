import { Writable } from 'node:stream'
import Fastify, { LogController } from 'fastify'
import pino from 'pino'
import { logRequest } from './log-request'
import { requestContext } from './request-context'

function createApp(lines: string[]) {
  return Fastify({
    logController: new LogController({ disableRequestLogging: true }),
    loggerInstance: pino(
      {
        level: 'info',
        serializers: {
          req: (request) => request,
          res: (reply) => reply,
        },
      },
      new Writable({
        write(chunk, _encoding, callback) {
          lines.push(chunk.toString())
          callback()
        },
      })
    ),
  })
}

describe('log-request plugin', () => {
  let app: ReturnType<typeof createApp>
  let lines: string[]

  beforeEach(async () => {
    lines = []
    app = createApp(lines)

    app.decorateRequest('tenantId', 'tenant-a')
    await app.register(requestContext)
    await app.register(logRequest({}))

    app.get('/request-log', async (_request, reply) => {
      reply.header('etag', 'test-etag')
      reply.header('x-secret-response', 'hidden-response')

      return { ok: true }
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('derives resources from route params and prefixes them', async () => {
    app.get('/bucket/:bucket/object/:name', async (request) => {
      return {
        resources: request.resources,
      }
    })

    const response = await app.inject({
      method: 'GET',
      url: '/bucket/demo/object/file.txt',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      resources: ['/demo/file.txt'],
    })
  })

  it('prefers configured resources and normalizes missing leading slashes', async () => {
    app.get(
      '/bucket/:bucket',
      {
        config: {
          resources: () => ['bucket/demo', '/object/demo'],
        },
      },
      async (request) => {
        return {
          resources: request.resources,
        }
      }
    )

    const response = await app.inject({
      method: 'GET',
      url: '/bucket/demo',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      resources: ['/bucket/demo', '/object/demo'],
    })
  })

  it('threads sbReqId into the request log data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/request-log',
      headers: {
        'sb-request-id': 'sb-req-123',
      },
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))

    expect(requestLogLine).toBeDefined()
    expect(requestLogLine).toContain('"sbReqId":"sb-req-123"')
    expect(requestLogLine).not.toContain('"request_id"')
  })

  it('threads traceId and spanId from a valid traceparent header into the request log data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/request-log',
      headers: {
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      },
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))
    expect(requestLogLine).toBeDefined()

    const requestLog = JSON.parse(requestLogLine ?? '{}')
    expect(requestLog.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
    expect(requestLog.spanId).toBe('00f067aa0ba902b7')
    expect(requestLog).not.toHaveProperty('trace_id')
    expect(requestLog).not.toHaveProperty('span_id')
  })

  it('logs empty traceId and spanId values when traceparent is malformed', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/request-log',
      headers: {
        traceparent: 'malformed-value',
      },
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))
    expect(requestLogLine).toBeDefined()

    const requestLog = JSON.parse(requestLogLine ?? '{}')
    expect(requestLog.traceId).toBe('')
    expect(requestLog.spanId).toBe('')
    expect(requestLog).not.toHaveProperty('trace_id')
    expect(requestLog).not.toHaveProperty('span_id')
  })

  it('logs empty traceId and spanId values when traceparent is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/request-log',
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))
    expect(requestLogLine).toBeDefined()

    const requestLog = JSON.parse(requestLogLine ?? '{}')
    expect(requestLog.traceId).toBe('')
    expect(requestLog.spanId).toBe('')
    expect(requestLog).not.toHaveProperty('trace_id')
    expect(requestLog).not.toHaveProperty('span_id')
  })

  it('threads tenant context into the request log data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/request-log',
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))

    expect(requestLogLine).toBeDefined()
    expect(requestLogLine).toContain('"tenantId":"tenant-a"')
    expect(requestLogLine).toContain('"project":"tenant-a"')
  })

  it('keeps configured route metadata in request logs', async () => {
    app.get(
      '/metadata-log',
      {
        config: {
          logMetadata: () => ({
            bucketId: 'bucket-a',
            objectName: 'file.txt',
          }),
        },
      },
      async () => {
        return { ok: true }
      }
    )

    const response = await app.inject({
      method: 'GET',
      url: '/metadata-log',
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))
    expect(requestLogLine).toBeDefined()

    const requestLog = JSON.parse(requestLogLine ?? '{}')

    expect(JSON.parse(requestLog.reqMetadata)).toEqual({
      bucketId: 'bucket-a',
      objectName: 'file.txt',
    })
  })

  it('logs executionTime as integer milliseconds', async () => {
    let now = 100.25
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => {
      now += 0.501
      return now
    })

    const response = await app.inject({
      method: 'GET',
      url: '/request-log',
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))
    expect(requestLogLine).toBeDefined()

    const requestLog = JSON.parse(requestLogLine ?? '{}')

    expect(requestLog.executionTime).toBeGreaterThan(0)
    expect(Number.isInteger(requestLog.executionTime)).toBe(true)

    nowSpy.mockRestore()
  })

  it('logs redacted urls without leaking sensitive request data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/request-log?token=hidden-query&keep=visible',
      headers: {
        authorization: 'Bearer hidden-auth',
        'x-client-info': 'storage-js',
        'x-forwarded-proto': 'https',
      },
    })

    expect(response.statusCode).toBe(200)

    const requestLogLine = lines.find((line) => line.includes('"type":"request"'))
    expect(requestLogLine).toBeDefined()

    const requestLog = JSON.parse(requestLogLine ?? '{}')
    const serializedLog = JSON.stringify(requestLog)

    expect(requestLog.msg).toContain('/request-log?token=redacted&keep=visible')
    expect(requestLog.req).toMatchObject({
      method: 'GET',
      url: '/request-log?token=redacted&keep=visible',
    })
    expect(requestLog.res).toMatchObject({
      headers: {
        etag: 'test-etag',
      },
    })
    expect(serializedLog).not.toContain('hidden-query')
    expect(serializedLog).not.toContain('hidden-auth')
    expect(serializedLog).not.toContain('hidden-response')
  })

  it('logs redacted urls for aborted response logs without reply metadata', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/request-log?token=hidden-query&keep=visible',
      simulate: {
        close: true,
        end: true,
        error: false,
        split: false,
      },
    })

    expect(response.statusCode).toBe(200)

    const abortedLogLine = lines.find((line) => line.includes('ABORTED RES'))
    expect(abortedLogLine).toBeDefined()

    const abortedLog = JSON.parse(abortedLogLine ?? '{}')
    const serializedLog = JSON.stringify(abortedLog)

    expect(abortedLog.msg).toContain('ABORTED RES')
    expect(abortedLog.msg).toContain('/request-log?token=redacted&keep=visible')
    expect(abortedLog.req).toMatchObject({
      method: 'GET',
      url: '/request-log?token=redacted&keep=visible',
    })
    expect(abortedLog.res).toBeUndefined()
    expect(serializedLog).not.toContain('hidden-query')
  })

  it('does not evaluate configured resources when request resources already exist', async () => {
    const configuredResources = vi.fn(() => {
      throw new Error('resources config should not run')
    })

    app.addHook('onRequest', async (request) => {
      request.resources = ['/preset/resource']
    })

    app.get(
      '/bucket/:bucket',
      {
        config: {
          resources: configuredResources,
        },
      },
      async (request) => {
        return {
          resources: request.resources,
        }
      }
    )

    const response = await app.inject({
      method: 'GET',
      url: '/bucket/demo',
    })

    expect(response.statusCode).toBe(200)
    expect(configuredResources).not.toHaveBeenCalled()
    expect(response.json()).toEqual({
      resources: ['/preset/resource'],
    })
  })
})
