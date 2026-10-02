import { withOptionalVersion } from '../backend/adapter'
import {
  LIFECYCLE_CONTINUATION_VERSION,
  LIFECYCLE_MAX_PAGE_SIZE,
  type LifecycleArtifact,
  type LifecycleBatchVersion,
  type LifecycleCandidateIdentity,
  type LifecycleContinuation,
  type LifecycleContinuationBatch,
  type LifecycleEvaluationPage,
  type LifecycleExecutionMode,
  type LifecycleInFlightAttempt,
  type LifecycleRunCounters,
  type LifecycleShardTopology,
  type LifecycleTrigger,
  type NoncurrentLifecycleShardCursor,
} from '../schemas/lifecycle'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const BIGINT = /^-?\d+$/
const MIN_SIGNED_BIGINT = -(1n << 63n)
const MAX_SIGNED_BIGINT = (1n << 63n) - 1n

interface LifecycleDeletionCounts {
  objectVersions: number
  deleteMarkers: number
  bytes: number
}

export class LifecycleContinuationDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LifecycleContinuationDecodeError'
  }
}

export function createLifecycleContinuation(input: {
  runId: string
  trigger: LifecycleTrigger
  generation: string
  snapshotAt: string
  mode: LifecycleExecutionMode
  topology: LifecycleShardTopology
}): LifecycleContinuation {
  return decodeLifecycleContinuation({
    continuationVersion: LIFECYCLE_CONTINUATION_VERSION,
    ...input,
    counters: {
      versionsExamined: 0,
      versionsEligible: 0,
      objectVersionsDeleted: 0,
      deleteMarkersDeleted: 0,
      bytesDeleted: 0,
      batchesCompleted: 0,
    },
  })
}

export function freezeLifecycleBatchVersion(
  candidate: LifecycleCandidateIdentity
): LifecycleBatchVersion {
  const physicalKey = withOptionalVersion(candidate.name, candidate.version ?? undefined)
  return {
    name: candidate.name,
    version: candidate.version,
    artifacts: candidate.isDeleteMarker
      ? []
      : [
          { key: physicalKey, outcome: 'UNRESOLVED' },
          { key: `${physicalKey}.info`, outcome: 'UNRESOLVED' },
        ],
  }
}

export function stageLifecycleBatch(
  continuation: LifecycleContinuation,
  input: {
    pageEnd: NoncurrentLifecycleShardCursor
    rawRowsExamined: number
    versions: LifecycleBatchVersion[]
  }
): LifecycleContinuation {
  if (continuation.batch !== undefined) {
    throw new Error('Lifecycle continuation already has a staged batch')
  }
  if (input.versions.length === 0) {
    throw new Error('Lifecycle batch cannot be empty')
  }
  if (
    !Number.isSafeInteger(input.rawRowsExamined) ||
    input.rawRowsExamined < input.versions.length ||
    input.rawRowsExamined > LIFECYCLE_MAX_PAGE_SIZE
  ) {
    throw new Error('Lifecycle batch does not fit its raw page')
  }

  return decodeLifecycleContinuation({
    ...continuation,
    pageEnd: input.pageEnd,
    counters: {
      ...continuation.counters,
      versionsExamined: continuation.counters.versionsExamined + input.rawRowsExamined,
      versionsEligible: continuation.counters.versionsEligible + input.versions.length,
    },
    batch: { versions: input.versions },
  })
}

export function advanceLifecycleEvaluationPage(
  continuation: LifecycleContinuation,
  page: LifecycleEvaluationPage
): LifecycleContinuation {
  if (continuation.batch !== undefined) {
    throw new Error('Lifecycle continuation already has a staged batch')
  }
  if (page.rawRowsExamined > 0 && page.pageEnd === undefined) {
    throw new Error('A non-empty lifecycle page requires pageEnd')
  }

  return decodeLifecycleContinuation({
    ...continuation,
    ...(page.pageEnd === undefined ? {} : { cursor: page.pageEnd }),
    counters: {
      ...continuation.counters,
      versionsExamined: continuation.counters.versionsExamined + page.rawRowsExamined,
      versionsEligible: continuation.counters.versionsEligible + page.candidates.length,
    },
  })
}

export function armLifecycleAttempt(
  continuation: LifecycleContinuation,
  attempt: LifecycleInFlightAttempt
): LifecycleContinuation {
  if (!continuation.batch || continuation.batch.versions.length === 0) {
    throw new Error('Lifecycle continuation has no batch to arm')
  }
  if (continuation.batch.inFlight) {
    if (
      continuation.batch.inFlight.attemptId === attempt.attemptId &&
      continuation.batch.inFlight.authorizedGeneration === attempt.authorizedGeneration
    ) {
      return continuation
    }
    throw new Error('Lifecycle batch already has a different armed attempt')
  }
  if (attempt.authorizedGeneration !== continuation.generation) {
    throw new Error('Lifecycle attempt generation does not match the staged policy')
  }

  return decodeLifecycleContinuation({
    ...continuation,
    batch: { ...continuation.batch, inFlight: attempt },
  })
}

