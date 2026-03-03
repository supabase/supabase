import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { branchKeys } from './keys'

export type BranchDiffVariables = {
  branchRef: string
  projectRef: string
  includedSchemas?: string
  pgdelta?: boolean
}

export async function getBranchDiff({
  branchRef,
  includedSchemas,
  pgdelta,
}: Pick<BranchDiffVariables, 'branchRef' | 'includedSchemas' | 'pgdelta'>) {
  const query: { included_schemas?: string; pgdelta?: string } = {}
  if (includedSchemas) query.included_schemas = includedSchemas
  if (pgdelta === true) query.pgdelta = 'true'

  const { data: diffData, error } = await get('/v1/branches/{branch_id_or_ref}/diff', {
    params: {
      path: { branch_id_or_ref: branchRef },
      query: Object.keys(query).length > 0 ? query : undefined,
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
  { branchRef, projectRef, includedSchemas, pgdelta }: BranchDiffVariables,
  {
    enabled = true,
    ...options
  }: Omit<UseCustomQueryOptions<BranchDiffData, ResponseError>, 'queryKey' | 'queryFn'> = {}
) =>
  useQuery<BranchDiffData, ResponseError>({
    queryKey: branchKeys.diff(projectRef, branchRef, pgdelta),
    queryFn: () => getBranchDiff({ branchRef, includedSchemas, pgdelta }),
    enabled: IS_PLATFORM && enabled && Boolean(branchRef),
    ...options,
  })
