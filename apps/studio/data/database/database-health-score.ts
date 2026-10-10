import { z } from 'zod'

/**
 * Point-in-time database health score, derived only from live PostgreSQL
 * statistics. Every threshold and penalty lives in DATABASE_HEALTH_CONFIG so it
 * can be reviewed and calibrated without touching the check logic.
 */
export const DATABASE_HEALTH_CONFIG = {
  status: { healthy: 80, needsAttention: 50 },
  /** Thresholds baked into the diagnostic queries themselves. */
  metrics: {
    statementTimeout: '5s',
    idleInTransactionSeconds: 30,
    longTransactionSeconds: 300,
    deadTupleRatio: 0.2,
    deadTupleMinimumRows: 1000,
    staleStatisticsDays: 7,
    staleStatisticsMinimumChanges: 1000,
  },
  criticalScoreCap: 30,
  categories: {
    connections: { label: 'Connections', weight: 20 },
    vacuum: { label: 'Vacuum and table health', weight: 25 },
    locks: { label: 'Locks', weight: 15 },
    transactions: { label: 'Transaction safety', weight: 20 },
    performance: { label: 'Performance', weight: 20 },
  },
  connections: {
    usage: { warningRatio: 0.7, warningDeduction: 12, criticalRatio: 0.9, criticalDeduction: 35 },
    idleInTransaction: { deductionPerSession: 6, maxDeduction: 24 },
    longRunningTransactions: { deductionPerSession: 10, maxDeduction: 30 },
  },
  vacuum: {
    deadTuples: { deductionPerTable: 5, maxDeduction: 30 },
    pastAutovacuumThreshold: { deductionPerTable: 3, maxDeduction: 18 },
    staleStatistics: { deductionPerTable: 3, maxDeduction: 15 },
    autovacuumDisabled: { deductionPerTable: 12, maxDeduction: 36 },
  },
  locks: {
    waitingSessions: { deductionPerSession: 10, maxDeduction: 30 },
    ungrantedLocks: { deductionPerLock: 6, maxDeduction: 24 },
    longWait: { seconds: 30, deduction: 25 },
  },
  transactions: {
    xidAge: { warningDeduction: 25, criticalDeduction: 100 },
    failsafeXidAge: 1_600_000_000,
    mvccHorizon: { seconds: 600, deduction: 20 },
  },
  performance: {
    cacheHit: {
      minimumBlocks: 10_000,
      warningRatio: 0.99,
      warningDeduction: 12,
      criticalRatio: 0.9,
      criticalDeduction: 35,
    },
    trackIoTiming: { deduction: 5 },
    hotUpdates: { minimumUpdates: 1_000, warningRatio: 0.3, deduction: 15 },
  },
} as const

const onOff = z.enum(['on', 'off'])
const count = z.coerce.number()
const optionalRatio = z.coerce.number().nullable()

export const connectionsMetricsSchema = z.object({
  max_connections: count,
  total_connections: count,
  idle_in_transaction_sessions: count,
  long_running_transactions: count,
})

export const vacuumMetricsSchema = z.object({
  table_count: count,
  dead_tuple_tables: count,
  tables_past_autovacuum_threshold: count,
  stale_statistics_tables: count,
  autovacuum_disabled_tables: count,
})

export const locksMetricsSchema = z.object({
  sessions_waiting_on_locks: count,
  ungranted_locks: count,
  longest_lock_wait_seconds: count,
})

export const transactionsMetricsSchema = z.object({
  max_database_xid_age: count,
  max_relation_xid_age: count,
  autovacuum: onOff,
  track_counts: onOff,
  autovacuum_freeze_max_age: count,
  oldest_transaction_seconds: count,
})

export const performanceMetricsSchema = z.object({
  cache_hit_ratio: optionalRatio,
  total_blocks_accessed: count,
  track_io_timing: onOff,
  hot_update_ratio: optionalRatio,
  total_updates: count,
})

