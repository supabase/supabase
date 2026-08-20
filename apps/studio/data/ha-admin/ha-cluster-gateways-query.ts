import { queryOptions } from '@tanstack/react-query'

import { getHaAdmin } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterGatewaysVariables = { projectRef?: string }
export type HaClusterGatewaysError = ResponseError

export type Multigateway = {
  id?: { cell?: string; name?: string }
  hostname?: string
}

async function getHaClusterGateways(
  { projectRef }: HaClusterGatewaysVariables,
  signal?: AbortSignal
) {
  return getHaAdmin<{ gateways?: Multigateway[] }>(projectRef, 'gateways', signal)
}

export type HaClusterGatewaysData = Awaited<ReturnType<typeof getHaClusterGateways>>

export const haClusterGatewaysQueryOptions = ({ projectRef }: HaClusterGatewaysVariables) =>
  queryOptions({
    queryKey: haAdminKeys.gateways(projectRef),
    queryFn: ({ signal }) => getHaClusterGateways({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
