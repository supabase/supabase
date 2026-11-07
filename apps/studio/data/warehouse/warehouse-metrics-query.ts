import { queryOptions } from '@tanstack/react-query'

import { warehouseKeys } from './keys'
import type {
  WarehouseMetricName,
  WarehouseMetricsInterval,
  WarehouseMetricsResponse,
} from './warehouse-metrics-api-types'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

const MAX_ATTRIBUTES = 8
const MAX_RETRIES = 2

export type WarehouseMetricsVariables = {
  projectRef?: string
  attributes: readonly WarehouseMetricName[]
  startDate: string
  endDate: string
  interval: WarehouseMetricsInterval
}

export type WarehouseMetricsData = WarehouseMetricsResponse
export type WarehouseMetricsError = StudioError

async function getWarehouseMetrics(
  { projectRef, attributes, startDate, endDate, interval }: WarehouseMetricsVariables,
  signal?: AbortSignal
): Promise<WarehouseMetricsData> {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/warehouse/{ref}/metrics', {
    params: {
      path: { ref: projectRef },
      query: { attributes: [...attributes], startDate, endDate, interval },
    },
    signal,
  })
  if (error) handleError(error)

  return data
}

/** Only capacity (503) and throttling (429) errors are worth retrying, and only twice. */
export const shouldRetryWarehouseMetrics = (failureCount: number, error: StudioError) =>
  failureCount < MAX_RETRIES && (error.code === 503 || error.code === 429)

export const warehouseMetricsQueryOptions = ({
  projectRef,
  attributes,
  startDate,
  endDate,
  interval,
}: WarehouseMetricsVariables) =>
  queryOptions({
    queryKey: warehouseKeys.metrics(projectRef, { attributes, startDate, endDate, interval }),
    queryFn: ({ signal }) =>
      getWarehouseMetrics({ projectRef, attributes, startDate, endDate, interval }, signal),
    enabled:
      IS_PLATFORM && !!projectRef && attributes.length > 0 && attributes.length <= MAX_ATTRIBUTES,
    retry: (failureCount: number, error: WarehouseMetricsError) =>
      shouldRetryWarehouseMetrics(failureCount, error),
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 8000) + Math.random() * 500,
    refetchOnWindowFocus: false,
  })
