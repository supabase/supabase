import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import type { V2WarehouseSetupRequest } from './warehouse-setup-api-types'
import { handleWarehouseV2Error } from './warehouse-v2-error'
import { post } from '@/data/fetchers'
import { replicationKeys } from '@/data/replication/keys'
import { pipelineIdSchema } from '@/data/replication/pipeline-id'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type WarehouseSetupBody = V2WarehouseSetupRequest['data']['attributes']

export type WarehouseSetupVariables = {
  projectRef: string
  body: WarehouseSetupBody
}

// Replaces the full replication selection (initial setup and later edits), so the picker's
// multi-schema selection maps onto it directly. The v2 `enable` route can't: it takes a single
// schema and rejects a selection that differs from the existing one.
async function setupWarehouse({ projectRef, body }: WarehouseSetupVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/v2/projects/{ref}/warehouse/setups', {
    params: { path: { ref: projectRef } },
    body: { data: { type: 'warehouse_setup', attributes: body } },
  })
  if (error) {
    handleWarehouseV2Error(error)
  }

  const { attributes } = data.data
  return {
    ...attributes,
    pipeline_id:
      attributes.pipeline_id === null ? null : pipelineIdSchema.parse(attributes.pipeline_id),
  }
}

export type WarehouseSetupData = Awaited<ReturnType<typeof setupWarehouse>>

export const useWarehouseSetupMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<WarehouseSetupData, StudioError, WarehouseSetupVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WarehouseSetupData, StudioError, WarehouseSetupVariables>({
    mutationFn: (vars) => setupWarehouse(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: warehouseKeys.setupStatus(variables.projectRef),
        }),
        queryClient.invalidateQueries({
          queryKey: replicationKeys.sources(variables.projectRef),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to set up Warehouse: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
