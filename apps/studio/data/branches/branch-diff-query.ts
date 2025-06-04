import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchDiffVariables = {
  branchId: string
  projectRef: string
}

export async function getBranchDiff({ branchId }: Pick<BranchDiffVariables, 'branchId'>) {
  const { data, error } = await post('/v1/branches/{branch_id}/diff' as any, {
    params: { path: { branch_id: branchId } },
  })

  if (error) handleError(error)
  return data as string
}

type BranchDiffData = Awaited<ReturnType<typeof getBranchDiff>>

export const useBranchDiffQuery = (
  { branchId, projectRef }: BranchDiffVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<BranchDiffData, ResponseError>, 'queryKey' | 'queryFn'> = {}
) =>
  useQuery<BranchDiffData, ResponseError>(
    branchKeys.diff(branchId),
    () => getBranchDiff({ branchId }),
    {
      enabled: enabled && typeof branchId !== 'undefined',
      ...options,
    }
  )
