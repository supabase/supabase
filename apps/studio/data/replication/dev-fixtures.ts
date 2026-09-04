/**
 * TEMPORARY — local design fixture. Do not merge.
 *
 * Short-circuits the replication status queries so the pipeline surfaces can be designed against
 * real-looking content without a live ETL pipeline. Switch states with the floating control in the
 * bottom-right of any replication page (PipelineFixtureController).
 *
 * Delete this file, its three query call sites, and the controller to go back to live data.
 */
import type { components } from 'api-types'

type PipelineStatusResponse = components['schemas']['ReplicationPipelineStatusResponse']
type PipelineVersionResponse = components['schemas']['ReplicationPipelineVersionResponse']
type ReplicationStatusResponse =
  components['schemas']['ReplicationPipelineReplicationStatusResponse']
type TableStatus = ReplicationStatusResponse['table_statuses'][number]

// Off under vitest so the MSW-backed component tests keep exercising the real fetch path.
export const USE_REPLICATION_DEV_FIXTURES = process.env.NODE_ENV !== 'test'

export const PIPELINE_FIXTURE_SCENARIOS = [
  'running',
  'running-with-update',
  'initial-sync',
  'caught-up-mid-sync',
  'errored-tables',
  'failed',
  'stopped',
  'starting',
  'no-tables',
  'status-unreachable',
] as const

export type PipelineFixtureScenario = (typeof PIPELINE_FIXTURE_SCENARIOS)[number]

export const PIPELINE_FIXTURE_SCENARIO_LABEL: Record<PipelineFixtureScenario, string> = {
  running: 'Running',
  'running-with-update': 'Running, update available',
  'initial-sync': 'Initial sync in progress',
  'caught-up-mid-sync': 'Caught up, tables still copying',
  'errored-tables': 'Running, some tables errored',
  failed: 'Pipeline failed',
  stopped: 'Pipeline stopped',
  starting: 'Pipeline starting',
  'no-tables': 'Running, no tables yet',
  'status-unreachable': 'Live updates unreachable',
}

const STORAGE_KEY = 'replication-fixture-scenario'

const isScenario = (value: unknown): value is PipelineFixtureScenario =>
  PIPELINE_FIXTURE_SCENARIOS.includes(value as PipelineFixtureScenario)

const readStoredScenario = (): PipelineFixtureScenario => {
  if (typeof window === 'undefined') return 'running'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isScenario(stored) ? stored : 'running'
}

let scenario: PipelineFixtureScenario = readStoredScenario()
const listeners = new Set<() => void>()

export const getPipelineFixtureScenario = () => scenario

export const setPipelineFixtureScenario = (next: PipelineFixtureScenario) => {
  scenario = next
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next)
  listeners.forEach((listener) => listener())
}

export const subscribeToPipelineFixtureScenario = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ============================================================================
// Fixtures
// ============================================================================

const KB = 1024
const MB = KB * 1024

/** Scenarios where the replication-status request itself should fail. */
export const isReplicationStatusUnreachable = () => scenario === 'status-unreachable'

const STATUS_BY_SCENARIO: Record<
  PipelineFixtureScenario,
  PipelineStatusResponse['status']['name']
> = {
  running: 'started',
  'running-with-update': 'started',
  'initial-sync': 'started',
  'caught-up-mid-sync': 'started',
  'errored-tables': 'started',
  failed: 'failed',
  stopped: 'stopped',
  starting: 'starting',
  'no-tables': 'started',
  'status-unreachable': 'started',
}

export const getPipelineStatusFixture = (pipelineId: number): PipelineStatusResponse => ({
  pipeline_id: pipelineId,
  status: { name: STATUS_BY_SCENARIO[scenario] },
})

export const getPipelineVersionFixture = (pipelineId: number): PipelineVersionResponse => ({
  pipeline_id: pipelineId,
  version: { id: 1, name: 'v0.9.2' },
  ...(scenario === 'running-with-update' ? { new_version: { id: 2, name: 'v0.10.0' } } : {}),
})

const table = (
  id: number,
  schema: string,
  name: string,
  state: TableStatus['state'],
  syncLag?: TableStatus['table_sync_lag']
): TableStatus => ({
  id,
  table_id: id,
  schema,
  name,
  table_name: `${schema}.${name}`,
  state,
  ...(syncLag === undefined ? {} : { table_sync_lag: syncLag }),
})

const LIVE_TABLES: TableStatus[] = [
  table(16_401, 'public', 'orders', { name: 'following_wal' }),
  table(16_402, 'public', 'order_items', { name: 'following_wal' }),
  table(16_403, 'public', 'customers', { name: 'following_wal' }),
  table(16_404, 'public', 'products', { name: 'following_wal' }),
  table(16_405, 'analytics', 'daily_revenue', { name: 'following_wal' }),
  table(16_406, 'analytics', 'session_events', { name: 'following_wal' }),
]

