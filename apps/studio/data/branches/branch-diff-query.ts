import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError, get } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchDiffVariables = {
  branchId: string
  projectRef: string
  includedSchemas?: string
}

export async function getBranchDiff({
  branchId,
  includedSchemas,
}: Pick<BranchDiffVariables, 'branchId' | 'includedSchemas'>) {
  try {
    const response = await get('/v1/branches/{branch_id}/diff' as any, {
      params: {
        path: { branch_id: branchId },
        query: includedSchemas ? { included_schemas: includedSchemas } : undefined,
      },
      headers: {
        Accept: 'text/plain',
      },
      parseAs: 'text',
    })

    if (response.error) {
      handleError(response.error)
    }

    return response.data as string
  } catch (error) {
    handleError(error)
    throw error
  }
}

type BranchDiffData = Awaited<ReturnType<typeof getBranchDiff>>

export const useBranchDiffQuery = (
  { branchId, projectRef, includedSchemas = 'public' }: BranchDiffVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<BranchDiffData, ResponseError>, 'queryKey' | 'queryFn'> = {}
) =>
  useQuery<BranchDiffData, ResponseError>(
    branchKeys.diff(branchId),
    () => getBranchDiff({ branchId, includedSchemas }),
    {
      enabled: enabled && typeof branchId !== 'undefined',
      ...options,
    }
  )
