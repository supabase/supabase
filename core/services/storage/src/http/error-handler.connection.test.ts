import { once } from 'node:events'
import { IncomingMessage, ServerResponse } from 'node:http'
import { createConnection, Socket } from 'node:net'
import { text } from 'node:stream/consumers'
import { ERRORS, ErrorCode, StorageBackendError } from '@internal/errors'
import { DataStore, Server } from '@tus/server'
import Fastify from 'fastify'
import { setErrorHandler } from './error-handler'
import { closeConnectionAfterResponse, closeConnectionOnError } from './plugins/close-connection'
import { signals } from './plugins/signals'
import { xmlParser } from './plugins/xml'
import { s3ErrorHandler } from './routes/s3/error-handler'
import { authenticatedRoutes } from './routes/tus'
import { onResponseError } from './routes/tus/lifecycle'

describe.each(['HTTP', 'S3', 'TUS'] as const)('%s error connections', (protocol) => {
  it.each([
    {
      name: 'unread body',
      error: ERRORS.InvalidRequest('Upload rejected'),
      consume: false,
      close: true,
    },
    {
      name: 'unread body with an unexpected error',
      error: new Error('boom'),
      consume: false,
      close: true,
    },
    {
      name: 'consumed body',
      error: ERRORS.InvalidRequest('Upload rejected'),
      consume: true,
      close: false,
    },
    {
      name: 'consumed body with an explicit close',
      error: ERRORS.InvalidRequest('Upload rejected').withConnectionClose(),
      consume: true,
      close: true,
    },
    {
      name: 'consumed body with AbortedTerminate',
      error: ERRORS.AbortedTerminate('Upload aborted'),
      consume: true,
      close: true,
    },
    {
      name: 'partial chunked body',
      error: ERRORS.InvalidRequest('Upload rejected'),
      consume: false,
      close: true,
      chunked: true,
    },
  ])('$name', async ({ error, consume, close, chunked }) => {
    const app = Fastify()
    let readableEnded: boolean | undefined
    let serverClosed = false

    if (protocol === 'TUS') {
      const tus = new Server({
        path: '/upload',
        datastore: new DataStore(),
        onIncomingRequest: async (request) => {
          const raw = request.runtime?.node?.req
          if (!raw) throw new Error('Expected a Node request')
          if (consume) await text(raw)
          readableEnded = raw.readableEnded
          throw error
        },
        onResponseError,
      })
      await app.register(authenticatedRoutes, { tusServer: tus })
    } else {
      await app.register(closeConnectionOnError)
      if (protocol === 'S3') {
        await app.register(xmlParser, { disableContentParser: true })
        app.setErrorHandler(s3ErrorHandler)
      } else {
        setErrorHandler(app)
      }
      app.post(
        '/upload',
        {
          onRequest: async (request) => {
            if (consume) await text(request.raw)
            readableEnded = request.raw.readableEnded
            throw error
          },
        },
        async () => 'unreachable'
      )
    }
    app.get('/health', async () => 'ok')

    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const client = createConnection({ host: '127.0.0.1', port: Number(new URL(address).port) })
    client.setEncoding('utf8')
    client.setTimeout(4000, () => client.destroy(new Error('Timed out waiting for response')))
    client.once('end', () => {
      serverClosed = true
    })
    client.on('error', () => {})

    try {
      const received = readResponse(client)
      client.write(
        [
          'POST /upload HTTP/1.1',
          'Host: localhost',
          'Connection: keep-alive',
          'Content-Type: application/offset+octet-stream',
          chunked ? 'Transfer-Encoding: chunked' : `Content-Length: ${consume ? 4 : 100000}`,
          'Tus-Resumable: 1.0.0',
          'Upload-Length: 100000',
          `Accept: ${protocol === 'S3' ? 'application/xml' : '*/*'}`,
          '',
          chunked ? '4\r\nbody\r\n' : 'body',
        ].join('\r\n')
      )
      const { headers, body } = await received
      const storageError = error instanceof StorageBackendError ? error : undefined

      expect(readableEnded).toBe(consume)
      expect(headers).toMatch(new RegExp(`^HTTP/1.1 ${storageError?.httpStatusCode ?? 500} `))
      expect(headers.match(/\r\nconnection: (\S+)/i)?.[1]).toBe(close ? 'close' : 'keep-alive')
      if (protocol === 'HTTP') {
        expect(JSON.parse(body).code).toBe(storageError?.code ?? ErrorCode.InternalError)
      } else if (protocol === 'S3') {
        expect(body).toContain(`<Code>${storageError?.code ?? ErrorCode.InternalError}</Code>`)
      } else {
        expect(headers).toMatch(/\r\ntus-resumable: 1\.0\.0/i)
        expect(body).toContain(error.message)
      }

      if (close) {
        await vi.waitFor(() => expect(serverClosed).toBe(true), { timeout: 4000 })
      } else {
        const nextReceived = readResponse(client)
        client.write('GET /health HTTP/1.1\r\nHost: localhost\r\n\r\n')
        expect((await nextReceived).body).toBe('ok')
      }
    } finally {
      client.destroy()
      await app.close()
    }
  })
})

