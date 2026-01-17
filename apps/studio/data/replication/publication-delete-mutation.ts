import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { replicationKeys } from './keys'

export type DeletePublicationParams = {
  projectRef?: string
  sourceId: number
  publicationName: string
}

async function deletePublication(
  { projectRef, sourceId, publicationName }: DeletePublicationParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del(
    '/platform/replication/{ref}/sources/{source_id}/publications/{publication_name}',
    {
      params: {
        path: {
          ref: projectRef,
          source_id: sourceId,
          publication_name: publicationName,
        },
      },
      signal,
    }
  )
  if (error) handleError(error)
  return data
}

type DeletePublicationData = Awaited<ReturnType<typeof deletePublication>>

export const useDeletePublicationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DeletePublicationData, ResponseError, DeletePublicationParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeletePublicationData, ResponseError, DeletePublicationParams>({
    mutationFn: (vars) => deletePublication(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, sourceId } = variables
      await queryClient.invalidateQueries({
        queryKey: replicationKeys.publications(projectRef, sourceId),
      })
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
  })
}
