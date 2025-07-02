import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { mergeRequestKeys } from './keys'
import type { MergeRequest } from './merge-requests-query'

export type MergeRequestCreateVariables = {
  projectRef: string
  title: string
  description?: string
  head: string
  base: string
}

export async function createMergeRequest({
  projectRef,
  title,
  description,
  head,
  base,
}: MergeRequestCreateVariables): Promise<MergeRequest> {
  // Mock data for development
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMergeRequest: MergeRequest = {
        id: `mr-${Date.now()}`,
        project_ref: projectRef,
        base: '6b3b94fe-f9f9-4c12-8796-ff67db250757',
        head: '7902c891-5286-4366-a44d-007b39e0782d',
        title,
        description,
        merge_requested_by: 'current-user-id',
        merge_approved_by: null,
        merge_requested_at: new Date().toISOString(),
        merge_approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      resolve(newMergeRequest)
    }, 800)
  })

  // Real API call (commented out for now)
  // const { data, error } = await post('/v1/projects/{ref}/merge-requests', {
  //   params: {
  //     path: { ref: projectRef },
  //   },
  //   body: {
  //     title,
  //     description,
  //     head,
  //     base,
  //     merge_requested_at: new Date().toISOString(),
  //   },
  // })

  // if (error) handleError(error)
  // return data as MergeRequest
}

type MergeRequestCreateData = MergeRequest

export const useMergeRequestCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<MergeRequestCreateData, ResponseError, MergeRequestCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<MergeRequestCreateData, ResponseError, MergeRequestCreateVariables>(
    (vars) => createMergeRequest(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(mergeRequestKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create merge request: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
