import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import { computeSuccessAndNonSuccessRates } from '../ProjectHome/ProjectUsage.metrics'
import type { ServiceKey } from './ObservabilityOverview.utils'

/**
 * Products whose traffic flows through the API Gateway. The gateway itself
 * (data_api / edge_logs) is excluded since it is the entry point, not a product.
 */
export const API_GATEWAY_PRODUCT_KEYS = [
  'db',
  'postgrest',
  'auth',
  'functions',
  'storage',
  'realtime',
] as const

export type ApiGatewayProductKey = (typeof API_GATEWAY_PRODUCT_KEYS)[number]

/** One timestamp bucket with a total-event count per product, ready for a stacked bar chart */
export type ApiGatewayProductDatum = { timestamp: string } & Record<ApiGatewayProductKey, number>

type ServiceChartData = { eventChartData: LogsBarChartDatum[] }
type ServiceTotals = { total: number; errorCount: number; warningCount: number }

/** Total events (infos + warnings + errors) in a single bucket */
const bucketTotal = (datum: LogsBarChartDatum): number =>
  datum.ok_count + datum.warning_count + datum.error_count

/**
 * Merges every product's per-level timeseries into one stacked-by-product series.
 * Each bar segment is a product's total event count for that timestamp bucket, so
 * the stacked bar height equals the aggregate request count for the API Gateway.
 */
export const buildApiGatewayProductData = (
  serviceData: Partial<Record<ServiceKey, ServiceChartData>>,
  productKeys: readonly ApiGatewayProductKey[] = API_GATEWAY_PRODUCT_KEYS
): ApiGatewayProductDatum[] => {
  const bucketsByTimestamp = new Map<string, ApiGatewayProductDatum>()

  const emptyDatum = (timestamp: string): ApiGatewayProductDatum => {
    const datum = { timestamp } as ApiGatewayProductDatum
    for (const key of productKeys) datum[key] = 0
    return datum
  }

  for (const productKey of productKeys) {
    const rows = serviceData[productKey]?.eventChartData ?? []
    for (const row of rows) {
      const existing = bucketsByTimestamp.get(row.timestamp) ?? emptyDatum(row.timestamp)
      existing[productKey] = bucketTotal(row)
      bucketsByTimestamp.set(row.timestamp, existing)
    }
  }

  return Array.from(bucketsByTimestamp.values()).sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
  )
}

/**
 * Aggregates request count and success rate across all API Gateway products so the
 * row header numbers match the stacked-by-product chart exactly.
 */
export const calculateApiGatewayAggregate = (
  serviceData: Partial<Record<ServiceKey, ServiceTotals>>,
  productKeys: readonly ApiGatewayProductKey[] = API_GATEWAY_PRODUCT_KEYS
): {
  total: number
  errorCount: number
  warningCount: number
  successRate: number
  errorRate: number
} => {
  let total = 0
  let errorCount = 0
  let warningCount = 0

  for (const productKey of productKeys) {
    const service = serviceData[productKey]
    if (!service) continue
    total += service.total
    errorCount += service.errorCount
    warningCount += service.warningCount
  }

  const { successRate } = computeSuccessAndNonSuccessRates(total, warningCount, errorCount)
  const errorRate = total > 0 ? (errorCount / total) * 100 : 0

  return { total, errorCount, warningCount, successRate, errorRate }
}
