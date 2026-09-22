import { DOCS_URL } from '@/lib/constants'

export const OBSERVABILITY_DOCS_HREFS = {
  overview: `${DOCS_URL}/guides/telemetry/reports`,
  queryPerformance: `${DOCS_URL}/guides/platform/performance#examining-query-performance`,
  queryInsights: `${DOCS_URL}/guides/platform/performance#examining-query-performance`,
  apiGateway: `${DOCS_URL}/guides/telemetry/reports#api-gateway`,
  database: `${DOCS_URL}/guides/telemetry/reports#database`,
  dataApi: `${DOCS_URL}/guides/telemetry/reports#postgrest`,
  auth: `${DOCS_URL}/guides/telemetry/reports#auth`,
  edgeFunctions: `${DOCS_URL}/guides/telemetry/reports#edge-functions`,
  storage: `${DOCS_URL}/guides/telemetry/reports#storage`,
  realtime: `${DOCS_URL}/guides/realtime/reports`,
  customReport: `${DOCS_URL}/guides/telemetry/reports#using-reports`,
} as const
