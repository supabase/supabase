import type { Bucket } from './bucket'

export const LIFECYCLE_MAX_RULES = 1000
export const LIFECYCLE_MAX_NONCURRENT_DAYS = 2147483647
export const LIFECYCLE_MAX_NEWER_NONCURRENT_VERSIONS = 100

// Keep additional fields visible to the semantic validator instead of allowing
// Fastify to strip them before we can return a useful unsupported-field error.
const lifecycleRuleSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'Rule IDs are limited to 255 characters.',
    },
    status: { type: 'string', enum: ['Enabled', 'Disabled'] },
    filter: { type: 'object', additionalProperties: true },
    noncurrentVersionExpiration: {
      type: 'object',
      properties: {
        noncurrentDays: {
          type: 'integer',
          finite: true,
          description: `Must be between 1 and ${LIFECYCLE_MAX_NONCURRENT_DAYS}.`,
        },
        newerNoncurrentVersions: { type: 'integer', finite: true },
      },
      required: ['noncurrentDays'],
    },
  },
} as const

export const bucketLifecycleConfigurationSchema = {
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      minItems: 1,
      maxItems: LIFECYCLE_MAX_RULES,
      items: {
        ...lifecycleRuleSchema,
        required: ['status', 'filter', 'noncurrentVersionExpiration'],
      },
    },
  },
  required: ['rules'],
} as const

export interface NoncurrentVersionExpiration {
  noncurrentDays: number
  newerNoncurrentVersions?: number
}

export type LifecycleRuleFilter = Record<string, never>

// Persisted configuration follows the same contract as normalized writes.
export interface LifecycleRule {
  id?: string
  status: 'Enabled' | 'Disabled'
  noncurrentVersionExpiration: NoncurrentVersionExpiration
  filter: LifecycleRuleFilter
}

export interface BucketLifecycleConfiguration {
  rules: LifecycleRule[]
}

export interface LifecycleEvaluationRule {
  cutoffAt: string
  newerNoncurrentVersions?: number
}

export const LIFECYCLE_MAX_PAGE_SIZE = 500

export interface NoncurrentLifecycleShardCursor {
  archivedAt: string
  name: string
}

export interface LifecycleCandidate {
  id: string
  bucketId: string
  name: string
  version: string | null
  isVersioned: boolean
  isDeleteMarker: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  archivedAt: string
}

export interface LifecycleCandidateIdentity {
  name: string
  version: string | null
  isDeleteMarker: boolean
}

export interface LifecycleEvaluationPage {
  rawRowsExamined: number
  candidates: LifecycleCandidateIdentity[]
  pageEnd?: NoncurrentLifecycleShardCursor
  exhausted: boolean
}

export interface EvaluateNoncurrentLifecyclePageInput {
  bucketId: string
  snapshotAt: string
  cursor?: NoncurrentLifecycleShardCursor
  rules: LifecycleEvaluationRule[]
  pageSize: number
}

export const LIFECYCLE_CONTINUATION_VERSION = 1 as const

export type LifecycleExecutionMode = 'EVALUATE' | 'DELETE'

export type LifecycleScanKind = 'NONCURRENT' | 'CURRENT'

export type LifecycleTrigger = 'scheduled' | 'configuration_change' | 'manual' | 'recovery'

export interface LifecycleShardTopology {
  scanKind: LifecycleScanKind
  epoch: string
  shardId: number
  shardCount: number
}

export interface LifecycleRunCounters {
  versionsExamined: number
  versionsEligible: number
  objectVersionsDeleted: number
  deleteMarkersDeleted: number
  bytesDeleted: number
  batchesCompleted: number
}

export type LifecycleArtifactOutcome = 'UNRESOLVED' | 'DELETED' | 'ABSENT' | 'FAILED'

export interface LifecycleArtifact {
  key: string
  outcome: LifecycleArtifactOutcome
  error?: string
}

export interface LifecycleBatchVersion {
  name: string
  version: string | null
  artifacts: LifecycleArtifact[]
}

export interface LifecycleInFlightAttempt {
  attemptId: string
  authorizedGeneration: string
  startedAt: string
}

export interface LifecycleContinuationBatch {
  versions: LifecycleBatchVersion[]
  inFlight?: LifecycleInFlightAttempt
}

export interface LifecycleContinuation {
  continuationVersion: typeof LIFECYCLE_CONTINUATION_VERSION
  runId: string
  trigger: LifecycleTrigger
  generation: string
  snapshotAt: string
  mode: LifecycleExecutionMode
  topology: LifecycleShardTopology
  cursor?: NoncurrentLifecycleShardCursor
  pageEnd?: NoncurrentLifecycleShardCursor
  counters: LifecycleRunCounters
  batch?: LifecycleContinuationBatch
}

export type LifecycleBucket = Pick<Bucket, 'id' | 'name' | 'type'> & {
  lifecycle_configuration: BucketLifecycleConfiguration | null
  lifecycle_configuration_generation: string | null
}
