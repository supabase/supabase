import type { BloatRow } from '@/data/database/debugger/bloat-query'
import type { BlockingRow } from '@/data/database/debugger/blocking-query'
import type { CacheHitRow } from '@/data/database/debugger/cache-hit-query'
import type { IndexUsageRow } from '@/data/database/debugger/index-usage-query'
import type { LocksRow } from '@/data/database/debugger/locks-query'
import type { LongRunningQueriesRow } from '@/data/database/debugger/long-running-queries-query'
import type { ReplicationSlotsRow } from '@/data/database/debugger/replication-slots-query'
import type { RoleStatsRow } from '@/data/database/debugger/role-stats-query'
import type { SeqScansRow } from '@/data/database/debugger/seq-scans-query'
import type { UnusedIndexesRow } from '@/data/database/debugger/unused-indexes-query'
import type { VacuumStatsRow } from '@/data/database/debugger/vacuum-stats-query'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type DebuggerSeverity = 'critical' | 'warning' | 'info' | 'ok'
export type DebuggerCategory = 'locks' | 'storage' | 'performance' | 'connections'

export interface DebuggerFinding {
  id: string
  category: DebuggerCategory
  severity: DebuggerSeverity
  title: string
  description: string
  recommendation?: string
}

export interface DebuggerCheckInput {
  locks?: LocksRow[]
  blocking?: BlockingRow[]
  longRunningQueries?: LongRunningQueriesRow[]
  bloat?: BloatRow[]
  vacuumStats?: VacuumStatsRow[]
  cacheHit?: CacheHitRow[]
  indexUsage?: IndexUsageRow[]
  unusedIndexes?: UnusedIndexesRow[]
  seqScans?: SeqScansRow[]
  roleStats?: RoleStatsRow[]
  replicationSlots?: ReplicationSlotsRow[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a Postgres interval string such as "00:30:15.123" or
 * "1 day 02:03:04" into total minutes (floating point).
 * Returns null if the string cannot be parsed.
 */
export function parseIntervalMinutes(interval: string): number | null {
  if (!interval) return null

  let totalMinutes = 0

  // Handle "N day(s)" prefix, e.g. "1 day 02:03:04" or "3 days 00:00:00"
  const dayMatch = interval.match(/(\d+)\s+days?/)
  if (dayMatch) {
    totalMinutes += parseInt(dayMatch[1], 10) * 24 * 60
  }

  // Handle HH:MM:SS[.fraction] component
  const timeMatch = interval.match(/(\d+):(\d{2}):(\d{2})(?:\.\d+)?/)
  if (timeMatch) {
    totalMinutes +=
      parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10) + parseInt(timeMatch[3], 10) / 60
    return totalMinutes
  }

  // Nothing parseable
  return totalMinutes > 0 ? totalMinutes : null
}

// ---------------------------------------------------------------------------
// Per-check interpreters
// ---------------------------------------------------------------------------

/**
 * Blocking check: any active blocking chain is critical.
 */
export function interpretBlocking(rows: BlockingRow[]): DebuggerFinding {
  if (rows.length === 0) {
    return {
      id: 'blocking',
      category: 'locks',
      severity: 'ok',
      title: 'No blocking queries',
      description: 'No queries are currently blocking other queries.',
    }
  }

  const uniqueBlockers = new Set(rows.map((r) => r.blocking_pid)).size
  const uniqueBlocked = new Set(rows.map((r) => r.blocked_pid)).size

  return {
    id: 'blocking',
    category: 'locks',
    severity: 'critical',
    title: 'Active query blocking detected',
    description:
      `${uniqueBlockers} quer${uniqueBlockers !== 1 ? 'ies' : 'y'} ` +
      `${uniqueBlockers !== 1 ? 'are' : 'is'} blocking ${uniqueBlocked} ` +
      `other quer${uniqueBlocked !== 1 ? 'ies' : 'y'}. ` +
      `Longest blocking duration: ${rows[0].blocking_duration}.`,
    recommendation:
      'Identify and terminate the blocking query using pg_terminate_backend(pid), ' +
      'or investigate the transaction holding the lock.',
  }
}

/**
 * Locks check: an ungranted (waiting) exclusive lock means a query is stalled.
 */
export function interpretLocks(rows: LocksRow[]): DebuggerFinding {
  const ungranted = rows.filter((r) => !r.granted)

  if (ungranted.length === 0) {
    return {
      id: 'locks',
      category: 'locks',
      severity: 'ok',
      title: 'No ungranted locks',
      description: 'All exclusive locks are currently granted.',
    }
  }

  return {
    id: 'locks',
    category: 'locks',
    severity: 'warning',
    title: `${ungranted.length} ungranted lock${ungranted.length !== 1 ? 's' : ''} detected`,
    description:
      `${ungranted.length} exclusive lock${ungranted.length !== 1 ? 's' : ''} ` +
      `${ungranted.length !== 1 ? 'are' : 'is'} waiting to be granted. ` +
      `Affected relations: ${[...new Set(ungranted.map((r) => r.relname))].join(', ')}.`,
    recommendation:
      'Check for long-running transactions or blocking queries holding conflicting locks.',
  }
}

/**
 * Long-running queries check:
 * - Any row is at least a warning.
 * - duration > 30 minutes is critical.
 */
export function interpretLongRunningQueries(rows: LongRunningQueriesRow[]): DebuggerFinding {
  if (rows.length === 0) {
    return {
      id: 'long-running-queries',
      category: 'performance',
      severity: 'ok',
      title: 'No long-running queries',
      description: 'No queries have been running beyond the configured threshold.',
    }
  }

  const longestRow = rows[0]
  const longestMinutes = parseIntervalMinutes(longestRow.duration)
  // Critical threshold: > 30 minutes
  const isCritical = longestMinutes !== null && longestMinutes > 30

  return {
    id: 'long-running-queries',
    category: 'performance',
    severity: isCritical ? 'critical' : 'warning',
    title: isCritical
      ? `${rows.length} long-running quer${rows.length !== 1 ? 'ies' : 'y'} (critical)`
      : `${rows.length} long-running quer${rows.length !== 1 ? 'ies' : 'y'} detected`,
    description:
      `${rows.length} quer${rows.length !== 1 ? 'ies' : 'y'} exceeded the configured threshold. ` +
      `Longest running duration: ${longestRow.duration}.`,
    recommendation:
      'Review whether these queries are expected to run this long. ' +
      'Consider adding indexes, optimizing the query plan, or terminating runaway queries with pg_terminate_backend(pid).',
  }
}

/**
 * Cache hit check: separate findings for table and index hit rate.
 * Thresholds:
 *   - ratio >= 0.99: ok
 *   - ratio >= 0.95 and < 0.99: warning
 *   - ratio < 0.95: critical
 */
export function interpretCacheHit(rows: CacheHitRow[]): DebuggerFinding[] {
  const findings: DebuggerFinding[] = []

  for (const row of rows) {
    const isIndex = row.name === 'index hit rate'
    const id = isIndex ? 'cache-hit-index' : 'cache-hit-table'
    const label = isIndex ? 'Index' : 'Table'

    const ratio = parseFloat(row.ratio)
    if (isNaN(ratio)) {
      findings.push({
        id,
        category: 'performance',
        severity: 'ok',
        title: `${label} cache hit rate: no data`,
        description: `No ${label.toLowerCase()} access statistics are available yet.`,
      })
      continue
    }

    const pct = (ratio * 100).toFixed(2)

    if (ratio < 0.95) {
      findings.push({
        id,
        category: 'performance',
        severity: 'critical',
        title: `${label} cache hit rate is critically low (${pct}%)`,
        description:
          `The ${label.toLowerCase()} buffer cache hit ratio is ${pct}%, well below the 95% minimum. ` +
          `A significant number of reads are going to disk.`,
        recommendation:
          'Consider increasing shared_buffers or instance RAM. ' +
          'Investigate workload patterns that bypass the cache.',
      })
    } else if (ratio < 0.99) {
      findings.push({
        id,
        category: 'performance',
        severity: 'warning',
        title: `${label} cache hit rate is below 99% (${pct}%)`,
        description:
          `The ${label.toLowerCase()} buffer cache hit ratio is ${pct}%. ` +
          `Some reads are going to disk, which may slow queries under load.`,
        recommendation:
          'Monitor memory usage and consider increasing shared_buffers if this persists.',
      })
    } else {
      findings.push({
        id,
        category: 'performance',
        severity: 'ok',
        title: `${label} cache hit rate is healthy (${pct}%)`,
        description: `The ${label.toLowerCase()} buffer cache hit ratio is ${pct}%.`,
      })
    }
  }

  return findings
}

/**
 * Bloat check: bloat ratio > 10 is flagged.
 * The bloat value is a ratio of actual pages to estimated optimal pages.
 */
export function interpretBloat(rows: BloatRow[]): DebuggerFinding {
  // bloatThreshold: ratio > 10x means 10x more pages than optimal
  const BLOAT_THRESHOLD = 10

  const bloated = rows.filter((r) => {
    const val = parseFloat(r.bloat)
    return !isNaN(val) && val > BLOAT_THRESHOLD
  })

  if (bloated.length === 0) {
    return {
      id: 'bloat',
      category: 'storage',
      severity: 'ok',
      title: 'No significant table or index bloat',
      description: `All tables and indexes have a bloat ratio at or below ${BLOAT_THRESHOLD}x.`,
    }
  }

  const sorted = [...bloated].sort((a, b) => parseFloat(b.bloat) - parseFloat(a.bloat))
  const top = sorted.slice(0, 5)
  const offenderList = top.map((r) => `${r.name} (${r.bloat}x, wasted: ${r.waste})`).join('; ')

  return {
    id: 'bloat',
    category: 'storage',
    severity: 'warning',
    title: `${bloated.length} bloated table${bloated.length !== 1 ? 's' : ''} or index${bloated.length !== 1 ? 'es' : ''} detected`,
    description:
      `${bloated.length} object${bloated.length !== 1 ? 's' : ''} exceed a ${BLOAT_THRESHOLD}x bloat ratio. ` +
      `Worst offenders: ${offenderList}.`,
    recommendation:
      'Run VACUUM FULL or use pg_repack to reclaim wasted space without taking exclusive locks.',
  }
}

/**
 * Vacuum stats check: tables where autovacuum is expected (expect_autovacuum = 'yes')
 * and have > 1000 dead rows are flagged.
 */
export function interpretVacuumStats(rows: VacuumStatsRow[]): DebuggerFinding {
  const DEAD_ROW_THRESHOLD = 1000

  const needsVacuum = rows.filter((r) => {
    if (r.expect_autovacuum !== 'yes') return false
    const dead = parseInt(r.dead_rowcount.replace(/[^0-9]/g, ''), 10)
    return !isNaN(dead) && dead > DEAD_ROW_THRESHOLD
  })

  if (needsVacuum.length === 0) {
    return {
      id: 'vacuum',
      category: 'storage',
      severity: 'ok',
      title: 'Autovacuum is keeping up',
      description: 'No tables have a dead row count above the autovacuum threshold.',
    }
  }

  const tableList = needsVacuum
    .slice(0, 5)
    .map((r) => `${r.name} (${r.dead_rowcount.trim()} dead rows)`)
    .join('; ')

  return {
    id: 'vacuum',
    category: 'storage',
    severity: 'warning',
    title: `${needsVacuum.length} table${needsVacuum.length !== 1 ? 's' : ''} need autovacuum`,
    description:
      `${needsVacuum.length} table${needsVacuum.length !== 1 ? 's' : ''} ` +
      `exceed the autovacuum dead-row threshold. Tables: ${tableList}.`,
    recommendation:
      'Check that autovacuum is enabled and not blocked. ' +
      'Consider manually running VACUUM on high-priority tables, or tuning autovacuum_vacuum_scale_factor.',
  }
}

/**
 * Index usage check: tables with < 95% of scans using an index AND > 10000 rows.
 */
export function interpretIndexUsage(rows: IndexUsageRow[]): DebuggerFinding {
  const INDEX_USAGE_THRESHOLD = 95
  const MIN_ROWS = 10_000

  const underIndexed = rows.filter((r) => {
    if (r.rows_in_table <= MIN_ROWS) return false
    const pct = parseFloat(r.percent_of_times_index_used)
    return !isNaN(pct) && pct < INDEX_USAGE_THRESHOLD
  })

  if (underIndexed.length === 0) {
    return {
      id: 'index-usage',
      category: 'performance',
      severity: 'ok',
      title: 'Index usage is healthy',
      description: `All large tables (>${MIN_ROWS.toLocaleString()} rows) use indexes for at least ${INDEX_USAGE_THRESHOLD}% of scans.`,
    }
  }

  const tableList = underIndexed
    .slice(0, 5)
    .map(
      (r) =>
        `${r.name} (${r.percent_of_times_index_used} index use, ${r.rows_in_table.toLocaleString()} rows)`
    )
    .join('; ')

  return {
    id: 'index-usage',
    category: 'performance',
    severity: 'warning',
    title: `${underIndexed.length} large table${underIndexed.length !== 1 ? 's' : ''} with low index usage`,
    description:
      `${underIndexed.length} table${underIndexed.length !== 1 ? 's' : ''} with ` +
      `>${MIN_ROWS.toLocaleString()} rows use indexes for fewer than ${INDEX_USAGE_THRESHOLD}% of scans. ` +
      `Tables: ${tableList}.`,
    recommendation:
      'Add indexes on frequently queried columns. Review query plans with EXPLAIN ANALYZE to identify full sequential scans.',
  }
}

/**
 * Unused indexes check: non-unique indexes with 0 scans are info-level candidates for removal.
 */
export function interpretUnusedIndexes(rows: UnusedIndexesRow[]): DebuggerFinding {
  const unused = rows.filter((r) => r.index_scans === 0)

  if (unused.length === 0) {
    return {
      id: 'unused-indexes',
      category: 'storage',
      severity: 'ok',
      title: 'No unused indexes found',
      description: 'All non-unique indexes have been scanned at least once.',
    }
  }

  const indexList = unused
    .slice(0, 5)
    .map((r) => `${r.index} on ${r.name} (${r.index_size})`)
    .join('; ')

  return {
    id: 'unused-indexes',
    category: 'storage',
    severity: 'info',
    title: `${unused.length} unused index${unused.length !== 1 ? 'es' : ''} detected`,
    description:
      `${unused.length} non-unique index${unused.length !== 1 ? 'es' : ''} have 0 scans recorded. ` +
      `Candidates: ${indexList}.`,
    recommendation:
      'Confirm these indexes are not needed, then drop them to reduce write overhead and disk usage. ' +
      'Be cautious: statistics reset after pg_stat_reset().',
  }
}

/**
 * Sequential scans check: tables with > 1000 seq scans flagged as info.
 */
export function interpretSeqScans(rows: SeqScansRow[]): DebuggerFinding {
  const SEQ_SCAN_THRESHOLD = 1_000

  const highSeqScans = rows.filter((r) => r.count > SEQ_SCAN_THRESHOLD)

  if (highSeqScans.length === 0) {
    return {
      id: 'seq-scans',
      category: 'performance',
      severity: 'ok',
      title: 'No high sequential scan counts',
      description: `No tables have more than ${SEQ_SCAN_THRESHOLD.toLocaleString()} sequential scans.`,
    }
  }

  const tableList = highSeqScans
    .slice(0, 5)
    .map((r) => `${r.name} (${r.count.toLocaleString()} seq scans)`)
    .join('; ')

  return {
    id: 'seq-scans',
    category: 'performance',
    severity: 'info',
    title: `${highSeqScans.length} table${highSeqScans.length !== 1 ? 's' : ''} with high sequential scan counts`,
    description:
      `${highSeqScans.length} table${highSeqScans.length !== 1 ? 's' : ''} have more than ` +
      `${SEQ_SCAN_THRESHOLD.toLocaleString()} sequential scans: ${tableList}.`,
    recommendation:
      'Review query plans with EXPLAIN ANALYZE. Adding indexes on frequently filtered columns may reduce seq scans.',
  }
}

/**
 * Role stats check: roles using >= 80% of connection limit flagged as warning.
 */
export function interpretRoleStats(rows: RoleStatsRow[]): DebuggerFinding {
  const CONNECTION_USAGE_THRESHOLD = 0.8

  const approaching = rows.filter((r) => {
    if (r.connection_limit <= 0) return false
    return r.active_connections / r.connection_limit >= CONNECTION_USAGE_THRESHOLD
  })

  if (approaching.length === 0) {
    return {
      id: 'role-connections',
      category: 'connections',
      severity: 'ok',
      title: 'Connection usage is normal',
      description: 'No roles are using more than 80% of their connection limit.',
    }
  }

  const roleList = approaching
    .slice(0, 5)
    .map(
      (r) =>
        `${r.role_name} (${r.active_connections}/${r.connection_limit}, ${Math.round((r.active_connections / r.connection_limit) * 100)}%)`
    )
    .join('; ')

  return {
    id: 'role-connections',
    category: 'connections',
    severity: 'warning',
    title: `${approaching.length} role${approaching.length !== 1 ? 's' : ''} approaching connection limit`,
    description:
      `${approaching.length} role${approaching.length !== 1 ? 's' : ''} ` +
      `${approaching.length !== 1 ? 'are' : 'is'} using over 80% of their connection limit. ` +
      `Roles: ${roleList}.`,
    recommendation:
      'Consider using a connection pooler such as Supavisor, increasing the connection limit, ' +
      'or auditing long-lived idle connections.',
  }
}

/**
 * Replication slots check: inactive slots or lag > 1 GB flagged as warning.
 */
export function interpretReplicationSlots(rows: ReplicationSlotsRow[]): DebuggerFinding {
  const LAG_GB_THRESHOLD = 1

  const problematic = rows.filter((r) => !r.active || r.replication_lag_gb > LAG_GB_THRESHOLD)

  if (problematic.length === 0) {
    return {
      id: 'replication-slots',
      category: 'connections',
      severity: 'ok',
      title: 'Replication slots are healthy',
      description: 'All replication slots are active and have acceptable lag.',
    }
  }

  const slotList = problematic
    .slice(0, 5)
    .map((r) => `${r.slot_name} (active: ${r.active}, lag: ${r.replication_lag_gb} GB)`)
    .join('; ')

  return {
    id: 'replication-slots',
    category: 'connections',
    severity: 'warning',
    title: `${problematic.length} problematic replication slot${problematic.length !== 1 ? 's' : ''}`,
    description:
      `${problematic.length} replication slot${problematic.length !== 1 ? 's' : ''} ` +
      `${problematic.length !== 1 ? 'are' : 'is'} either inactive or have lag exceeding ${LAG_GB_THRESHOLD} GB. ` +
      `Slots: ${slotList}.`,
    recommendation:
      'Drop unused replication slots with pg_drop_replication_slot(slot_name). ' +
      'Inactive slots prevent WAL cleanup and can fill the disk.',
  }
}

// ---------------------------------------------------------------------------
// Aggregator
// ---------------------------------------------------------------------------

/**
 * Runs all per-check interpreters over the provided input.
 * A field being undefined means "not loaded / not run" -- those checks are
 * silently skipped (no finding emitted). An empty array means "loaded, no
 * rows found" -- in that case the interpreter will return an ok finding.
 */
export function interpretDebuggerResults(input: DebuggerCheckInput): DebuggerFinding[] {
  const findings: DebuggerFinding[] = []

  if (input.blocking !== undefined) {
    findings.push(interpretBlocking(input.blocking))
  }

  if (input.locks !== undefined) {
    findings.push(interpretLocks(input.locks))
  }

  if (input.longRunningQueries !== undefined) {
    findings.push(interpretLongRunningQueries(input.longRunningQueries))
  }

  if (input.cacheHit !== undefined) {
    findings.push(...interpretCacheHit(input.cacheHit))
  }

  if (input.bloat !== undefined) {
    findings.push(interpretBloat(input.bloat))
  }

  if (input.vacuumStats !== undefined) {
    findings.push(interpretVacuumStats(input.vacuumStats))
  }

  if (input.indexUsage !== undefined) {
    findings.push(interpretIndexUsage(input.indexUsage))
  }

  if (input.unusedIndexes !== undefined) {
    findings.push(interpretUnusedIndexes(input.unusedIndexes))
  }

  if (input.seqScans !== undefined) {
    findings.push(interpretSeqScans(input.seqScans))
  }

  if (input.roleStats !== undefined) {
    findings.push(interpretRoleStats(input.roleStats))
  }

  if (input.replicationSlots !== undefined) {
    findings.push(interpretReplicationSlots(input.replicationSlots))
  }

  return findings
}