describe.each(['HTTP', 'S3'] as const)('%s bodyless error connections', (protocol) => {
  it.each([
    { method: 'GET', validation: false },
    { method: 'HEAD', validation: false },
    { method: 'DELETE', validation: false },
    { method: 'OPTIONS', validation: false },
    { method: 'GET', validation: true },
    { method: 'HEAD', validation: true },
    { method: 'DELETE', validation: true },
    { method: 'OPTIONS', validation: true },
    { method: 'POST', validation: false, zeroLength: true },
    { method: 'GET', validation: true, zeroLength: true },
  ] as const)('$method, validation=$validation', async ({ method, validation, zeroLength }) => {
    const app = Fastify()
    await app.register(closeConnectionOnError)
    if (protocol === 'S3') app.setErrorHandler(s3ErrorHandler)
    else setErrorHandler(app)
    app.route({
      method,
      url: '/error',
      schema: validation ? { querystring: { type: 'object', required: ['missing'] } } : undefined,
      handler: () => {
        throw ERRORS.InvalidRequest('Read rejected')
      },
    })
    app.get('/health', async () => 'ok')
    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const client = createConnection({ host: '127.0.0.1', port: Number(new URL(address).port) })
    client.setEncoding('utf8')
    client.setTimeout(4000, () => client.destroy(new Error('Timed out waiting for response')))

    try {
      const received = readResponse(client, method === 'HEAD')
      client.write(
        `${method} /error HTTP/1.1\r\nHost: localhost\r\n${zeroLength ? 'Content-Length: 0\r\n' : ''}\r\n`
      )
      const { headers } = await received
      expect(headers).toMatch(/^HTTP\/1.1 400 /)
      expect(headers).toMatch(/\r\nconnection: keep-alive/i)

      const nextReceived = readResponse(client)
      client.write('GET /health HTTP/1.1\r\nHost: localhost\r\n\r\n')
      expect((await nextReceived).body).toBe('ok')
    } finally {
      client.destroy()
      await app.close()
    }
  })
})

