import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type DeleteIcebergNamespaceVariables = {
  projectRef?: string
  warehouse: string
  namespace: string
}

async function deleteIcebergNamespace({
  projectRef,
  warehouse,
  namespace,
}: DeleteIcebergNamespaceVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { error } = await del(
    '/platform/storage/{ref}/analytics-buckets/{id}/namespaces/{namespace}',
    {
      params: { path: { ref: projectRef, id: warehouse, namespace } },
    }
  )

  if (error) handleError(error)
  return true
}

type IcebergNamespaceDeleteData = Awaited<ReturnType<typeof deleteIcebergNamespace>>

export const useIcebergNamespaceDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IcebergNamespaceDeleteData,
    ResponseError,
    DeleteIcebergNamespaceVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IcebergNamespaceDeleteData, ResponseError, DeleteIcebergNamespaceVariables>({
    mutationFn: (vars) => deleteIcebergNamespace({ ...vars }),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.icebergNamespaces({
          projectRef: variables.projectRef,
          warehouse: variables.warehouse,
        }),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete Iceberg namespace: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
