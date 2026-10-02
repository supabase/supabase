import { execFileSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tls from 'node:tls'
import {
  attachTlsSessionCapture,
  createTlsSessionSlot,
  installTlsSessionResumption,
  observeTlsSessionResumption,
  peekTlsSession,
  storeTlsSession,
  TLS_SESSION_MAX_AGE_MS,
  TlsSessionResumptionClient,
} from '@internal/database/tls-session-resumption'
import * as metrics from '@internal/monitoring/metrics'
import { vi } from 'vitest'

describe('tls session slot', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('stores and returns the latest session', () => {
    const slot = createTlsSessionSlot()
    const first = Buffer.from('first')
    const second = Buffer.from('second')

    expect(peekTlsSession(slot)).toBeUndefined()

    storeTlsSession(slot, first)
    expect(peekTlsSession(slot)).toEqual(first)

    storeTlsSession(slot, second)
    expect(peekTlsSession(slot)).toEqual(second)
  })

  test('copies tickets out of pooled buffers so slots never pin pool arenas', () => {
    const slot = createTlsSessionSlot()
    // simulate a big pooled buffer arena (256k)
    const arena = Buffer.allocUnsafeSlow(256 * 1024)
    const ticket = arena.subarray(0, 1068)
    ticket.fill(7)

    storeTlsSession(slot, ticket)

    const stored = peekTlsSession(slot)
    expect(stored).toEqual(ticket)
    expect(stored!.buffer).not.toBe(arena.buffer)
    expect(stored!.buffer.byteLength).toBe(ticket.byteLength)
  })

  test('expires sessions after the max age', () => {
    vi.useFakeTimers()
    const slot = createTlsSessionSlot()

    storeTlsSession(slot, Buffer.from('ticket'))
    vi.advanceTimersByTime(TLS_SESSION_MAX_AGE_MS - 1)
    expect(peekTlsSession(slot)).toBeInstanceOf(Buffer)

    vi.advanceTimersByTime(2)
    expect(peekTlsSession(slot)).toBeUndefined()
    expect(slot.session).toBeUndefined()
  })

  test('injection getter is enumerable and re-evaluated per Object.assign', () => {
    const slot = createTlsSessionSlot()
    const ssl: tls.ConnectionOptions = { rejectUnauthorized: false }
    installTlsSessionResumption(ssl, slot)

    const descriptor = Object.getOwnPropertyDescriptor(ssl, 'session')
    expect(descriptor?.get).toBeInstanceOf(Function)
    expect(descriptor?.enumerable).toBe(true)

    expect(Object.assign({}, ssl).session).toBeUndefined()

    const first = Buffer.from('first')
    storeTlsSession(slot, first)
    expect(Object.assign({}, ssl).session).toEqual(first)

    const second = Buffer.from('second')
    storeTlsSession(slot, second)
    expect(Object.assign({}, ssl).session).toEqual(second)
  })

  test('slot reference does not leak into tls.connect options', () => {
    const slot = createTlsSessionSlot()
    const ssl: tls.ConnectionOptions = { rejectUnauthorized: false }
    installTlsSessionResumption(ssl, slot)

    // pg builds the tls.connect options with Object.assign(options, ssl) — only the
    // enumerable `session` getter value may cross, never the slot itself
    const options = Object.assign({ host: '127.0.0.1' }, ssl)
    expect(Object.getOwnPropertySymbols(options)).toHaveLength(0)
    expect(Object.keys(options).sort()).toEqual(['host', 'rejectUnauthorized', 'session'].sort())
  })

  test('install is idempotent', () => {
    const first = createTlsSessionSlot()
    const second = createTlsSessionSlot()
    const ssl: tls.ConnectionOptions = {}
    installTlsSessionResumption(ssl, first)
    installTlsSessionResumption(ssl, second)

    storeTlsSession(first, Buffer.from('first-slot'))
    storeTlsSession(second, Buffer.from('second-slot'))

    expect(Object.assign({}, ssl).session).toEqual(Buffer.from('first-slot'))
  })

  test('capture stores every session emitted by the socket', () => {
    const slot = createTlsSessionSlot()
    const socket = new EventEmitter()
    attachTlsSessionCapture(socket, slot)

    const first = Buffer.from('first')
    const second = Buffer.from('second')
    socket.emit('session', first)
    expect(peekTlsSession(slot)).toEqual(first)

    socket.emit('session', second)
    expect(peekTlsSession(slot)).toEqual(second)
  })

  test('capture tolerates streams without listener support', () => {
    const slot = createTlsSessionSlot()
    expect(() => attachTlsSessionCapture(undefined, slot)).not.toThrow()
    expect(() => attachTlsSessionCapture({}, slot)).not.toThrow()
    expect(() => attachTlsSessionCapture(null, slot)).not.toThrow()
  })
})

