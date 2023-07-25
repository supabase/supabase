import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { branchKeys } from './keys'
import { ResponseError } from 'types'

export type BranchesVariables = {
  projectRef?: string
}

export async function getBranches({ projectRef }: BranchesVariables, signal?: AbortSignal) {
  const { data, error } = await get(`/v1/projects/{ref}/branches`, {
    params: { path: { ref: projectRef ?? '' } },
    signal,
  })

  if (error) throw error
  return data
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