describe('staged close', () => {
  it('half-closes the socket after the rejection and keeps draining until the client closes', async () => {
    const app = Fastify()
    await app.register(closeConnectionOnError)
    setErrorHandler(app)
    let serverSocket: Socket | undefined
    app.post(
      '/upload',
      {
        onRequest: async (request) => {
          serverSocket = request.raw.socket
          throw ERRORS.InvalidRequest('Upload rejected')
        },
      },
      async () => 'unreachable'
    )
    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const client = createConnection({ host: '127.0.0.1', port: Number(new URL(address).port) })
    client.setEncoding('utf8')
    client.setTimeout(4000, () => client.destroy(new Error('Timed out waiting for response')))
    const errors: string[] = []
    client.on('error', (error: NodeJS.ErrnoException) => errors.push(error.code ?? error.message))

    try {
      const received = readResponse(client)
      client.write('POST /upload HTTP/1.1\r\nHost: localhost\r\nContent-Length: 2048\r\n\r\n')
      client.write(Buffer.alloc(1024))
      const { headers } = await received
      expect(headers).toMatch(/\r\nconnection: close/i)

      // FIN is sent but the socket stays open to drain the rest of the body.
      // Destroying it here would answer the client next chunk with a TCP reset
      // that can discard the response.
      await vi.waitFor(() => expect(serverSocket?.writableEnded).toBe(true))
      expect(serverSocket?.destroyed).toBe(false)

      client.end(Buffer.alloc(1024))
      await vi.waitFor(() => expect(serverSocket?.destroyed).toBe(true))
      expect(errors).toEqual([])
    } finally {
      client.destroy()
      await app.close()
    }
  })

  it.each([
    'same read',
    'incomplete second body',
    'before finish',
    'backpressured response',
    'after response',
  ])('does not process a request pipelined behind the rejected body: %s', async (timing) => {
    const logErrors: string[] = []
    const app = Fastify({
      logger: {
        level: 'error',
        stream: {
          write: (line: string) => {
            logErrors.push(line)
          },
        },
      },
    })
    await app.register(closeConnectionOnError)
    await app.register(signals)
    setErrorHandler(app)
    let serverSocket: Socket | undefined
    const responseReady = Promise.withResolvers<void>()
    const sendResponse = Promise.withResolvers<void>()
    const secondParsed = Promise.withResolvers<void>()
    const secondClosed = Promise.withResolvers<void>()
    app.server.on('request', (request) => {
      if (request.url === '/second') {
        request.once('close', secondClosed.resolve)
        secondParsed.resolve()
      }
    })
    app.addHook('onSend', (request, _reply, payload, done) => {
      if (request.url === '/upload' && timing === 'before finish') {
        responseReady.resolve()
        void sendResponse.promise.then(() => done(null, payload))
      } else {
        done(null, payload)
      }
    })
    app.addContentTypeParser('application/octet-stream', (_request, _payload, done) => done(null))
    app.post(
      '/upload',
      {
        onRequest: (request, _reply, done) => {
          serverSocket = request.raw.socket
          done(
            ERRORS.InvalidRequest(
              timing === 'backpressured response' ? 'x'.repeat(8 * 1024 * 1024) : 'Upload rejected'
            )
          )
        },
      },
      async () => 'unreachable'
    )
    const secondStarted = vi.fn()
    const secondHandled = vi.fn(async () => 'second')
    app.post(
      '/second',
      {
        onRequest: async () => {
          secondStarted()
        },
      },
      secondHandled
    )
    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const client = createConnection({ host: '127.0.0.1', port: Number(new URL(address).port) })
    client.setEncoding('utf8')
    client.setTimeout(4000, () => client.destroy(new Error('Timed out waiting for response')))
    const errors: string[] = []
    client.on('error', (error: NodeJS.ErrnoException) => errors.push(error.code ?? error.message))
    if (timing === 'backpressured response') client.pause()

    try {
      const received = readResponse(client)
      const prefix = 'POST /upload HTTP/1.1\r\nHost: localhost\r\nContent-Length: 8\r\n\r\nabcd'
      const remainder =
        'efghPOST /second HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/octet-stream\r\n' +
        (timing === 'incomplete second body'
          ? 'Content-Length: 8\r\n\r\nbody'
          : 'Content-Length: 0\r\n\r\n')
      if (timing === 'same read' || timing === 'incomplete second body') {
        client.end(prefix + remainder)
      } else {
        client.write(prefix)
        if (timing === 'before finish') {
          await responseReady.promise
          client.end(remainder)
          await secondParsed.promise
          sendResponse.resolve()
        } else if (timing === 'backpressured response') {
          await vi.waitFor(() => expect(serverSocket?.writableNeedDrain).toBe(true))
          client.end(remainder)
          await secondParsed.promise
          client.resume()
        }
      }
      const { headers, body } = await received
      expect(headers).toMatch(/^HTTP\/1.1 400 /)
      expect(headers).toMatch(/\r\nconnection: close/i)
      expect(JSON.parse(body).code).toBe(ErrorCode.InvalidRequest)

      if (timing === 'after response') client.end(remainder)
      await vi.waitFor(() => expect(serverSocket?.destroyed).toBe(true))
      if (timing === 'incomplete second body') await secondClosed.promise
      expect(secondStarted).not.toHaveBeenCalled()
      expect(secondHandled).not.toHaveBeenCalled()
      expect(errors).toEqual([])
      expect(logErrors).toEqual([])
    } finally {
      sendResponse.resolve()
      client.destroy()
      await app.close()
    }
  })
})

