import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { replicationKeys } from './keys'

export type UpdatePublicationParams = {
  projectRef: string
  sourceId: number
  publicationName: string
  tables: { schema: string; name: string }[]
}

async function updatePublication(
  { projectRef, sourceId, publicationName, tables }: UpdatePublicationParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/sources/{source_id}/publications/{publication_name}',
    {
      params: { path: { ref: projectRef, source_id: sourceId, publication_name: publicationName } },
      body: { tables },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

type UpdatePublicationData = Awaited<ReturnType<typeof updatePublication>>

export const useUpdatePublicationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UpdatePublicationData, ResponseError, UpdatePublicationParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdatePublicationData, ResponseError, UpdatePublicationParams>({
    mutationFn: (vars) => updatePublication(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, sourceId } = variables
      await queryClient.invalidateQueries({
        queryKey: replicationKeys.publications(projectRef, sourceId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update publication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
