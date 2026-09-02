import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']

export type WarehouseSetupVariables = {
  projectRef: string
  body: WarehouseSetupBody
}

async function setupWarehouse({ projectRef, body }: WarehouseSetupVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/warehouse/{ref}/setup', {
    params: { path: { ref: projectRef } },
    body,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type WarehouseSetupData = Awaited<ReturnType<typeof setupWarehouse>>

export const useWarehouseSetupMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<WarehouseSetupData, ResponseError, WarehouseSetupVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WarehouseSetupData, ResponseError, WarehouseSetupVariables>({
    mutationFn: (vars) => setupWarehouse(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: warehouseKeys.setupStatus(variables.projectRef),
      })
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
