import type {
  V2WarehouseSetupAcceptedResponse,
  V2WarehouseSetupStatusResponse,
} from '@/data/warehouse/warehouse-setup-api-types'

type SetupAttributes = V2WarehouseSetupAcceptedResponse['data']['attributes']
type SetupStatusAttributes = V2WarehouseSetupStatusResponse['data']['attributes']
type SetupStatusTable = SetupStatusAttributes['tables'][number]

export type WarehouseSetupStatusOverrides = Partial<Omit<SetupStatusAttributes, 'tables'>> & {
  // A scenario's tables only describe what the UI reads. The v2-only identity and observation
  // fields default so each test doesn't repeat them.
  tables?: (Omit<SetupStatusTable, 'id' | 'replication_state'> &
    Partial<Pick<SetupStatusTable, 'id' | 'replication_state'>>)[]
}

export const WAREHOUSE_FDW_STATUS: NonNullable<SetupStatusAttributes['fdw_status']> = {
  extension_available: true,
  extension_installed: true,
  foreign_schema_imported: true,
  schema_created: true,
  server_configured: true,
  wrapper_installed: true,
}

/** Body of `GET /v2/projects/:ref/warehouse/setups/current`. Defaults to Warehouse not set up. */
export const createMockWarehouseSetupStatusResponse = ({
  tables = [],
  ...attributes
}: WarehouseSetupStatusOverrides = {}): V2WarehouseSetupStatusResponse => ({
  data: {
    type: 'warehouse_setup',
    id: 'default',
    attributes: {
      fdw_status: WAREHOUSE_FDW_STATUS,
      setup_status: 'not_started',
      status: 'running',
      replication_state: 'unavailable',
      steps: [],
      ...attributes,
      tables: tables.map((table, index) => ({ id: index + 1, replication_state: null, ...table })),
    },
  },
})

/** Body of the 202 from `POST /v2/projects/:ref/warehouse/setups`. */
export const createMockWarehouseSetupResponse = (
  attributes: Partial<SetupAttributes> = {}
): V2WarehouseSetupAcceptedResponse => ({
  data: {
    type: 'warehouse_setup',
    id: 'default',
    attributes: {
      accepted: true,
      pipeline_id: '1',
      selected_tables: [],
      tables: [],
      ...attributes,
    },
  },
})
