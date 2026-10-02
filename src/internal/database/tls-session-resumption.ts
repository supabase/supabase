import { recordTlsSessionResumption } from '@internal/monitoring/metrics'
import { Client } from 'pg'
import type { ConnectionOptions } from 'tls'

/**
 * TLS session resumption for tenant DB connections, coupled to the pool.
 *
 * Node skips the per-handshake certificate extraction and identity verification work only
 * when a session is resumed, and resumed handshakes are cheaper on the wire. pg implements
 * no client session cache, so every reconnect pays the full handshake.
 *
 * Each PgPoolStrategy owns one TlsSessionSlot (1 pool = 1 tenant = 1 host:port). The pool's
 * ssl options get an enumerable session getter whose value pg copies into the tls.connect
 * options with Object.assign on every physical connect, so each new connection offers the
 * freshest ticket. The slot itself rides along as a non-enumerable property of the same ssl
 * object to prevent copying into the tls.connect options while still being accessible to the
 * client to attach a listener to the connection to capture newer tickets and observability.
 *
 * The slot lives exactly as long as the strategy is retained in the bounded tenant-pool
 * LRU. Recently used tenants keep the slot alive by recency; capacity eviction retires
 * cold strategies. The slot's storedAt bound is independent of cache residency and frees
 * stale tickets on peek.
 *
 * A stale or rejected ticket downgrades to a full handshake inside the same connection
 * attempt so resumption failure is never a connection error and if the server issues no
 * tickets the slot simply stays empty.
 */

export const TLS_SESSION_MAX_AGE_MS = 60 * 60 * 1000

export type TlsSessionSlot = {
  session?: Buffer
  storedAt: number
}

const kTlsSessionSlot = Symbol('tlsSessionSlot')

export function createTlsSessionSlot(): TlsSessionSlot {
  return { storedAt: 0 }
}

export function storeTlsSession(slot: TlsSessionSlot, session: Buffer): void {
  // Copy the ticket out of the pooled arena to avoid pinning the pool's memory.
  const copy = Buffer.allocUnsafeSlow(session.byteLength)
  session.copy(copy)

  slot.session = copy
  slot.storedAt = Date.now()
}

export function peekTlsSession(slot: TlsSessionSlot): Buffer | undefined {
  if (!slot.session) {
    return undefined
  }

  if (Date.now() - slot.storedAt > TLS_SESSION_MAX_AGE_MS) {
    slot.session = undefined
    return undefined
  }

  return slot.session
}

function getTlsSessionSlot(ssl: object): TlsSessionSlot | undefined {
  return (ssl as Record<symbol, TlsSessionSlot | undefined>)[kTlsSessionSlot]
}

export function installTlsSessionResumption(ssl: ConnectionOptions, slot: TlsSessionSlot): void {
  if (getTlsSessionSlot(ssl) || Object.getOwnPropertyDescriptor(ssl, 'session')) {
    return
  }

  // non-enumerable to prevent copying into the tls.connect options
  Object.defineProperty(ssl, kTlsSessionSlot, { value: slot })
  Object.defineProperty(ssl, 'session', {
    // enumerable to copy into tls.connect options
    enumerable: true,
    configurable: true,
    get: () => peekTlsSession(slot),
  })
}

export function attachTlsSessionCapture(stream: unknown, slot: TlsSessionSlot): void {
  const socket = stream as
    | { on?: (event: string, listener: (arg: Buffer) => void) => unknown }
    | undefined
  if (!socket || typeof socket.on !== 'function') {
    return
  }

  socket.on('session', (session: Buffer) => {
    storeTlsSession(slot, session)
  })
}

// Record whether the server actually resumed the offered session
export function observeTlsSessionResumption(stream: unknown, slot: TlsSessionSlot): void {
  const socket = stream as
    | {
        once?: (event: string, listener: () => void) => unknown
        isSessionReused?: () => boolean
      }
    | undefined
  if (
    !socket ||
    typeof socket.once !== 'function' ||
    typeof socket.isSessionReused !== 'function'
  ) {
    return
  }

  const offered = peekTlsSession(slot) !== undefined

  socket.once('secureConnect', () => {
    const reused = socket.isSessionReused?.() === true
    recordTlsSessionResumption(reused ? 'resumed' : offered ? 'rejected' : 'uncached')
  })
}

// Dependency contract to fail in CI if pg changes between upgrades.
type PgClientInternals = {
  connectionParameters?: { ssl?: unknown }
  connection?: {
    once?: (event: string, listener: () => void) => unknown
    stream?: unknown
  }
}

type TlsSessionResumptionClientCtor = new (
  config?: ConstructorParameters<typeof Client>[0]
) => Client

function attachTlsSessionResumption(client: Client): void {
  const internals = client as unknown as PgClientInternals
  const ssl = internals.connectionParameters?.ssl
  if (!ssl || typeof ssl !== 'object') {
    return
  }

  const slot = getTlsSessionSlot(ssl)
  if (!slot) {
    return
  }

  const connection = internals.connection
  connection?.once?.('sslconnect', () => {
    attachTlsSessionCapture(connection.stream, slot)
    observeTlsSessionResumption(connection.stream, slot)
  })
}

// Client constructor that resumes TLS sessions from the slot installed on the pool's ssl options.
export const TlsSessionResumptionClient = class TlsSessionResumptionClient {
  constructor(config?: ConstructorParameters<typeof Client>[0]) {
    const client = new Client(config)
    attachTlsSessionResumption(client)
    return client
  }
} as unknown as TlsSessionResumptionClientCtor