export type ConnectionsMetrics = z.infer<typeof connectionsMetricsSchema>
export type VacuumMetrics = z.infer<typeof vacuumMetricsSchema>
export type LocksMetrics = z.infer<typeof locksMetricsSchema>
export type TransactionsMetrics = z.infer<typeof transactionsMetricsSchema>
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>

export type DatabaseHealthCategoryId = keyof typeof DATABASE_HEALTH_CONFIG.categories

export type DatabaseHealthMetricsByCategory = {
  connections: ConnectionsMetrics
  vacuum: VacuumMetrics
  locks: LocksMetrics
  transactions: TransactionsMetrics
  performance: PerformanceMetrics
}

export type DatabaseHealthCollection = {
  [Id in DatabaseHealthCategoryId]:
    | { status: 'collected'; metrics: DatabaseHealthMetricsByCategory[Id] }
    | { status: 'unavailable'; error: string }
}

export type DatabaseHealthSeverity = 'low' | 'medium' | 'high'

export type DatabaseHealthFinding = {
  id: string
  category: DatabaseHealthCategoryId
  severity: DatabaseHealthSeverity
  title: string
  description: string
  deduction: number
  action: string
}

export type DatabaseHealthSkippedCheck = { id: string; reason: string }

export type DatabaseHealthCategory = {
  id: DatabaseHealthCategoryId
  label: string
  weight: number
} & (
  | {
      status: 'collected'
      score: number
      findings: DatabaseHealthFinding[]
      skippedChecks: DatabaseHealthSkippedCheck[]
    }
  | { status: 'unavailable'; error: string }
)

export type DatabaseHealthResult = {
  score: number | null
  status: 'healthy' | 'needs_attention' | 'critical' | 'unavailable'
  categories: DatabaseHealthCategory[]
  findings: DatabaseHealthFinding[]
  criticalConditions: string[]
  skippedChecks: DatabaseHealthSkippedCheck[]
}

type CheckFinding = Omit<DatabaseHealthFinding, 'id' | 'category'>

type CheckOutcome =
  | { status: 'passed' }
  | { status: 'insufficient_data'; reason: string }
  | { status: 'failed'; finding: CheckFinding }

type Check<TMetrics> = { id: string; run: (metrics: TMetrics) => CheckOutcome }

const passed: CheckOutcome = { status: 'passed' }

const insufficientData = (reason: string): CheckOutcome => ({ status: 'insufficient_data', reason })

const failed = (finding: CheckFinding): CheckOutcome => ({ status: 'failed', finding })

