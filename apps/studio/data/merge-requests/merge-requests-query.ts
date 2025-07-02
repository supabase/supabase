import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { mergeRequestKeys } from './keys'

export type MergeRequestsVariables = {
  projectRef?: string
}

export type MergeRequest = {
  id: string
  project_ref: string
  base: string
  head: string
  title: string
  description?: string
  merge_requested_by: string | null
  merge_approved_by: string | null
  merge_requested_at: string | null
  merge_approved_at: string | null
  created_at: string
  updated_at: string
}

export async function getMergeRequests(
  { projectRef }: MergeRequestsVariables,
  signal?: AbortSignal
): Promise<MergeRequest[]> {
  if (!projectRef) throw new Error('Project ref is required')

  // Mock data for development
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'mr-1',
          project_ref: projectRef,
          base: '6b3b94fe-f9f9-4c12-8796-ff67db250757',
          head: '7902c891-5286-4366-a44d-007b39e0782d',
          title: 'Deploy feature-auth to production',
          description: 'This PR includes new authentication features and bug fixes.',
          merge_requested_by: 'user-123',
          merge_approved_by: null,
          merge_requested_at: '2024-01-15T10:30:00Z',
          merge_approved_at: null,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 'mr-2',
          project_ref: projectRef,
          base: '6b3b94fe-f9f9-4c12-8796-ff67db250757',
          head: '7902c891-5286-4366-a44d-007b39e0782d',
          title: 'Deploy hotfix-db-migration to production',
          description: 'Critical database schema updates for user table.',
          merge_requested_by: 'user-456',
          merge_approved_by: 'user-789',
          merge_requested_at: '2024-01-14T14:20:00Z',
          merge_approved_at: '2024-01-14T15:45:00Z',
          created_at: '2024-01-14T14:20:00Z',
          updated_at: '2024-01-14T15:45:00Z',
        },
      ])
    }, 500)
  })

  // Real API call (commented out for now)
  // const { data, error } = await get(`/v1/projects/{ref}/merge-requests`, {
  //   params: { path: { ref: projectRef } },
  //   signal,
  // })

  // if (error) {
  //   handleError(error)
  // }
  // return data as MergeRequest[]
}

export type MergeRequestsData = MergeRequest[]
export type MergeRequestsError = ResponseError

export const useMergeRequestsQuery = <TData = MergeRequestsData>(
  { projectRef }: MergeRequestsVariables,
  { enabled = true, ...options }: UseQueryOptions<MergeRequestsData, MergeRequestsError, TData> = {}
) =>
  useQuery<MergeRequestsData, MergeRequestsError, TData>(
    mergeRequestKeys.list(projectRef),
    ({ signal }) => getMergeRequests({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
