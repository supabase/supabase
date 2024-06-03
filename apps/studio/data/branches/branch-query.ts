import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchVariables = {
  projectRef?: string
  id?: string
}

export async function getBranch({ id }: BranchVariables, signal?: AbortSignal) {
  if (!id) throw new Error('id is required')

  const { data, error } = await get(`/v1/branches/{branch_id}`, {
    params: { path: { branch_id: id } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type BranchData = Awaited<ReturnType<typeof getBranch>>
export type BranchError = ResponseError

export const useBranchQuery = <TData = BranchData>(
  { projectRef, id }: BranchVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchData, BranchError, TData> = {}
) =>
  useQuery<BranchData, BranchError, TData>(
    branchKeys.detail(projectRef, id),
    ({ signal }) => getBranch({ id }, signal),
    {
      enabled: enabled && typeof id !== 'undefined',
      ...options,
    }
  )
