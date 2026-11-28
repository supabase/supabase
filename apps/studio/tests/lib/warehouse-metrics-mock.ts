import { http, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw'

import type { WarehouseMetricsResponse } from '@/data/warehouse/warehouse-metrics-api-types'
import { API_URL } from '@/lib/constants'
import { mswServer, type APIErrorBody } from '@/tests/lib/msw'

/**
 * Mocks the Warehouse metrics endpoint with the widened response type. `addAPIMock` is typed from
 * the generated API types, which don't list the pending measurements yet. Delete this helper and
 * use `addAPIMock` again once the generated types catch up.
 */
export const addWarehouseMetricsMock = (
  response: HttpResponseResolver<
    PathParams,
    DefaultBodyType,
    WarehouseMetricsResponse | APIErrorBody
  >
) => mswServer.use(http.get(`${API_URL}/platform/warehouse/:ref/metrics`, response))
