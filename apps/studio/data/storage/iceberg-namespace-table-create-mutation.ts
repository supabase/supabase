import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

export type NamespaceTableFields = components['schemas']['CreateNamespaceTableBody']['fields']

type CreateIcebergNamespaceTableVariables = {
  projectRef?: string
  warehouse: string
  namespace: string
  name: string
  fields: NamespaceTableFields
}

async function createIcebergNamespaceTable({
  projectRef,
  warehouse,
  namespace,
  name,
  fields,
}: CreateIcebergNamespaceTableVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(
    '/platform/storage/{ref}/analytics-buckets/{id}/namespaces/{namespace}/tables',
    {
      params: { path: { ref: projectRef, id: warehouse, namespace } },
      body: { name, fields },
    }
  )

  if (error) handleError(error)
  return data
}

type IcebergNamespaceTableCreateData = Awaited<ReturnType<typeof createIcebergNamespaceTable>>

export const useIcebergNamespaceTableCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IcebergNamespaceTableCreateData,
    ResponseError,
    CreateIcebergNamespaceTableVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IcebergNamespaceTableCreateData,
    ResponseError,
    CreateIcebergNamespaceTableVariables
  >({
    mutationFn: (vars) => createIcebergNamespaceTable({ ...vars }),
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
        toast.error(`Failed to create Iceberg namespace table: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
