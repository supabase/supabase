import { Readable, Writable } from 'node:stream'
import Fastify, { LogController } from 'fastify'
import pino from 'pino'
import { blobResponse } from './blob-response'

function createApp(lines: string[]) {
  return Fastify({
    loggerInstance: pino(
      { level: 'error' },
      new Writable({
        write(chunk, _encoding, callback) {
          lines.push(chunk.toString())
          callback()
        },
      })
    ),
    logController: new LogController({ disableRequestLogging: true }),
  })
}

describe('blobResponse', () => {
  it('converts Blob payloads to Fastify-compatible web streams', async () => {
    const app = Fastify()
    await app.register(blobResponse)
    app.get('/blob', (_request, reply) =>
      reply.type('application/octet-stream').send(new Blob(['body']))
    )

    try {
      const response = await app.inject('/blob')

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('application/octet-stream')
      expect(response.body).toBe('body')
    } finally {
      await app.close()
    }
  })

  it('preserves already supported payloads', async () => {
    const lines: string[] = []
    const app = createApp(lines)
    await app.register(blobResponse)
    app.get('/json', async () => ({ ok: true }))
    app.get('/buffer', (_request, reply) =>
      reply.type('application/octet-stream').send(Buffer.from('buffer'))
    )
    app.get('/node-stream', (_request, reply) =>
      reply.type('application/octet-stream').send(Readable.from(['node-stream']))
    )
    app.get('/web-stream', (_request, reply) =>
      reply.type('application/octet-stream').send(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('web-stream'))
            controller.close()
          },
        })
      )
    )
    app.get('/response', () => new Response('response'))

    try {
      const responses = await Promise.all(
        ['/json', '/buffer', '/node-stream', '/web-stream', '/response'].map((url) =>
          app.inject(url)
        )
      )

      expect(responses.map((response) => response.statusCode)).toEqual([200, 200, 200, 200, 200])
      expect(responses[0].json()).toEqual({ ok: true })
      expect(responses.slice(1).map((response) => response.body)).toEqual([
        'buffer',
        'node-stream',
        'web-stream',
        'response',
      ])
      expect(lines).toEqual([])
    } finally {
      await app.close()
    }
  })

  it('logs unsupported payload metadata without the query string or payload', async () => {
    const lines: string[] = []
    const app = createApp(lines)
    await app.register(blobResponse)
    app.get('/unsupported/:name', (_request, reply) =>
      reply.type('application/octet-stream').send({ secret: 'do-not-log' })
    )

    try {
      const response = await app.inject('/unsupported/file.txt?token=do-not-log')

      expect(response.statusCode).toBe(500)
      const logs = lines.map((line) => JSON.parse(line) as Record<string, unknown>)
      const log = logs.find((entry) => entry.msg === 'Unsupported Fastify reply payload')

      expect(log).toEqual(
        expect.objectContaining({
          type: 'fastify',
          msg: 'Unsupported Fastify reply payload',
        })
      )
      expect(JSON.parse(String(log?.metadata))).toEqual({
        method: 'GET',
        route: '/unsupported/:name',
        url: '/unsupported/file.txt',
        statusCode: 200,
        contentType: 'application/octet-stream',
        payloadType: 'object',
        payloadConstructor: 'Object',
        payloadTag: '[object Object]',
      })
      expect(lines.join('')).not.toContain('do-not-log')
    } finally {
      await app.close()
    }
  })
})
