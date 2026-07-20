import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { ResponseError, type UseCustomMutationOptions } from '@/types'

export type WarehouseRefreshSchemaVariables = {
  projectRef: string
}

/**
 * Reinstalls the project's Warehouse foreign schema (`POST /platform/warehouse/{ref}/refresh-schema`).
 * Re-runs the FDW's foreign schema import so tables/columns added or changed on the Warehouse side
 * (new linked tables, altered source columns) show up without waiting for the next scheduled sync.
 */
export async function refreshWarehouseSchema({ projectRef }: WarehouseRefreshSchemaVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const result = await fetchPost(
    `${API_URL?.replace('/platform', '')}/platform/warehouse/${projectRef}/refresh-schema`,
    {},
    { credentials: 'include' }
  )
  if (result instanceof ResponseError) throw result
  return result
}

type WarehouseRefreshSchemaData = Awaited<ReturnType<typeof refreshWarehouseSchema>>

export const useWarehouseRefreshSchemaMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    WarehouseRefreshSchemaData,
    ResponseError,
    WarehouseRefreshSchemaVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WarehouseRefreshSchemaData, ResponseError, WarehouseRefreshSchemaVariables>({
    mutationFn: refreshWarehouseSchema,
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.tables(variables.projectRef) }),
        queryClient.invalidateQueries({
          queryKey: warehouseKeys.setupStatus(variables.projectRef),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to refresh Warehouse schema: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
