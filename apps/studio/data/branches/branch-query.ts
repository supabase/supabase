import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchVariables = {
  branchRef?: string
  projectRef?: string
}

export async function getBranch({ branchRef }: BranchVariables, signal?: AbortSignal) {
  if (!branchRef) throw new Error('branchRef is required')

  const { data, error } = await get(`/v1/branches/{branch_id_or_ref}`, {
    params: { path: { branch_id_or_ref: branchRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type BranchData = Awaited<ReturnType<typeof getBranch>>
export type BranchError = ResponseError

export const useBranchQuery = <TData = BranchData>(
  { projectRef, branchRef }: BranchVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchData, BranchError, TData> = {}
) =>
  useQuery<BranchData, BranchError, TData>(
    branchKeys.detail(projectRef, branchRef),
    ({ signal }) => getBranch({ branchRef }, signal),
    {
      enabled: IS_PLATFORM && enabled && Boolean(branchRef),
      ...options,
    }
  )
