import { queryOptions, skipToken } from '@tanstack/react-query'

import { branchKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { GrantForVariants } from '@/lib/grants'
import type { ResponseError } from '@/types'

export type BranchDiffGrant = GrantForVariants<'get', '/v1/branches/{branch_id_or_ref}/diff'>

export type BranchDiffVariables = {
  branchRef?: string
  projectRef?: string
  includedSchemas?: string
  pgdelta?: boolean
  grant?: BranchDiffGrant
}

export async function getBranchDiff({
  branchRef,
  includedSchemas,
  pgdelta,
  grant,
}: {
  branchRef: string
  includedSchemas?: string
  pgdelta?: boolean
  grant: BranchDiffGrant
}) {
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
    grant,
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

export type BranchDiffData = Awaited<ReturnType<typeof getBranchDiff>>
export type BranchDiffError = ResponseError

export const branchDiffQueryOptions = ({
  branchRef,
  projectRef,
  includedSchemas,
  pgdelta,
  grant,
}: BranchDiffVariables) =>
  queryOptions<BranchDiffData, BranchDiffError>({
    queryKey: branchKeys.diff(projectRef, branchRef, pgdelta),
    queryFn:
      IS_PLATFORM && branchRef && grant
        ? () => getBranchDiff({ branchRef, includedSchemas, pgdelta, grant })
        : skipToken,
  })
