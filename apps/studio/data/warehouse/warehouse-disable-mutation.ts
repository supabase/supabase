import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import type { WarehouseSetupStatusResponse } from './warehouse-setup-status-query'
import { del, handleError } from '@/data/fetchers'
import { replicationKeys } from '@/data/replication/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WarehouseDisableVariables = {
  projectRef: string
  deleteData: boolean
}

async function disableWarehouse({ projectRef, deleteData }: WarehouseDisableVariables) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const { error } = await del('/platform/warehouse/{ref}', {
    params: { path: { ref: projectRef }, query: { delete_data: deleteData ? 'true' : 'false' } },
    parseAs: 'text',
  })
  if (error) {
    handleError(error)
  }
}

export type WarehouseDisableData = Awaited<ReturnType<typeof disableWarehouse>>

export const useWarehouseDisableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<WarehouseDisableData, ResponseError, WarehouseDisableVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WarehouseDisableData, ResponseError, WarehouseDisableVariables>({
    mutationFn: disableWarehouse,
    async onSuccess(data, variables, context) {
      const { projectRef, deleteData } = variables
      // A status request started before DELETE must not restore the enabled controls.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: warehouseKeys.setupStatus(projectRef) }),
        queryClient.cancelQueries({ queryKey: warehouseKeys.catalog(projectRef) }),
      ])
      queryClient.setQueryData<WarehouseSetupStatusResponse>(
        warehouseKeys.setupStatus(projectRef),
        {
          setup_status: 'disabling',
          delete_data: deleteData,
          fdw_status: null,
          steps: [],
          tables: [],
        }
      )
      // Refresh these on their next mount, once the status panel allows access again.
      await Promise.all(
        [
          warehouseKeys.catalog(projectRef),
          replicationKeys.sources(projectRef),
          replicationKeys.destinations(projectRef),
          replicationKeys.pipelines(projectRef),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey, refetchType: 'none' }))
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to disable Warehouse: ${error.message}`)
      } else {
        await onError(error, variables, context)
      }
    },
    ...options,
  })
}
