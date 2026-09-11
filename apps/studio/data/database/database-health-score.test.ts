import { describe, expect, it } from 'vitest'

import {
  calculateDatabaseHealth,
  DATABASE_HEALTH_CONFIG,
  type DatabaseHealthCollection,
  type TransactionsMetrics,
} from './database-health-score'

const healthyTransactionsMetrics = {
  max_database_xid_age: 1_000_000,
  max_relation_xid_age: 1_000_000,
  autovacuum: 'on',
  track_counts: 'on',
  autovacuum_freeze_max_age: 200_000_000,
  oldest_transaction_seconds: 2,
} satisfies TransactionsMetrics

const healthyCollection = (): DatabaseHealthCollection => ({
  connections: {
    status: 'collected',
    metrics: {
      max_connections: 100,
      total_connections: 10,
      idle_in_transaction_sessions: 0,
      long_running_transactions: 0,
    },
  },
  vacuum: {
    status: 'collected',
    metrics: {
      table_count: 20,
      dead_tuple_tables: 0,
      tables_past_autovacuum_threshold: 0,
      stale_statistics_tables: 0,
      autovacuum_disabled_tables: 0,
    },
  },
  locks: {
    status: 'collected',
    metrics: { sessions_waiting_on_locks: 0, ungranted_locks: 0, longest_lock_wait_seconds: 0 },
  },
  transactions: { status: 'collected', metrics: healthyTransactionsMetrics },
  performance: {
    status: 'collected',
    metrics: {
      cache_hit_ratio: 0.999,
      total_blocks_accessed: 5_000_000,
      track_io_timing: 'on',
      hot_update_ratio: 0.8,
      total_updates: 100_000,
    },
  },
})

describe('calculateDatabaseHealth', () => {
  it('scores a healthy database at 100 with no findings', () => {
    const result = calculateDatabaseHealth(healthyCollection())

    expect(result.score).toBe(100)
    expect(result.status).toBe('healthy')
    expect(result.findings).toEqual([])
  })

  it('deducts per-table penalties up to the configured maximum', () => {
    const collection = healthyCollection()
    collection.vacuum = {
      status: 'collected',
      metrics: {
        table_count: 100,
        dead_tuple_tables: 100,
        tables_past_autovacuum_threshold: 0,
        stale_statistics_tables: 0,
        autovacuum_disabled_tables: 0,
      },
    }

    const result = calculateDatabaseHealth(collection)
    const finding = result.findings.find((f) => f.id === 'dead-tuples')

    expect(finding?.deduction).toBe(DATABASE_HEALTH_CONFIG.vacuum.deadTuples.maxDeduction)
    expect(result.score).toBeLessThan(100)
  })

  it('caps the score at 30 when autovacuum is off', () => {
    const collection = healthyCollection()
    collection.transactions = {
      status: 'collected',
      metrics: { ...healthyTransactionsMetrics, autovacuum: 'off' },
    }

    const result = calculateDatabaseHealth(collection)

    expect(result.score).toBeLessThanOrEqual(DATABASE_HEALTH_CONFIG.criticalScoreCap)
    expect(result.status).toBe('critical')
    expect(result.criticalConditions).toContain('Autovacuum is disabled')
  })

  it('caps the score at 30 when XID age reaches the failsafe threshold', () => {
    const collection = healthyCollection()
    collection.transactions = {
      status: 'collected',
      metrics: {
        ...healthyTransactionsMetrics,
        max_relation_xid_age: DATABASE_HEALTH_CONFIG.transactions.failsafeXidAge,
      },
    }

    const result = calculateDatabaseHealth(collection)

    expect(result.score).toBeLessThanOrEqual(DATABASE_HEALTH_CONFIG.criticalScoreCap)
    expect(result.criticalConditions).toContain('Transaction ID wraparound is imminent')
  })

  it('excludes unavailable categories from the weighted average instead of scoring them', () => {
    const collection = healthyCollection()
    collection.locks = { status: 'unavailable', error: 'canceling statement due to timeout' }
    collection.performance = { status: 'unavailable', error: 'permission denied' }

    const result = calculateDatabaseHealth(collection)

    expect(result.score).toBe(100)
    expect(result.categories.filter((c) => c.status === 'unavailable')).toHaveLength(2)
  })

  it('reports unavailable when no category could be collected', () => {
    const result = calculateDatabaseHealth({
      connections: { status: 'unavailable', error: 'failed' },
      vacuum: { status: 'unavailable', error: 'failed' },
      locks: { status: 'unavailable', error: 'failed' },
      transactions: { status: 'unavailable', error: 'failed' },
      performance: { status: 'unavailable', error: 'failed' },
    })

    expect(result.score).toBeNull()
    expect(result.status).toBe('unavailable')
  })

  it('skips checks with insufficient data rather than passing them', () => {
    const collection = healthyCollection()
    collection.performance = {
      status: 'collected',
      metrics: {
        cache_hit_ratio: null,
        total_blocks_accessed: 0,
        track_io_timing: 'on',
        hot_update_ratio: null,
        total_updates: 0,
      },
    }

    const result = calculateDatabaseHealth(collection)

    expect(result.skippedChecks.map((check) => check.id)).toEqual([
      'cache-hit-ratio',
      'hot-update-ratio',
    ])
    expect(result.findings).toEqual([])
  })

  it('sorts findings by severity then deduction', () => {
    const collection = healthyCollection()
    collection.performance = {
      status: 'collected',
      metrics: {
        cache_hit_ratio: 0.5,
        total_blocks_accessed: 5_000_000,
        track_io_timing: 'off',
        hot_update_ratio: 0.8,
        total_updates: 100_000,
      },
    }

    const result = calculateDatabaseHealth(collection)

    expect(result.findings.map((finding) => finding.severity)).toEqual(['high', 'low'])
  })
})
