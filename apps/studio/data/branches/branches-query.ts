import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchesVariables = {
  projectRef?: string
}

export type Branch = components['schemas']['BranchResponse'] & {
  review_requested_at?: string | null
}

export async function getBranches({ projectRef }: BranchesVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/v1/projects/{ref}/branches`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) {
    if ((error as ResponseError).message === 'Preview branching is not enabled for this project.') {
      return []
    } else {
      handleError(error)
    }
  }
  
  // Mock review_requested_at field for now until API is ready
  const branchesWithReviewField = data?.map((branch: any) => ({
    ...branch,
    review_requested_at: branch.review_requested_at || null
  }))
  
  return branchesWithReviewField
}

export type BranchesData = Awaited<ReturnType<typeof getBranches>>
export type BranchesError = ResponseError

export const useBranchesQuery = <TData = BranchesData>(
  { projectRef }: BranchesVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchesData, BranchesError, TData> = {}
) =>
  useQuery<BranchesData, BranchesError, TData>(
    branchKeys.list(projectRef),
    ({ signal }) => getBranches({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
