import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { warehouseKeys } from './keys'
import { fetchGet } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { ResponseError } from '@/types'

/**
 * DuckLake connection details for reading Warehouse tables from an external query engine.
 *
 * The Warehouse uses a DuckLake destination plugged into the project itself — the current project
 * is used for BOTH the catalog (its Postgres) and the storage (its object-storage bucket). This is
 * the same `supabase_project` / `supabase_storage` DuckLake config the replication product builds,
 * resolved by the platform into a concrete catalog URL + provisioned S3 credentials.
 */
export interface WarehouseCatalogCredentials {
  /** Postgres connection to the project DB that holds the DuckLake catalog metadata. */
  catalogUrl: string
  /** Object-storage location of the DuckLake data files, e.g. `s3://<bucket>/<path>`. */
  dataPath: string
  s3Endpoint: string
  s3Region: string
  s3AccessKeyId: string
  s3SecretAccessKey: string
  /** Schema in the catalog DB that stores the DuckLake metadata tables (e.g. `ducklake`). */
  metadataSchema: string
}

export interface WarehouseCatalog {
  enabled: boolean
  credentials?: WarehouseCatalogCredentials
}

type WarehouseCatalogApiResponse = {
  enabled: boolean
  credentials?: {
    catalog_url: string
    data_path: string
    s3_endpoint: string
    s3_region: string
    s3_access_key_id: string
    s3_secret_access_key: string
    metadata_schema: string
  }
}

export type WarehouseCatalogVariables = { projectRef?: string }
export type WarehouseCatalogData = WarehouseCatalog
export type WarehouseCatalogError = ResponseError

export async function getWarehouseCatalog(
  { projectRef }: WarehouseCatalogVariables,
  signal?: AbortSignal
): Promise<WarehouseCatalogData> {
  if (!projectRef) throw new Error('projectRef is required')

  const result = await fetchGet<WarehouseCatalogApiResponse>(
    `${API_URL?.replace('/platform', '')}/platform/warehouse/${projectRef}/catalog`,
    { abortSignal: signal, credentials: 'include' }
  )
  if (result instanceof ResponseError) throw result

  const creds = result.credentials
  return {
    enabled: result.enabled,
    credentials: creds
      ? {
          catalogUrl: creds.catalog_url,
          dataPath: creds.data_path,
          s3Endpoint: creds.s3_endpoint,
          s3Region: creds.s3_region,
          s3AccessKeyId: creds.s3_access_key_id,
          s3SecretAccessKey: creds.s3_secret_access_key,
          metadataSchema: creds.metadata_schema,
        }
      : undefined,
  }
}

export const useWarehouseCatalogQuery = <TData = WarehouseCatalogData>(
  { projectRef }: WarehouseCatalogVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<WarehouseCatalogData, WarehouseCatalogError, TData>, 'queryKey'> = {}
) =>
  useQuery<WarehouseCatalogData, WarehouseCatalogError, TData>({
    queryKey: warehouseKeys.catalog(projectRef),
    queryFn: ({ signal }) => getWarehouseCatalog({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
