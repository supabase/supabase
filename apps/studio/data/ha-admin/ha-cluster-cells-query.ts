import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { getHaAdmin, parseHaAdminResponse } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterCellsVariables = { projectRef?: string }
export type HaClusterCellsError = ResponseError

// Every field is optional because proto3 JSON omits zero values.
const haClusterCellsResponseSchema = z.object({ names: z.array(z.string()).optional() })

async function getHaClusterCells({ projectRef }: HaClusterCellsVariables, signal?: AbortSignal) {
  const data = await getHaAdmin(projectRef, 'cells', signal)
  return parseHaAdminResponse(haClusterCellsResponseSchema, data)
}

export type HaClusterCellsData = Awaited<ReturnType<typeof getHaClusterCells>>

export const haClusterCellsQueryOptions = ({ projectRef }: HaClusterCellsVariables) =>
  queryOptions({
    queryKey: haAdminKeys.cells(projectRef),
    queryFn: ({ signal }) => getHaClusterCells({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
