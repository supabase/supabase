import { queryOptions } from '@tanstack/react-query'

import { getHaAdmin } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterCellsVariables = { projectRef?: string }
export type HaClusterCellsError = ResponseError

async function getHaClusterCells({ projectRef }: HaClusterCellsVariables, signal?: AbortSignal) {
  return getHaAdmin<{ names?: string[] }>(projectRef, 'cells', signal)
}

export type HaClusterCellsData = Awaited<ReturnType<typeof getHaClusterCells>>

export const haClusterCellsQueryOptions = ({ projectRef }: HaClusterCellsVariables) =>
  queryOptions({
    queryKey: haAdminKeys.cells(projectRef),
    queryFn: ({ signal }) => getHaClusterCells({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
