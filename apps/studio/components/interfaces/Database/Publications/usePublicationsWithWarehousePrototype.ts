import { useMemo } from 'react'
import { useSnapshot } from 'valtio'

import { SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME } from '@/components/interfaces/Database/Warehouse/managedWarehouse.resources'
import {
  hasWarehouseTables,
  warehouseDemoStore,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { buildWarehousePrototypePublication } from '@/components/interfaces/Database/Warehouse/warehousePublication.prototype'
import {
  useDatabasePublicationsQuery,
  type DatabasePublicationsData,
  type DatabasePublicationsError,
  type DatabasePublicationsVariables,
} from '@/data/database-publications/database-publications-query'
import type { UseCustomQueryOptions } from '@/types'

export function usePublicationsWithWarehousePrototype(
  variables: DatabasePublicationsVariables,
  options?: UseCustomQueryOptions<DatabasePublicationsData, DatabasePublicationsError>
) {
  const query = useDatabasePublicationsQuery(variables, options)
  const warehouseSnap = useSnapshot(warehouseDemoStore)

  const data = useMemo(() => {
    const publications = query.data ?? []

    if (
      publications.some(
        (publication) => publication.name === SUPABASE_MANAGED_WAREHOUSE_RESOURCE_NAME
      )
    ) {
      return publications
    }

    if (!hasWarehouseTables()) {
      return publications
    }

    const linkedTableKeys = Object.entries(warehouseSnap.tables)
      .filter(([, table]) => table.mode === 'has_warehouse_copy')
      .map(([tableKey]) => tableKey)

    return [...publications, buildWarehousePrototypePublication(linkedTableKeys)].sort(
      (a, b) => a.id - b.id
    )
  }, [query.data, warehouseSnap.tables])

  return { ...query, data }
}
