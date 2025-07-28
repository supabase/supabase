import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
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
  const { data: diffData, error } = await get('/v1/branches/{branch_id}/diff', {
    params: {
      path: { branch_id: branchId },
      query: includedSchemas ? { included_schemas: includedSchemas } : undefined,
    },
    headers: {
      Accept: 'text/plain',
    },
    parseAs: 'text',
  })

  if (error) {
    handleError(error)
  }

  // Handle empty object responses (when no diff exists)
  if (typeof diffData === 'object' && Object.keys(diffData).length === 0) {
    return ''
  }

  return diffData || ''
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
    branchKeys.diff(projectRef, branchId),
    () => getBranchDiff({ branchId, includedSchemas }),
    {
      enabled: IS_PLATFORM && enabled && typeof branchId !== 'undefined' && branchId !== '',
      ...options,
    }
  )