export function recordLifecycleArtifactOutcomes(
  continuation: LifecycleContinuation,
  outcomes: ReadonlyMap<string, Pick<LifecycleArtifact, 'outcome' | 'error'>>
): LifecycleContinuation {
  if (!continuation.batch?.inFlight) {
    throw new Error('Lifecycle batch must be armed before recording artifact outcomes')
  }

  const knownKeys = new Set(
    continuation.batch.versions.flatMap((version) =>
      version.artifacts.map((artifact) => artifact.key)
    )
  )
  for (const key of outcomes.keys()) {
    if (!knownKeys.has(key)) throw new Error(`Lifecycle outcome references unknown artifact ${key}`)
  }

  const versions = continuation.batch.versions.map((version) => ({
    ...version,
    artifacts: version.artifacts.map((artifact) => {
      const outcome = outcomes.get(artifact.key)
      return outcome ? { key: artifact.key, ...outcome } : artifact
    }),
  }))

  return decodeLifecycleContinuation({
    ...continuation,
    batch: { versions, inFlight: continuation.batch.inFlight },
  })
}

export function filterStagedLifecycleBatch(
  continuation: LifecycleContinuation,
  retainedVersions: ReadonlyArray<Pick<LifecycleBatchVersion, 'name' | 'version'>>
): LifecycleContinuation {
  if (!continuation.batch || continuation.batch.inFlight) {
    throw new Error('Lifecycle batch must be staged and unarmed before filtering')
  }

  const versions = selectRetainedVersions(continuation.batch.versions, retainedVersions)
  if (versions.length === continuation.batch.versions.length) return continuation
  if (versions.length === 0) return advanceLifecycleBatch(continuation)

  return decodeLifecycleContinuation({
    ...continuation,
    batch: { versions },
  })
}

export function refreshStagedLifecycleBatchArtifacts(
  continuation: LifecycleContinuation,
  candidates: ReadonlyArray<LifecycleCandidateIdentity>
): LifecycleContinuation {
  if (!continuation.batch || continuation.batch.inFlight) {
    throw new Error('Lifecycle batch must be staged and unarmed before refreshing artifacts')
  }
  if (candidates.length !== continuation.batch.versions.length) {
    throw new Error('Lifecycle artifact refresh must cover the current batch')
  }

  const currentVersions = continuation.batch.versions
  const versions = candidates.map((candidate, index) => {
    const current = currentVersions[index]
    if (current.name !== candidate.name || current.version !== candidate.version) {
      throw new Error('Lifecycle artifact refresh identities must preserve batch order')
    }
    return freezeLifecycleBatchVersion(candidate)
  })

  return decodeLifecycleContinuation({
    ...continuation,
    batch: { versions },
  })
}

export function commitLifecycleBatchResults(
  continuation: LifecycleContinuation,
  retainedVersions: ReadonlyArray<Pick<LifecycleBatchVersion, 'name' | 'version'>>,
  deleted: LifecycleDeletionCounts
): LifecycleContinuation {
  if (!continuation.batch?.inFlight) {
    throw new Error('Lifecycle batch must be armed before committing results')
  }

  const versions = selectRetainedVersions(continuation.batch.versions, retainedVersions)
  if (versions.length === 0) return completeLifecycleBatch(continuation, deleted)

  const retained = new Set(versions)
  if (
    continuation.batch.versions.some(
      (version) => !retained.has(version) && lifecycleVersionNeedsCompensation(version)
    )
  ) {
    throw new Error('Lifecycle batch still requires artifact compensation')
  }

  return decodeLifecycleContinuation({
    ...continuation,
    counters: addDeletionCounters(continuation.counters, deleted),
    batch: { versions, inFlight: continuation.batch.inFlight },
  })
}

export function completeLifecycleBatch(
  continuation: LifecycleContinuation,
  deleted: LifecycleDeletionCounts = { objectVersions: 0, deleteMarkers: 0, bytes: 0 }
): LifecycleContinuation {
  if (!continuation.batch || !continuation.pageEnd) {
    throw new Error('Lifecycle continuation has no batch to complete')
  }
  if (!continuation.batch.inFlight) {
    throw new Error('Lifecycle batch must be armed before completing')
  }
  if (continuation.batch.versions.some(lifecycleVersionNeedsCompensation)) {
    throw new Error('Lifecycle batch still requires artifact compensation')
  }

  return advanceLifecycleBatch(continuation, deleted)
}

