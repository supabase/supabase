import { useQuery } from '@tanstack/react-query'

import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'
import { haAdminKeys } from './keys'

/**
 * Read-only slices of the multiadmin API, surfaced through the mgmt-api
 * `/ha-admin` GET passthrough. Types are a hand-copied subset of multiadmin's
 * OpenAPI spec (multigres `docs/api/multiadmin.openapi.yaml`) — the passthrough
 * is a catch-all proxy, so these paths aren't in Studio's generated OpenAPI
 * types. All fields are optional because proto3 JSON omits zero values.
 *
 * mgmt-api forwards `/ha-admin/v1/<x>` → `/multiadmin/v1/<x>`, which the project
 * edge gateway rewrites to multiadmin's `/api/v1/<x>`.
 */

export type HaClusterCells = { names?: string[] }
export type HaClusterDatabases = { names?: string[] }

export type Multipooler = {
  id?: { cell?: string; name?: string }
  shardKey?: { database?: string; tableGroup?: string; shard?: string }
  type?: 'UNKNOWN' | 'PRIMARY' | 'REPLICA' | 'DRAINED'
  servingStatus?: 'SERVING' | 'DISABLED' | 'DRAINING'
  hostname?: string
  lifecycleStatus?: { status?: string }
  routingState?: { role?: string }
}
export type HaClusterPoolers = { poolers?: Multipooler[] }

export type Multigateway = {
  id?: { cell?: string; name?: string }
  hostname?: string
}
export type HaClusterGateways = { gateways?: Multigateway[] }

type HaAdminVariables = { projectRef?: string }

// The passthrough is off-schema, so interpolate `ref` into the path and cast to
// `any`. The shared `get` middleware still applies auth, base URL and error
// handling.
async function getHaAdmin<T>(projectRef: string | undefined, subPath: string, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- off-schema passthrough path
    `/platform/projects/${projectRef}/ha-admin/v1/${subPath}` as any,
    { signal }
  )

  if (error) handleError(error)
  return data as T
}

export const useHaClusterCellsQuery = <TData = HaClusterCells>(
  { projectRef }: HaAdminVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<HaClusterCells, ResponseError, TData> = {}
) =>
  useQuery<HaClusterCells, ResponseError, TData>({
    queryKey: haAdminKeys.cells(projectRef),
    queryFn: ({ signal }) => getHaAdmin<HaClusterCells>(projectRef, 'cells', signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

export const useHaClusterDatabasesQuery = <TData = HaClusterDatabases>(
  { projectRef }: HaAdminVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<HaClusterDatabases, ResponseError, TData> = {}
) =>
  useQuery<HaClusterDatabases, ResponseError, TData>({
    queryKey: haAdminKeys.databases(projectRef),
    queryFn: ({ signal }) => getHaAdmin<HaClusterDatabases>(projectRef, 'databases', signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

export const useHaClusterPoolersQuery = <TData = HaClusterPoolers>(
  { projectRef }: HaAdminVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<HaClusterPoolers, ResponseError, TData> = {}
) =>
  useQuery<HaClusterPoolers, ResponseError, TData>({
    queryKey: haAdminKeys.poolers(projectRef),
    queryFn: ({ signal }) => getHaAdmin<HaClusterPoolers>(projectRef, 'poolers', signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

export const useHaClusterGatewaysQuery = <TData = HaClusterGateways>(
  { projectRef }: HaAdminVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<HaClusterGateways, ResponseError, TData> = {}
) =>
  useQuery<HaClusterGateways, ResponseError, TData>({
    queryKey: haAdminKeys.gateways(projectRef),
    queryFn: ({ signal }) => getHaAdmin<HaClusterGateways>(projectRef, 'gateways', signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
