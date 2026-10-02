import type { DatabaseStatement } from '@internal/database'
import type { QueryResultRow } from 'pg'
import { lifecycleCutoffTime } from '../lifecycle/configuration'
import {
  type EvaluateNoncurrentLifecyclePageInput,
  LIFECYCLE_MAX_NEWER_NONCURRENT_VERSIONS,
  LIFECYCLE_MAX_PAGE_SIZE,
  type LifecycleCandidate,
  type LifecycleCandidateIdentity,
  type LifecycleEvaluationPage,
  type NoncurrentLifecycleShardCursor,
} from '../schemas/lifecycle'

interface LifecycleEvaluationResultRow extends QueryResultRow {
  raw_rows_examined: number
  candidates: unknown
  page_end: unknown | null
}

// Builds an oldest-first page up to the least restrictive rule cutoff. Cursor ordering
// assumes distinct archive times per object key. Newer-version counts are bounded by
// the largest retention count.
export function buildEvaluateNoncurrentLifecyclePageStatement(
  input: EvaluateNoncurrentLifecyclePageInput
): DatabaseStatement {
  validateEvaluationInput(input)

  const values: unknown[] = [input.bucketId]
  const parameter = (value: unknown) => {
    values.push(value)
    return `$${values.length}`
  }

  const snapshotParameter = parameter(timestampParameter(input.snapshotAt))
  const latestCutoff = input.rules.reduce(
    (latest, rule) =>
      lifecycleCutoffTime(rule.cutoffAt) > lifecycleCutoffTime(latest) ? rule.cutoffAt : latest,
    input.rules[0].cutoffAt
  )
  const latestCutoffParameter = parameter(timestampParameter(latestCutoff))
  const conditions = [
    'object_row.bucket_id = $1',
    'object_row.archived_at IS NOT NULL',
    `object_row.archived_at <= ${snapshotParameter}::timestamptz`,
    `object_row.archived_at < ${latestCutoffParameter}::timestamptz`,
  ]
  if (input.cursor) {
    const cursorArchivedAt = parameter(timestampParameter(input.cursor.archivedAt))
    const cursorName = parameter(input.cursor.name)
    conditions.push(`(
      object_row.archived_at,
      object_row.name COLLATE "C"
    ) > (
      ${cursorArchivedAt}::timestamptz,
      ${cursorName}::text COLLATE "C"
    )`)
  }

  const pageSizeParameter = parameter(input.pageSize)
  const cutoffsParameter = parameter(input.rules.map((rule) => timestampParameter(rule.cutoffAt)))
  const newerCountsParameter = parameter(
    input.rules.map((rule) => rule.newerNoncurrentVersions ?? null)
  )
  const maximumNewerProbeParameter = parameter(
    Math.max(1, ...input.rules.map((rule) => rule.newerNoncurrentVersions ?? 0))
  )

  return {
    text: `
      WITH rules(cutoff_at, newer_noncurrent_versions) AS MATERIALIZED (
        SELECT *
        FROM unnest(
          ${cutoffsParameter}::timestamptz[],
          ${newerCountsParameter}::integer[]
        )
      ),
      raw_page AS MATERIALIZED (
        SELECT
          object_row.name,
          object_row.version,
          object_row.is_delete_marker,
          object_row.archived_at
        FROM storage.objects AS object_row
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY object_row.archived_at, object_row.name COLLATE "C"
        LIMIT ${pageSizeParameter}::integer
      ),
      evaluated AS MATERIALIZED (
        SELECT raw_page.*, COALESCE(newer.newer_count, 0) AS newer_count
        FROM raw_page
        LEFT JOIN LATERAL (
          SELECT count(*)::integer AS newer_count
          FROM (
            SELECT 1
            FROM storage.objects AS newer_row
            WHERE newer_row.bucket_id = $1
              AND newer_row.name COLLATE "C" = raw_page.name COLLATE "C"
              AND newer_row.archived_at IS NOT NULL
              AND newer_row.archived_at <= ${snapshotParameter}::timestamptz
              AND newer_row.archived_at > raw_page.archived_at
            ORDER BY newer_row.archived_at
            LIMIT ${maximumNewerProbeParameter}::integer
          ) AS bounded_newer
          WHERE EXISTS (
            SELECT 1
            FROM rules
            WHERE rules.newer_noncurrent_versions IS NOT NULL
              AND raw_page.archived_at < rules.cutoff_at
          )
        ) AS newer ON true
      )
      SELECT
        (SELECT count(*)::integer FROM raw_page) AS raw_rows_examined,
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'name', evaluated.name,
              'version', evaluated.version,
              'isDeleteMarker', evaluated.is_delete_marker
            )
            ORDER BY evaluated.archived_at, evaluated.name COLLATE "C"
          )
          FROM evaluated
          WHERE EXISTS (
            SELECT 1
            FROM rules
            WHERE evaluated.archived_at < rules.cutoff_at
              AND (
                rules.newer_noncurrent_versions IS NULL
                OR evaluated.newer_count >= rules.newer_noncurrent_versions
              )
          )
        ), '[]'::jsonb) AS candidates,
        (
          SELECT jsonb_build_object('archivedAt', raw_page.archived_at, 'name', raw_page.name)
          FROM raw_page
          ORDER BY raw_page.archived_at DESC, raw_page.name COLLATE "C" DESC
          LIMIT 1
        ) AS page_end
    `,
    values,
  }
}

