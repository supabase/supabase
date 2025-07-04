import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type CreatePublicationParams = {
  projectRef: string
  sourceId: number
  name: string
  tables: { schema: string; name: string }[]
}

async function createPublication(
  { projectRef, sourceId, name, tables }: CreatePublicationParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/sources/{source_id}/publications',
    {
      params: { path: { ref: projectRef, source_id: sourceId } },
      body: { name, tables },
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
  UseMutationOptions<CreatePublicationData, ResponseError, CreatePublicationParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreatePublicationData, ResponseError, CreatePublicationParams>(
    (vars) => createPublication(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, sourceId } = variables
        await queryClient.invalidateQueries(replicationKeys.publications(projectRef, sourceId))
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
    }
  )
}