describe('resumption outcome observability', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function fakeTlsSocket(reused: boolean) {
    const socket = new EventEmitter() as EventEmitter & { isSessionReused: () => boolean }
    socket.isSessionReused = () => reused
    return socket
  }

  test("records 'resumed' when the server accepts the offered session", () => {
    const recordSpy = vi.spyOn(metrics, 'recordTlsSessionResumption')
    const slot = createTlsSessionSlot()
    storeTlsSession(slot, Buffer.from('ticket'))

    const socket = fakeTlsSocket(true)
    observeTlsSessionResumption(socket, slot)
    socket.emit('secureConnect')

    expect(recordSpy).toHaveBeenCalledWith('resumed')
  })

  test("records 'rejected' when a session was offered but the handshake was full", () => {
    const recordSpy = vi.spyOn(metrics, 'recordTlsSessionResumption')
    const slot = createTlsSessionSlot()
    storeTlsSession(slot, Buffer.from('ticket'))

    const socket = fakeTlsSocket(false)
    observeTlsSessionResumption(socket, slot)
    socket.emit('secureConnect')

    expect(recordSpy).toHaveBeenCalledWith('rejected')
  })

  test("records 'uncached' when no session was available to offer", () => {
    const recordSpy = vi.spyOn(metrics, 'recordTlsSessionResumption')
    const slot = createTlsSessionSlot()

    const socket = fakeTlsSocket(false)
    observeTlsSessionResumption(socket, slot)
    socket.emit('secureConnect')

    expect(recordSpy).toHaveBeenCalledWith('uncached')
  })

  test('samples the offer when attached, not when the handshake completes', () => {
    const recordSpy = vi.spyOn(metrics, 'recordTlsSessionResumption')
    const slot = createTlsSessionSlot()

    const socket = fakeTlsSocket(false)
    observeTlsSessionResumption(socket, slot)

    storeTlsSession(slot, Buffer.from('ticket'))
    socket.emit('secureConnect')

    expect(recordSpy).toHaveBeenCalledWith('uncached')
  })

  test('tolerates sockets without resumption support', () => {
    const slot = createTlsSessionSlot()
    expect(() => observeTlsSessionResumption(new EventEmitter(), slot)).not.toThrow()
    expect(() => observeTlsSessionResumption(undefined, slot)).not.toThrow()
    expect(() => observeTlsSessionResumption({}, slot)).not.toThrow()
  })
})

