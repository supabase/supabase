import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchDiffVariables = {
  branchRef: string
  projectRef: string
  includedSchemas?: string
}

export async function getBranchDiff({
  branchRef,
  includedSchemas,
}: Pick<BranchDiffVariables, 'branchRef' | 'includedSchemas'>) {
  const { data: diffData, error } = await get('/v1/branches/{branch_id_or_ref}/diff', {
    params: {
      path: { branch_id_or_ref: branchRef },
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
  { branchRef, projectRef, includedSchemas }: BranchDiffVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseQueryOptions<BranchDiffData, ResponseError>, 'queryKey' | 'queryFn'> = {}
) =>
  useQuery<BranchDiffData, ResponseError>(
    branchKeys.diff(projectRef, branchRef),
    () => getBranchDiff({ branchRef, includedSchemas }),
    {
      enabled: IS_PLATFORM && enabled && Boolean(branchRef),
      ...options,
    }
  )
