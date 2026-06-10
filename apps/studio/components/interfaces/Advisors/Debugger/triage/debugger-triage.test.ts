import { describe, expect, test } from 'vitest'

import {
  interpretBloat,
  interpretBlocking,
  interpretCacheHit,
  interpretDebuggerResults,
  interpretIndexUsage,
  interpretLocks,
  interpretLongRunningQueries,
  interpretReplicationSlots,
  interpretRoleStats,
  interpretSeqScans,
  interpretUnusedIndexes,
  interpretVacuumStats,
  parseIntervalMinutes,
} from './debugger-triage'
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
// parseIntervalMinutes
// ---------------------------------------------------------------------------

describe('parseIntervalMinutes', () => {
  test('parses HH:MM:SS format', () => {
    expect(parseIntervalMinutes('00:05:00')).toBe(5)
  })

  test('parses HH:MM:SS.fraction format', () => {
    const result = parseIntervalMinutes('00:30:00.123')
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(30, 1)
  })

  test('parses 1 hour 30 min', () => {
    expect(parseIntervalMinutes('01:30:00')).toBe(90)
  })

  test('parses interval with day component', () => {
    const result = parseIntervalMinutes('1 day 02:00:00')
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(1560, 0) // 24*60 + 2*60
  })

  test('parses plural days', () => {
    const result = parseIntervalMinutes('3 days 00:00:00')
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(3 * 24 * 60, 0)
  })

  test('returns null for empty string', () => {
    expect(parseIntervalMinutes('')).toBeNull()
  })

  test('returns null for unparseable string', () => {
    expect(parseIntervalMinutes('not-a-duration')).toBeNull()
  })

  test('parses exactly 30 minutes', () => {
    expect(parseIntervalMinutes('00:30:00')).toBe(30)
  })

  test('parses slightly above 30 minutes', () => {
    const result = parseIntervalMinutes('00:30:01')
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(30)
  })
})

// ---------------------------------------------------------------------------
// interpretBlocking
// ---------------------------------------------------------------------------

describe('interpretBlocking', () => {
  test('returns ok when no blocking rows', () => {
    const finding = interpretBlocking([])
    expect(finding.severity).toBe('ok')
    expect(finding.id).toBe('blocking')
    expect(finding.category).toBe('locks')
  })

  test('returns critical when blocking rows present', () => {
    const row: BlockingRow = {
      blocked_pid: 1,
      blocking_statement: 'SELECT 1',
      blocking_duration: '00:01:00',
      blocking_pid: 2,
      blocked_statement: 'UPDATE foo SET x=1',
      blocked_duration: '00:00:30',
    }
    const finding = interpretBlocking([row])
    expect(finding.severity).toBe('critical')
    expect(finding.id).toBe('blocking')
  })

  test('description mentions count of blocking and blocked queries', () => {
    const rows: BlockingRow[] = [
      {
        blocked_pid: 1,
        blocking_statement: 'SELECT 1',
        blocking_duration: '00:02:00',
        blocking_pid: 3,
        blocked_statement: 'UPDATE a',
        blocked_duration: '00:01:00',
      },
      {
        blocked_pid: 2,
        blocking_statement: 'SELECT 1',
        blocking_duration: '00:01:30',
        blocking_pid: 4,
        blocked_statement: 'UPDATE b',
        blocked_duration: '00:00:45',
      },
    ]
    const finding = interpretBlocking(rows)
    expect(finding.description).toContain('2')
  })

  test('undefined input skips in aggregator', () => {
    const findings = interpretDebuggerResults({ blocking: undefined })
    const blockingFindings = findings.filter((f) => f.id === 'blocking')
    expect(blockingFindings).toHaveLength(0)
  })

  test('empty array input produces ok in aggregator', () => {
    const findings = interpretDebuggerResults({ blocking: [] })
    const blockingFindings = findings.filter((f) => f.id === 'blocking')
    expect(blockingFindings).toHaveLength(1)
    expect(blockingFindings[0].severity).toBe('ok')
  })
})

// ---------------------------------------------------------------------------
// interpretLocks
// ---------------------------------------------------------------------------

