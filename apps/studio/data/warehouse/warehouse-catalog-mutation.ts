import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type UpdateWarehouseCatalogBody = components['schemas']['UpdateWarehouseCatalogBody']

export type UpdateWarehouseCatalogVariables = {
  projectRef: string
  body: UpdateWarehouseCatalogBody
}

async function updateWarehouseCatalog({ projectRef, body }: UpdateWarehouseCatalogVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/warehouse/{ref}/catalog', {
    params: { path: { ref: projectRef } },
    body,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type UpdateWarehouseCatalogData = Awaited<ReturnType<typeof updateWarehouseCatalog>>

export const useUpdateWarehouseCatalogMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UpdateWarehouseCatalogData, ResponseError, UpdateWarehouseCatalogVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateWarehouseCatalogData, ResponseError, UpdateWarehouseCatalogVariables>({
    mutationFn: (vars) => updateWarehouseCatalog(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: warehouseKeys.catalog(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update Warehouse catalog access: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
