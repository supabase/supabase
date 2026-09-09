import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { getHaAdmin, parseHaAdminResponse } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterGatewaysVariables = { projectRef?: string }
export type HaClusterGatewaysError = ResponseError

// Every field is optional because proto3 JSON omits zero values.
const multigatewaySchema = z.object({
  id: z.object({ cell: z.string().optional(), name: z.string().optional() }).optional(),
  hostname: z.string().optional(),
})

const haClusterGatewaysResponseSchema = z.object({
  gateways: z.array(multigatewaySchema).optional(),
})

export type Multigateway = z.infer<typeof multigatewaySchema>

async function getHaClusterGateways(
  { projectRef }: HaClusterGatewaysVariables,
  signal?: AbortSignal
) {
  const data = await getHaAdmin(projectRef, 'gateways', signal)
  return parseHaAdminResponse(haClusterGatewaysResponseSchema, data)
}

export type HaClusterGatewaysData = Awaited<ReturnType<typeof getHaClusterGateways>>

export const haClusterGatewaysQueryOptions = ({ projectRef }: HaClusterGatewaysVariables) =>
  queryOptions({
    queryKey: haAdminKeys.gateways(projectRef),
    queryFn: ({ signal }) => getHaClusterGateways({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
