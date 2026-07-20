import type { WarehouseCatalogCredentials } from '@/data/warehouse/warehouse-catalog-query'

export type WarehouseCatalogEngine = 'duckdb' | 'env'

export const WAREHOUSE_CATALOG_ENGINES: { key: WarehouseCatalogEngine; label: string }[] = [
  { key: 'duckdb', label: 'DuckDB' },
  { key: 'env', label: 'Environment variables' },
]

export const WAREHOUSE_CATALOG_ENV_VARS = {
  catalogUrl: 'DUCKLAKE_CATALOG_URL',
  dataPath: 'DUCKLAKE_DATA_PATH',
  s3Endpoint: 'DUCKLAKE_S3_ENDPOINT',
  s3Region: 'DUCKLAKE_S3_REGION',
  s3AccessKeyId: 'DUCKLAKE_S3_ACCESS_KEY_ID',
  s3SecretAccessKey: 'DUCKLAKE_S3_SECRET_ACCESS_KEY',
  metadataSchema: 'DUCKLAKE_METADATA_SCHEMA',
} as const

export function buildWarehouseCatalogEnv(creds: WarehouseCatalogCredentials): string {
  return [
    `${WAREHOUSE_CATALOG_ENV_VARS.catalogUrl}=${creds.catalogUrl}`,
    `${WAREHOUSE_CATALOG_ENV_VARS.dataPath}=${creds.dataPath}`,
    `${WAREHOUSE_CATALOG_ENV_VARS.s3Endpoint}=${creds.s3Endpoint}`,
    `${WAREHOUSE_CATALOG_ENV_VARS.s3Region}=${creds.s3Region}`,
    `${WAREHOUSE_CATALOG_ENV_VARS.s3AccessKeyId}=${creds.s3AccessKeyId}`,
    `${WAREHOUSE_CATALOG_ENV_VARS.s3SecretAccessKey}=${creds.s3SecretAccessKey}`,
    `${WAREHOUSE_CATALOG_ENV_VARS.metadataSchema}=${creds.metadataSchema}`,
  ].join('\n')
}

/**
 * Convert the Warehouse catalog Postgres URL into the libpq keyword/value connection string that
 * DuckDB's `ducklake` extension expects (`postgres:host=… user=… …`). Passing the raw `postgres://`
 * URI to `ATTACH 'ducklake:…'` fails — most notably with IPv6 hosts, which the URI wraps in
 * brackets that DuckDB/libpq don't accept in this position.
 */
export function buildDuckDbCatalogConnectionString(catalogUrl: string): string {
  let url: URL
  try {
    url = new URL(catalogUrl)
  } catch {
    // Not a parseable URL (already keyword/value, or malformed) — pass through unchanged.
    return catalogUrl
  }

  const host = url.hostname.replace(/^\[/, '').replace(/\]$/, '') // unwrap IPv6 brackets
  const dbname = decodeURIComponent(url.pathname.replace(/^\//, ''))

  const params: string[] = []
  if (host) params.push(`host=${host}`)
  if (url.password) params.push(`password=${decodeURIComponent(url.password)}`)
  if (url.port) params.push(`port=${url.port}`)
  if (url.username) params.push(`user=${decodeURIComponent(url.username)}`)
  if (dbname) params.push(`dbname=${dbname}`)
  for (const [key, value] of url.searchParams) {
    params.push(`${key}=${value}`)
  }

  return `postgres:${params.join(' ')}`
}

/**
 * Per-engine connection snippet for the Warehouse catalog. The Warehouse is backed by DuckLake
 * (a Postgres catalog + object storage), so DuckDB attaches it via the `ducklake` extension.
 */
export function getWarehouseCatalogEngineContent(
  engine: WarehouseCatalogEngine,
  creds: WarehouseCatalogCredentials
): { headerLabel: string; language: 'sql' | 'bash'; value: string } {
  switch (engine) {
    case 'duckdb':
      return {
        headerLabel: 'warehouse.sql',
        language: 'sql',
        value: `INSTALL ducklake;
INSTALL postgres;
INSTALL httpfs;
LOAD ducklake;

CREATE SECRET supabase_warehouse_storage (
  TYPE s3,
  KEY_ID '${creds.s3AccessKeyId}',
  SECRET '${creds.s3SecretAccessKey}',
  REGION '${creds.s3Region}',
  ENDPOINT '${creds.s3Endpoint}',
  URL_STYLE 'path'
);

ATTACH 'ducklake:${buildDuckDbCatalogConnectionString(creds.catalogUrl)}' AS warehouse (
  DATA_PATH '${creds.dataPath}',
  METADATA_SCHEMA '${creds.metadataSchema}'
);

USE warehouse;
SELECT * FROM events LIMIT 10;`,
      }
    case 'env':
    default:
      return {
        headerLabel: 'catalog.env',
        language: 'bash',
        value: buildWarehouseCatalogEnv(creds),
      }
  }
}