describe('interpretLocks', () => {
  test('returns ok when no rows', () => {
    expect(interpretLocks([]).severity).toBe('ok')
  })

  test('returns ok when all locks are granted', () => {
    const row: LocksRow = {
      pid: 1,
      relname: 'users',
      transactionid: '123',
      granted: true,
      stmt: 'SELECT 1',
      age: '00:00:10',
    }
    expect(interpretLocks([row]).severity).toBe('ok')
  })

  test('returns warning when any lock is ungranted', () => {
    const row: LocksRow = {
      pid: 2,
      relname: 'orders',
      transactionid: '456',
      granted: false,
      stmt: 'UPDATE orders SET status=1',
      age: '00:00:05',
    }
    expect(interpretLocks([row]).severity).toBe('warning')
  })

  test('mentions relation name in description', () => {
    const row: LocksRow = {
      pid: 2,
      relname: 'my_table',
      transactionid: '789',
      granted: false,
      stmt: 'DELETE FROM my_table',
      age: '00:00:02',
    }
    const finding = interpretLocks([row])
    expect(finding.description).toContain('my_table')
  })

  test('only ungranted locks counted — mixed granted/ungranted is warning', () => {
    const rows: LocksRow[] = [
      { pid: 1, relname: 'a', transactionid: '1', granted: true, stmt: 'q1', age: '00:00:01' },
      { pid: 2, relname: 'b', transactionid: '2', granted: false, stmt: 'q2', age: '00:00:02' },
    ]
    expect(interpretLocks(rows).severity).toBe('warning')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ locks: undefined })
    expect(findings.filter((f) => f.id === 'locks')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretLongRunningQueries
// ---------------------------------------------------------------------------

describe('interpretLongRunningQueries', () => {
  test('returns ok when no rows', () => {
    expect(interpretLongRunningQueries([]).severity).toBe('ok')
  })

  test('returns warning for query under 30 minutes', () => {
    const row: LongRunningQueriesRow = {
      pid: 1,
      duration: '00:10:00',
      query: 'SELECT pg_sleep(600)',
    }
    expect(interpretLongRunningQueries([row]).severity).toBe('warning')
  })

  test('returns warning for query at exactly 30 minutes', () => {
    const row: LongRunningQueriesRow = {
      pid: 1,
      duration: '00:30:00',
      query: 'SELECT pg_sleep(1800)',
    }
    // 30 min is NOT > 30, so should be warning
    expect(interpretLongRunningQueries([row]).severity).toBe('warning')
  })

  test('returns critical for query just above 30 minutes', () => {
    const row: LongRunningQueriesRow = {
      pid: 1,
      duration: '00:30:01',
      query: 'SELECT pg_sleep(1801)',
    }
    expect(interpretLongRunningQueries([row]).severity).toBe('critical')
  })

  test('returns critical for query exceeding 1 hour', () => {
    const row: LongRunningQueriesRow = {
      pid: 1,
      duration: '01:30:00',
      query: 'SELECT slow_thing()',
    }
    expect(interpretLongRunningQueries([row]).severity).toBe('critical')
  })

  test('returns warning when duration cannot be parsed', () => {
    const row: LongRunningQueriesRow = {
      pid: 1,
      duration: 'unknown',
      query: 'SELECT 1',
    }
    // Unparseable duration should not throw; should fall back to warning
    const finding = interpretLongRunningQueries([row])
    expect(finding.severity).toBe('warning')
  })

  test('description includes the longest duration', () => {
    const rows: LongRunningQueriesRow[] = [
      { pid: 1, duration: '00:45:00', query: 'q1' },
      { pid: 2, duration: '00:10:00', query: 'q2' },
    ]
    const finding = interpretLongRunningQueries(rows)
    expect(finding.description).toContain('00:45:00')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ longRunningQueries: undefined })
    expect(findings.filter((f) => f.id === 'long-running-queries')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretCacheHit
// ---------------------------------------------------------------------------

describe('interpretCacheHit', () => {
  test('returns ok finding for each entry when ratio >= 0.99', () => {
    const rows: CacheHitRow[] = [
      { name: 'index hit rate', ratio: '0.9990' },
      { name: 'table hit rate', ratio: '1.0000' },
    ]
    const findings = interpretCacheHit(rows)
    expect(findings).toHaveLength(2)
    expect(findings.every((f) => f.severity === 'ok')).toBe(true)
  })

  test('returns warning for ratio exactly at 0.99 (boundary — ok)', () => {
    const rows: CacheHitRow[] = [{ name: 'table hit rate', ratio: '0.9900' }]
    // 0.99 is NOT < 0.99, so ok
    expect(interpretCacheHit(rows)[0].severity).toBe('ok')
  })

  test('returns warning for ratio just below 0.99', () => {
    const rows: CacheHitRow[] = [{ name: 'table hit rate', ratio: '0.9899' }]
    expect(interpretCacheHit(rows)[0].severity).toBe('warning')
  })

  test('returns warning for ratio between 0.95 and 0.99', () => {
    const rows: CacheHitRow[] = [{ name: 'index hit rate', ratio: '0.9700' }]
    expect(interpretCacheHit(rows)[0].severity).toBe('warning')
  })

  test('returns critical for ratio exactly at 0.95 (boundary)', () => {
    const rows: CacheHitRow[] = [{ name: 'table hit rate', ratio: '0.9500' }]
    // 0.95 IS < 0.95? No, it is NOT. So warning.
    expect(interpretCacheHit(rows)[0].severity).toBe('warning')
  })

  test('returns critical for ratio just below 0.95', () => {
    const rows: CacheHitRow[] = [{ name: 'table hit rate', ratio: '0.9499' }]
    expect(interpretCacheHit(rows)[0].severity).toBe('critical')
  })

  test('returns critical for very low ratio', () => {
    const rows: CacheHitRow[] = [{ name: 'index hit rate', ratio: '0.5000' }]
    expect(interpretCacheHit(rows)[0].severity).toBe('critical')
  })

  test('handles N/A ratio gracefully', () => {
    const rows: CacheHitRow[] = [{ name: 'table hit rate', ratio: 'N/A' }]
    const findings = interpretCacheHit(rows)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('ok')
    expect(findings[0].description).toContain('statistics are available')
  })

  test('index and table findings have distinct ids', () => {
    const rows: CacheHitRow[] = [
      { name: 'index hit rate', ratio: '0.9000' },
      { name: 'table hit rate', ratio: '0.9800' },
    ]
    const findings = interpretCacheHit(rows)
    expect(findings.find((f) => f.id === 'cache-hit-index')?.severity).toBe('critical')
    expect(findings.find((f) => f.id === 'cache-hit-table')?.severity).toBe('warning')
  })

  test('returns empty array for empty input', () => {
    expect(interpretCacheHit([])).toHaveLength(0)
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ cacheHit: undefined })
    expect(findings.filter((f) => f.id.startsWith('cache-hit'))).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretBloat
// ---------------------------------------------------------------------------

describe('interpretBloat', () => {
  test('returns ok when no rows', () => {
    expect(interpretBloat([]).severity).toBe('ok')
  })

  test('returns ok when all bloat ratios <= 10', () => {
    const rows: BloatRow[] = [
      { type: 'table', name: 'public.users', bloat: '10.0', waste: '1024 bytes' },
      { type: 'index', name: 'public.orders::idx', bloat: '5.0', waste: '512 bytes' },
    ]
    expect(interpretBloat(rows).severity).toBe('ok')
  })

  test('returns warning when any bloat ratio > 10', () => {
    const rows: BloatRow[] = [{ type: 'table', name: 'public.big', bloat: '10.1', waste: '1 MB' }]
    expect(interpretBloat(rows).severity).toBe('warning')
  })

  test('exactly 10 is not flagged', () => {
    const rows: BloatRow[] = [
      { type: 'table', name: 'public.edge', bloat: '10.0', waste: '100 bytes' },
    ]
    expect(interpretBloat(rows).severity).toBe('ok')
  })

  test('description lists offending table names', () => {
    const rows: BloatRow[] = [
      { type: 'table', name: 'public.bloated_table', bloat: '15.0', waste: '10 MB' },
    ]
    const finding = interpretBloat(rows)
    expect(finding.description).toContain('public.bloated_table')
  })

  test('handles non-numeric bloat gracefully', () => {
    const rows: BloatRow[] = [{ type: 'table', name: 'public.x', bloat: 'N/A', waste: '0 bytes' }]
    expect(interpretBloat(rows).severity).toBe('ok')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ bloat: undefined })
    expect(findings.filter((f) => f.id === 'bloat')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretVacuumStats
// ---------------------------------------------------------------------------

describe('interpretVacuumStats', () => {
  const makeRow = (
    name: string,
    expect_autovacuum: string,
    dead_rowcount: string
  ): VacuumStatsRow => ({
    name,
    last_vacuum: '',
    last_autovacuum: '',
    last_analyze: '',
    last_autoanalyze: '',
    rowcount: '10,000',
    dead_rowcount,
    autovacuum_threshold: '50',
    expect_autovacuum,
    autoanalyze_threshold: '50',
    expect_autoanalyze: 'no',
  })

  test('returns ok when no rows', () => {
    expect(interpretVacuumStats([]).severity).toBe('ok')
  })

  test('returns ok when expect_autovacuum is no', () => {
    const row = makeRow('public.clean', 'no', '5,000')
    expect(interpretVacuumStats([row]).severity).toBe('ok')
  })

  test('returns ok when expect_autovacuum is yes but dead rows <= threshold', () => {
    const row = makeRow('public.small', 'yes', '500')
    expect(interpretVacuumStats([row]).severity).toBe('ok')
  })

  test('returns ok when dead rows exactly at threshold (1000)', () => {
    const row = makeRow('public.edge', 'yes', '1,000')
    // 1000 is NOT > 1000, so ok
    expect(interpretVacuumStats([row]).severity).toBe('ok')
  })

  test('returns warning when expect_autovacuum yes and dead rows > 1000', () => {
    const row = makeRow('public.dirty', 'yes', '1,001')
    expect(interpretVacuumStats([row]).severity).toBe('warning')
  })

  test('returns warning for heavily dead table', () => {
    const row = makeRow('public.huge', 'yes', ' 1,234,567')
    expect(interpretVacuumStats([row]).severity).toBe('warning')
  })

  test('description includes table name', () => {
    const row = makeRow('public.mytable', 'yes', '50,000')
    const finding = interpretVacuumStats([row])
    expect(finding.description).toContain('public.mytable')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ vacuumStats: undefined })
    expect(findings.filter((f) => f.id === 'vacuum')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretIndexUsage
// ---------------------------------------------------------------------------

describe('interpretIndexUsage', () => {
  const makeRow = (
    name: string,
    percent_of_times_index_used: string,
    rows_in_table: number
  ): IndexUsageRow => ({ name, percent_of_times_index_used, rows_in_table })

  test('returns ok when no rows', () => {
    expect(interpretIndexUsage([]).severity).toBe('ok')
  })

  test('returns ok when usage >= 95% on large table', () => {
    const row = makeRow('public.big', '95.0%', 50_000)
    expect(interpretIndexUsage([row]).severity).toBe('ok')
  })

  test('returns ok when low usage but table is small', () => {
    const row = makeRow('public.tiny', '50.0%', 9_999)
    expect(interpretIndexUsage([row]).severity).toBe('ok')
  })

  test('returns ok when table is exactly at min row count threshold', () => {
    const row = makeRow('public.edge', '50.0%', 10_000)
    // 10_000 is NOT > 10_000, so ok
    expect(interpretIndexUsage([row]).severity).toBe('ok')
  })

  test('returns warning when usage < 95% on table with > 10000 rows', () => {
    const row = makeRow('public.missing_idx', '80.5%', 50_000)
    expect(interpretIndexUsage([row]).severity).toBe('warning')
  })

  test('returns warning just below 95% on large table', () => {
    const row = makeRow('public.borderline', '94.9%', 20_000)
    expect(interpretIndexUsage([row]).severity).toBe('warning')
  })

  test('skips Insufficient data rows', () => {
    const row = makeRow('public.new', 'Insufficient data', 100_000)
    expect(interpretIndexUsage([row]).severity).toBe('ok')
  })

  test('description includes table name', () => {
    const row = makeRow('public.slow_table', '60.0%', 100_000)
    const finding = interpretIndexUsage([row])
    expect(finding.description).toContain('public.slow_table')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ indexUsage: undefined })
    expect(findings.filter((f) => f.id === 'index-usage')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretUnusedIndexes
// ---------------------------------------------------------------------------

describe('interpretUnusedIndexes', () => {
  const makeRow = (
    name: string,
    index: string,
    index_size: string,
    index_scans: number
  ): UnusedIndexesRow => ({ name, index, index_size, index_scans })

  test('returns ok when no rows', () => {
    expect(interpretUnusedIndexes([]).severity).toBe('ok')
  })

  test('returns ok when all indexes have scans > 0', () => {
    const row = makeRow('public.users', 'idx_users_email', '512 kB', 5)
    expect(interpretUnusedIndexes([row]).severity).toBe('ok')
  })

  test('returns info when any index has 0 scans', () => {
    const row = makeRow('public.orders', 'idx_orders_old', '2 MB', 0)
    expect(interpretUnusedIndexes([row]).severity).toBe('info')
  })

  test('mixed: only zero-scan indexes flagged', () => {
    const rows: UnusedIndexesRow[] = [
      makeRow('public.a', 'idx_a', '1 MB', 10),
      makeRow('public.b', 'idx_b', '2 MB', 0),
    ]
    const finding = interpretUnusedIndexes(rows)
    expect(finding.severity).toBe('info')
    expect(finding.description).toContain('1 non-unique index')
  })

  test('description includes index name', () => {
    const row = makeRow('public.events', 'idx_events_old_col', '5 MB', 0)
    const finding = interpretUnusedIndexes([row])
    expect(finding.description).toContain('idx_events_old_col')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ unusedIndexes: undefined })
    expect(findings.filter((f) => f.id === 'unused-indexes')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretSeqScans
// ---------------------------------------------------------------------------

describe('interpretSeqScans', () => {
  test('returns ok when no rows', () => {
    expect(interpretSeqScans([]).severity).toBe('ok')
  })

  test('returns ok when all counts <= 1000', () => {
    const rows: SeqScansRow[] = [
      { name: 'public.a', count: 1_000 },
      { name: 'public.b', count: 500 },
    ]
    expect(interpretSeqScans(rows).severity).toBe('ok')
  })

  test('returns info when count is exactly 1000 (boundary)', () => {
    const rows: SeqScansRow[] = [{ name: 'public.a', count: 1_000 }]
    // 1000 is NOT > 1000, so ok
    expect(interpretSeqScans(rows).severity).toBe('ok')
  })

  test('returns info when count just above 1000', () => {
    const rows: SeqScansRow[] = [{ name: 'public.big', count: 1_001 }]
    expect(interpretSeqScans(rows).severity).toBe('info')
  })

  test('description includes table name and count', () => {
    const rows: SeqScansRow[] = [{ name: 'public.scanned_a_lot', count: 5_000 }]
    const finding = interpretSeqScans(rows)
    expect(finding.description).toContain('public.scanned_a_lot')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ seqScans: undefined })
    expect(findings.filter((f) => f.id === 'seq-scans')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretRoleStats
// ---------------------------------------------------------------------------

describe('interpretRoleStats', () => {
  const makeRow = (
    role_name: string,
    active_connections: number,
    connection_limit: number
  ): RoleStatsRow => ({ role_name, active_connections, connection_limit, custom_config: '' })

  test('returns ok when no rows', () => {
    expect(interpretRoleStats([]).severity).toBe('ok')
  })

  test('returns ok when usage < 80%', () => {
    const row = makeRow('app_user', 79, 100)
    expect(interpretRoleStats([row]).severity).toBe('ok')
  })

  test('returns ok when usage exactly at 80% boundary', () => {
    const row = makeRow('app_user', 80, 100)
    // 80/100 = 0.80 which is NOT >= 0.80? It IS >= 0.80, so warning
    expect(interpretRoleStats([row]).severity).toBe('warning')
  })

  test('returns warning when usage just above 80%', () => {
    const row = makeRow('app_user', 81, 100)
    expect(interpretRoleStats([row]).severity).toBe('warning')
  })

  test('returns warning when usage at 100%', () => {
    const row = makeRow('app_user', 100, 100)
    expect(interpretRoleStats([row]).severity).toBe('warning')
  })

  test('skips roles with connection_limit of 0', () => {
    const row = makeRow('nologin_role', 0, 0)
    expect(interpretRoleStats([row]).severity).toBe('ok')
  })

  test('description includes role name and counts', () => {
    const row = makeRow('api_user', 90, 100)
    const finding = interpretRoleStats([row])
    expect(finding.description).toContain('api_user')
    expect(finding.description).toContain('90/100')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ roleStats: undefined })
    expect(findings.filter((f) => f.id === 'role-connections')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretReplicationSlots
// ---------------------------------------------------------------------------

describe('interpretReplicationSlots', () => {
  const makeRow = (
    slot_name: string,
    active: boolean,
    replication_lag_gb: number
  ): ReplicationSlotsRow => ({
    slot_name,
    active,
    state: active ? 'streaming' : 'N/A',
    replication_client_address: active ? '10.0.0.1' : 'N/A',
    replication_lag_gb,
  })

  test('returns ok when no rows', () => {
    expect(interpretReplicationSlots([]).severity).toBe('ok')
  })

  test('returns ok when all slots are active and lag <= 1 GB', () => {
    const rows: ReplicationSlotsRow[] = [makeRow('slot_a', true, 0.5), makeRow('slot_b', true, 1.0)]
    expect(interpretReplicationSlots(rows).severity).toBe('ok')
  })

  test('returns ok when lag exactly at 1 GB (boundary)', () => {
    const row = makeRow('slot_edge', true, 1.0)
    // 1.0 is NOT > 1, so ok
    expect(interpretReplicationSlots([row]).severity).toBe('ok')
  })

  test('returns warning when active slot lag just above 1 GB', () => {
    const row = makeRow('slot_lagged', true, 1.01)
    expect(interpretReplicationSlots([row]).severity).toBe('warning')
  })

  test('returns warning when slot is inactive regardless of lag', () => {
    const row = makeRow('slot_dead', false, 0)
    expect(interpretReplicationSlots([row]).severity).toBe('warning')
  })

  test('description includes slot name', () => {
    const row = makeRow('my_dead_slot', false, 0)
    const finding = interpretReplicationSlots([row])
    expect(finding.description).toContain('my_dead_slot')
  })

  test('undefined skips in aggregator', () => {
    const findings = interpretDebuggerResults({ replicationSlots: undefined })
    expect(findings.filter((f) => f.id === 'replication-slots')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// interpretDebuggerResults (aggregator)
// ---------------------------------------------------------------------------

describe('interpretDebuggerResults', () => {
  test('returns empty array for empty input object', () => {
    expect(interpretDebuggerResults({})).toHaveLength(0)
  })

  test('only runs checks for provided fields', () => {
    const findings = interpretDebuggerResults({ blocking: [] })
    const ids = findings.map((f) => f.id)
    expect(ids).toContain('blocking')
    expect(ids).not.toContain('bloat')
    expect(ids).not.toContain('vacuum')
    expect(ids).not.toContain('locks')
  })

  test('all-ok scenario returns one ok finding per loaded check', () => {
    const findings = interpretDebuggerResults({
      blocking: [],
      locks: [],
      longRunningQueries: [],
      bloat: [],
      vacuumStats: [],
      indexUsage: [],
      unusedIndexes: [],
      seqScans: [],
      roleStats: [],
      replicationSlots: [],
      // cacheHit with empty array returns 0 findings (no rows to iterate)
      cacheHit: [],
    })
    expect(findings.every((f) => f.severity === 'ok')).toBe(true)
  })

  test('critical finding from blocking propagates correctly', () => {
    const findings = interpretDebuggerResults({
      blocking: [
        {
          blocked_pid: 1,
          blocking_statement: 'SELECT 1',
          blocking_duration: '00:01:00',
          blocking_pid: 2,
          blocked_statement: 'UPDATE x',
          blocked_duration: '00:00:30',
        },
      ],
    })
    const blocking = findings.find((f) => f.id === 'blocking')
    expect(blocking?.severity).toBe('critical')
  })

  test('each finding has a non-empty id, title, and description', () => {
    const findings = interpretDebuggerResults({
      blocking: [],
      locks: [{ pid: 1, relname: 'x', transactionid: '1', granted: false, stmt: 'q', age: '1s' }],
    })
    for (const f of findings) {
      expect(f.id.length).toBeGreaterThan(0)
      expect(f.title.length).toBeGreaterThan(0)
      expect(f.description.length).toBeGreaterThan(0)
    }
  })
})
