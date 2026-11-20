/**
 * TEMPORARY. Shared by the `*.fallback.ts` modules next to the builders. Delete it with the last of
 * them, once Spark (turso) runs every pg-meta query they stand in for.
 *
 * A fallback runs only after its builder's SQL fails with a catalog gap: plain catalog SQL that a
 * partial `pg_catalog` runs, with the builder's output shape assembled in TypeScript. Postgres never
 * reaches it, so its SQL has no plan-guard budget.
 */
import type { SafeSqlFragment } from './pg-format'

export type CatalogRow = Record<string, unknown>

/** Runs one SQL statement on the project and returns its rows. */
export type CatalogQuery = (sql: SafeSqlFragment) => Promise<CatalogRow[]>

const GAP_SQLSTATES = new Set(['0A000', '42P01', '42883', '42703', '42704', '3F000'])

// turso refuses these constructs with a syntax error (42601) or a data exception (22000) instead of
// 0A000; Postgres never words an error this way.
const TURSO_REFUSALS =
  /^(?:unnest currently requires exactly one array|ORDER BY may not be used with non-aggregate|Array slice missing lower index|unnest requires an array$)/i

// turso's wording for a missing object, which Postgres never uses: Postgres's own
// `relation "x" does not exist` (even for a user table named `pg_x`) reaches the caller unchanged.
// Spark reports the session schema `pg_temp` missing in Postgres's words.
const MISSING_CATALOG_OBJECT =
  /^no such (?:table|function|column): |^schema "pg_temp" does not exist$/i

// Spark's refusals of what the table editor writes with: `json(b)_populate_record(set)`, and the
// column-less `select` of an all-default row.
const POPULATE_RECORD_REFUSAL =
  /^(?:no such (?:function|table): jsonb?_populate_record(?:set)?|SELECT requires at least one column or expression)$/i

// For an error that carries no SQLSTATE.
const GAP_MESSAGE =
  /^(?:[a-z_ ]+ is not supported|unnest currently requires exactly one array|no such (?:table|function|column): [\w.]+)$/i

const SQLSTATE_IN_TEXT = /\bERROR:\s+([0-9A-Z]{5}):\s*/

function errorField(error: unknown, key: string): string | undefined {
  if (typeof error !== 'object' || error === null || !(key in error)) return undefined
  const value = (error as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

function sqlStateOf(error: unknown): string | undefined {
  const candidates = [errorField(error, 'sqlState'), errorField(error, 'code')]
  const direct = candidates.find((value) => value !== undefined && /^[0-9A-Z]{5}$/.test(value))
  if (direct) return direct
  for (const key of ['formattedError', 'message']) {
    const match = errorField(error, key)?.match(SQLSTATE_IN_TEXT)
    if (match) return match[1]
  }
  return undefined
}

function messageOf(error: unknown): string {
  const message = errorField(error, 'message') ?? String(error)
  const afterState = message.split(SQLSTATE_IN_TEXT)
  return (afterState.length > 1 ? afterState[afterState.length - 1] : message)
    .replace(/^Failed to (?:run sql query|execute query): /, '')
    .trim()
}

/**
 * Whether a query failed because the database lacks a catalog, function or SQL feature the query
 * needs (Spark on turso), as opposed to any other failure. Permission errors are never gaps: a
 * fallback skips pg-meta's privilege filters.
 */
export function isCatalogGap(error: unknown): boolean {
  const state = sqlStateOf(error)
  const message = messageOf(error)
  if (state === '42501' || /^permission denied\b/i.test(message)) return false
  if (state === undefined) return GAP_MESSAGE.test(message)
  if (state === '0A000') return true
  if (state === '42601' || state === '22000') return TURSO_REFUSALS.test(message)
  return GAP_SQLSTATES.has(state) && MISSING_CATALOG_OBJECT.test(message)
}

/**
 * Whether a table editor write failed only because the database lacks `json(b)_populate_record(set)`.
 * Narrower than `isCatalogGap`: a write is retried only when the database refused it before running
 * it, never after a trigger may have had side effects.
 */
export function isPopulateRecordGap(error: unknown): boolean {
  const state = sqlStateOf(error)
  return (
    (state === '42883' || state === '42P01' || state === '42601') &&
    POPULATE_RECORD_REFUSAL.test(messageOf(error))
  )
}

/** Whether the database refused a `DO` block as such, not a statement the block ran. */
export function isDoBlockGap(error: unknown): boolean {
  return sqlStateOf(error) === '0A000' && /^DO is not supported$/i.test(messageOf(error))
}

/** Runs `run`; when it fails with a gap `isGap` accepts, returns `fallback()` instead. */
export async function withCatalogFallback<T>(
  run: () => Promise<T>,
  fallback: () => Promise<T>,
  isGap: (error: unknown) => boolean = isCatalogGap
): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (!isGap(error)) throw error
    return fallback()
  }
}

/** Rows of a query whose catalog may be missing on a partial `pg_catalog`; empty when it is. */
export const optionalRows = (run: Promise<CatalogRow[]>) =>
  run.catch((error) => {
    if (isCatalogGap(error)) return [] as CatalogRow[]
    throw error
  })

// turso returns some booleans as 0/1.
export const toBool = (value: unknown) =>
  value === true || value === 1 || value === 't' || value === 'true'
export const toInt = (value: unknown) => Number(value ?? 0)
export const toText = (value: unknown) =>
  value === null || value === undefined ? null : String(value)

// Postgres prints an int2vector as `1 2` and a smallint[] as `{1,2}`; turso prints both as `1 2`.
export const toAttnums = (value: unknown) =>
  value === null || value === undefined
    ? []
    : String(value)
        .replace(/[{}]/g, '')
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number)