describe('connection close fallback', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it.each(['before', 'after'])('clears the timer on socket close %s finish', (when) => {
    const socket = new Socket()
    const request = new IncomingMessage(socket)
    request.headers = { 'content-length': '100000' }
    const response = new ServerResponse(request)

    closeConnectionAfterResponse(request, response)
    if (when === 'before') {
      socket.destroy()
      socket.emit('close')
    }
    response.emit('finish')
    if (when === 'after') socket.emit('close')

    expect(vi.getTimerCount()).toBe(0)
    socket.destroy()
  })

  it('keeps a fully received body alive even if its stream has not been consumed', () => {
    const socket = new Socket()
    const request = new IncomingMessage(socket)
    request.headers = { 'content-length': '4' }
    request.complete = true
    const response = new ServerResponse(request)

    expect(request.readableEnded).toBe(false)
    closeConnectionAfterResponse(request, response)
    response.emit('finish')

    expect(response.getHeader('connection')).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
    socket.destroy()
  })

  it.each([
    false,
    true,
  ])('destroys a stuck socket after the grace period, complete=%s', async (complete) => {
    const socket = new Socket()
    const request = new IncomingMessage(socket)
    request.headers = { 'content-length': '100000' }
    request.complete = complete
    if (complete) {
      request.resume()
      request.push(null)
      await once(request, 'close')
      expect(request.closed).toBe(true)
    }
    const response = new ServerResponse(request)
    const end = vi.spyOn(socket, 'end').mockImplementation(() => socket)
    const destroy = vi.spyOn(socket, 'destroy').mockImplementation(() => socket)

    closeConnectionAfterResponse(request, response, ERRORS.AbortedTerminate('rejected'))
    response.emit('finish')
    expect(end).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(2999)
    expect(destroy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)

    expect(destroy).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    expect(socket.listenerCount('close')).toBe(0)
    socket.destroy()
  })

  it('shares one unreferenced timer across repeated calls', () => {
    const socket = new Socket()
    vi.spyOn(socket, 'end').mockImplementation(() => socket)
    const request = new IncomingMessage(socket)
    request.headers = { 'content-length': '100000' }
    const response = new ServerResponse(request)
    const timeout = vi.spyOn(globalThis, 'setTimeout')

    closeConnectionAfterResponse(request, response)
    closeConnectionAfterResponse(request, response)
    expect(response.listenerCount('finish')).toBe(1)
    response.emit('finish')
    closeConnectionAfterResponse(request, response)

    expect(vi.getTimerCount()).toBe(1)
    expect(timeout.mock.results[0].value.hasRef()).toBe(false)
    socket.emit('close')
    expect(vi.getTimerCount()).toBe(0)
    socket.destroy()
  })

  it('removes the pending finish callback if the socket closes first', () => {
    const socket = new Socket()
    const request = new IncomingMessage(socket)
    request.headers = { 'content-length': '100000' }
    const response = new ServerResponse(request)

    closeConnectionAfterResponse(request, response)
    socket.destroy()
    socket.emit('close')
    expect(response.listenerCount('finish')).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})

function readResponse(socket: Socket, head = false): Promise<{ headers: string; body: string }> {
  return new Promise((resolve, reject) => {
    let response = ''
    socket.once('error', reject)
    const onEnd = () => reject(new Error('Connection ended before the complete response'))
    socket.once('end', onEnd)
    const onData = (chunk: string) => {
      response += chunk
      const separator = response.indexOf('\r\n\r\n')
      if (separator === -1) return
      const headers = response.slice(0, separator)
      const length = headers.match(/\r\ncontent-length: (\d+)/i)
      if (!head && !length) return reject(new Error('Expected a Content-Length response header'))
      const body = response.slice(separator + 4)
      if (!head && Buffer.byteLength(body) < Number(length?.[1])) return
      socket.off('data', onData)
      socket.off('error', reject)
      socket.off('end', onEnd)
      resolve({ headers, body })
    }
    socket.on('data', onData)
  })
}
