import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { mergeRequestKeys } from './keys'
import type { MergeRequest } from './merge-requests-query'

export type MergeRequestUpdateVariables = {
  id: string
  projectRef: string
  merge_approved_by?: string | null
}

export async function updateMergeRequest({
  id,
  merge_approved_by,
}: MergeRequestUpdateVariables): Promise<MergeRequest> {
  // Mock data for development
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedMergeRequest: MergeRequest = {
        id: id,
        project_ref: 'mock-project-ref',
        base: '6b3b94fe-f9f9-4c12-8796-ff67db250757',
        head: '7902c891-5286-4366-a44d-007b39e0782d',
        title: 'Deploy feature-auth to production',
        description:
          'This deploy request includes new authentication features, improved error handling, and several bug fixes.',
        merge_requested_by: 'user-123',
        merge_approved_by: merge_approved_by ?? null,
        merge_requested_at: '2024-01-15T10:30:00Z',
        merge_approved_at: merge_approved_by ? new Date().toISOString() : null,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: new Date().toISOString(),
      }
      resolve(updatedMergeRequest)
    }, 500)
  })

  // Real API call (commented out for now)
  // const { data, error } = await patch('/v1/merge-requests/{merge_request_id}', {
  //   params: {
  //     path: { merge_request_id: id },
  //   },
  //   body: {
  //     merge_approved_by,
  //     merge_approved_at: merge_approved_by ? new Date().toISOString() : null,
  //   },
  // })

  // if (error) handleError(error)
  // return data as MergeRequest
}

type MergeRequestUpdateData = MergeRequest

export const useMergeRequestUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<MergeRequestUpdateData, ResponseError, MergeRequestUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<MergeRequestUpdateData, ResponseError, MergeRequestUpdateVariables>(
    (vars) => updateMergeRequest(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(mergeRequestKeys.list(projectRef))
        await queryClient.invalidateQueries(mergeRequestKeys.detail(projectRef, variables.id))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update merge request: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
