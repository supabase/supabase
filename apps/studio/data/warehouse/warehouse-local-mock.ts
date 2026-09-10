import type { components } from 'api-types'

type WarehouseCatalogResponse = components['schemas']['WarehouseCatalogResponse']
type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']
type WarehouseSetupResponse = components['schemas']['WarehouseSetupResponse']
type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse']

const MOCK_PARAMETER = 'warehouseMock'
const SETTING_UP_DURATION_MS = 3_000
const COPYING_DURATION_MS = 6_000

const WAREHOUSE_LOCAL_MOCK_SCENARIOS = [
  'flow',
  'flow-error',
  'not-started',
  'setting-up',
  'copying',
  'setup-error',
  'complete',
  'complete-mixed',
  'status-error',
  'mutation-error',
  'catalog-off',
  'catalog-error',
] as const

type WarehouseLocalMockScenario = (typeof WAREHOUSE_LOCAL_MOCK_SCENARIOS)[number]

interface WarehouseLocalMockState {
  catalogEnabled: boolean
  flowAttempt: number
  startedAt?: number
}

const stateByProject = new Map<string, WarehouseLocalMockState>()

const fdwStatus: WarehouseSetupStatusResponse['fdw_status'] = {
  extension_available: true,
  extension_installed: true,
  foreign_schema_imported: true,
  schema_created: true,
  server_configured: true,
  wrapper_installed: true,
}

const emptyFdwStatus: WarehouseSetupStatusResponse['fdw_status'] = {
  extension_available: false,
  extension_installed: false,
  foreign_schema_imported: false,
  schema_created: false,
  server_configured: false,
  wrapper_installed: false,
}

const liveTables: WarehouseSetupStatusResponse['tables'] = [
  {
    schema: 'public',
    name: 'australian_mammals',
    copy_name: 'public.australian_mammals',
    state: 'live',
    lag_ms: 1_400,
    last_synced_at: new Date(Date.now() - 12_000).toISOString(),
    warehouse_size_bytes: 4_812_390,
  },
  {
    schema: 'public',
    name: 'colours',
    copy_name: 'public.colours',
    state: 'live',
    lag_ms: 43_000,
    last_synced_at: new Date(Date.now() - 90_000).toISOString(),
    warehouse_size_bytes: 118_204,
  },
]

const mixedTables: WarehouseSetupStatusResponse['tables'] = [
  ...liveTables,
  {
    schema: 'public',
    name: 'orders',
    copy_name: 'public.orders',
    state: 'syncing',
    lag_ms: 512_000,
    last_synced_at: new Date(Date.now() - 600_000).toISOString(),
  },
  {
    schema: 'analytics',
    name: 'daily_metrics',
    copy_name: 'analytics.daily_metrics',
    state: 'error',
  },
]

const getScenario = (): WarehouseLocalMockScenario | undefined => {
  const isLocalBrowser =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' &&
    process.env.NODE_ENV !== 'test' &&
    typeof window !== 'undefined'
  if (!isLocalBrowser) return undefined

  const value = new URLSearchParams(window.location.search).get(MOCK_PARAMETER)
  return WAREHOUSE_LOCAL_MOCK_SCENARIOS.find((scenario) => scenario === value)
}

const getState = (projectRef: string) => {
  const existing = stateByProject.get(projectRef)
  if (existing) return existing

  const state: WarehouseLocalMockState = {
    catalogEnabled: false,
    flowAttempt: 0,
  }
  stateByProject.set(projectRef, state)
  return state
}

const getStepStatus = (
  setupStatus: WarehouseSetupStatusResponse['setup_status'],
  step: 'pipeline' | 'copy' | 'fdw'
): WarehouseSetupStatusResponse['steps'][number]['status'] => {
  if (setupStatus === 'not_started') return 'waiting'
  if (step === 'pipeline') return 'completed'
  if (step === 'copy' && setupStatus === 'copying') return 'running'
  if (step === 'copy' && setupStatus === 'error') return 'error'
  if (setupStatus === 'complete') return 'completed'
  return 'waiting'
}

const getStatusResponse = ({
  setupStatus,
  tables = [],
}: {
  setupStatus: WarehouseSetupStatusResponse['setup_status']
  tables?: WarehouseSetupStatusResponse['tables']
}): WarehouseSetupStatusResponse => ({
  setup_status: setupStatus,
  pipeline_id: setupStatus === 'not_started' ? undefined : 7_042,
  steps: [
    { name: 'warehouse_pipeline', status: getStepStatus(setupStatus, 'pipeline') },
    {
      name: 'warehouse_copy',
      status: getStepStatus(setupStatus, 'copy'),
      message: setupStatus === 'error' ? 'Failed to copy public.orders' : undefined,
    },
    { name: 'warehouse_fdw', status: getStepStatus(setupStatus, 'fdw') },
  ],
  tables,
  fdw_status: setupStatus === 'complete' ? fdwStatus : emptyFdwStatus,
})

