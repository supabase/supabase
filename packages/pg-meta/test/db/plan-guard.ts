/**
 * Shared EXPLAIN plan-budget harness for hot-path Studio introspection queries.
 *
 * ── THE RULE ──────────────────────────────────────────────────────────────
 * Every new introspection query added under `src/sql/` that is executed on a
 * user's live catalog (Table Editor, Database pages, entity lists, definitions,
 * ...) MUST get a budget entry in `test/sql/studio/catalog-plan-guard.test.ts`.
 *
 * Seq scans over catalogs that SCALE with schema size -- pg_class, pg_attribute,
 * pg_index, pg_constraint, pg_attrdef, pg_description, pg_depend, pg_policy,
 * pg_trigger, pg_rewrite, ... -- are only acceptable with a written STRUCTURAL
 * justification (e.g. "no index exists on pg_constraint.confrelid"). An unscoped
 * O(catalog) scan with no such justification is a bug: a production catalog had
 * ~267K pg_class rows and unscoped CTEs turned a single Table Editor open into
 * 30-58s of seq scans. Scope your query to the requested OID/schema instead.
 *
 * Tiny, fixed-size system catalogs (see TINY_NON_SCALING_CATALOGS) are always
 * tolerated: the planner full-scans them because they hold a handful of rows and
 * do not grow with the number of tables.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { createTestDatabase } from './utils'

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>

/**
 * Tiny, fixed-size system catalogs (a handful of schemas/FDWs/enums/procs) that
 * PostgreSQL's planner will always choose to seq scan regardless of query
 * scoping, because a full scan of a handful of rows is cheaper than an index
 * scan. These don't grow with table count and are unrelated to the O(catalog)
 * regression this harness guards against, which is specifically about catalogs
 * that scale with the number of tables/columns/indexes/constraints (pg_class,
 * pg_attribute, pg_index, pg_constraint, ...).
 */
export const TINY_NON_SCALING_CATALOGS = new Set([
  'pg_namespace',
  'pg_foreign_table',
  'pg_foreign_server',
  'pg_foreign_data_wrapper',
  'pg_enum',
  'pg_proc',
])

/**
 * Recursively walk an EXPLAIN (FORMAT JSON) plan tree and collect the relation
 * name of every `Seq Scan` node. Returns one entry per seq-scan node (so a
 * relation scanned twice appears twice).
 */
export function collectSeqScans(
  node: unknown,
  out: Array<string | undefined> = []
): Array<string | undefined> {
  if (Array.isArray(node)) {
    for (const item of node) collectSeqScans(item, out)
  } else if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj['Node Type'] === 'Seq Scan') {
      out.push(obj['Relation Name'] as string | undefined)
    }
    for (const key of Object.keys(obj)) {
      collectSeqScans(obj[key], out)
    }
  }
  return out
}

export type ExplainResult = {
  /** The top-level plan node (`{ Plan, "Execution Time", ... }`). */
  plan: { Plan: unknown; 'Execution Time': number }
  /** Relation name of every seq-scan node found in the plan (one per node). */
  seqScans: Array<string | undefined>
  /** Measured execution time in milliseconds. */
  executionTimeMs: number
}

/**
 * Run `EXPLAIN (ANALYZE, FORMAT JSON)` on a SQL fragment and return the plan
 * together with the flattened list of seq-scanned relations and the measured
 * execution time.
 */
export async function explainAnalyze(
  db: TestDatabase,
  sqlFragment: string
): Promise<ExplainResult> {
  const [row] = await db.executeQuery<Array<Record<string, any>>>(
    `explain (analyze, format json) ${sqlFragment}`
  )
  const [plan] = row['QUERY PLAN'] as Array<{ Plan: unknown; 'Execution Time': number }>
  return {
    plan,
    seqScans: collectSeqScans(plan.Plan),
    executionTimeMs: plan['Execution Time'],
  }
}

export type PlanBudget = {
  /**
   * Seq scans on scaling catalogs that are structurally unavoidable, keyed by
   * relation name. `max` caps how many seq-scan nodes on that relation are
   * allowed; `reason` is the written structural justification (shown on
   * failure). Prefix a reason with `KNOWN ISSUE:` to flag a suspected unscoped
   * scan that still needs a follow-up fix.
   */
  allowedSeqScans?: Record<string, { max: number; reason: string }>
  /** Upper bound on measured execution time, in ms. Defaults to 1000. */
  maxExecutionTimeMs?: number
}

/**
 * Assert an EXPLAIN result stays within its plan budget:
 *   - tiny non-scaling catalogs are always tolerated,
 *   - every other seq scan must match an `allowedSeqScans` entry and stay at or
 *     under its `max`,
 *   - execution time must stay under `maxExecutionTimeMs` (default 1000ms).
 *
 * Failures are actionable: they name the offending relations, dump the full
 * seq-scan list, and restate the rule so the developer knows to scope the query
 * or add a justified budget entry.
 *
 * Throws an `Error` describing the first violation; the caller (a vitest `test`)
 * surfaces it as a failed assertion.
 */
export function assertPlanWithinBudget(result: ExplainResult, budget: PlanBudget = {}): void {
  const allowed = budget.allowedSeqScans ?? {}
  const maxExecutionTimeMs = budget.maxExecutionTimeMs ?? 1000

  const seqScans = result.seqScans
  const seqScanList = JSON.stringify(seqScans)

  // Count seq-scan nodes per relation, ignoring tolerated tiny catalogs.
  const counts = new Map<string, number>()
  const offending: string[] = []
  for (const relation of seqScans) {
    if (!relation) {
      offending.push('(unknown relation)')
      continue
    }
    if (TINY_NON_SCALING_CATALOGS.has(relation)) continue
    if (!(relation in allowed)) {
      offending.push(relation)
      continue
    }
    counts.set(relation, (counts.get(relation) ?? 0) + 1)
  }

  if (offending.length > 0) {
    throw new Error(
      `Unexpected seq scan(s) on scaling catalog(s): ${offending.join(', ')}.\n` +
        `RULE: scope your query to the requested OID/schema so it uses an index, ` +
        `or -- if the scan is structurally unavoidable -- add a justified budget ` +
        `entry to allowedSeqScans with a written reason.\n` +
        `Tolerated tiny non-scaling catalogs: ${[...TINY_NON_SCALING_CATALOGS].join(', ')}.\n` +
        `Declared allowedSeqScans: ${Object.keys(allowed).join(', ') || '(none)'}.\n` +
        `All seq scans in plan: ${seqScanList}`
    )
  }

  for (const [relation, { max, reason }] of Object.entries(allowed)) {
    const found = counts.get(relation) ?? 0
    if (found > max) {
      throw new Error(
        `Too many seq-scan nodes on ${relation}: found ${found}, budget allows ${max}.\n` +
          `Reason on file: "${reason}".\n` +
          `A higher count usually means a new unscoped scan crept in -- scope it or ` +
          `raise the budget with justification.\n` +
          `All seq scans in plan: ${seqScanList}`
      )
    }
  }

  if (result.executionTimeMs >= maxExecutionTimeMs) {
    throw new Error(
      `Query took ${result.executionTimeMs.toFixed(1)}ms, budget is ${maxExecutionTimeMs}ms. ` +
        `At stress scale this signals O(catalog) work -- scope the query to the ` +
        `requested OID/schema.\n` +
        `All seq scans in plan: ${seqScanList}`
    )
  }
}
