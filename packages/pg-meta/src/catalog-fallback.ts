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

// Spark's exact refusals of the pg-meta queries that have a fallback, by SQLSTATE. An error is a
// gap only when it is one of these: Postgres can raise any SQLSTATE itself (an event trigger can
// refuse a statement with 0A000), and its wording never matches turso's.
const TURSO_REFUSALS: Record<string, string[]> = {
  '0A000': [
    'SELECT DISTINCT ON is not supported',
    'DO is not supported',
    'a column alias list on a function is not supported',
  ],
  '42601': [
    'unnest currently requires exactly one array',
    'ORDER BY may not be used with non-aggregate jsonb_agg()',
    'Array slice missing lower index',
  ],
  '22000': ['unnest requires an array'],
  '3F000': ['schema "pg_temp" does not exist'],
  '42703': ['no such column: a'],
  '42883': [
    'no such function: array_ndims',
    'no such function: array_fill',
    'no such function: json_build_object',
    'no such function: left',
    'no such function: jsonb_agg',
    'no such function: pg_has_role',
    'no such function: pg_get_functiondef',
    'no such function: pg_get_function_identity_arguments',
    'no such function: to_regclass',
  ],
  '42P01': [
    'no such table: aclexplode',
    'no such table: pg_available_extensions',
    'no such table: pg_enum',
    'no such table: main.pg_enum',
    'no such table: pg_get_keywords',
    'no such table: pg_locks',
    'no such table: pg_partition_tree',
    'no such table: pg_stat_activity',
    'no such table: main.pg_stat_activity',
    'no such table: supabase_migrations.schema_migrations',
  ],
}

// Spark's refusals of what the table editor writes with: `json(b)_populate_record(set)`, and the
// column-less `select` of an all-default row.
const POPULATE_RECORD_REFUSAL =
  /^(?:no such (?:function|table): jsonb?_populate_record(?:set)?|SELECT requires at least one column or expression)$/i

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
 * Whether a query failed with one of Spark's (turso's) refusals of a catalog, function or SQL
 * feature a pg-meta query needs, as opposed to any other failure.
 */
export function isCatalogGap(error: unknown): boolean {
  const state = sqlStateOf(error)
  const message = messageOf(error)
  if (state === undefined) {
    return Object.values(TURSO_REFUSALS).some((messages) => messages.includes(message))
  }
  return TURSO_REFUSALS[state]?.includes(message) ?? false
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
