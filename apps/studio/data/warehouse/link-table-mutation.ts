import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { warehouseKeys } from './keys'
import type { WarehouseLinkedTable } from './warehouse-types'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { ResponseError, type UseCustomMutationOptions } from '@/types'

export type WarehouseLinkTableVariables = {
  projectRef: string
  schema: string
  name: string
}

/**
 * Links a table into Warehouse ("Copy to Warehouse"). Server-side this ensures the project's
 * `supabase_warehouse_pipeline` (DuckLake destination) exists, adds the table to its publication,
 * and starts the pipeline. Returns the new linked-table status.
 */
export async function linkWarehouseTable({
  projectRef,
  schema,
  name,
}: WarehouseLinkTableVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const result = await fetchPost<WarehouseLinkedTable>(
    `${API_URL?.replace('/platform', '')}/platform/warehouse/${projectRef}/tables`,
    { schema, name },
    { credentials: 'include' }
  )
  if (result instanceof ResponseError) throw result
  return result
}

type WarehouseLinkTableData = Awaited<ReturnType<typeof linkWarehouseTable>>

export const useWarehouseLinkTableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<WarehouseLinkTableData, ResponseError, WarehouseLinkTableVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<WarehouseLinkTableData, ResponseError, WarehouseLinkTableVariables>({
    mutationFn: linkWarehouseTable,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.tables(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create Warehouse copy: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
