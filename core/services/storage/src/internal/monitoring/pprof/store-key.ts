import { randomBytes } from 'node:crypto'
import { getConfig } from '../../../config'
import { resolveRuntimeIdentity } from '../runtime-identity'

export type ProfileClass = 'auto' | 'manual'
export type ProfileKind = 'cpu' | 'heap'

export interface ProfileIdentity {
  class: ProfileClass
  kind: ProfileKind
  reason: string
  startedAt: Date
  durationSeconds: number
}

export interface ProfileRuntimeIdentity {
  hostname?: string
  applicationId: string
  workerId: string
  processId?: number
}

export interface ArchivedProfile extends ProfileIdentity {
  key: string
  hostname: string
  applicationId: string
  workerId: string
  processId: number
  build: string
  size?: number
  etag?: string
}

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9.-]{0,63}$/
const CAPTURE_SEGMENT = /^(\d{13})-([a-f0-9]{12})$/
const DURATION_SEGMENT = /^d\d{6}s$/
const APPLICATION_SEGMENT = /^a\.[a-z0-9][a-z0-9.-]{0,63}$/
const WORKER_SEGMENT = /^w\.[a-z0-9][a-z0-9.-]{0,63}$/
const PROCESS_SEGMENT = /^p\.\d+$/
const REVERSE_EPOCH_MAX = 9_999_999_999_999
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000
const { version } = getConfig()

export class InvalidProfileDateError extends Error {}

function trimDashes(value: string) {
  let start = 0
  while (value[start] === '-') start += 1

  let end = value.length
  while (end > start && value[end - 1] === '-') end -= 1

  return value.slice(start, end)
}

export function profileKeySegment(value: string, fallback: string) {
  const normalized = trimDashes(value.toLowerCase().replace(/[^a-z0-9.-]+/g, '-'))
  return SAFE_SEGMENT.test(normalized) ? normalized : fallback
}

export function encodeProfileCursor(key: string) {
  return Buffer.from(key).toString('base64url')
}

export function reverseProfileTimestamp(timestamp: number) {
  return `${REVERSE_EPOCH_MAX - timestamp}`.padStart(13, '0')
}

export function profileDateRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new InvalidProfileDateError('Invalid profile date')
  const start = Date.parse(`${date}T00:00:00.000Z`)
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10) !== date) {
    throw new InvalidProfileDateError('Invalid profile date')
  }
  return { start, end: start + DAY_MILLISECONDS }
}

export function decodeProfileCursor(cursor: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error('Invalid profile cursor')
  const key = Buffer.from(cursor, 'base64url').toString('utf8')
  if (encodeProfileCursor(key) !== cursor || key.includes('..') || key.startsWith('/')) {
    throw new Error('Invalid profile cursor')
  }
  return key
}

export function buildProfileKey(
  identity: ProfileIdentity,
  runtimeIdentity: ProfileRuntimeIdentity
) {
  const reverseMs = reverseProfileTimestamp(identity.startedAt.getTime())
  const captureId = randomBytes(6).toString('hex')
  const application = `a.${profileKeySegment(runtimeIdentity.applicationId, 'unknown')}`
  const worker = `w.${profileKeySegment(runtimeIdentity.workerId, 'unknown')}`
  const instance = profileKeySegment(
    runtimeIdentity.hostname ?? resolveRuntimeIdentity().hostname,
    'unknown'
  )
  const processId = `p.${runtimeIdentity.processId ?? process.pid}`
  const build = profileKeySegment(version, 'unknown')
  const filename =
    [
      `d${`${identity.durationSeconds}`.padStart(6, '0')}s`,
      profileKeySegment(identity.reason, 'unknown'),
      instance,
      application,
      worker,
      processId,
      build,
    ].join('_') + '.pprof.gz'

  return ['v1', identity.class, `${reverseMs}-${captureId}`, identity.kind, filename].join('/')
}

export function parseProfileKey(key: string): ArchivedProfile | undefined {
  const root = 'v1/'
  if (!key.startsWith(root)) return
  const parts = key.slice(root.length).split('/')
  if (parts.length !== 4) return
  const [profileClass, capture, kind, filename] = parts
  if (
    (profileClass !== 'auto' && profileClass !== 'manual') ||
    (kind !== 'cpu' && kind !== 'heap')
  ) {
    return
  }
  const captureMatch = capture.match(CAPTURE_SEGMENT)
  if (!captureMatch || !filename.endsWith('.pprof.gz')) return
  const fields = filename.slice(0, -'.pprof.gz'.length).split('_')
  if (fields.length !== 7) return
  const durationSeconds = Number.parseInt(fields[0].slice(1, -1), 10)
  const applicationId = fields[3].slice(2)
  const workerId = fields[4].slice(2)
  const processId = Number.parseInt(fields[5].slice(2), 10)
  const startedAtMs = REVERSE_EPOCH_MAX - Number(captureMatch[1])
  const startedAt = new Date(startedAtMs)
  if (
    !Number.isFinite(durationSeconds) ||
    !Number.isSafeInteger(startedAtMs) ||
    startedAtMs < 0 ||
    Number.isNaN(startedAt.getTime()) ||
    reverseProfileTimestamp(startedAt.getTime()) !== captureMatch[1] ||
    !DURATION_SEGMENT.test(fields[0]) ||
    !SAFE_SEGMENT.test(fields[1]) ||
    !APPLICATION_SEGMENT.test(fields[3]) ||
    !WORKER_SEGMENT.test(fields[4]) ||
    !PROCESS_SEGMENT.test(fields[5]) ||
    !Number.isSafeInteger(processId) ||
    processId <= 0 ||
    !SAFE_SEGMENT.test(fields[2]) ||
    !SAFE_SEGMENT.test(fields[6])
  ) {
    return
  }
  return {
    key,
    class: profileClass,
    kind,
    reason: fields[1],
    startedAt,
    durationSeconds,
    hostname: fields[2],
    applicationId,
    workerId,
    processId,
    build: fields[6],
  }
}
