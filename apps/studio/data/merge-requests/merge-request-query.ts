import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { mergeRequestKeys } from './keys'
import type { MergeRequest } from './merge-requests-query'

export type MergeRequestVariables = {
  projectRef?: string
  id?: string
}

export async function getMergeRequest(
  { id }: MergeRequestVariables,
  signal?: AbortSignal
): Promise<MergeRequest> {
  if (!id) throw new Error('id is required')

  // Mock data for development
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: id,
        project_ref: 'mock-project-ref',
        base: '6b3b94fe-f9f9-4c12-8796-ff67db250757',
        head: '7902c891-5286-4366-a44d-007b39e0782d',
        title: 'Deploy feature-auth to production',
        description:
          'This deploy request includes new authentication features, improved error handling, and several bug fixes. The changes have been thoroughly tested in the staging environment.',
        merge_requested_by: 'user-123',
        merge_approved_by: null,
        merge_requested_at: '2024-01-15T10:30:00Z',
        merge_approved_at: null,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      })
    }, 300)
  })

  // Real API call (commented out for now)
  // const { data, error } = await get(`/v1/merge-requests/{merge_request_id}`, {
  //   params: { path: { merge_request_id: id } },
  //   signal,
  // })

  // if (error) handleError(error)
  // return data as MergeRequest
}

export type MergeRequestData = MergeRequest
export type MergeRequestError = ResponseError

export const useMergeRequestQuery = <TData = MergeRequestData>(
  { projectRef, id }: MergeRequestVariables,
  { enabled = true, ...options }: UseQueryOptions<MergeRequestData, MergeRequestError, TData> = {}
) =>
  useQuery<MergeRequestData, MergeRequestError, TData>(
    mergeRequestKeys.detail(projectRef, id),
    ({ signal }) => getMergeRequest({ id }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