const COPYING_TABLES: TableStatus[] = [
  table(16_401, 'public', 'orders', { name: 'following_wal' }),
  table(16_402, 'public', 'order_items', { name: 'copied_table' }),
  // Healthy copy: only the backlog and the check-in are worth showing
  table(
    16_403,
    'public',
    'customers',
    { name: 'copying_table' },
    {
      active: true,
      wal_status: 'reserved',
      restart_lsn_bytes: 6 * MB,
      confirmed_flush_lsn_bytes: 2 * MB,
      safe_wal_size_bytes: 900 * MB,
      reply_time_lag: 4_800,
    }
  ),
  // Struggling copy: exercises the disconnected and at-risk WAL parts of the same line
  table(
    16_404,
    'public',
    'products',
    { name: 'copying_table' },
    {
      active: false,
      wal_status: 'unreserved',
      restart_lsn_bytes: 640 * MB,
      confirmed_flush_lsn_bytes: 180 * MB,
      safe_wal_size_bytes: 40 * MB,
      reply_time_lag: 96_000,
    }
  ),
  table(16_405, 'analytics', 'daily_revenue', { name: 'queued' }),
  table(16_406, 'analytics', 'session_events', { name: 'queued' }),
]

const syncingSlot = (pendingMb: number) => ({
  active: false,
  wal_status: 'reserved' as const,
  restart_lsn_bytes: 2_048 * MB,
  confirmed_flush_lsn_bytes: pendingMb * MB,
  safe_wal_size_bytes: 1_980 * MB,
})

// Reproduces https://supabase.slack.com/archives/C09AA979135/p1787754881360069: the pipeline's
// main slot is caught up on ongoing changes while four table sync workers copy, the default, and
// the remaining tables queue behind them.
const CAUGHT_UP_MID_SYNC_TABLES: TableStatus[] = [
  table(16_401, 'public', 'orders', { name: 'following_wal' }),
  table(16_402, 'public', 'order_items', { name: 'copying_table' }, syncingSlot(30.7)),
  table(16_403, 'public', 'customers', { name: 'copying_table' }, syncingSlot(30.76)),
  table(16_404, 'public', 'products', { name: 'copying_table' }, syncingSlot(30.74)),
  table(16_405, 'public', 'payments', { name: 'copying_table' }, syncingSlot(29.51)),
  table(16_406, 'analytics', 'daily_revenue', { name: 'queued' }),
  table(16_407, 'analytics', 'session_events', { name: 'queued' }),
  table(16_408, 'analytics', 'page_views', { name: 'queued' }),
]

const ERRORED_TABLES: TableStatus[] = [
  ...LIVE_TABLES.slice(0, 4),
  table(16_405, 'analytics', 'daily_revenue', {
    name: 'error',
    reason:
      'Destination rejected a batch: column "user_agent" exceeds the maximum string length of 1024 characters.',
    solution: 'Trim or exclude the offending column, then reset this table.',
    retry_policy: { policy: 'manual_retry' },
  }),
  table(16_406, 'analytics', 'session_events', {
    name: 'error',
    reason: 'Connection to the destination timed out after 30s.',
    solution: 'Replication retries on its own. No action needed unless this keeps happening.',
    retry_policy: {
      policy: 'timed_retry',
      next_retry: new Date(Date.now() + 214_000).toISOString(),
    },
  }),
]

const TABLES_BY_SCENARIO: Record<PipelineFixtureScenario, TableStatus[]> = {
  running: LIVE_TABLES,
  'running-with-update': LIVE_TABLES,
  'initial-sync': COPYING_TABLES,
  'caught-up-mid-sync': CAUGHT_UP_MID_SYNC_TABLES,
  'errored-tables': ERRORED_TABLES,
  failed: LIVE_TABLES,
  stopped: LIVE_TABLES,
  starting: LIVE_TABLES,
  'no-tables': [],
  'status-unreachable': LIVE_TABLES,
}

export const getReplicationStatusFixture = (pipelineId: number): ReplicationStatusResponse => ({
  pipeline_id: pipelineId,
  apply_lag: {
    active: scenario !== 'stopped' && scenario !== 'failed',
    wal_status: scenario === 'failed' ? 'unreserved' : 'reserved',
    restart_lsn_bytes: 18 * MB,
    confirmed_flush_lsn_bytes:
      scenario === 'running' || scenario === 'caught-up-mid-sync' ? 0 : 384 * KB,
    safe_wal_size_bytes: scenario === 'caught-up-mid-sync' ? 2_048 * MB : 900 * MB,
    write_lag: 120,
    flush_lag: 340,
    reply_time_lag: scenario === 'caught-up-mid-sync' ? 21_900 : 1_200,
  },
  table_statuses: TABLES_BY_SCENARIO[scenario],
})

type CostEstimateResponse = components['schemas']['CostEstimateResponse']

const RATE_PER_GB = 0.6
const bytesForTable = (id: number) => ((id % 7) + 1) * 12 * MB

/** Cost estimate aligned to the current scenario’s fixture tables. */
export const getCostEstimateFixture = (): CostEstimateResponse => {
  const tables = TABLES_BY_SCENARIO[scenario].map((t) => {
    const estimated_bytes = bytesForTable(t.id)
    return {
      schema: t.schema,
      name: t.name,
      estimated_bytes,
      estimated_cost: (estimated_bytes / (1024 * 1024 * 1024)) * RATE_PER_GB,
      is_row_filtered: false,
    }
  })
  const total_bytes = tables.reduce((sum, t) => sum + t.estimated_bytes, 0)
  const total_cost = tables.reduce((sum, t) => sum + t.estimated_cost, 0)

  return {
    currency: 'usd',
    pipeline: { hourly_cost: 0.053, monthly_cost: 38.69 },
    streaming: { rate_per_gb: 3 },
    table_copy: {
      rate_per_gb: RATE_PER_GB,
      tables,
      total_bytes,
      total_cost,
    },
  }
}