// A pg upgrade that reshapes event or configuration must fail here
// rather than silently disabling the feature.
describe('TlsSessionResumptionClient pg wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('finds the slot on the ssl options and captures sessions on sslconnect', () => {
    const slot = createTlsSessionSlot()
    const ssl: tls.ConnectionOptions = { rejectUnauthorized: false }
    installTlsSessionResumption(ssl, slot)

    const client = new TlsSessionResumptionClient({
      host: '1.2.3.4',
      port: 5433,
      user: 'user',
      password: 'password',
      database: 'db',
      ssl,
    })

    const internals = client as unknown as {
      connection: EventEmitter & { stream: unknown }
    }
    expect(internals.connection).toBeDefined()
    expect(internals.connection.listenerCount('sslconnect')).toBe(1)

    const recordSpy = vi.spyOn(metrics, 'recordTlsSessionResumption')
    const stream = new EventEmitter() as EventEmitter & { isSessionReused: () => boolean }
    stream.isSessionReused = () => false
    internals.connection.stream = stream
    internals.connection.emit('sslconnect')

    const session = Buffer.from('ticket')
    stream.emit('session', session)
    expect(peekTlsSession(slot)).toEqual(session)

    expect(Object.assign({}, ssl).session).toEqual(session)

    stream.emit('secureConnect')
    expect(recordSpy).toHaveBeenCalledWith('uncached')
  })

  test('does nothing without a slot on the ssl options', () => {
    const client = new TlsSessionResumptionClient({
      host: '1.2.3.4',
      port: 5432,
      user: 'user',
      password: 'password',
      database: 'db',
      ssl: { rejectUnauthorized: false },
    })

    const internals = client as unknown as { connection: EventEmitter }
    expect(internals.connection.listenerCount('sslconnect')).toBe(0)
  })

  test('does nothing without object-form ssl settings', () => {
    const client = new TlsSessionResumptionClient({
      host: 'db.example.com',
      port: 5432,
      user: 'user',
      password: 'password',
      database: 'db',
    })

    const internals = client as unknown as { connection: EventEmitter }
    expect(internals.connection.listenerCount('sslconnect')).toBe(0)
  })
})

const opensslAvailable = (() => {
  try {
    execFileSync('openssl', ['version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

describe.runIf(opensslAvailable)('TLS session resumption against a real TLS server', () => {
  let certDir: string
  let serverKey: Buffer
  let serverCert: Buffer

  beforeAll(() => {
    certDir = mkdtempSync(join(tmpdir(), 'tls-resume-'))
    execFileSync(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'ec',
        '-pkeyopt',
        'ec_paramgen_curve:prime256v1',
        '-nodes',
        '-keyout',
        join(certDir, 'key.pem'),
        '-out',
        join(certDir, 'cert.pem'),
        '-days',
        '2',
        '-subj',
        '/CN=localhost',
      ],
      { stdio: 'ignore' }
    )
    serverKey = readFileSync(join(certDir, 'key.pem'))
    serverCert = readFileSync(join(certDir, 'cert.pem'))
  })

  afterAll(() => {
    rmSync(certDir, { recursive: true, force: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each([['TLSv1.2'], ['TLSv1.3']])('resumes a session over %s', async (version) => {
    const tlsVersion = version as tls.SecureVersion
    const server = tls.createServer({
      key: serverKey,
      cert: serverCert,
      minVersion: tlsVersion,
      maxVersion: tlsVersion,
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as AddressInfo).port
    const slot = createTlsSessionSlot()

    const recordSpy = vi.spyOn(metrics, 'recordTlsSessionResumption')

    try {
      const first = tls.connect({ host: '127.0.0.1', port, rejectUnauthorized: false })
      attachTlsSessionCapture(first, slot)
      observeTlsSessionResumption(first, slot)
      const sessionArrived = new Promise<void>((resolve, reject) => {
        first.once('session', () => resolve())
        first.once('error', reject)
      })
      await new Promise<void>((resolve, reject) => {
        first.once('secureConnect', resolve)
        first.once('error', reject)
      })
      expect(first.isSessionReused()).toBe(false)
      await sessionArrived
      first.destroy()

      expect(peekTlsSession(slot)).toBeInstanceOf(Buffer)
      expect(recordSpy).toHaveBeenNthCalledWith(1, 'uncached')

      const ssl: tls.ConnectionOptions = { rejectUnauthorized: false }
      installTlsSessionResumption(ssl, slot)
      const options: tls.ConnectionOptions = { host: '127.0.0.1', port }
      Object.assign(options, ssl)

      const second = tls.connect(options)
      observeTlsSessionResumption(second, slot)
      await new Promise<void>((resolve, reject) => {
        second.once('secureConnect', resolve)
        second.once('error', reject)
      })
      const reused = second.isSessionReused()
      second.destroy()

      expect(reused).toBe(true)
      expect(recordSpy).toHaveBeenNthCalledWith(2, 'resumed')
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