const getFlowStatus = (
  projectRef: string,
  scenario: 'flow' | 'flow-error'
): WarehouseSetupStatusResponse => {
  const state = getState(projectRef)
  if (state.startedAt === undefined) return getStatusResponse({ setupStatus: 'not_started' })

  const elapsed = Date.now() - state.startedAt
  if (elapsed < SETTING_UP_DURATION_MS) {
    return getStatusResponse({ setupStatus: 'setting_up' })
  }
  if (elapsed < COPYING_DURATION_MS) {
    return getStatusResponse({ setupStatus: 'copying', tables: mixedTables.slice(0, 3) })
  }
  if (scenario === 'flow-error' && state.flowAttempt === 1) {
    return getStatusResponse({ setupStatus: 'error', tables: mixedTables.slice(2) })
  }
  return getStatusResponse({ setupStatus: 'complete', tables: mixedTables })
}

export const getWarehouseLocalMockStatus = (
  projectRef: string
): WarehouseSetupStatusResponse | undefined => {
  const scenario = getScenario()
  if (scenario === undefined) return undefined
  if (scenario === 'status-error') throw new Error('Mock Warehouse status request failed')
  if (scenario === 'flow' || scenario === 'flow-error') return getFlowStatus(projectRef, scenario)
  if (scenario === 'not-started' || scenario === 'mutation-error') {
    return getStatusResponse({ setupStatus: 'not_started' })
  }
  if (scenario === 'setting-up') return getStatusResponse({ setupStatus: 'setting_up' })
  if (scenario === 'copying') {
    return getStatusResponse({ setupStatus: 'copying', tables: mixedTables.slice(0, 3) })
  }
  if (scenario === 'setup-error') {
    return getStatusResponse({ setupStatus: 'error', tables: mixedTables.slice(2) })
  }
  if (scenario === 'complete') {
    return getStatusResponse({ setupStatus: 'complete', tables: liveTables })
  }
  return getStatusResponse({ setupStatus: 'complete', tables: mixedTables })
}

export const setupWarehouseLocalMock = async ({
  projectRef,
  body,
}: {
  projectRef: string
  body: WarehouseSetupBody
}): Promise<WarehouseSetupResponse | undefined> => {
  const scenario = getScenario()
  if (scenario === undefined) return undefined

  await new Promise((resolve) => setTimeout(resolve, 600))
  if (scenario === 'mutation-error') throw new Error('Mock Warehouse setup request failed')

  const state = getState(projectRef)
  if (body.targets.length === 0) {
    state.startedAt = undefined
    state.catalogEnabled = false
    return { pipeline_id: 7_042, tables: [] }
  }

  state.startedAt = Date.now()
  state.flowAttempt += 1
  return { pipeline_id: 7_042, tables: mixedTables }
}

const catalogCredentials: NonNullable<WarehouseCatalogResponse['credentials']> = {
  catalog_url: 'postgres://postgres:pwd@db.example.supabase.co:5432/postgres',
  data_path: 's3://warehouse/',
  metadata_schema: 'ducklake',
  s3_access_key_id: 'example-access-key-id',
  s3_endpoint: 'example.storage.supabase.co/storage/v1/s3',
  s3_region: 'ap-southeast-1',
  s3_secret_access_key: 'example-secret',
}

export const getWarehouseLocalMockCatalog = (
  projectRef: string
): WarehouseCatalogResponse | undefined => {
  const scenario = getScenario()
  if (scenario === undefined) return undefined
  if (scenario === 'catalog-error') throw new Error('Mock Warehouse catalog request failed')

  const isFlow = scenario === 'flow' || scenario === 'flow-error'
  const isEnabled =
    scenario === 'catalog-off' ? false : !isFlow || getState(projectRef).catalogEnabled
  return { enabled: isEnabled, credentials: isEnabled ? catalogCredentials : undefined }
}

export const updateWarehouseLocalMockCatalog = async ({
  projectRef,
  enabled,
}: {
  projectRef: string
  enabled: boolean
}): Promise<WarehouseCatalogResponse | undefined> => {
  const scenario = getScenario()
  if (scenario === undefined) return undefined

  await new Promise((resolve) => setTimeout(resolve, 400))
  const state = getState(projectRef)
  state.catalogEnabled = enabled
  return { enabled, credentials: enabled ? catalogCredentials : undefined }
}
