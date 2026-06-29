import { computeSuccessAndNonSuccessRates } from '../ProjectHome/ProjectUsage.metrics'
import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import type { ServiceKey } from './ObservabilityOverview.utils'

export const API_GATEWAY_PRODUCT_KEYS = [
  'db',
  'postgrest',
  'auth',
  'functions',
  'storage',
  'realtime',
] as const

export type ApiGatewayProductKey = (typeof API_GATEWAY_PRODUCT_KEYS)[number]

export type ApiGatewayProductDatum = { timestamp: string } & Record<ApiGatewayProductKey, number>

type ServiceChartData = { eventChartData: LogsBarChartDatum[] }
type ServiceTotals = { total: number; errorCount: number; warningCount: number }

const bucketTotal = (datum: LogsBarChartDatum): number =>
  datum.ok_count + datum.warning_count + datum.error_count

const emptyDatum = (timestamp: string): ApiGatewayProductDatum => ({
  timestamp,
  db: 0,
  postgrest: 0,
  auth: 0,
  functions: 0,
  storage: 0,
  realtime: 0,
})

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
