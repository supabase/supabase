import { useWarehouseTableStates } from './warehouse-tables-query'
import {
  getSqlWarehouseRouting,
  getWarehouseQualifiedNamesFromSql,
  sourceTableKeyFromWarehouseQualifiedName,
} from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'

/** Fallback shown when a query references a Warehouse table whose lag we don't have yet. */
const DEFAULT_WAREHOUSE_LAG_SECONDS = 12

/**
 * Sync lag (seconds) to surface for a SQL snippet that reads from the Warehouse. Returns the max
 * lag across every `*_warehouse` table referenced in the query, or undefined when the query only
 * touches the Postgres heap. Lag is sourced from the linked-tables query (gated by the warehouse
 * flag), so this returns the fallback only when warehouse is enabled but the table's lag is unknown.
 */
export function useSqlWarehouseLagSeconds(sql: string): number | undefined {
  const states = useWarehouseTableStates()

  if (getSqlWarehouseRouting(sql) === 'postgres') return undefined

  const lags = getWarehouseQualifiedNamesFromSql(sql)
    .map((qualifiedName) => states.get(sourceTableKeyFromWarehouseQualifiedName(qualifiedName)))
    .map((state) => state?.lagSeconds)
    .filter((lag): lag is number => lag !== undefined)

  if (lags.length > 0) return Math.max(...lags)
  return DEFAULT_WAREHOUSE_LAG_SECONDS
}
