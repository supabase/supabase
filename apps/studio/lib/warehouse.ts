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

export function getDuckLakeAttachSnippet(credentials: {
  catalog_url: string
  data_path: string
  metadata_schema: string
}): string {
  return `ATTACH 'ducklake:${credentials.catalog_url}' AS warehouse (DATA_PATH '${credentials.data_path}', METADATA_SCHEMA '${credentials.metadata_schema}');`
}
