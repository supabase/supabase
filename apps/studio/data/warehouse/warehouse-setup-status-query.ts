import { useQuery } from '@tanstack/react-query'

import { warehouseKeys } from './keys'
import { handleWarehouseV2Error } from './warehouse-v2-error'
import { get } from '@/data/fetchers'
import { pipelineIdSchema } from '@/data/replication/pipeline-id'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

type WarehouseSetupStatusVariables = { projectRef?: string }

async function getWarehouseSetupStatus(
  { projectRef }: WarehouseSetupStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // No query parameters: without `selection_id` or `inspect_fdw=false` the read inspects the FDW,
  // which the FDW setup step reports.
  const { data, error } = await get('/v2/projects/{ref}/warehouse/setups/current', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleWarehouseV2Error(error)
  }

  const { attributes } = data.data
  return {
    ...attributes,
    pipeline_id:
      attributes.pipeline_id === undefined
        ? undefined
        : pipelineIdSchema.parse(attributes.pipeline_id),
  }
}

export type WarehouseSetupStatusData = Awaited<ReturnType<typeof getWarehouseSetupStatus>>

export const useWarehouseSetupStatusQuery = <TData = WarehouseSetupStatusData>(
  { projectRef }: WarehouseSetupStatusVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WarehouseSetupStatusData, StudioError, TData> = {}
) =>
  useQuery<WarehouseSetupStatusData, StudioError, TData>({
    queryKey: warehouseKeys.setupStatus(projectRef),
    queryFn: ({ signal }) => getWarehouseSetupStatus({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    retry: false,
    ...options,
  })
