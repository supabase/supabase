import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DatabaseHealthReport } from './DatabaseHealthSection'
import {
  calculateDatabaseHealth,
  type DatabaseHealthCollection,
} from '@/data/database/database-health-score'

const COLLECTED_AT = '2026-08-12T10:30:00.000Z'

const collection = (): DatabaseHealthCollection => ({
  connections: {
    status: 'collected',
    metrics: {
      max_connections: 100,
      total_connections: 95,
      idle_in_transaction_sessions: 0,
      long_running_transactions: 0,
    },
  },
  vacuum: {
    status: 'collected',
    metrics: {
      table_count: 10,
      dead_tuple_tables: 0,
      tables_past_autovacuum_threshold: 0,
      stale_statistics_tables: 0,
      autovacuum_disabled_tables: 0,
    },
  },
  locks: { status: 'unavailable', error: 'canceling statement due to statement timeout' },
  transactions: {
    status: 'collected',
    metrics: {
      max_database_xid_age: 1_000_000,
      max_relation_xid_age: 1_000_000,
      autovacuum: 'on',
      track_counts: 'on',
      autovacuum_freeze_max_age: 200_000_000,
      oldest_transaction_seconds: 0,
    },
  },
  performance: {
    status: 'collected',
    metrics: {
      cache_hit_ratio: 0.999,
      total_blocks_accessed: 5_000_000,
      track_io_timing: 'on',
      hot_update_ratio: 0.9,
      total_updates: 50_000,
    },
  },
})

describe('DatabaseHealthReport', () => {
  it('shows each finding with an explanation and a suggested action', () => {
    const result = calculateDatabaseHealth(collection())

    render(<DatabaseHealthReport result={result} collectedAt={COLLECTED_AT} />)

    expect(screen.getByText('Connection pool is close to its limit')).toBeInTheDocument()
    expect(screen.getByText(/95 of 100 connections are in use/)).toBeInTheDocument()
    expect(
      screen.getByText('Route clients through a connection pooler or reduce your pool size')
    ).toBeInTheDocument()
  })

  it('calls out categories that could not be checked', () => {
    const result = calculateDatabaseHealth(collection())

    render(<DatabaseHealthReport result={result} collectedAt={COLLECTED_AT} />)

    expect(screen.getByText('Some categories could not be checked')).toBeInTheDocument()
    expect(screen.getByText(/Locks were excluded from the score/)).toBeInTheDocument()
  })

  it('explains the score cap when a critical condition is present', () => {
    const withAutovacuumOff = collection()
    withAutovacuumOff.transactions = {
      status: 'collected',
      metrics: {
        max_database_xid_age: 1_000_000,
        max_relation_xid_age: 1_000_000,
        autovacuum: 'off',
        track_counts: 'on',
        autovacuum_freeze_max_age: 200_000_000,
        oldest_transaction_seconds: 0,
      },
    }
    const result = calculateDatabaseHealth(withAutovacuumOff)

    render(<DatabaseHealthReport result={result} collectedAt={COLLECTED_AT} />)

    expect(screen.getByText('Score capped at 30 by a critical condition')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('reports an unavailable snapshot when no query returned', () => {
    const result = calculateDatabaseHealth({
      connections: { status: 'unavailable', error: 'failed' },
      vacuum: { status: 'unavailable', error: 'failed' },
      locks: { status: 'unavailable', error: 'failed' },
      transactions: { status: 'unavailable', error: 'failed' },
      performance: { status: 'unavailable', error: 'failed' },
    })

    render(<DatabaseHealthReport result={result} collectedAt={COLLECTED_AT} />)

    expect(screen.getByText('Unable to read database health')).toBeInTheDocument()
  })
})
