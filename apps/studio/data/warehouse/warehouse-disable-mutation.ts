import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import { replicationKeys } from '@/data/replication/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WarehouseDisableVariables = {
  projectRef: string
  shouldDeleteData: boolean
}

async function disableWarehouse({ projectRef, shouldDeleteData }: WarehouseDisableVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/platform/warehouse/{ref}', {
    params: {
      path: { ref: projectRef },
      query: { delete_data: shouldDeleteData ? 'true' : 'false' },
    },
  })
  if (error) {
    handleError(error)
  }

  return data
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
    mutationFn: (vars) => disableWarehouse(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.catalog(variables.projectRef) }),
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
        toast.error(`Failed to disable Warehouse: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