const cappedDeduction = (count: number, perItem: number, maxDeduction: number) =>
  Math.min(count * perItem, maxDeduction)

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`

const asPercentage = (ratio: number) => `${(ratio * 100).toFixed(1)}%`

const connectionsChecks: Check<ConnectionsMetrics>[] = [
  {
    id: 'connection-usage',
    run: ({ total_connections, max_connections }) => {
      if (max_connections === 0) return insufficientData('max_connections reported as 0')

      const { usage } = DATABASE_HEALTH_CONFIG.connections
      const ratio = total_connections / max_connections
      if (ratio < usage.warningRatio) return passed

      const isCritical = ratio >= usage.criticalRatio
      return failed({
        severity: isCritical ? 'high' : 'medium',
        title: 'Connection pool is close to its limit',
        description: `${total_connections} of ${max_connections} connections are in use (${asPercentage(ratio)}). New connections are refused once the limit is reached.`,
        deduction: isCritical ? usage.criticalDeduction : usage.warningDeduction,
        action: 'Route clients through a connection pooler or reduce your pool size',
      })
    },
  },
  {
    id: 'idle-in-transaction',
    run: ({ idle_in_transaction_sessions }) => {
      if (idle_in_transaction_sessions === 0) return passed

      const { idleInTransaction } = DATABASE_HEALTH_CONFIG.connections
      return failed({
        severity: 'medium',
        title: 'Sessions are idle in transaction',
        description: `${pluralize(idle_in_transaction_sessions, 'session has', 'sessions have')} been idle in a transaction for over 30 seconds. These sessions hold locks and block vacuum.`,
        deduction: cappedDeduction(
          idle_in_transaction_sessions,
          idleInTransaction.deductionPerSession,
          idleInTransaction.maxDeduction
        ),
        action: 'Find the idle sessions and commit or roll back their transactions',
      })
    },
  },
  {
    id: 'long-running-transactions',
    run: ({ long_running_transactions }) => {
      if (long_running_transactions === 0) return passed

      const { longRunningTransactions } = DATABASE_HEALTH_CONFIG.connections
      return failed({
        severity: 'medium',
        title: 'Transactions have been running for over 5 minutes',
        description: `${pluralize(long_running_transactions, 'transaction has', 'transactions have')} been open for more than 5 minutes.`,
        deduction: cappedDeduction(
          long_running_transactions,
          longRunningTransactions.deductionPerSession,
          longRunningTransactions.maxDeduction
        ),
        action: 'Review the long-running queries and add a statement timeout',
      })
    },
  },
]

const vacuumChecks: Check<VacuumMetrics>[] = [
  {
    id: 'dead-tuples',
    run: ({ table_count, dead_tuple_tables }) => {
      if (table_count === 0) return insufficientData('No user tables to inspect')
      if (dead_tuple_tables === 0) return passed

      const { deadTuples } = DATABASE_HEALTH_CONFIG.vacuum
      return failed({
        severity: 'medium',
        title: 'Tables are carrying too many dead rows',
        description: `${pluralize(dead_tuple_tables, 'table has', 'tables have')} more than 20% dead rows. Dead rows slow down scans and waste disk.`,
        deduction: cappedDeduction(
          dead_tuple_tables,
          deadTuples.deductionPerTable,
          deadTuples.maxDeduction
        ),
        action: 'Run VACUUM on the affected tables',
      })
    },
  },
  {
    id: 'past-autovacuum-threshold',
    run: ({ table_count, tables_past_autovacuum_threshold }) => {
      if (table_count === 0) return insufficientData('No user tables to inspect')
      if (tables_past_autovacuum_threshold === 0) return passed

      const { pastAutovacuumThreshold } = DATABASE_HEALTH_CONFIG.vacuum
      return failed({
        severity: 'medium',
        title: 'Autovacuum is falling behind',
        description: `${pluralize(tables_past_autovacuum_threshold, 'table has', 'tables have')} accumulated more dead rows than their autovacuum trigger.`,
        deduction: cappedDeduction(
          tables_past_autovacuum_threshold,
          pastAutovacuumThreshold.deductionPerTable,
          pastAutovacuumThreshold.maxDeduction
        ),
        action: 'Lower autovacuum_vacuum_scale_factor or vacuum the tables manually',
      })
    },
  },
  {
    id: 'stale-statistics',
    run: ({ table_count, stale_statistics_tables }) => {
      if (table_count === 0) return insufficientData('No user tables to inspect')
      if (stale_statistics_tables === 0) return passed

      const { staleStatistics } = DATABASE_HEALTH_CONFIG.vacuum
      return failed({
        severity: 'low',
        title: 'Planner statistics are stale',
        description: `${pluralize(stale_statistics_tables, 'table has', 'tables have')} changed a lot since the last ANALYZE. The planner picks worse plans with stale statistics.`,
        deduction: cappedDeduction(
          stale_statistics_tables,
          staleStatistics.deductionPerTable,
          staleStatistics.maxDeduction
        ),
        action: 'Run ANALYZE on the affected tables',
      })
    },
  },
  {
    id: 'autovacuum-disabled-tables',
    run: ({ autovacuum_disabled_tables }) => {
      if (autovacuum_disabled_tables === 0) return passed

      const { autovacuumDisabled } = DATABASE_HEALTH_CONFIG.vacuum
      return failed({
        severity: 'high',
        title: 'Autovacuum is disabled on some tables',
        description: `${pluralize(autovacuum_disabled_tables, 'table has', 'tables have')} autovacuum_enabled set to false. These tables never get vacuumed automatically.`,
        deduction: cappedDeduction(
          autovacuum_disabled_tables,
          autovacuumDisabled.deductionPerTable,
          autovacuumDisabled.maxDeduction
        ),
        action: 'Re-enable autovacuum on the affected tables',
      })
    },
  },
]

const locksChecks: Check<LocksMetrics>[] = [
  {
    id: 'sessions-waiting-on-locks',
    run: ({ sessions_waiting_on_locks }) => {
      if (sessions_waiting_on_locks === 0) return passed

      const { waitingSessions } = DATABASE_HEALTH_CONFIG.locks
      return failed({
        severity: 'medium',
        title: 'Sessions are waiting on locks',
        description: `${pluralize(sessions_waiting_on_locks, 'session is', 'sessions are')} blocked waiting for a lock.`,
        deduction: cappedDeduction(
          sessions_waiting_on_locks,
          waitingSessions.deductionPerSession,
          waitingSessions.maxDeduction
        ),
        action: 'Identify the blocking session and end it if it is stuck',
      })
    },
  },
  {
    id: 'ungranted-locks',
    run: ({ ungranted_locks }) => {
      if (ungranted_locks === 0) return passed

      const { ungrantedLocks } = DATABASE_HEALTH_CONFIG.locks
      return failed({
        severity: 'medium',
        title: 'Lock requests have not been granted',
        description: `${pluralize(ungranted_locks, 'lock request is', 'lock requests are')} still pending. Pending locks queue behind each other and stall writes.`,
        deduction: cappedDeduction(
          ungranted_locks,
          ungrantedLocks.deductionPerLock,
          ungrantedLocks.maxDeduction
        ),
        action: 'Review the lock queue and retry the blocked statements',
      })
    },
  },
  {
    id: 'long-lock-wait',
    run: ({ longest_lock_wait_seconds }) => {
      const { longWait } = DATABASE_HEALTH_CONFIG.locks
      if (longest_lock_wait_seconds < longWait.seconds) return passed

      return failed({
        severity: 'high',
        title: 'A session has been waiting on a lock for too long',
        description: `The longest lock wait is ${Math.round(longest_lock_wait_seconds)} seconds. Waits this long usually mean a transaction is stuck.`,
        deduction: longWait.deduction,
        action: 'End the blocking transaction to release the lock',
      })
    },
  },
]

const transactionsChecks: Check<TransactionsMetrics>[] = [
  {
    id: 'xid-age',
    run: ({ max_database_xid_age, max_relation_xid_age, autovacuum_freeze_max_age }) => {
      const { xidAge, failsafeXidAge } = DATABASE_HEALTH_CONFIG.transactions
      const age = Math.max(max_database_xid_age, max_relation_xid_age)

      if (age >= failsafeXidAge) {
        return failed({
          severity: 'high',
          title: 'Transaction ID wraparound is imminent',
          description: `The oldest transaction ID is ${age.toLocaleString()} transactions old, past the ${failsafeXidAge.toLocaleString()} failsafe. PostgreSQL stops accepting writes near 2 billion.`,
          deduction: xidAge.criticalDeduction,
          action: 'Run VACUUM FREEZE on the oldest tables now',
        })
      }

      if (autovacuum_freeze_max_age === 0) {
        return insufficientData('autovacuum_freeze_max_age reported as 0')
      }

      if (age < autovacuum_freeze_max_age) return passed

      return failed({
        severity: 'high',
        title: 'Transaction ID age is past the freeze threshold',
        description: `The oldest transaction ID is ${age.toLocaleString()} transactions old, past autovacuum_freeze_max_age of ${autovacuum_freeze_max_age.toLocaleString()}.`,
        deduction: xidAge.warningDeduction,
        action: 'Let the anti-wraparound vacuum finish, or run VACUUM FREEZE',
      })
    },
  },
  {
    id: 'autovacuum-disabled',
    run: ({ autovacuum }) => {
      if (autovacuum === 'on') return passed

      return failed({
        severity: 'high',
        title: 'Autovacuum is disabled',
        description:
          'Autovacuum is off for the whole database. Dead rows and transaction IDs accumulate until the database stops accepting writes.',
        deduction: 100,
        action: 'Set autovacuum back to on',
      })
    },
  },
  {
    id: 'track-counts-disabled',
    run: ({ track_counts }) => {
      if (track_counts === 'on') return passed

      return failed({
        severity: 'high',
        title: 'Statistics collection is disabled',
        description:
          'track_counts is off, so PostgreSQL cannot see which tables need vacuuming. Autovacuum stops working correctly.',
        deduction: 100,
        action: 'Set track_counts back to on',
      })
    },
  },
  {
    id: 'mvcc-horizon',
    run: ({ oldest_transaction_seconds }) => {
      const { mvccHorizon } = DATABASE_HEALTH_CONFIG.transactions
      if (oldest_transaction_seconds < mvccHorizon.seconds) return passed

      return failed({
        severity: 'medium',
        title: 'An old transaction is holding back cleanup',
        description: `The oldest open transaction started ${Math.round(oldest_transaction_seconds / 60)} minutes ago. Vacuum cannot remove rows newer than it.`,
        deduction: mvccHorizon.deduction,
        action: 'End the oldest transaction so vacuum can reclaim space',
      })
    },
  },
]

const performanceChecks: Check<PerformanceMetrics>[] = [
  {
    id: 'cache-hit-ratio',
    run: ({ cache_hit_ratio, total_blocks_accessed }) => {
      const { cacheHit } = DATABASE_HEALTH_CONFIG.performance
      if (cache_hit_ratio === null || total_blocks_accessed < cacheHit.minimumBlocks) {
        return insufficientData(
          `Fewer than ${cacheHit.minimumBlocks.toLocaleString()} blocks read since the last statistics reset`
        )
      }
      if (cache_hit_ratio >= cacheHit.warningRatio) return passed

      const isCritical = cache_hit_ratio < cacheHit.criticalRatio
      return failed({
        severity: isCritical ? 'high' : 'medium',
        title: 'Cache hit ratio is low',
        description: `${asPercentage(cache_hit_ratio)} of block reads are served from cache. Reads that miss cache go to disk.`,
        deduction: isCritical ? cacheHit.criticalDeduction : cacheHit.warningDeduction,
        action: 'Add indexes for the heaviest queries, or move to a larger compute add-on',
      })
    },
  },
  {
    id: 'track-io-timing',
    run: ({ track_io_timing }) => {
      if (track_io_timing === 'on') return passed

      return failed({
        severity: 'low',
        title: 'I/O timing is not tracked',
        description:
          'track_io_timing is off, so query plans and pg_stat_statements cannot show time spent reading from disk.',
        deduction: DATABASE_HEALTH_CONFIG.performance.trackIoTiming.deduction,
        action: 'Set track_io_timing to on',
      })
    },
  },
  {
    id: 'hot-update-ratio',
    run: ({ hot_update_ratio, total_updates }) => {
      const { hotUpdates } = DATABASE_HEALTH_CONFIG.performance
      if (hot_update_ratio === null || total_updates < hotUpdates.minimumUpdates) {
        return insufficientData(
          `Fewer than ${hotUpdates.minimumUpdates.toLocaleString()} updates since the last statistics reset`
        )
      }
      if (hot_update_ratio >= hotUpdates.warningRatio) return passed

      return failed({
        severity: 'low',
        title: 'Few updates are heap-only',
        description: `Only ${asPercentage(hot_update_ratio)} of updates avoid rewriting index entries. Every other update writes to every index on the table.`,
        deduction: hotUpdates.deduction,
        action: 'Drop unused indexes on frequently updated tables',
      })
    },
  },
]

const CHECKS_BY_CATEGORY = {
  connections: connectionsChecks,
  vacuum: vacuumChecks,
  locks: locksChecks,
  transactions: transactionsChecks,
  performance: performanceChecks,
}

const CRITICAL_CHECK_IDS = new Set(['autovacuum-disabled', 'track-counts-disabled'])

function evaluateCategory<Id extends DatabaseHealthCategoryId>(
  id: Id,
  metrics: DatabaseHealthMetricsByCategory[Id]
) {
  const findings: DatabaseHealthFinding[] = []
  const skippedChecks: DatabaseHealthSkippedCheck[] = []

  const checks = CHECKS_BY_CATEGORY[id] as Check<DatabaseHealthMetricsByCategory[Id]>[]
  for (const check of checks) {
    const outcome = check.run(metrics)
    if (outcome.status === 'failed') {
      findings.push({ id: check.id, category: id, ...outcome.finding })
    }
    if (outcome.status === 'insufficient_data') {
      skippedChecks.push({ id: check.id, reason: outcome.reason })
    }
  }

  const totalDeduction = findings.reduce((total, finding) => total + finding.deduction, 0)

  return { score: Math.max(0, 100 - totalDeduction), findings, skippedChecks }
}

const SEVERITY_ORDER: Record<DatabaseHealthSeverity, number> = { high: 0, medium: 1, low: 2 }

export function calculateDatabaseHealth(
  collection: DatabaseHealthCollection
): DatabaseHealthResult {
  const categoryIds = Object.keys(DATABASE_HEALTH_CONFIG.categories) as DatabaseHealthCategoryId[]

  const categories = categoryIds.map((id): DatabaseHealthCategory => {
    const { label, weight } = DATABASE_HEALTH_CONFIG.categories[id]
    const collected = collection[id]

    if (collected.status === 'unavailable') {
      return { id, label, weight, status: 'unavailable', error: collected.error }
    }

    return { id, label, weight, status: 'collected', ...evaluateCategory(id, collected.metrics) }
  })

  const collectedCategories = categories.filter((category) => category.status === 'collected')

  const findings = collectedCategories
    .flatMap((category) => category.findings)
    .sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.deduction - a.deduction
    )

  const criticalConditions = findings
    .filter((finding) => CRITICAL_CHECK_IDS.has(finding.id))
    .map((finding) => finding.title)

  const transactionsCategory = categories.find((category) => category.id === 'transactions')
  const hasFailsafeXidAge =
    transactionsCategory?.status === 'collected' &&
    collection.transactions.status === 'collected' &&
    Math.max(
      collection.transactions.metrics.max_database_xid_age,
      collection.transactions.metrics.max_relation_xid_age
    ) >= DATABASE_HEALTH_CONFIG.transactions.failsafeXidAge
  if (hasFailsafeXidAge) criticalConditions.push('Transaction ID wraparound is imminent')

  const skippedChecks = collectedCategories.flatMap((category) => category.skippedChecks)

  if (collectedCategories.length === 0) {
    return {
      score: null,
      status: 'unavailable',
      categories,
      findings,
      criticalConditions,
      skippedChecks,
    }
  }

  const totalWeight = collectedCategories.reduce((total, category) => total + category.weight, 0)
  const weightedScore = collectedCategories.reduce(
    (total, category) => total + category.score * category.weight,
    0
  )

  const score =
    criticalConditions.length > 0
      ? Math.min(Math.round(weightedScore / totalWeight), DATABASE_HEALTH_CONFIG.criticalScoreCap)
      : Math.round(weightedScore / totalWeight)

  return {
    score,
    status: getDatabaseHealthStatus(score, criticalConditions),
    categories,
    findings,
    criticalConditions,
    skippedChecks,
  }
}

function getDatabaseHealthStatus(
  score: number,
  criticalConditions: string[]
): DatabaseHealthResult['status'] {
  if (criticalConditions.length > 0) return 'critical'
  if (score >= DATABASE_HEALTH_CONFIG.status.healthy) return 'healthy'
  if (score >= DATABASE_HEALTH_CONFIG.status.needsAttention) return 'needs_attention'
  return 'critical'
}

export const DATABASE_HEALTH_STATUS_LABELS: Record<DatabaseHealthResult['status'], string> = {
  healthy: 'Healthy',
  needs_attention: 'Needs attention',
  critical: 'Critical',
  unavailable: 'Unavailable',
}
