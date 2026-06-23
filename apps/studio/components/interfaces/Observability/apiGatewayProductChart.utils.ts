import { computeSuccessAndNonSuccessRates } from '../ProjectHome/ProjectUsage.metrics'
import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
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

/** A fresh bucket with every product zeroed, so each datum always has the full product shape */
const emptyDatum = (timestamp: string): ApiGatewayProductDatum => ({
  timestamp,
  db: 0,
  postgrest: 0,
  auth: 0,
  functions: 0,
  storage: 0,
  realtime: 0,
})

/**
 * Merges every product's per-level timeseries into one stacked-by-product series.
 * Each bar segment is a product's total event count for that timestamp bucket, so
 * the stacked bar height equals the aggregate request count for the API Gateway.
 * Services not in API_GATEWAY_PRODUCT_KEYS (e.g. data_api itself) are ignored.
 */
export const buildApiGatewayProductData = (
  serviceData: Partial<Record<ServiceKey, ServiceChartData>>
): ApiGatewayProductDatum[] => {
  const bucketsByTimestamp = new Map<string, ApiGatewayProductDatum>()

  for (const productKey of API_GATEWAY_PRODUCT_KEYS) {
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
 * Aggregates request count and health across all API Gateway products so the row
 * header matches the stacked-by-product chart. Each product's `total` is the sum of
 * its infos + warnings + errors, the same value the chart stacks, so the header
 * request count always equals the chart's total bar height.
 */
export const calculateApiGatewayAggregate = (
  serviceData: Partial<Record<ServiceKey, ServiceTotals>>
): {
  total: number
  errorCount: number
  warningCount: number
  errorRate: number
  successRate: number
} => {
  let total = 0
  let errorCount = 0
  let warningCount = 0

  for (const productKey of API_GATEWAY_PRODUCT_KEYS) {
    const service = serviceData[productKey]
    if (!service) continue
    total += service.total
    errorCount += service.errorCount
    warningCount += service.warningCount
  }

  const errorRate = total > 0 ? (errorCount / total) * 100 : 0
  const { successRate } = computeSuccessAndNonSuccessRates(total, warningCount, errorCount)

  return { total, errorCount, warningCount, errorRate, successRate }
}