function advanceLifecycleBatch(
  continuation: LifecycleContinuation,
  deleted: LifecycleDeletionCounts = { objectVersions: 0, deleteMarkers: 0, bytes: 0 }
): LifecycleContinuation {
  if (!continuation.batch || !continuation.pageEnd) {
    throw new Error('Lifecycle continuation has no batch to advance')
  }

  const { batch: _batch, pageEnd: _pageEnd, ...rest } = continuation
  return decodeLifecycleContinuation({
    ...rest,
    cursor: continuation.pageEnd,
    counters: {
      ...addDeletionCounters(continuation.counters, deleted),
      batchesCompleted: continuation.counters.batchesCompleted + 1,
    },
  })
}

export function lifecycleVersionNeedsCompensation(version: LifecycleBatchVersion): boolean {
  const outcomes = new Set(version.artifacts.map((artifact) => artifact.outcome))
  return (
    outcomes.has('UNRESOLVED') ||
    (outcomes.has('FAILED') && (outcomes.has('DELETED') || outcomes.has('ABSENT')))
  )
}

function selectRetainedVersions(
  currentVersions: LifecycleBatchVersion[],
  retainedVersions: ReadonlyArray<Pick<LifecycleBatchVersion, 'name' | 'version'>>
): LifecycleBatchVersion[] {
  const identities = new Set(
    retainedVersions.map((version) => lifecycleVersionIdentity(version.name, version.version))
  )
  if (identities.size !== retainedVersions.length) {
    throw new Error('Lifecycle retained version identities must be unique')
  }

  const versions = currentVersions.filter((version) =>
    identities.has(lifecycleVersionIdentity(version.name, version.version))
  )
  if (versions.length !== retainedVersions.length) {
    throw new Error('Lifecycle retained versions must belong to the current batch')
  }
  return versions
}

export function lifecycleVersionIdentity(name: string, version: string | null): string {
  return JSON.stringify([name, version])
}

function addDeletionCounters(
  counters: LifecycleRunCounters,
  deleted: LifecycleDeletionCounts
): LifecycleRunCounters {
  return {
    ...counters,
    objectVersionsDeleted: counters.objectVersionsDeleted + deleted.objectVersions,
    deleteMarkersDeleted: counters.deleteMarkersDeleted + deleted.deleteMarkers,
    bytesDeleted: counters.bytesDeleted + deleted.bytes,
  }
}

export function decodeLifecycleContinuation(value: unknown): LifecycleContinuation {
  const continuation = record(value, 'continuation')
  const continuationVersion = continuation.continuationVersion
  if (continuationVersion !== LIFECYCLE_CONTINUATION_VERSION) {
    throw decodeError(`Unsupported lifecycle continuation version ${String(continuationVersion)}`)
  }

  const decoded: LifecycleContinuation = {
    continuationVersion: LIFECYCLE_CONTINUATION_VERSION,
    runId: uuid(continuation.runId, 'runId'),
    trigger: oneOf(
      continuation.trigger,
      ['scheduled', 'configuration_change', 'manual', 'recovery'] as const,
      'trigger'
    ),
    generation: uuid(continuation.generation, 'generation'),
    snapshotAt: timestamp(continuation.snapshotAt, 'snapshotAt'),
    mode: oneOf(continuation.mode, ['EVALUATE', 'DELETE'] as const, 'mode'),
    topology: decodeTopology(continuation.topology),
    counters: decodeCounters(continuation.counters),
  }

  if (continuation.cursor !== undefined)
    decoded.cursor = decodeCursor(continuation.cursor, 'cursor')
  if (continuation.pageEnd !== undefined) {
    decoded.pageEnd = decodeCursor(continuation.pageEnd, 'pageEnd')
  }
  if (continuation.batch !== undefined) decoded.batch = decodeBatch(continuation.batch)

  if (decoded.batch?.versions.length && decoded.pageEnd === undefined) {
    throw decodeError('A lifecycle continuation batch requires pageEnd')
  }

  return decoded
}

function decodeTopology(value: unknown): LifecycleShardTopology {
  const topology = record(value, 'topology')
  const shardCount = safeInteger(topology.shardCount, 'topology.shardCount', 1, 1024)
  const shardId = safeInteger(topology.shardId, 'topology.shardId', 0, shardCount - 1)

  return {
    scanKind: oneOf(topology.scanKind, ['NONCURRENT', 'CURRENT'] as const, 'topology.scanKind'),
    epoch: positiveBigint(topology.epoch, 'topology.epoch'),
    shardId,
    shardCount,
  }
}

function decodeCursor(value: unknown, label: string): NoncurrentLifecycleShardCursor {
  const cursor = record(value, label)
  return {
    archivedAt: timestamp(cursor.archivedAt, `${label}.archivedAt`),
    name: string(cursor.name, `${label}.name`),
  }
}