export function mapLifecycleEvaluationPage(
  row: LifecycleEvaluationResultRow,
  pageSize: number
): LifecycleEvaluationPage {
  const rawRowsExamined = Number(row.raw_rows_examined)
  if (!Number.isSafeInteger(rawRowsExamined) || rawRowsExamined < 0 || rawRowsExamined > pageSize) {
    throw new Error('Lifecycle evaluation returned an invalid raw row count')
  }

  if (!Array.isArray(row.candidates)) {
    throw new Error('Lifecycle evaluation returned invalid candidates')
  }
  const candidates = row.candidates.map(decodeLifecycleCandidateIdentity)
  if (candidates.length > rawRowsExamined) {
    throw new Error('Lifecycle evaluation returned more candidates than raw rows')
  }

  const pageEnd = row.page_end === null ? undefined : decodeCursor(row.page_end)
  if ((rawRowsExamined === 0) !== (pageEnd === undefined)) {
    throw new Error('Lifecycle evaluation returned an invalid page end')
  }

  return {
    rawRowsExamined,
    candidates,
    ...(pageEnd === undefined ? {} : { pageEnd }),
    exhausted: rawRowsExamined < pageSize,
  }
}

function timestampParameter(value: string): string {
  if (value === '-infinity') return value
  const date = new Date(value)
  const year = date.getUTCFullYear()
  if (year > 0) return value

  // PostgreSQL uses 1 BC for astronomical year zero. Preserve fractional seconds
  // from the input because Date truncates the microseconds used in cursor ordering.
  const fraction = value.match(/\.\d+/)?.[0] ?? '.000'
  const timestamp = date
    .toISOString()
    .replace(/^[+-]?\d+/, String(1 - year).padStart(4, '0'))
    .replace(/\.\d+Z$/, `${fraction}Z`)
  return `${timestamp} BC`
}

function validateEvaluationInput(input: EvaluateNoncurrentLifecyclePageInput) {
  if (
    !Number.isSafeInteger(input.pageSize) ||
    input.pageSize < 1 ||
    input.pageSize > LIFECYCLE_MAX_PAGE_SIZE
  ) {
    throw new Error(`Lifecycle page size must be between 1 and ${LIFECYCLE_MAX_PAGE_SIZE}`)
  }
  timestamp(input.snapshotAt, 'snapshotAt')
  if (input.rules.length === 0) {
    throw new Error('Lifecycle evaluation requires at least one enabled rule')
  }
  if (input.cursor) {
    string(input.cursor.name, 'cursor.name')
    timestamp(input.cursor.archivedAt, 'cursor.archivedAt')
  }
  for (const rule of input.rules) {
    if (rule.cutoffAt !== '-infinity') timestamp(rule.cutoffAt, 'rule.cutoffAt')
    if (
      rule.newerNoncurrentVersions !== undefined &&
      (!Number.isSafeInteger(rule.newerNoncurrentVersions) ||
        rule.newerNoncurrentVersions < 1 ||
        rule.newerNoncurrentVersions > LIFECYCLE_MAX_NEWER_NONCURRENT_VERSIONS)
    ) {
      throw new Error(
        `Lifecycle newer-version limit must be between 1 and ${LIFECYCLE_MAX_NEWER_NONCURRENT_VERSIONS}`
      )
    }
  }
}

export function decodeLifecycleCandidateIdentity(value: unknown): LifecycleCandidateIdentity {
  const candidate = record(value, 'candidate')
  return {
    name: string(candidate.name, 'candidate.name'),
    version: nullableString(candidate.version, 'candidate.version'),
    isDeleteMarker: boolean(candidate.isDeleteMarker, 'candidate.isDeleteMarker'),
  }
}

export function decodeCandidate(value: unknown): LifecycleCandidate {
  const candidate = record(value, 'candidate')
  return {
    id: string(candidate.id, 'candidate.id'),
    bucketId: string(candidate.bucketId, 'candidate.bucketId'),
    name: string(candidate.name, 'candidate.name'),
    version: nullableString(candidate.version, 'candidate.version'),
    isVersioned: boolean(candidate.isVersioned, 'candidate.isVersioned'),
    isDeleteMarker: boolean(candidate.isDeleteMarker, 'candidate.isDeleteMarker'),
    metadata:
      candidate.metadata === null
        ? null
        : (record(candidate.metadata, 'candidate.metadata') as Record<string, unknown>),
    createdAt: timestamp(candidate.createdAt, 'candidate.createdAt'),
    archivedAt: timestamp(candidate.archivedAt, 'candidate.archivedAt'),
  }
}

function decodeCursor(value: unknown): NoncurrentLifecycleShardCursor {
  const cursor = record(value, 'pageEnd')
  return {
    archivedAt: timestamp(cursor.archivedAt, 'pageEnd.archivedAt'),
    name: string(cursor.name, 'pageEnd.name'),
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a string`)
  return value
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : string(value, label)
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`)
  return value
}

function timestamp(value: unknown, label: string): string {
  const parsed = value instanceof Date ? value.toISOString() : string(value, label)
  if (Number.isNaN(Date.parse(parsed))) throw new Error(`${label} must be an ISO timestamp`)
  return parsed
}

export type { LifecycleEvaluationResultRow }
