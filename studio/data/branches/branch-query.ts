import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { branchKeys } from './keys'
import { ResponseError } from 'types'

export type BranchVariables = {
  id: string
}

export async function getBranch({ id }: BranchVariables, signal?: AbortSignal) {
  const { data, error } = await get(`/v1/branches/{branch_id}`, {
    params: { path: { branch_id: id } },
    signal,
  })

  if (error) throw error
  return data
}

export type BranchData = Awaited<ReturnType<typeof getBranch>>
export type BranchError = ResponseError

export const useBranchQuery = <TData = BranchData>(
  { id }: BranchVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchData, BranchError, TData> = {}
) =>
  useQuery<BranchData, BranchError, TData>(
    branchKeys.detail(id),
    ({ signal }) => getBranch({ id }, signal),
    { enabled: enabled && typeof id !== 'undefined', ...options }
  )