function decodeCounters(value: unknown): LifecycleRunCounters {
  const counters = record(value, 'counters')
  return {
    versionsExamined: nonnegativeInteger(counters.versionsExamined, 'counters.versionsExamined'),
    versionsEligible: nonnegativeInteger(counters.versionsEligible, 'counters.versionsEligible'),
    objectVersionsDeleted: nonnegativeInteger(
      counters.objectVersionsDeleted,
      'counters.objectVersionsDeleted'
    ),
    deleteMarkersDeleted: nonnegativeInteger(
      counters.deleteMarkersDeleted,
      'counters.deleteMarkersDeleted'
    ),
    bytesDeleted: nonnegativeInteger(counters.bytesDeleted, 'counters.bytesDeleted'),
    batchesCompleted: nonnegativeInteger(counters.batchesCompleted, 'counters.batchesCompleted'),
  }
}

function decodeBatch(value: unknown): LifecycleContinuationBatch {
  const batch = record(value, 'batch')
  if (!Array.isArray(batch.versions) || batch.versions.length > LIFECYCLE_MAX_PAGE_SIZE) {
    throw decodeError(`batch.versions must contain at most ${LIFECYCLE_MAX_PAGE_SIZE} entries`)
  }

  const versions = batch.versions.map((entry, index): LifecycleBatchVersion => {
    const version = record(entry, `batch.versions[${index}]`)
    if (
      !Array.isArray(version.artifacts) ||
      (version.artifacts.length !== 0 && version.artifacts.length !== 2)
    ) {
      throw decodeError(`batch.versions[${index}].artifacts must contain 0 or 2 entries`)
    }
    return {
      name: string(version.name, `batch.versions[${index}].name`),
      version:
        version.version === null
          ? null
          : string(version.version, `batch.versions[${index}].version`),
      artifacts: version.artifacts.map((artifact, artifactIndex) =>
        decodeArtifact(artifact, `batch.versions[${index}].artifacts[${artifactIndex}]`)
      ),
    }
  })

  const decoded: LifecycleContinuationBatch = { versions }
  if (batch.inFlight !== undefined) decoded.inFlight = decodeAttempt(batch.inFlight)
  return decoded
}

function decodeArtifact(value: unknown, label: string): LifecycleArtifact {
  const artifact = record(value, label)
  const decoded: LifecycleArtifact = {
    key: string(artifact.key, `${label}.key`),
    outcome: oneOf(
      artifact.outcome,
      ['UNRESOLVED', 'DELETED', 'ABSENT', 'FAILED'] as const,
      `${label}.outcome`
    ),
  }
  if (artifact.error !== undefined) decoded.error = string(artifact.error, `${label}.error`)
  return decoded
}

function decodeAttempt(value: unknown): LifecycleInFlightAttempt {
  const attempt = record(value, 'batch.inFlight')
  return {
    attemptId: uuid(attempt.attemptId, 'batch.inFlight.attemptId'),
    authorizedGeneration: uuid(attempt.authorizedGeneration, 'batch.inFlight.authorizedGeneration'),
    startedAt: timestamp(attempt.startedAt, 'batch.inFlight.startedAt'),
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw decodeError(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0)
    throw decodeError(`${label} must be a string`)
  return value
}

function uuid(value: unknown, label: string): string {
  const parsed = string(value, label)
  if (!UUID.test(parsed)) throw decodeError(`${label} must be a UUID`)
  return parsed
}

function timestamp(value: unknown, label: string): string {
  const parsed = string(value, label)
  if (Number.isNaN(Date.parse(parsed))) throw decodeError(`${label} must be an ISO timestamp`)
  return parsed
}

function signedBigint(value: unknown, label: string): string {
  const parsed = string(value, label)
  if (!BIGINT.test(parsed)) throw decodeError(`${label} must be a bigint decimal string`)
  const bigint = BigInt(parsed)
  if (bigint < MIN_SIGNED_BIGINT || bigint > MAX_SIGNED_BIGINT) {
    throw decodeError(`${label} is outside the signed bigint range`)
  }
  return parsed
}

function positiveBigint(value: unknown, label: string): string {
  const parsed = signedBigint(value, label)
  if (BigInt(parsed) < 1n) throw decodeError(`${label} must be positive`)
  return parsed
}

function nonnegativeInteger(value: unknown, label: string): number {
  return safeInteger(value, label, 0, Number.MAX_SAFE_INTEGER)
}

function safeInteger(value: unknown, label: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw decodeError(`${label} must be an integer between ${minimum} and ${maximum}`)
  }
  return value as number
}

function oneOf<T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== 'string' || !values.includes(value)) {
    throw decodeError(`${label} must be one of ${values.join(', ')}`)
  }
  return value as T[number]
}

function decodeError(message: string) {
  return new LifecycleContinuationDecodeError(message)
}
