import { PASSWORD_PLACEHOLDER } from '@/components/interfaces/ConnectSheet/ConnectionString.utils'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

/**
 * [Unverified] Per explicit product-owner direction, the Warehouse FlightSQL endpoint is assumed
 * to follow `{projectRef}.warehouse.supabase.{tld}`. This pattern could not be confirmed anywhere
 * in the platform repo's application code, infra config, or generated API types
 * (`packages/api-types`) -- no field on any Warehouse response (`WarehouseSetupStatusResponse`,
 * `WarehouseSetupResponse`, `WarehouseCatalogResponse`) carries this domain, and no matching
 * gateway/ingress rule was found. Revisit and replace this client-side construction if the backend
 * ever starts returning the endpoint directly on a Warehouse response.
 */
const WAREHOUSE_TLD = IS_STAGING_OR_LOCAL ? 'red' : 'io'

/**
 * Name of the singleton replication publication (and destination) the platform manages for
 * Warehouse — `SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME` in the platform repo. Its table list is
 * the source of truth for what's currently replicated.
 */
export const WAREHOUSE_PUBLICATION_NAME = 'supabase_warehouse'

export function getWarehouseFlightSqlEndpoint(projectRef: string): string {
  return `${projectRef}.warehouse.supabase.${WAREHOUSE_TLD}`
}

export function getWarehouseFlightSqlConnectionString(projectRef: string): string {
  const endpoint = getWarehouseFlightSqlEndpoint(projectRef)
  // The password is the project's database password. It's never fetched or displayed here --
  // mirroring how the direct-connection tab shows a placeholder instead of the real secret.
  return `flightsql://postgres:${PASSWORD_PLACEHOLDER}@${endpoint}:443?tls=enabled`
}

export function getWarehouseUsqlCommand(projectRef: string): string {
  const endpoint = getWarehouseFlightSqlEndpoint(projectRef)
  return `usql -X -W 'flightsql://postgres@${endpoint}:443?tls=enabled'`
}

/** Environment variables the DuckLake setup script reads secrets from. */
export const DUCKLAKE_S3_SECRET_ENV_VAR = 'DUCKLAKE_S3_SECRET'
export const DUCKLAKE_METADATA_PASSWORD_ENV_VAR = 'DUCKLAKE_METADATA_PASSWORD'

export interface WarehouseCatalogConnection {
  host: string
  port: string
  database: string
  user: string
  password: string
}

/**
 * Splits the DuckLake catalog Postgres URL into the parts DuckDB's `TYPE postgres` secret expects
 * as individual options. Returns null when the URL can't be parsed, so callers can fall back to
 * surfacing the raw value instead of emitting a broken script.
 */
export function parseWarehouseCatalogUrl(catalogUrl: string): WarehouseCatalogConnection | null {
  try {
    const url = new URL(catalogUrl)
    if (!url.hostname) return null

    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, '') || 'postgres',
      user: decodeURIComponent(url.username) || 'postgres',
      password: decodeURIComponent(url.password),
    }
  } catch {
    return null
  }
}

/**
 * Full DuckDB script for attaching the project's Warehouse: an S3 secret for the data files, a
 * Postgres secret for the metadata catalog, a DuckLake secret binding the two, then the attach.
 *
 * Both passwords are read via `getenv()` rather than inlined, so the script is safe to copy into a
 * shared file — the values themselves are surfaced separately in the UI.
 *
 * `METADATA_SCHEMA` is set explicitly because DuckLake defaults it to `main`, not to the schema the
 * platform provisions.
 */
export function getDuckLakeSetupScript({
  credentials,
  connection,
}: {
  credentials: {
    data_path: string
    metadata_schema: string
    s3_access_key_id: string
    s3_endpoint: string
    s3_region: string
  }
  connection: WarehouseCatalogConnection
}): string {
  return `-- 1. S3 credentials for reading the Warehouse data files
CREATE OR REPLACE SECRET ducklake_s3 (
  TYPE s3,
  KEY_ID '${credentials.s3_access_key_id}',
  SECRET getenv('${DUCKLAKE_S3_SECRET_ENV_VAR}'),
  REGION '${credentials.s3_region}',
  ENDPOINT '${credentials.s3_endpoint}',
  URL_STYLE 'path'
);

-- 2. Postgres credentials for the DuckLake metadata catalog
CREATE OR REPLACE SECRET ducklake_metadata (
  TYPE postgres,
  HOST '${connection.host}',
  PORT ${connection.port},
  DATABASE '${connection.database}',
  USER '${connection.user}',
  PASSWORD getenv('${DUCKLAKE_METADATA_PASSWORD_ENV_VAR}')
);

-- 3. Bind the metadata secret into a DuckLake secret configuration
CREATE OR REPLACE SECRET ducklake_warehouse (
  TYPE ducklake,
  METADATA_PATH '',
  DATA_PATH '${credentials.data_path}',
  METADATA_SCHEMA '${credentials.metadata_schema}',
  METADATA_PARAMETERS MAP {
    'TYPE': 'postgres',
    'SECRET': 'ducklake_metadata'
  }
);

-- 4. Clean attach using only the secret identifier
ATTACH 'ducklake:ducklake_warehouse' AS warehouse;`
}
