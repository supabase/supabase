import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type CreatePublicationParams = {
  projectRef: string
  sourceId: number
  name: string
  tableIds: number[]
  publishViaPartitionRoot?: boolean
}

async function createPublication(
  { projectRef, sourceId, name, tableIds, publishViaPartitionRoot = true }: CreatePublicationParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await put(
    '/platform/replication/v2/{ref}/sources/{source_id}/publications/{publication_name}',
    {
      params: { path: { ref: projectRef, source_id: sourceId, publication_name: name } },
      body: {
        type: 'tables',
        tables: tableIds.map((id) => ({ id })),
        operations: ['insert', 'update', 'delete', 'truncate'],
        publish_via_partition_root: publishViaPartitionRoot,
      },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

type CreatePublicationData = Awaited<ReturnType<typeof createPublication>>

export const useCreatePublicationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<CreatePublicationData, ResponseError, CreatePublicationParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreatePublicationData, ResponseError, CreatePublicationParams>({
    mutationFn: (vars) => createPublication(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, sourceId } = variables
      await queryClient.invalidateQueries({
        queryKey: replicationKeys.publications(projectRef, sourceId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create publication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
