import crypto from 'crypto'
import { PoolConfig } from '../lib/types.js'
import { getSecret } from '../lib/secrets.js'
import type { AccessControl } from '@supabase/postgrest-typegen'
import pkg from '#package.json' with { type: 'json' }

export const PG_META_HOST = process.env.PG_META_HOST || '0.0.0.0'
export const PG_META_PORT = Number(process.env.PG_META_PORT || 1337)
export const CRYPTO_KEY = (await getSecret('CRYPTO_KEY')) || 'SAMPLE_KEY'

const PG_META_DB_HOST = process.env.PG_META_DB_HOST || 'localhost'
const PG_META_DB_NAME = process.env.PG_META_DB_NAME || 'postgres'
const PG_META_DB_USER = process.env.PG_META_DB_USER || 'postgres'
const PG_META_DB_PORT = process.env.PG_META_DB_PORT || '5432'
const PG_META_DB_PASSWORD = (await getSecret('PG_META_DB_PASSWORD')) || 'postgres'
const PG_META_DB_SSL_MODE = process.env.PG_META_DB_SSL_MODE || 'disable'

const PG_CONN_TIMEOUT_SECS = Number(process.env.PG_CONN_TIMEOUT_SECS || 15)
const PG_QUERY_TIMEOUT_SECS = Number(process.env.PG_QUERY_TIMEOUT_SECS || 55)

export let PG_CONNECTION = process.env.PG_META_DB_URL
if (!PG_CONNECTION) {
  const pgConn = new URL('postgresql://')
  pgConn.hostname = PG_META_DB_HOST
  pgConn.port = PG_META_DB_PORT
  pgConn.username = PG_META_DB_USER
  pgConn.password = PG_META_DB_PASSWORD
  pgConn.pathname = encodeURIComponent(PG_META_DB_NAME)
  pgConn.searchParams.set('sslmode', PG_META_DB_SSL_MODE)
  PG_CONNECTION = `${pgConn}`
}

export const PG_META_DB_SSL_ROOT_CERT = process.env.PG_META_DB_SSL_ROOT_CERT
if (PG_META_DB_SSL_ROOT_CERT) {
  // validate cert
  new crypto.X509Certificate(PG_META_DB_SSL_ROOT_CERT)
}

export const EXPORT_DOCS = process.env.PG_META_EXPORT_DOCS === 'true'
export const GENERATE_TYPES = process.env.PG_META_GENERATE_TYPES
export const GENERATE_TYPES_INCLUDED_SCHEMAS = GENERATE_TYPES
  ? (process.env.PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS?.split(',') ?? [])
  : []
export const GENERATE_TYPES_DEFAULT_SCHEMA =
  process.env.PG_META_GENERATE_TYPES_DEFAULT_SCHEMA || 'public'
export const GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS =
  process.env.PG_META_GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS === 'true'
export const POSTGREST_VERSION = process.env.PG_META_POSTGREST_VERSION
export const GENERATE_TYPES_SWIFT_ACCESS_CONTROL = process.env
  .PG_META_GENERATE_TYPES_SWIFT_ACCESS_CONTROL
  ? (process.env.PG_META_GENERATE_TYPES_SWIFT_ACCESS_CONTROL as AccessControl)
  : 'internal'

export const PG_META_MAX_RESULT_SIZE = process.env.PG_META_MAX_RESULT_SIZE_MB
  ? // Node-postgres get a maximum size in bytes make the conversion from the env variable
    // from MB to Bytes
    parseInt(process.env.PG_META_MAX_RESULT_SIZE_MB, 10) * 1024 * 1024
  : 2 * 1024 * 1024 * 1024 // default to 2GB max query size result

export const MAX_BODY_LIMIT = process.env.PG_META_MAX_BODY_LIMIT_MB
  ? // Fastify server max body size allowed, is in bytes, convert from MB to Bytes
    parseInt(process.env.PG_META_MAX_BODY_LIMIT_MB, 10) * 1024 * 1024
  : 3 * 1024 * 1024

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  max: 1,
  connectionTimeoutMillis: PG_CONN_TIMEOUT_SECS * 1000,
  query_timeout: PG_QUERY_TIMEOUT_SECS * 1000,
  ssl: PG_META_DB_SSL_ROOT_CERT ? { ca: PG_META_DB_SSL_ROOT_CERT } : undefined,
  application_name: `postgres-meta ${pkg.version}`,
  maxResultSize: PG_META_MAX_RESULT_SIZE,
}

export const PG_META_REQ_HEADER = process.env.PG_META_REQ_HEADER || 'request-id'

// Formatting generated types with prettier is CPU-bound and synchronous, so on
// a large schema it blocks the event loop for seconds at a time and the server
// cannot answer anything else, health checks included. Setting this to 'true'
// moves formatting onto a worker thread, which leaves the main thread free.
//
// Opt-in: the default keeps formatting inline, so behaviour is unchanged unless
// it is explicitly enabled. Always off in type-generation mode, where the
// process generates once and exits and there is nothing to keep responsive.
export const FORMAT_IN_WORKER =
  process.env.PG_META_FORMAT_IN_WORKER === 'true' && !process.env.PG_META_GENERATE_TYPES

// Kept at 1 by default: the point is to keep the main thread free, not to
// parallelise formatting. Raise it only if there are spare cores.
export const FORMAT_POOL_SIZE = Number(process.env.PG_META_FORMAT_POOL_SIZE || 1)

// Maximum format calls running or waiting at once. Past this the request is
// rejected with a 503 instead of queueing: without a bound the backlog absorbs
// a burst and every caller waits, which relocates the pile-up instead of
// shedding it.
export const FORMAT_MAX_QUEUE = Number(process.env.PG_META_FORMAT_MAX_QUEUE || 20)

export const FORMAT_TIMEOUT_MS = Number(process.env.PG_META_FORMAT_TIMEOUT_SECS || 60) * 1000

// Workers exit after being idle this long, so the process can still shut down
// (and tests can finish) without an explicit teardown.
export const FORMAT_IDLE_TIMEOUT_MS =
  Number(process.env.PG_META_FORMAT_IDLE_TIMEOUT_SECS || 30) * 1000

// How long a shutdown may wait on in-flight work before the process
// force-exits. Note the container runtime SIGKILLs at its own stop grace
// period (10s by default in Docker, same as this default), so set this lower
// than that for the force-exit to actually run.
export const SHUTDOWN_GRACE_PERIOD_MS =
  Number(process.env.PG_META_SHUTDOWN_GRACE_PERIOD_SECS || 10) * 1000
