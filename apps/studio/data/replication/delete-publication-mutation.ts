import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, del } from 'data/fetchers'

export type DeletePublicationParams = {
  projectRef: string
  sourceId: number
  publicationName: string
}

async function deletePublication(
  { projectRef, sourceId, publicationName: publication_name }: DeletePublicationParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del(
    '/platform/replication/{ref}/sources/{source_id}/publications/{publication_name}',
    {
      params: { path: { ref: projectRef, source_id: sourceId, publication_name } },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

type DeletePublicationData = Awaited<ReturnType<typeof deletePublication>>

export const useDeletePublicationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeletePublicationData, ResponseError, DeletePublicationParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeletePublicationData, ResponseError, DeletePublicationParams>(
    (vars) => deletePublication(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, sourceId } = variables
        await queryClient.invalidateQueries(replicationKeys.publications(projectRef, sourceId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete publication: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
