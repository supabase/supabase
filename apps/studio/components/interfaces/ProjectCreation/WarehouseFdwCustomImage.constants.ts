export const WAREHOUSE_FDW_CUSTOM_POSTGRES_VERSION =
  '15.14.1.138-fdw-warehouse-74b5ba9-r7-adminapi110'

export const WAREHOUSE_FDW_CUSTOM_DB_VERSION = `supabase-postgres-${WAREHOUSE_FDW_CUSTOM_POSTGRES_VERSION}`

export const WAREHOUSE_FDW_CUSTOM_INSTANCE_TYPE = 't4g.micro'

export const WAREHOUSE_FDW_CUSTOM_REGION_NAME = 'Southeast Asia (Singapore)'

export const WAREHOUSE_FDW_CUSTOM_REGION_SELECTION = {
  type: 'specific',
  code: 'ap-southeast-1',
} as const

export const WAREHOUSE_FDW_CUSTOM_REQUEST = {
  enabled: true,
  secret_region: 'ap-southeast-1',
  endpoint: 'https://quaxy-flight-staging.fdw-warehouse.supabase.green',
  tls_domain_name: 'quaxy-flight-staging.fdw-warehouse.supabase.green',
  jwt_kid: 'fdw-warehouse-staging',
  jwt_issuer: 'fdw-warehouse',
  jwt_audience: 'quaxy-flight',
  jwt_ttl_secs: 300,
} as const

export const normalizeCustomPostgresVersion = (version?: string) =>
  version?.trim().replace(/^supabase-postgres-/, '') ?? ''

export const isWarehouseFdwCustomPostgresVersion = (version?: string) =>
  normalizeCustomPostgresVersion(version) === WAREHOUSE_FDW_CUSTOM_POSTGRES_VERSION
