import type { components, operations } from 'api-types'

export type WarehouseMetricsResponse = components['schemas']['WarehouseMetricsResponse_Output']
export type WarehouseMetric = WarehouseMetricsResponse['metrics'][number]
export type WarehouseMetricName = WarehouseMetric['metric']
export type WarehouseMetricAvailability = WarehouseMetric['availability']
export type WarehouseMetricsInterval = NonNullable<
  operations['WarehouseMetricsController_getMetrics']['parameters']['query']['interval']
>
