import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useMemo } from 'react'

import { warehouseKeys } from './keys'
import {
  POSTGRES_TABLE_STATE,
  tableKeyOf,
  tableStateFromLinkedTable,
  type WarehouseLinkedTable,
  type WarehouseTableState,
} from './warehouse-types'
import { fetchGet } from '@/data/fetchers'
import { useIsWarehouseEnabled } from '@/hooks/misc/useIsWarehouseEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { API_URL } from '@/lib/constants'
import { ResponseError } from '@/types'

export type WarehouseTablesVariables = { projectRef?: string }
type WarehouseTablesResponse = { tables: WarehouseLinkedTable[] }
export type WarehouseTablesData = WarehouseLinkedTable[]
export type WarehouseTablesError = ResponseError

export async function getWarehouseTables(
  { projectRef }: WarehouseTablesVariables,
  signal?: AbortSignal
): Promise<WarehouseTablesData> {
  if (!projectRef) throw new Error('projectRef is required')

  const result = await fetchGet<WarehouseTablesResponse>(
    `${API_URL?.replace('/platform', '')}/platform/warehouse/${projectRef}/tables`,
    { abortSignal: signal, credentials: 'include' }
  )
  if (result instanceof ResponseError) throw result
  return result.tables ?? []
}

export const useWarehouseTablesQuery = <TData = WarehouseTablesData>(
  { projectRef }: WarehouseTablesVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<WarehouseTablesData, WarehouseTablesError, TData>, 'queryKey'> = {}
) =>
  useQuery<WarehouseTablesData, WarehouseTablesError, TData>({
    queryKey: warehouseKeys.tables(projectRef),
    queryFn: ({ signal }) => getWarehouseTables({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    // Warehouse setup is async: `POST /tables` returns immediately (202) with `state: 'syncing'`
    // while the initial copy + FDW install run in the worker. Poll `GET /tables` while any table
    // is still syncing so the UI advances to `live` (or `error`) on its own.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((table) => table.state === 'syncing') ? 5000 : false,
    ...options,
  })

/** Per-table storage state for the selected project. Falls back to Postgres-only when not linked. */
export function useWarehouseTableState(tableKey: string): WarehouseTableState {
  const isWarehouseEnabled = useIsWarehouseEnabled()
  const { data: project } = useSelectedProjectQuery()
  const { data } = useWarehouseTablesQuery(
    { projectRef: project?.ref },
    { enabled: isWarehouseEnabled }
  )

  return useMemo(() => {
    const match = (data ?? []).find((table) => tableKeyOf(table.schema, table.name) === tableKey)
    return match ? tableStateFromLinkedTable(match) : POSTGRES_TABLE_STATE
  }, [data, tableKey])
}

/** Lookup of every linked table for the selected project, keyed by `schema.name`. */
export function useWarehouseTableStates(): Map<string, WarehouseTableState> {
  const isWarehouseEnabled = useIsWarehouseEnabled()
  const { data: project } = useSelectedProjectQuery()
  const { data } = useWarehouseTablesQuery(
    { projectRef: project?.ref },
    { enabled: isWarehouseEnabled }
  )

  return useMemo(() => {
    const map = new Map<string, WarehouseTableState>()
    for (const table of data ?? []) {
      map.set(tableKeyOf(table.schema, table.name), tableStateFromLinkedTable(table))
    }
    return map
  }, [data])
}
