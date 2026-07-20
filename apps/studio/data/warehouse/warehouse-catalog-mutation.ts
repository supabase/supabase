import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { ResponseError, type UseCustomMutationOptions } from '@/types'

export type UpdateWarehouseCatalogVariables = {
  projectRef: string
  enabled: boolean
}

/**
 * Enables or disables external Warehouse Catalog access for the project. Enabling provisions the
 * catalog credentials that external query engines (DuckDB, Spark, Trino, PyIceberg) use to read
 * Warehouse tables without touching the primary database.
 */
export async function updateWarehouseCatalog({
  projectRef,
  enabled,
}: UpdateWarehouseCatalogVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const result = await fetchPost(
    `${API_URL?.replace('/platform', '')}/platform/warehouse/${projectRef}/catalog`,
    { enabled },
    { credentials: 'include' }
  )
  if (result instanceof ResponseError) throw result
  return result
}

type UpdateWarehouseCatalogData = Awaited<ReturnType<typeof updateWarehouseCatalog>>

export const useUpdateWarehouseCatalogMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    UpdateWarehouseCatalogData,
    ResponseError,
    UpdateWarehouseCatalogVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateWarehouseCatalogData, ResponseError, UpdateWarehouseCatalogVariables>({
    mutationFn: updateWarehouseCatalog,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.catalog(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update Warehouse Catalog: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
