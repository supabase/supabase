import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleError, del } from 'data/fetchers'
import type { ResponseError } from 'types'
import { mergeRequestKeys } from './keys'

export type MergeRequestDeleteVariables = {
  id: string
  projectRef: string
}

export async function deleteMergeRequest({
  id,
  projectRef,
}: MergeRequestDeleteVariables): Promise<void> {
  // Mock data for development
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 500)
  })

  // Real API call (commented out for now)
  // const { error } = await del('/v1/merge-requests/{merge_request_id}', {
  //   params: {
  //     path: { merge_request_id: id },
  //   },
  // })

  // if (error) handleError(error)
}

export const useMergeRequestDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<void, ResponseError, MergeRequestDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, ResponseError, MergeRequestDeleteVariables>(
    (vars) => deleteMergeRequest(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(mergeRequestKeys.list(projectRef))
        await queryClient.invalidateQueries(mergeRequestKeys.detail(projectRef, variables.id))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete merge request: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
