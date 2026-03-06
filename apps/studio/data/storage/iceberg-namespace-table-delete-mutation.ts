import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type DeleteIcebergNamespaceTableVariables = {
  warehouse: string
  namespace: string
  table: string
  projectRef?: string
}

async function deleteIcebergNamespaceTable({
  projectRef,
  warehouse,
  namespace,
  table,
}: DeleteIcebergNamespaceTableVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { error } = await del(
    '/platform/storage/{ref}/analytics-buckets/{id}/namespaces/{namespace}/tables/{table}',
    {
      params: {
        path: { ref: projectRef, id: warehouse, namespace, table },
        query: { purge: true },
      },
    }
  )

  if (error) handleError(error)
  return true
}

type IcebergNamespaceTableDeleteData = Awaited<ReturnType<typeof deleteIcebergNamespaceTable>>

export const useIcebergNamespaceTableDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IcebergNamespaceTableDeleteData,
    ResponseError,
    DeleteIcebergNamespaceTableVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IcebergNamespaceTableDeleteData,
    ResponseError,
    DeleteIcebergNamespaceTableVariables
  >({
    mutationFn: (vars) => deleteIcebergNamespaceTable({ ...vars }),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespace({
          projectRef: variables.projectRef,
          warehouse: variables.warehouse,
          namespace: variables.namespace,
        }),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete Iceberg namespace table: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
