import { LOGS_VIEW_VERSION, type LogsView } from '../UnifiedLogs.views'

export const PRESET_VIEW_ID_PREFIX = 'preset:'

export const isPresetViewId = (id: string | null | undefined): boolean =>
  !!id && id.startsWith(PRESET_VIEW_ID_PREFIX)

const equals = (propertyName: string, values: string[]) =>
  values.map((value) => ({ propertyName, operator: '=' as const, value }))

const preset = ({
  id,
  name,
  description,
  logSource,
  conditions,
}: {
  id: string
  name: string
  description: string
  logSource: string
  conditions: { propertyName: string; operator: '='; value: string }[]
}): PresetView => ({
  id: `${PRESET_VIEW_ID_PREFIX}${id}`,
  name,
  description,
  type: 'logs_view',
  version: LOGS_VIEW_VERSION,
  logSource,
  filters: { logicalOperator: 'AND', conditions },
  viewOptions: {},
})

export interface PresetView extends LogsView {
  description: string
}

export const PRESET_VIEWS: PresetView[] = [
  preset({
    id: 'errors',
    name: 'Errors',
    description: 'Everything that failed, across every log type.',
    logSource: 'edge_logs',
    conditions: equals('level', ['error']),
  }),
  preset({
    id: 'failed-requests',
    name: 'Failed requests',
    description: 'Client-facing requests that returned 4xx or 5xx.',
    logSource: 'edge_logs',
    conditions: [
      ...equals('log_type', ['edge', 'postgrest', 'auth', 'storage']),
      ...equals('level', ['warning', 'error']),
    ],
  }),
  preset({
    id: 'database-health',
    name: 'Database health',
    description: 'Postgres, compute and connection pooling activity.',
    logSource: 'postgres_logs',
    conditions: equals('log_type', ['postgres', 'compute', 'supavisor', 'pgbouncer']),
  }),
]
