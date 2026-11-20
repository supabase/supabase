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

const GAP_SQLSTATES = new Set(['0A000', '42P01', '42883', '42704', '3F000'])

// turso refuses these constructs with a syntax error (42601) instead of 0A000.
const SYNTAX_REFUSALS =
  /^(?:unnest currently requires exactly one array|ORDER BY may not be used with non-aggregate|SELECT requires at least one column or expression)/i

// A missing object is a gap when it is turso's wording ("no such function: x") or a catalog object;
// Postgres's own `relation "x" does not exist` for a user's table must reach the caller unchanged.
const MISSING_CATALOG_OBJECT = /^no such (?:table|function|column): |\bpg_[a-z_]+\b/i

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
  if (state === '42601') return SYNTAX_REFUSALS.test(message)
  return GAP_SQLSTATES.has(state) && MISSING_CATALOG_OBJECT.test(message)
}

/** Runs `run`; when it fails with a catalog gap, returns `fallback()` instead. */
export async function withCatalogFallback<T>(
  run: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (!isCatalogGap(error)) throw error
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
