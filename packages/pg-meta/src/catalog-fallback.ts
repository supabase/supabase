/**
 * TEMPORARY. Shared by the `*.fallback.ts` modules next to the builders. Delete it with the last of
 * them, once Spark (turso) runs every pg-meta query they stand in for.
 *
 * A fallback runs instead of its builder on a Spark project: plain catalog SQL that a partial
 * `pg_catalog` runs, with the builder's output shape assembled in TypeScript. Studio decides from the
 * project, so a fallback never sees Postgres and its SQL has no plan-guard budget.
 */
import type { SafeSqlFragment } from './pg-format'

export type CatalogRow = Record<string, unknown>

/** Runs one SQL statement on the project and returns its rows. */
export type CatalogQuery = (sql: SafeSqlFragment) => Promise<CatalogRow[]>

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
