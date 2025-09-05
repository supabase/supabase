import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, fetchPost } from 'data/fetchers'

export type UpdatePipelineVersionParams = {
  projectRef: string
  pipelineId: number
  versionId: number
}

async function updatePipelineVersion(
  { projectRef, pipelineId, versionId }: UpdatePipelineVersionParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')
  if (!versionId) throw new Error('versionId is required')

  const url = `/platform/replication/${projectRef}/pipelines/${pipelineId}/update-version`
  const data = await fetchPost(url, { version_id: versionId }, { abortSignal: signal })
  if ((data as any)?.error) {
    handleError((data as any).error)
  }

  return data
}

type UpdatePipelineVersionData = Awaited<ReturnType<typeof updatePipelineVersion>>

export const useUpdatePipelineVersionMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdatePipelineVersionData, ResponseError, UpdatePipelineVersionParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdatePipelineVersionData, ResponseError, UpdatePipelineVersionParams>(
    (vars) => updatePipelineVersion(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, pipelineId } = variables
        // Ensure the version dot updates promptly
        await queryClient.invalidateQueries(
          replicationKeys.pipelinesVersion(projectRef, pipelineId)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(error, variables, context) {
        const { projectRef, pipelineId } = variables
        if (error?.code === 404) {
          // Default image changed meanwhile. Refresh version info so UI reflects latest state.
          await queryClient.invalidateQueries(
            replicationKeys.pipelinesVersion(projectRef, pipelineId)
          )
        } else if (onError === undefined) {
          toast.error(`Failed to update pipeline version: ${error.message}`)
        } else {
          onError(error, variables, context)
        }
      },
      ...options,
    }
  )
}
