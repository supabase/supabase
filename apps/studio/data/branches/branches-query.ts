import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'data/api'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchesVariables = {
  projectRef?: string
}

export type Branch = components['schemas']['BranchResponse']

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
      throw error
    }
  }
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
