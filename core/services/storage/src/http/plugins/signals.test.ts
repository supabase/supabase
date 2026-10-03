import { EventEmitter, once } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { request as httpRequest } from 'node:http'
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { RequestSignals, signals as signalsPlugin } from './signals'

class FakeReq extends EventEmitter {
  aborted = false
}

class FakeRes extends EventEmitter {
  closed = false
  writableFinished = false
}

function build() {
  const req = new FakeReq()
  const res = new FakeRes()
  const signals = new RequestSignals(
    req as unknown as IncomingMessage,
    res as unknown as ServerResponse
  )
  return { req, res, signals }
}

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), 1000)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

describe('RequestSignals', () => {
  it('does not wire socket listeners until a signal is accessed', () => {
    const { req, res, signals } = build()

    expect(req.listenerCount('close')).toBe(0)
    expect(res.listenerCount('close')).toBe(0)

    // touch a signal
    void signals.body

    expect(req.listenerCount('close')).toBe(1)
    expect(res.listenerCount('close')).toBe(1)
  })

  it('wires the socket listeners only once across multiple accesses', () => {
    const { req, res, signals } = build()

    void signals.body
    void signals.response
    void signals.disconnect

    expect(req.listenerCount('close')).toBe(1)
    expect(res.listenerCount('close')).toBe(1)
  })

  it('returns the same controller instance on repeated access', () => {
    const { signals } = build()
    expect(signals.body).toBe(signals.body)
    expect(signals.disconnect).toBe(signals.disconnect)
  })

  it('aborts body and disconnect when the request closes after being aborted', () => {
    const { req, signals } = build()

    const body = signals.body
    const disconnect = signals.disconnect
    const response = signals.response

    req.aborted = true
    req.emit('close')

    expect(body.signal.aborted).toBe(true)
    expect(disconnect.signal.aborted).toBe(true)
    expect(response.signal.aborted).toBe(false)
  })

  it('does not abort body when the request closes cleanly', () => {
    const { req, signals } = build()

    const body = signals.body
    req.aborted = false
    req.emit('close')

    expect(body.signal.aborted).toBe(false)
  })

  it('aborts response and disconnect when the response closes before finishing', () => {
    const { res, signals } = build()

    const body = signals.body
    const response = signals.response
    const disconnect = signals.disconnect

    res.writableFinished = false
    res.emit('close')

    expect(response.signal.aborted).toBe(true)
    expect(disconnect.signal.aborted).toBe(true)
    expect(body.signal.aborted).toBe(false)
  })

  it('does not abort response when the response finishes normally', () => {
    const { res, signals } = build()

    const response = signals.response
    res.writableFinished = true
    res.emit('close')

    expect(response.signal.aborted).toBe(false)
  })

  it('aborts immediately when accessed after the request was already aborted', () => {
    const { req, signals } = build()
    req.aborted = true

    expect(signals.body.signal.aborted).toBe(true)
    expect(signals.disconnect.signal.aborted).toBe(true)
  })

  it('aborts immediately when accessed after the response was already aborted', () => {
    const { res, signals } = build()
    res.closed = true
    res.writableFinished = false

    expect(signals.response.signal.aborted).toBe(true)
    expect(signals.disconnect.signal.aborted).toBe(true)
  })

  it('abortRequest aborts only the controllers that were created', () => {
    const { signals } = build()

    // only body has been accessed
    const body = signals.body
    signals.abortRequest()

    expect(body.signal.aborted).toBe(true)
    // disconnect was never accessed; accessing it now should create a fresh,
    // non-aborted controller since the raw request was never actually aborted
    expect(signals.disconnect.signal.aborted).toBe(false)
  })
})

describe('signals plugin', () => {
  it('aborts request-side signals through Fastify onRequestAbort for real socket disconnects', async () => {
    const app = Fastify()
    let resolveBodyAbort!: () => void
    let resolveRequestStarted!: () => void
    const bodyAborted = new Promise<void>((resolve) => {
      resolveBodyAbort = resolve
    })
    const requestStarted = new Promise<void>((resolve) => {
      resolveRequestStarted = resolve
    })

    await app.register(signalsPlugin)
    app.addHook('onRequest', async (request) => {
      resolveRequestStarted()
      request.signals.body.signal.addEventListener('abort', resolveBodyAbort, { once: true })
    })
    app.addContentTypeParser('application/octet-stream', (_request, payload, done) => {
      payload.resume()
      payload.once('end', () => done(null))
      payload.once('error', done)
    })
    app.post('/upload', async () => ({ ok: true }))

    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const client = httpRequest(`${address}/upload`, {
      headers: {
        'content-length': '1000000',
        'content-type': 'application/octet-stream',
      },
      method: 'POST',
    })
    client.on('error', () => {})

    try {
      client.flushHeaders()
      client.write('partial body')
      await withTimeout(requestStarted, 'Timed out waiting for request start')
      client.destroy()

      await withTimeout(bodyAborted, 'Timed out waiting for request abort')
    } finally {
      client.destroy()
      await app.close()
    }
  })

  it('aborts response and disconnect signals for real socket disconnects mid-response', async () => {
    const app = Fastify()
    let resolveResponseAbort!: () => void
    let resolveDisconnectAbort!: () => void
    const responseAborted = new Promise<void>((resolve) => {
      resolveResponseAbort = resolve
    })
    const disconnectAborted = new Promise<void>((resolve) => {
      resolveDisconnectAbort = resolve
    })

    await app.register(signalsPlugin)
    app.get('/stream', async (request, reply) => {
      request.signals.response.signal.addEventListener('abort', resolveResponseAbort, {
        once: true,
      })
      request.signals.disconnect.signal.addEventListener('abort', resolveDisconnectAbort, {
        once: true,
      })

      reply.hijack()
      reply.raw.writeHead(200, { 'content-type': 'text/plain' })
      reply.raw.write('partial response')

      await Promise.all([responseAborted, disconnectAborted])
    })

    const address = await app.listen({ host: '127.0.0.1', port: 0 })
    const client = httpRequest(`${address}/stream`, { method: 'GET' })
    client.on('error', () => {})

    try {
      client.end()
      const [response] = await withTimeout(
        once(client, 'response') as Promise<[IncomingMessage]>,
        'Timed out waiting for streaming response'
      )
      await withTimeout(once(response, 'data'), 'Timed out waiting for response data')
      response.destroy()

      await withTimeout(
        Promise.all([responseAborted, disconnectAborted]),
        'Timed out waiting for response abort'
      )
    } finally {
      client.destroy()
      await app.close()
    }
  })
})
